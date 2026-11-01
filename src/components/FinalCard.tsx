import { StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { POINTS_PER_CORRECT } from '../game';
import { useStrings } from '../strings';
import { colors, useAppTheme, useDesktopLayout } from '../theme';
import { AppText } from './AppText';
import { Direction } from './Direction';
import { CardWatermark } from './CardWatermark';
import { BulbArt, RaysArt } from './TriviaArt';

type Props = {
  score: number;
  correctCount: number;
  total: number;
  // An AI game's line about the topic's best score, e.g. "New best for this topic!".
  note?: string;
};

function verdictIndex(correctCount: number, total: number): number {
  const share = correctCount / total;
  if (share === 1) return 0;
  if (share >= 0.8) return 1;
  if (share >= 0.6) return 2;
  if (share >= 0.3) return 3;
  return 4;
}

export function FinalCard({ score, correctCount, total, note }: Props) {
  const { t, rtl } = useStrings();
  const theme = useAppTheme();
  const desktop = useDesktopLayout();
  return (
    <Direction rtl={rtl} style={[styles.card, desktop && styles.cardDesktop]}>
      <CardWatermark size={320} offset={60} />
      <Svg width={110} height={110} viewBox="0 0 200 200">
        <RaysArt color={theme.highlight} />
        <BulbArt color={theme.accent} fill={theme.highlight} markColor="#FFFFFF" />
      </Svg>
      <AppText weight="black" style={styles.title}>
        {t.verdicts[verdictIndex(correctCount, total)]}
      </AppText>
      <AppText muted style={styles.label}>
        {t.totalScore}
      </AppText>
      <AppText weight="black" style={[styles.score, { color: theme.accent }]}>
        {score}
      </AppText>
      <AppText weight="regular" muted style={styles.detail}>
        {t.result(correctCount, total, total * POINTS_PER_CORRECT)}
      </AppText>
      {!!note && (
        <AppText weight="black" style={[styles.detail, { color: theme.accent }]}>
          {note}
        </AppText>
      )}
      <AppText weight="regular" muted style={styles.detail}>
        {t.nextGame}
      </AppText>
    </Direction>
  );
}

const styles = StyleSheet.create({
  // Computers: capped in height so it matches the question card on a tall monitor.
  cardDesktop: { maxHeight: 660, borderRadius: 30 },
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
