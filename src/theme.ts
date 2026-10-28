import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// One rounded typeface everywhere, in three weights.
export const FONTS = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

// A light, high-contrast palette used whatever the category.
export const colors = {
  card: '#FFFFFF',
  border: '#E1E2F2',
  option: '#F7F7FD',
  optionBorder: '#D5D6EE',
  optionPressed: '#ECECFA',
  correct: '#2F9E5B',
  correctSoft: '#E3F5EA',
  wrong: '#D94F4F',
  wrongSoft: '#FBE7E7',
  shadow: '#24245A',
};

// Tag colours for each question's difficulty.
export const DIFFICULTY_COLORS = {
  easy: { text: colors.correct, background: colors.correctSoft },
  medium: { text: '#A8650F', background: '#FDF0DA' },
  hard: { text: colors.wrong, background: colors.wrongSoft },
};

export type AppTheme = {
  title: string;
  tagline: string;
  // Main text colour and a softer one for secondary text.
  ink: string;
  inkMuted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  // Gold for the lightbulb glow, stars and other highlights.
  highlight: string;
  highlightSoft: string;
  background: {
    top: string;
    bottom: string;
    line: string;
  };
};

// Trivia Night: one game-night look for every category.
export const THEME: AppTheme = {
  title: 'Trivia Night',
  tagline: 'Pick your categories. Beat the clock.',
  ink: '#24245A',
  inkMuted: '#5F6290',
  accent: '#4B47C9',
  accentText: '#FFFFFF',
  accentSoft: '#E7E7FB',
  highlight: '#F2AE2E',
  highlightSoft: '#FFF3D6',
  background: {
    top: '#EEF0FB',
    bottom: '#FBF5E9',
    line: '#9DA2D8',
  },
};

export const ThemeContext = createContext<AppTheme>(THEME);

export function useAppTheme() {
  return useContext(ThemeContext);
}

// Phones with less than this much usable height get tighter spacing, so the
// longest question and its feedback fit without scrolling.
const COMPACT_BELOW = 780;

export function useCompactLayout() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Measure what's left after the notch / status bar and the home indicator.
  return height - insets.top - insets.bottom < COMPACT_BELOW;
}

// Tablets get larger text and buttons to fill the extra room.
export function useLargeLayout() {
  const { width, height } = useWindowDimensions();
  return width >= 600 && height >= 900;
}
