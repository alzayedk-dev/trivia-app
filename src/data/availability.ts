import { Category, CATEGORIES } from './categories';
import { MY_COUNTS } from './myQuestions';
import { Difficulty } from './questions';

export type QuestionSource = 'live' | 'mine';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

// Multiple-choice questions in the Open Trivia Database per category and
// difficulty, checked on 2026-10-28. Each number is a lower bound: 50 means 50
// or more, 20 means 20–49, 10 means 10–19, 5 means 5–9, 1 means 1–4 and 0 means
// none. A difficulty with none can't be picked for that category.
const LIVE_COUNTS: Record<number, Record<Difficulty, number>> = {
  9: { easy: 50, medium: 50, hard: 50 },
  10: { easy: 20, medium: 50, hard: 20 },
  11: { easy: 50, medium: 50, hard: 20 },
  12: { easy: 50, medium: 50, hard: 50 },
  13: { easy: 5, medium: 10, hard: 10 },
  14: { easy: 50, medium: 50, hard: 20 },
  15: { easy: 50, medium: 50, hard: 50 },
  16: { easy: 10, medium: 20, hard: 20 },
  17: { easy: 50, medium: 50, hard: 50 },
  18: { easy: 20, medium: 50, hard: 20 },
  19: { easy: 20, medium: 20, hard: 10 },
  20: { easy: 10, medium: 20, hard: 10 },
  21: { easy: 50, medium: 50, hard: 20 },
  22: { easy: 50, medium: 50, hard: 50 },
  23: { easy: 50, medium: 50, hard: 50 },
  24: { easy: 10, medium: 20, hard: 10 },
  25: { easy: 10, medium: 10, hard: 10 },
  26: { easy: 10, medium: 20, hard: 5 },
  27: { easy: 10, medium: 20, hard: 20 },
  28: { easy: 20, medium: 20, hard: 10 },
  29: { easy: 10, medium: 20, hard: 10 },
  30: { easy: 10, medium: 10, hard: 5 },
  31: { easy: 50, medium: 50, hard: 20 },
  32: { easy: 20, medium: 20, hard: 20 },
};

function countsFor(source: QuestionSource, categoryId: number): Record<Difficulty, number> | undefined {
  return source === 'live' ? LIVE_COUNTS[categoryId] : MY_COUNTS[categoryId];
}

// The difficulties a category can be played at with this source.
export function availableDifficulties(source: QuestionSource, categoryId: number): Difficulty[] {
  const counts = countsFor(source, categoryId);
  // Unknown live categories are assumed to have every level.
  if (!counts) return source === 'live' ? DIFFICULTIES : [];
  return DIFFICULTIES.filter((d) => counts[d] > 0);
}

// The categories a source has questions for, in the usual order.
export function sourceCategories(source: QuestionSource): Category[] {
  return CATEGORIES.filter((c) => availableDifficulties(source, c.id).length > 0);
}

// Medium if the category has it, otherwise the first level it does have.
export function defaultDifficulty(source: QuestionSource, categoryId: number): Difficulty {
  const levels = availableDifficulties(source, categoryId);
  return levels.includes('medium') ? 'medium' : (levels[0] ?? 'medium');
}
