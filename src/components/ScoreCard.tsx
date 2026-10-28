import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useNativeDriver } from '../animation';
import { colors, useAppTheme, useCompactLayout } from '../theme';
import { AppText } from './AppText';
import { CardWatermark } from './CardWatermark';

type Props = {
  score: number;
  // One entry per question: true/false once answered, null before.
  results: (boolean | null)[];
  current: number;
};

// Score plus a segmented progress bar: one segment per question, green when
// right, red when wrong, highlighted for the current one. Fits 5 to 15 questions.
export function ScoreCard({ score, results, current }: Props) {
  const theme = useAppTheme();
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

  const shown = Math.min(current + 1, results.length);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <CardWatermark size={120} offset={30} opacity={0.06} radius={20} />
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
      <View style={styles.progress}>
        <AppText muted style={[styles.count, compact && styles.countCompact]}>
          {shown}/{results.length}
        </AppText>
        <View style={styles.segments} accessibilityLabel={`Question ${shown} of ${results.length}`}>
          {results.map((result, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                result === null && { backgroundColor: i === current ? theme.accent : theme.accentSoft },
                result === true && styles.segmentCorrect,
                result === false && styles.segmentWrong,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  cardCompact: { paddingVertical: 4, paddingHorizontal: 12, minHeight: 44, gap: 10 },
  label: { fontSize: 12, letterSpacing: 1.5 },
  score: { fontSize: 32, minWidth: 64 },
  scoreCompact: { fontSize: 24, minWidth: 40 },
  progress: { flex: 1, gap: 6 },
  count: { fontSize: 13, alignSelf: 'flex-end' },
  countCompact: { fontSize: 12 },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 8, borderRadius: 4 },
  segmentCorrect: { backgroundColor: colors.correct },
  segmentWrong: { backgroundColor: colors.wrong },
});
