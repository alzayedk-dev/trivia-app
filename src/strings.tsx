import { createContext, useContext } from 'react';
import { AiLanguage } from './aiOptions';
import { Difficulty } from './data/questions';

// The words on the game screens. An AI game in Arabic shows the Arabic column and
// reads right to left; every other game uses English. The home screen stays English.
const STRINGS = {
  en: {
    home: 'Home',
    score: 'SCORE',
    newSet: 'New set',
    unsure: 'Not sure about this one',
    newBest: 'New best for this topic!',
    bestScore: (best: number) => `Best for this topic: ${best}`,
    playAgain: 'Play again',
    next: 'Next',
    seeScore: 'See score',
    correct: 'Correct',
    incorrect: 'Incorrect',
    timesUp: 'Time’s up',
    writing: 'Writing your questions…',
    errorTitle: 'The lights flickered',
    aiError: 'The AI couldn’t write your questions this time. Give it another go.',
    tryAgain: 'Try again',
    totalScore: 'TOTAL SCORE',
    nextGame: 'Next game: new questions with the same settings.',
    letters: ['A', 'B', 'C', 'D'],
    difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as Record<Difficulty, string>,
    verdicts: ['Perfect game!', 'Trivia champion!', 'Sharp thinking!', 'Good effort!', 'Better luck next round!'],
    result: (correct: number, total: number, points: number) =>
      `${correct} of ${total} correct · out of ${points} points`,
  },
  ar: {
    home: 'الرئيسية',
    score: 'النقاط',
    newSet: 'أسئلة جديدة',
    unsure: 'غير متأكد من هذا السؤال',
    newBest: 'رقم قياسي جديد في هذا الموضوع!',
    bestScore: (best: number) => `أفضل نتيجة في هذا الموضوع: ${best}`,
    playAgain: 'العب مرة أخرى',
    next: 'التالي',
    seeScore: 'عرض النتيجة',
    correct: 'إجابة صحيحة',
    incorrect: 'إجابة خاطئة',
    timesUp: 'انتهى الوقت',
    writing: 'جارٍ كتابة أسئلتك…',
    errorTitle: 'حدث خلل',
    aiError: 'لم يتمكن الذكاء الاصطناعي من كتابة أسئلتك هذه المرة. حاول مرة أخرى.',
    tryAgain: 'حاول مرة أخرى',
    totalScore: 'مجموع النقاط',
    nextGame: 'اللعبة القادمة: أسئلة جديدة بنفس الإعدادات.',
    letters: ['أ', 'ب', 'ج', 'د'],
    difficulty: { easy: 'سهل', medium: 'متوسط', hard: 'صعب' } as Record<Difficulty, string>,
    verdicts: ['لعبة مثالية!', 'بطل المعلومات!', 'تفكير حاد!', 'جهد جيد!', 'حظاً أوفر في الجولة القادمة!'],
    result: (correct: number, total: number, points: number) => `${correct} من ${total} صحيحة · من أصل ${points} نقطة`,
  },
};

const LanguageContext = createContext<AiLanguage>('en');

// Wraps a game so everything inside it speaks the given language.
export const LanguageProvider = LanguageContext.Provider;

export function useStrings() {
  const language = useContext(LanguageContext);
  return { t: STRINGS[language], language, rtl: language === 'ar' };
}
