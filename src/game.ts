import { Question, QUESTIONS } from './data/questions';

export const QUESTIONS_PER_ROUND = 5;
export const POINTS_PER_CORRECT = 50;
export const SECONDS_PER_QUESTION = 30;
// Recorded as the pick when a question's timer runs out.
export const TIMED_OUT = '';

export type RoundQuestion = {
  question: Question;
  // Options in display order; `answer` is the correct one.
  options: string[];
  answer: string;
};

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Picks a fresh round, avoiding questions already seen this session until the
// whole bank has been used.
export function pickRound(seenIds: Set<string>): RoundQuestion[] {
  let pool = QUESTIONS.filter((q) => !seenIds.has(q.id));
  if (pool.length < QUESTIONS_PER_ROUND) {
    seenIds.clear();
    pool = QUESTIONS;
  }
  return shuffle(pool)
    .slice(0, QUESTIONS_PER_ROUND)
    .map((question) => {
      seenIds.add(question.id);
      return { question, options: shuffle(question.options), answer: question.options[0] };
    });
}
