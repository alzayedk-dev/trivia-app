import { StyleSheet, View } from 'react-native';
import { POINTS_PER_CORRECT, QUESTIONS_PER_ROUND, RoundQuestion, TIMED_OUT } from '../game';
import { colors, useCompactLayout, useLargeLayout, useTopicTheme } from '../theme';
import { AnswerButton, AnswerState } from './AnswerButton';
import { AnswerFeedback } from './AnswerFeedback';
import { AppText } from './AppText';
import { CardWatermark } from './CardWatermark';
import { TimerBar, TimerPill, useQuestionTimer } from './QuestionTimer';

const LETTERS = ['A', 'B', 'C', 'D'];

type Props = {
  item: RoundQuestion;
  index: number;
  picked: string | null;
  onPick: (option: string) => void;
  // The timer runs once the question has been shown and until it's answered.
  started: boolean;
  onTimeout: () => void;
  // Wrong answers removed by the 50/50 lifeline.
  removed: string[];
};

// Question and feedback sit at the top; the answers sit at the bottom of the
// card, where a thumb naturally rests.
export function QuestionCard({ item, index, picked, onPick, started, onTimeout, removed }: Props) {
  const theme = useTopicTheme();
  const compact = useCompactLayout();
  const large = useLargeLayout();
  const answered = picked !== null;
  const correct = picked === item.answer;
  const timedOut = picked === TIMED_OUT;
  const { secondsLeft, progress } = useQuestionTimer({ running: started && !answered, onTimeout });

  const stateFor = (option: string): AnswerState => {
    if (!answered) return 'idle';
    if (option === picked) return correct ? 'correct' : 'wrong';
    if (option === item.answer) return 'reveal';
    return 'faded';
  };

  // Once answered, only your pick and the right answer stay, making room for
  // the feedback so the card never needs to scroll.
  const visibleOptions = item.options
    .map((option, i) => ({ option, i }))
    .filter(({ option }) => stateFor(option) !== 'faded' && (answered || !removed.includes(option)));

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <CardWatermark size={300} offset={70} />

      <View style={styles.meta}>
        <AppText weight="black" style={[styles.number, { backgroundColor: theme.accent, color: theme.accentText }]}>
          {index + 1}/{QUESTIONS_PER_ROUND}
        </AppText>
        <TimerPill secondsLeft={secondsLeft} />
        <AppText style={[styles.category, { color: theme.accent, backgroundColor: theme.accentSoft }]}>
          {item.question.category}
        </AppText>
      </View>
      <TimerBar progress={progress} secondsLeft={secondsLeft} />

      <AppText weight="black" style={[styles.prompt, compact && styles.promptCompact, large && styles.promptLarge]}>
        {item.question.prompt}
      </AppText>

      {answered && (
        <View
          style={[
            styles.feedback,
            compact && styles.feedbackCompact,
            correct ? styles.feedbackRight : styles.feedbackWrong,
          ]}
        >
          <View style={styles.verdictRow}>
            <AppText weight="black" style={[styles.verdict, { color: correct ? colors.correct : colors.wrong }]}>
              {correct ? 'Correct' : timedOut ? "Time's up" : 'Incorrect'}
            </AppText>
            {correct && (
              <AppText weight="black" style={styles.pointsPill}>
                +{POINTS_PER_CORRECT}
              </AppText>
            )}
          </View>
          <AppText weight="regular" style={[styles.fact, compact && styles.factCompact]}>
            {item.question.fact}
          </AppText>
        </View>
      )}

      <View style={styles.spacer} />

      <View style={[styles.options, compact && styles.optionsCompact]}>
        {visibleOptions.map(({ option, i }) => (
          <AnswerButton
            key={option}
            label={option}
            letter={LETTERS[i]}
            state={stateFor(option)}
            onPress={() => onPick(option)}
          />
        ))}
      </View>

      {answered && <AnswerFeedback correct={correct} points={POINTS_PER_CORRECT} />}
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
    padding: 16,
    gap: 14,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardCompact: { padding: 12, gap: 10 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  category: {
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prompt: { fontSize: 23, lineHeight: 30 },
  promptCompact: { fontSize: 20, lineHeight: 26 },
  promptLarge: { fontSize: 30, lineHeight: 38 },
  feedback: { borderRadius: 16, padding: 12, gap: 4 },
  feedbackCompact: { padding: 10, gap: 2 },
  feedbackRight: { backgroundColor: colors.correctSoft },
  feedbackWrong: { backgroundColor: colors.wrongSoft },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verdict: { fontSize: 20 },
  pointsPill: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: colors.correct,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fact: { fontSize: 15, lineHeight: 21 },
  factCompact: { fontSize: 14, lineHeight: 19 },
  spacer: { flex: 1, minHeight: 4 },
  options: { gap: 10 },
  optionsCompact: { gap: 8 },
});
