import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionSource } from './data/availability';
import { categoryName } from './data/categories';
import { MY_QUESTIONS } from './data/myQuestions';
import { Difficulty, Question } from './data/questions';
import { shuffle } from './shuffle';

// Questions come from the Open Trivia Database (opentdb.com, CC BY-SA 4.0).
// They're downloaded per category and difficulty and kept on the device, so
// games start quickly; "My questions" take over when offline. Every question
// this device has seen is remembered, so nothing repeats until the supply for
// that category and difficulty has been used up, and a question is never shown
// twice while the app stays open.

const API = 'https://opentdb.com';
const BATCH_SIZE = 20;
// The API allows one request per 5 seconds from each address.
const REQUEST_GAP_MS = 5200;
const REQUEST_TIMEOUT_MS = 8000;
// After a failed download, skip the network for a while and use built-in questions.
const OFFLINE_BACKOFF_MS = 30000;
// Keep at least this many questions in stock for each chosen category and difficulty.
const LOW_STOCK = 4;
// How long one question will wait for a download before using a built-in one.
const QUESTION_WAIT_MS = 12000;

const STORAGE = {
  seen: 'trivia-night/seen-v1',
  stock: 'trivia-night/stock-v1',
  token: 'trivia-night/token-v1',
};

export type Slot = { categoryId: number; difficulty: Difficulty };

type State = {
  // Ids of every question this device has been given.
  seen: Set<string>;
  // Downloaded questions not yet played, by "category:difficulty".
  stock: Record<string, Question[]>;
  // The API's session token, which stops it sending the same question twice.
  token: string | null;
};

let statePromise: Promise<State> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;
let offlineUntil = 0;
// Every question shown since the app was opened. Never cleared, so nothing
// repeats within a session even after the longer-term "seen" list starts over.
const sessionSeen = new Set<string>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const keyOf = ({ categoryId, difficulty }: Slot) => `${categoryId}:${difficulty}`;

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
    stock: await readJson<Record<string, Question[]>>(STORAGE.stock, {}),
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

// Runs network tasks one after another so requests never overlap.
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

