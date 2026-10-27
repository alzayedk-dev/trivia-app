import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// One rounded typeface everywhere, in three weights.
export const FONTS = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

// Colours shared by every topic: a light, high-contrast palette.
export const colors = {
  card: '#FFFFFF',
  border: '#DCE6EA',
  option: '#F6FAFB',
  optionBorder: '#CFDDE3',
  optionPressed: '#E8F1F4',
  correct: '#2F9E5B',
  correctSoft: '#E3F5EA',
  wrong: '#D94F4F',
  wrongSoft: '#FBE7E7',
  shadow: '#13405A',
};

// A topic is a whole quiz subject (Geography, later maybe History or Science).
// Each topic gets its own text colour, accent, background art and answer animations.
export type Topic = 'geography';

export type TopicTheme = {
  topic: Topic;
  title: string;
  tagline: string;
  // Main text colour and a softer one for secondary text.
  ink: string;
  inkMuted: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  background: {
    top: string;
    bottom: string;
    line: string;
  };
};

export const TOPIC_THEMES: Record<Topic, TopicTheme> = {
  geography: {
    topic: 'geography',
    title: 'Geo Trivia',
    tagline: 'How well do you know the world?',
    ink: '#13405A',
    inkMuted: '#56778A',
    accent: '#11788A',
    accentText: '#FFFFFF',
    accentSoft: '#DDF0F3',
    background: {
      top: '#E4F2F5',
      bottom: '#F6F1E2',
      line: '#6FA9B6',
    },
  },
};

// Only Geography exists for now; switching this changes the colours, art and animations.
export const ACTIVE_TOPIC: Topic = 'geography';

export const TopicThemeContext = createContext<TopicTheme>(TOPIC_THEMES[ACTIVE_TOPIC]);

export function useTopicTheme() {
  return useContext(TopicThemeContext);
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
