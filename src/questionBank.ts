import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty, Question, QUESTIONS } from './data/questions';
import { shuffle } from './shuffle';

// Questions come from the Open Trivia Database (opentdb.com, CC BY-SA 4.0).
// They're downloaded in batches and kept on the device, so a round starts
// instantly; the built-in questions take over when offline. Every question
// this device has seen is remembered, so nothing repeats until the whole
// supply has been used.

const API = 'https://opentdb.com';
const GEOGRAPHY = 22;
const BATCH_SIZE = 50;
// The API allows one request per 5 seconds from each address.
const REQUEST_GAP_MS = 5200;
const REQUEST_TIMEOUT_MS = 8000;
// Top up the stock when any difficulty falls below this many questions.
const LOW_STOCK = 4;
// How long a round will wait for a download before using built-in questions.
const ROUND_WAIT_MS = 6000;

const STORAGE = {
  seen: 'geo-trivia/seen-v1',
  stock: 'geo-trivia/stock-v1',
  token: 'geo-trivia/token-v1',
};

type State = {
  // Ids of every question this device has been given.
  seen: Set<string>;
  // Downloaded questions not yet played.
  stock: Question[];
  // The API's session token, which stops it sending the same question twice.
  token: string | null;
};

let statePromise: Promise<State> | null = null;
let topUp: Promise<void> | null = null;
let lastRequestAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getState(): Promise<State> {
  statePromise ??= (async () => ({
    seen: new Set(await readJson<string[]>(STORAGE.seen, [])),
    stock: await readJson<Question[]>(STORAGE.stock, []),
    token: await readJson<string | null>(STORAGE.token, null),
  }))();
  return statePromise;
}

async function save(state: State) {
  try {
    await AsyncStorage.multiSet([
      [STORAGE.seen, JSON.stringify([...state.seen])],
      [STORAGE.stock, JSON.stringify(state.stock)],
      [STORAGE.token, JSON.stringify(state.token)],
    ]);
  } catch {
    // Storage is best-effort; the game still works without it.
  }
}

// Small stable hash so database questions get a short, repeatable id.
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function request(path: string): Promise<{ response_code: number; [key: string]: unknown }> {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API}${path}`, { signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function newToken(state: State) {
  const result = await request('/api_token.php?command=request');
  state.token = typeof result.token === 'string' ? result.token : null;
}

type ApiQuestion = {
  difficulty: Difficulty;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

function fromApi(item: ApiQuestion): Question {
  const prompt = decodeURIComponent(item.question);
  return {
    id: `otdb:${hash(prompt)}`,
    difficulty: decodeURIComponent(item.difficulty) as Difficulty,
    category: 'Geography',
    prompt,
    options: [item.correct_answer, ...item.incorrect_answers].map((o) => decodeURIComponent(o)),
  };
}

// Downloads one batch into the stock. Response codes: 0 ok, 1 fewer questions
// left than asked for, 3 token unknown/expired, 4 token has seen everything,
// 5 too many requests.
// The very first batch is fetched without a token so the first round isn't held
// up waiting for one; the local "seen" list filters any later overlap.
async function downloadBatch(state: State) {
  let amount = BATCH_SIZE;
  for (let attempt = 0; attempt < 4; attempt++) {
    const token = state.token ? `&token=${state.token}` : '';
    const result = await request(
      `/api.php?amount=${amount}&category=${GEOGRAPHY}&type=multiple&encode=url3986${token}`,
    );
    if (result.response_code === 0) {
      const known = new Set(state.stock.map((q) => q.id));
      for (const question of (result.results as ApiQuestion[]).map(fromApi)) {
        if (!state.seen.has(question.id) && !known.has(question.id)) {
          state.stock.push(question);
          known.add(question.id);
        }
      }
      return;
    }
    if (result.response_code === 1 && amount > 10) {
      amount = 10;
    } else if (result.response_code === 1 || result.response_code === 4) {
      // This device has seen the whole database: start over from the beginning.
      await request(`/api_token.php?command=reset&token=${state.token}`);
      for (const id of state.seen) if (id.startsWith('otdb:')) state.seen.delete(id);
      amount = BATCH_SIZE;
    } else if (result.response_code === 3) {
      await newToken(state);
    } else if (result.response_code !== 5) {
      return;
    }
  }
}

function lowOnStock(state: State) {
  return (['easy', 'medium', 'hard'] as const).some(
    (d) => state.stock.filter((q) => q.difficulty === d).length < LOW_STOCK,
  );
}

// Starts a background download if the stock is running low. Safe to call often.
// Resolves as soon as the new questions are in stock.
export function topUpStock(): Promise<void> {
  topUp ??= (async () => {
    try {
      const state = await getState();
      if (lowOnStock(state)) {
        await downloadBatch(state);
        await save(state);
      }
      if (!state.token) void fetchToken(state);
    } catch {
      // Offline or the service is down: the built-in questions cover it.
    } finally {
      topUp = null;
    }
  })();
  return topUp;
}

async function fetchToken(state: State) {
  try {
    await newToken(state);
    await save(state);
  } catch {
    // Try again on the next top-up.
  }
}

function takeFrom(pool: Question[], difficulty: Difficulty, exclude: Set<string>): Question | undefined {
  return pool.find((q) => q.difficulty === difficulty && !exclude.has(q.id));
}

// Picks one question per slot, preferring downloaded ones, then unseen built-in
// ones of the same difficulty, then any unseen built-in one. If even those are
// used up, the built-in questions start over.
export async function nextQuestions(plan: Difficulty[]): Promise<Question[]> {
  const state = await getState();
  const missing = plan.some((d) => !state.stock.some((q) => q.difficulty === d));
  if (missing) await Promise.race([topUpStock(), sleep(ROUND_WAIT_MS)]);

  const picked: Question[] = [];
  const used = new Set<string>();
  const shuffledBuiltIns = shuffle(QUESTIONS);
  for (const difficulty of plan) {
    let question = takeFrom(state.stock, difficulty, used);
    if (question) {
      state.stock = state.stock.filter((q) => q !== question);
    } else {
      const unseen = shuffledBuiltIns.filter((q) => !state.seen.has(q.id));
      if (unseen.length === 0) for (const q of QUESTIONS) state.seen.delete(q.id);
      const pool = unseen.length ? unseen : shuffledBuiltIns;
      question = takeFrom(pool, difficulty, used) ?? pool.find((q) => !used.has(q.id));
    }
    if (!question) continue;
    picked.push(question);
    used.add(question.id);
    state.seen.add(question.id);
  }

  await save(state);
  void topUpStock();
  return picked;
}