// Small stable hash so database questions get a short, repeatable id.
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function request(path: string): Promise<{ response_code: number; [key: string]: unknown }> {
  if (Date.now() < offlineUntil) throw new Error('offline');
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API}${path}`, { signal: controller.signal });
    return await response.json();
  } catch (error) {
    offlineUntil = Date.now() + OFFLINE_BACKOFF_MS;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

type ApiQuestion = { question: string; correct_answer: string; incorrect_answers: string[] };

function fromApi(item: ApiQuestion, slot: Slot): Question {
  const prompt = decodeURIComponent(item.question);
  return {
    id: `otdb:${keyOf(slot)}:${hash(prompt)}`,
    categoryId: slot.categoryId,
    category: categoryName(slot.categoryId),
    difficulty: slot.difficulty,
    prompt,
    options: [item.correct_answer, ...item.incorrect_answers].map((o) => decodeURIComponent(o)),
  };
}

// Downloads one batch for a category and difficulty into the stock. Response
// codes: 0 ok, 1 fewer questions left than asked for, 3 token unknown or
// expired, 4 token has seen everything, 5 too many requests.
async function download(state: State, slot: Slot) {
  const key = keyOf(slot);
  let amount = BATCH_SIZE;
  let restarted = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = state.token ? `&token=${state.token}` : '';
    const result = await request(
      `/api.php?amount=${amount}&category=${slot.categoryId}&difficulty=${slot.difficulty}&type=multiple&encode=url3986${token}`,
    );
    if (result.response_code === 0) {
      const stock = (state.stock[key] ??= []);
      const known = new Set(stock.map((q) => q.id));
      for (const question of (result.results as ApiQuestion[]).map((item) => fromApi(item, slot))) {
        if (!state.seen.has(question.id) && !known.has(question.id)) {
          stock.push(question);
          known.add(question.id);
        }
      }
      return;
    }
    if (result.response_code === 1 && amount > 5) {
      amount = 5;
    } else if ((result.response_code === 1 || result.response_code === 4) && state.token && !restarted) {
      // This device has seen everything left for this choice: start it over.
      await request(`/api_token.php?command=reset&token=${state.token}`);
      for (const id of state.seen) if (id.startsWith(`otdb:${key}:`)) state.seen.delete(id);
      restarted = true;
      amount = BATCH_SIZE;
    } else if (result.response_code === 3) {
      const fresh = await request('/api_token.php?command=request');
      state.token = typeof fresh.token === 'string' ? fresh.token : null;
    } else if (result.response_code !== 5) {
      return;
    }
  }
}

// Makes sure there are at least `want` questions in stock for a choice.
function fill(slot: Slot, want: number): Promise<void> {
  return enqueue(async () => {
    const state = await getState();
    if ((state.stock[keyOf(slot)]?.length ?? 0) >= want) return;
    try {
      await download(state, slot);
      // The very first download goes without a token so the first game isn't
      // held up waiting for one; get it afterwards.
      if (!state.token) {
        const fresh = await request('/api_token.php?command=request');
        state.token = typeof fresh.token === 'string' ? fresh.token : null;
      }
    } catch {
      // Offline or the service is down: built-in questions cover it.
    } finally {
      await save(state);
    }
  });
}

// Tops up the stock for each chosen category in the background, e.g. while the
// player is still on the setup screen. Safe to call often.
export function warmUp(slots: Slot[]) {
  const unique = [...new Map(slots.map((s) => [keyOf(s), s])).values()];
  for (const slot of unique) void fill(slot, LOW_STOCK);
}

// Picks one of my questions for a slot: the same category if I have it
// (otherwise General Knowledge), preferring the same difficulty and questions
// this device hasn't seen. Never one already shown this session; undefined if
// those have all been used.
function fromMyQuestions(slot: Slot, state: State): Question | undefined {
  const sameCategory = MY_QUESTIONS.filter((q) => q.categoryId === slot.categoryId);
  const bank = sameCategory.length ? sameCategory : MY_QUESTIONS.filter((q) => q.categoryId === 9);
  const fresh = shuffle(bank).filter((q) => !sessionSeen.has(q.id));
  // Once this device has seen them all, the longer-term list starts over.
  let unseen = fresh.filter((q) => !state.seen.has(q.id));
  if (unseen.length === 0) {
    for (const q of bank) state.seen.delete(q.id);
    unseen = fresh;
  }
  return unseen.find((q) => q.difficulty === slot.difficulty) ?? unseen[0];
}

function takeFromStock(state: State, slot: Slot): Question | undefined {
  const stock = state.stock[keyOf(slot)] ?? [];
  const index = stock.findIndex((q) => !sessionSeen.has(q.id) && !state.seen.has(q.id));
  if (index < 0) return undefined;
  return stock.splice(index, 1)[0];
}

// What the game is told about each question it's given.
export type Delivery = {
  question: Question;
  // True when this is one of my questions because the server couldn't be reached.
  offlineBackup: boolean;
};

// Hands the game one question per slot, in order, as each becomes available.
// Live: from stock, else after a download, else another difficulty of the same
// category, else my questions. Mine: from my questions only. Slots that can't
// be filled without repeating a question from this session are skipped, so a
// game can come up short. Stops early if `cancelled()`.
export async function streamQuestions(
  slots: Slot[],
  source: QuestionSource,
  onQuestion: (delivery: Delivery) => void,
  cancelled: () => boolean,
): Promise<void> {
  const state = await getState();
  for (const slot of slots) {
    if (cancelled()) return;
    let question: Question | undefined;
    let offlineBackup = false;
    if (source === 'live') {
      question = takeFromStock(state, slot);
      if (!question && Date.now() >= offlineUntil) {
        await Promise.race([fill(slot, 1), sleep(QUESTION_WAIT_MS)]);
        question = takeFromStock(state, slot);
      }
      if (!question) {
        const others = (['easy', 'medium', 'hard'] as const).filter((d) => d !== slot.difficulty);
        for (const difficulty of others) {
          question ??= takeFromStock(state, { categoryId: slot.categoryId, difficulty });
        }
      }
      if (!question) offlineBackup = Date.now() < offlineUntil;
    }
    question ??= fromMyQuestions(slot, state);
    if (!question) continue;
    sessionSeen.add(question.id);
    state.seen.add(question.id);
    if (cancelled()) return;
    onQuestion({ question, offlineBackup });
  }
  await save(state);
  if (source === 'live') warmUp(slots);
}
