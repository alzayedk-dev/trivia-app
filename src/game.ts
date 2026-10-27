import { Difficulty, Question } from './data/questions';
import { nextQuestions } from './questionBank';
import { shuffle } from './shuffle';

export { shuffle };

export const QUESTIONS_PER_ROUND = 5;
export const POINTS_PER_CORRECT = 50;
export const SECONDS_PER_QUESTION = 30;
// Recorded as the pick when a question's timer runs out.
export const TIMED_OUT = '';

// Each round gets harder as it goes.
export const ROUND_PLAN: Difficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard'];

export type RoundQuestion = {
  question: Question;
  // Options in display order; `answer` is the correct one.
  options: string[];
  answer: string;
};

// A fresh round of questions this device hasn't seen, easiest first.
export async function nextRound(): Promise<RoundQuestion[]> {
  const questions = await nextQuestions(ROUND_PLAN);
  return questions.map((question) => ({
    question,
    options: shuffle(question.options),
    answer: question.options[0],
  }));
}
