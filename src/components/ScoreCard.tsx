import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useNativeDriver } from '../animation';
import { POINTS_PER_CORRECT } from '../game';
import { colors, useCompactLayout, useTopicTheme } from '../theme';
import { AppText } from './AppText';
import { CardWatermark } from './CardWatermark';

type Props = {
  score: number;
  // One entry per question: true/false once answered, null before.
  results: (boolean | null)[];
  current: number;
};

export function ScoreCard({ score, results, current }: Props) {
  const theme = useTopicTheme();
  const compact = useCompactLayout();
  const pop = useState(() => new Animated.Value(1))[0];
  const previous = useRef(score);

  useEffect(() => {
    if (score > previous.current) {
      Animated.sequence([
        Animated.spring(pop, { toValue: 1.35, friction: 3, tension: 220, useNativeDriver }),
        Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver }),
      ]).start();
    }
    previous.current = score;
  }, [score, pop]);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <CardWatermark size={120} offset={30} opacity={0.08} radius={20} />
      <View>
        {/* Short phones fit the score card beside the Home button, so the label goes. */}
        {!compact && (
          <AppText muted style={styles.label}>
            SCORE
          </AppText>
        )}
        <Animated.View style={{ transform: [{ scale: pop }], alignSelf: 'flex-start' }}>
          <AppText weight="black" style={[styles.score, compact && styles.scoreCompact, { color: theme.accent }]}>
            {score}
          </AppText>
        </Animated.View>
      </View>
      <View style={[styles.dots, compact && styles.dotsCompact]}>
        {results.map((result, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              compact && styles.dotCompact,
              i === current && result === null && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
              result === true && styles.dotCorrect,
              result === false && styles.dotWrong,
            ]}
          >
            <AppText weight="black" muted={result === null} style={[styles.dotText, result !== null && styles.dotTextDone]}>
              {result === true ? POINTS_PER_CORRECT : result === false ? 0 : i + 1}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardCompact: { paddingVertical: 4, paddingHorizontal: 10, minHeight: 44 },
  label: { fontSize: 12, letterSpacing: 1.5 },
  score: { fontSize: 32, minWidth: 80 },
  scoreCompact: { fontSize: 24, minWidth: 32 },
  dots: { flexDirection: 'row', gap: 6 },
  dotsCompact: { gap: 4 },
  dotCompact: { width: 28, height: 28, borderRadius: 14 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.option,
  },
  dotCorrect: { backgroundColor: colors.correct, borderColor: colors.correct },
  dotWrong: { backgroundColor: colors.wrong, borderColor: colors.wrong },
  dotText: { fontSize: 13 },
  dotTextDone: { color: '#FFFFFF' },
});
