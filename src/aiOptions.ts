import { Difficulty } from './data/questions';

// AI mode choices the player makes on the home screen.

// "mixed" is one easy-to-hard round; the others make every question that level.
export type AiDifficulty = 'mixed' | Difficulty;
export const AI_DIFFICULTIES: AiDifficulty[] = ['mixed', 'easy', 'medium', 'hard'];

export type AiLanguage = 'en' | 'ar';
export const AI_LANGUAGES: { value: AiLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

// One-tap topics: the button text is also the topic that's sent, in the chosen language.
export const AI_TOPICS: Record<AiLanguage, string[]> = {
  en: ['Soccer', 'Islam', 'Middle East culture', 'Kuwait'],
  ar: ['كرة القدم', 'الإسلام', 'ثقافة الشرق الأوسط', 'الكويت'],
};

// Which free model writes the questions. "auto" is the app's own order; the others go first
// but another model still steps in if the pick is busy.
export type AiModel = 'auto' | 'gemma' | 'nemotron';
export const AI_MODELS: { value: AiModel; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Recommended. Uses whichever free model is available.' },
  { value: 'gemma', label: 'Gemma', hint: 'Google’s free model. If it’s busy, another one steps in.' },
  { value: 'nemotron', label: 'Nemotron', hint: 'NVIDIA’s free model. If it’s busy, another one steps in.' },
];
