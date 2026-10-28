import { GENERAL_QUESTIONS } from './generalQuestions';
import { Difficulty, GEOGRAPHY_QUESTIONS, Question } from './questions';

// "My questions": the app's own question set, used when the player picks My
// questions on the start screen and as the offline backup for Live questions.
// To plug in your own database later, replace or extend this list; every
// question needs a categoryId from src/data/categories.ts.
export const MY_QUESTIONS: Question[] = [...GENERAL_QUESTIONS, ...GEOGRAPHY_QUESTIONS];

// How many of my questions there are per category and difficulty.
export const MY_COUNTS: Record<number, Record<Difficulty, number>> = MY_QUESTIONS.reduce(
  (counts, q) => {
    counts[q.categoryId] ??= { easy: 0, medium: 0, hard: 0 };
    counts[q.categoryId][q.difficulty] += 1;
    return counts;
  },
  {} as Record<number, Record<Difficulty, number>>,
);
