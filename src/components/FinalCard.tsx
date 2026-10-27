import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { POINTS_PER_CORRECT, QUESTIONS_PER_ROUND } from '../game';
import { colors, useTopicTheme } from '../theme';
import { AppText } from './AppText';
import { CardWatermark } from './CardWatermark';
import { GlobeArt } from './GlobeArt';

type Props = {
  score: number;
  correctCount: number;
};

function verdict(correctCount: number): string {
  if (correctCount === QUESTIONS_PER_ROUND) return 'Perfect round!';
  if (correctCount >= 4) return 'World traveller!';
  if (correctCount >= 3) return 'Solid navigating!';
  if (correctCount >= 1) return 'Keep exploring!';
  return 'Time to pack a map!';
}

export function FinalCard({ score, correctCount }: Props) {
  const theme = useTopicTheme();
  return (
    <View style={styles.card}>
      <CardWatermark size={320} offset={60} />
      <Svg width={96} height={96} viewBox="0 0 200 200">
        <GlobeArt color={theme.accent} fill={theme.accentSoft} route={false} />
      </Svg>
      <AppText weight="black" style={styles.title}>
        {verdict(correctCount)}
      </AppText>
      <AppText muted style={styles.label}>
        TOTAL SCORE
      </AppText>
      <AppText weight="black" style={[styles.score, { color: theme.accent }]}>
        {score}
      </AppText>
      <AppText weight="regular" muted style={styles.detail}>
        {correctCount} of {QUESTIONS_PER_ROUND} correct · out of {QUESTIONS_PER_ROUND * POINTS_PER_CORRECT} points
      </AppText>
      <AppText weight="regular" muted style={styles.detail}>
        Next round: 5 new questions.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { fontSize: 28, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  label: { fontSize: 13, letterSpacing: 1.5 },
  score: { fontSize: 72, lineHeight: 84 },
  detail: { fontSize: 15, textAlign: 'center' },
});
