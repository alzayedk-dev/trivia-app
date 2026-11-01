import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AiDifficulty, AiLanguage, AiModel } from './aiOptions';
import { Difficulty, Question } from './data/questions';
import { hash } from './hash';

// AI mode: the player types a topic and an AI (through our own function in
// api/ai-questions.ts, which holds the OpenRouter key) writes 5 questions about it.

export const AI_QUESTION_COUNT = 5;

const PRODUCTION_URL = 'https://trivia-app-lyart-phi.vercel.app/api/ai-questions';
// The local test server started by `npm run ai-api`.
const LOCAL_URL = 'http://localhost:8788/api/ai-questions';
// The AI can be slow, so wait a good while before giving up.
const REQUEST_TIMEOUT_MS = 65_000;
const MAX_AVOID = 15;
const MIXED_LEVELS: Difficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard'];

export type AiStyle = { difficulty: AiDifficulty; language: AiLanguage; model: AiModel };

// The tag on each question: a mixed game goes easy to hard, otherwise they all match.
function levelFor(difficulty: AiDifficulty, index: number): Difficulty {
  return difficulty === 'mixed' ? MIXED_LEVELS[index] : difficulty;
}

// The small line shown under the error message when a reply can't be read. It
// has no status code, because the server answered fine; the contents were bad.
export const UNREADABLE = 'Couldn’t read the AI’s reply';

// The function lives on the Vercel site. Pages served from Vercel call it directly;
// everywhere else (the Expo site, Expo Go on a phone) uses the full address.
function endpoint(): string {
  const location = Platform.OS === 'web' ? globalThis.location : undefined;
  if (location) {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return LOCAL_URL;
    if (location.hostname.endsWith('.vercel.app')) return '/api/ai-questions';
  }
  // Expo Go while developing: the phone reaches the test server on the computer running Expo.
  const host = __DEV__ && Platform.OS !== 'web' ? Constants.expoConfig?.hostUri?.split(':')[0] : undefined;
  return host ? `http://${host}:8788/api/ai-questions` : PRODUCTION_URL;
}

export type AiResult =
  | { ok: true; questions: Question[] }
  // `detail` is the small line under the error message, e.g. "Error 429 · …".
  | { ok: false; detail: string };

// Everything the AI has written this session, so a later game never repeats a question.
const seenIds = new Set<string>();
// The questions asked per topic, passed to the AI so it steers clear of them.
const askedByTopic = new Map<string, string[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

// Asks for 5 questions about the topic. Never throws: every problem comes back
// as `{ ok: false, detail }` so the game can show its error screen.
export async function fetchAiQuestions(topic: string, style: AiStyle): Promise<AiResult> {
  const cleanTopic = topic.replace(/\s+/g, ' ').trim();
  const key = cleanTopic.toLowerCase();
  // If the AI repeats a question from earlier, ask once more before giving up.
  for (let attempt = 0; attempt < 2; attempt++) {
    const avoid = askedByTopic.get(key) ?? [];
    const result = await requestQuestions(cleanTopic, avoid, style);
    if (!result.ok) return result;
    askedByTopic.set(key, [...avoid, ...result.questions.map((q) => q.prompt)].slice(-MAX_AVOID));
    const fresh = result.questions.filter((q) => !seenIds.has(q.id));
    if (fresh.length === AI_QUESTION_COUNT) {
      fresh.forEach((q) => seenIds.add(q.id));
      return { ok: true, questions: fresh };
    }
  }
  return { ok: false, detail: 'Couldn’t get 5 new questions' };
}

async function requestQuestions(topic: string, avoid: string[], style: AiStyle): Promise<AiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          avoid,
          difficulty: style.difficulty,
          language: style.language,
          model: style.model,
        }),
        signal: controller.signal,
      });
    } catch {
      return { ok: false, detail: controller.signal.aborted ? 'The AI took too long' : 'No connection' };
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, detail: describeFailure(response.status, body) };
    const questions = readQuestions(body, topic, style.difficulty);
    return questions ? { ok: true, questions } : { ok: false, detail: UNREADABLE };
  } catch {
    // Anything unexpected still ends in the friendly error screen, never a crash.
    return { ok: false, detail: UNREADABLE };
  } finally {
    clearTimeout(timer);
  }
}

const REASONS: Record<number, string> = {
  400: 'Bad request',
  401: 'The AI key was rejected',
  402: 'The AI is out of credits',
  403: 'Not allowed',
  404: 'Not found',
  405: 'Wrong kind of request',
  408: 'The AI took too long',
  429: 'The AI is busy (too many requests)',
  500: 'Server problem',
  502: 'The AI service had a problem',
  503: 'The AI service is unavailable',
  504: 'The AI took too long',
};

// The small line for a failed request: the status code and a short reason.
function describeFailure(status: number, body: unknown): string {
  const kind = isRecord(body) && isRecord(body.error) && typeof body.error.kind === 'string' ? body.error.kind : '';
  if (kind === 'unreadable') return UNREADABLE;
  if (kind === 'config') return `Error ${status} · The AI isn’t set up on the server yet`;
  if (kind === 'network') return `Error ${status} · The AI service can’t be reached`;
  const reason = REASONS[status] ?? (status >= 500 ? 'Server problem' : 'Request failed');
  return `Error ${status} · ${reason}`;
}

// Checks the function's answer again before the game uses it (a safety net: the
// function already tidies the AI's reply). Returns null if anything is off.
function readQuestions(body: unknown, topic: string, difficulty: AiDifficulty): Question[] | null {
  if (!isRecord(body) || !Array.isArray(body.questions) || body.questions.length !== AI_QUESTION_COUNT) return null;
  const questions: Question[] = [];
  for (const [index, item] of body.questions.entries()) {
    if (!isRecord(item)) return null;
    const { question, correct_answer: correct, wrong_answers: wrong } = item;
    if (typeof question !== 'string' || typeof correct !== 'string') return null;
    if (!Array.isArray(wrong) || wrong.length !== 3 || !wrong.every((w) => typeof w === 'string')) return null;
    const options = [correct, ...(wrong as string[])];
    if (options.some((o) => !o.trim()) || !question.trim()) return null;
    if (new Set(options.map((o) => o.trim().toLowerCase())).size !== options.length) return null;
    questions.push({
      id: `ai:${hash(question)}`,
      // Not one of the Open Trivia Database categories; the topic is shown as the category.
      categoryId: 0,
      category: topic,
      difficulty: isDifficulty(item.difficulty) ? item.difficulty : levelFor(difficulty, index),
      prompt: question.trim(),
      // The one-line "why it's right", shown once the player has answered.
      // Set by the fact-checker when it wasn't sure the question is right.
      ...(item.unsure === true && { unsure: true }),
      ...(typeof item.explanation === 'string' && item.explanation.trim() && { fact: item.explanation.trim() }),
      // The correct answer is first by convention; the game shuffles the order.
      options: options.map((o) => o.trim()),
    });
  }
  return questions;
}
