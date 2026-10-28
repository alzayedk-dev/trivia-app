import { Question } from './data/questions';
import { Slot } from './questionBank';
import { activePicks, GameSettings } from './settings';
import { shuffle } from './shuffle';

export { shuffle };

export const POINTS_PER_CORRECT = 50;
// Recorded as the pick when a question's timer runs out.
export const TIMED_OUT = '';

export type RoundQuestion = {
  question: Question;
  // Options in display order; `answer` is the correct one.
  options: string[];
  answer: string;
};

export function toRoundQuestion(question: Question): RoundQuestion {
  return { question, options: shuffle(question.options), answer: question.options[0] };
}

// One slot per question, sharing questions out evenly between the categories
// picked for the current source (each at its own difficulty) in a random order.
export function buildPlan(settings: GameSettings): Slot[] {
  const choices = shuffle(activePicks(settings));
  const slots = Array.from({ length: settings.questionCount }, (_, i) => {
    const choice = choices[i % choices.length];
    return { categoryId: choice.id, difficulty: choice.difficulty };
  });
  return shuffle(slots);
}
