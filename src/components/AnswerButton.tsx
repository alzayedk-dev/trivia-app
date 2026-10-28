import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useNativeDriver } from '../animation';
import { colors, useCompactLayout, useLargeLayout, useAppTheme } from '../theme';
import { AppText } from './AppText';

// idle: not answered yet. correct: picked and right. wrong: picked and wrong.
// reveal: the right answer after a wrong pick. faded: the other answers, which
// the question card hides once you've answered.
export type AnswerState = 'idle' | 'correct' | 'wrong' | 'reveal' | 'faded';

type Props = {
  label: string;
  letter: string;
  state: AnswerState;
  onPress: () => void;
};

export function AnswerButton({ label, letter, state, onPress }: Props) {
  const theme = useAppTheme();
  const compact = useCompactLayout();
  const large = useLargeLayout();
  const scale = useState(() => new Animated.Value(1))[0];
  const shake = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (state === 'correct') {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.06, friction: 3, tension: 200, useNativeDriver }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver }),
      ]).start();
    } else if (state === 'wrong') {
      const step = (toValue: number) => Animated.timing(shake, { toValue, duration: 50, useNativeDriver });
      Animated.sequence([step(12), step(-12), step(9), step(-9), step(4), step(0)]).start();
    } else if (state === 'reveal') {
      Animated.sequence([
        Animated.delay(250),
        Animated.spring(scale, { toValue: 1.04, friction: 4, useNativeDriver }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver }),
      ]).start();
    }
  }, [state, scale, shake]);

  const isRight = state === 'correct' || state === 'reveal';
  const icon = isRight ? '✓' : state === 'wrong' ? '✕' : letter;

  return (
    <Animated.View style={{ transform: [{ scale }, { translateX: shake }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={state !== 'idle'}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          compact && styles.compact,
          large && styles.large,
          pressed && styles.pressed,
          isRight && styles.correct,
          state === 'wrong' && styles.wrong,
          state === 'faded' && styles.faded,
        ]}
      >
        <AppText
          weight="black"
          style={[
            styles.badge,
            { backgroundColor: theme.accentSoft, color: theme.accent },
            isRight && styles.badgeCorrect,
            state === 'wrong' && styles.badgeWrong,
          ]}
        >
          {icon}
        </AppText>
        <AppText style={[styles.label, large && styles.labelLarge]}>{label}</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    backgroundColor: colors.option,
    borderColor: colors.optionBorder,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  compact: { minHeight: 52, paddingVertical: 6 },
  large: { minHeight: 70, paddingHorizontal: 16 },
  pressed: { backgroundColor: colors.optionPressed },
  correct: { borderColor: colors.correct, backgroundColor: colors.correctSoft },
  wrong: { borderColor: colors.wrong, backgroundColor: colors.wrongSoft },
  faded: { opacity: 0.45 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 34,
    fontSize: 16,
  },
  badgeCorrect: { backgroundColor: colors.correct, color: '#FFFFFF' },
  badgeWrong: { backgroundColor: colors.wrong, color: '#FFFFFF' },
  label: { flex: 1, fontSize: 18 },
  labelLarge: { fontSize: 21 },
});
