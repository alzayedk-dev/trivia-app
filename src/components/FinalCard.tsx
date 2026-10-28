import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { POINTS_PER_CORRECT } from '../game';
import { colors, useAppTheme } from '../theme';
import { AppText } from './AppText';
import { CardWatermark } from './CardWatermark';
import { BulbArt, RaysArt } from './TriviaArt';

type Props = {
  score: number;
  correctCount: number;
  total: number;
};

function verdict(correctCount: number, total: number): string {
  const share = correctCount / total;
  if (share === 1) return 'Perfect game!';
  if (share >= 0.8) return 'Trivia champion!';
  if (share >= 0.6) return 'Sharp thinking!';
  if (share >= 0.3) return 'Good effort!';
  return 'Better luck next round!';
}

export function FinalCard({ score, correctCount, total }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.card}>
      <CardWatermark size={320} offset={60} />
      <Svg width={110} height={110} viewBox="0 0 200 200">
        <RaysArt color={theme.highlight} />
        <BulbArt color={theme.accent} fill={theme.highlight} markColor="#FFFFFF" />
      </Svg>
      <AppText weight="black" style={styles.title}>
        {verdict(correctCount, total)}
      </AppText>
      <AppText muted style={styles.label}>
        TOTAL SCORE
      </AppText>
      <AppText weight="black" style={[styles.score, { color: theme.accent }]}>
        {score}
      </AppText>
      <AppText weight="regular" muted style={styles.detail}>
        {correctCount} of {total} correct · out of {total * POINTS_PER_CORRECT} points
      </AppText>
      <AppText weight="regular" muted style={styles.detail}>
        Next game: new questions with the same settings.
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
