import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNativeDriver } from '../animation';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { FinalCard } from '../components/FinalCard';
import { BulbIcon, ChevronLeft } from '../components/Icons';
import { LoadingScreen } from '../components/LoadingScreen';
import { PillButton } from '../components/PillButton';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreCard } from '../components/ScoreCard';
import { EmptyScreen, ErrorScreen } from '../components/StatusScreen';
import { buildPlan, POINTS_PER_CORRECT, RoundQuestion, shuffle, TIMED_OUT, toRoundQuestion } from '../game';
import { streamQuestions } from '../questionBank';
import { GameSettings, useGameSettings } from '../settings';
import { SHARE_MESSAGE } from '../share';
import { useAppTheme, useCompactLayout } from '../theme';

const NUDGE = 40;

function buzz(correct: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

export function generateMetadata(): Metadata {
  return { title: 'Trivia Night', description: SHARE_MESSAGE };
}

const goHome = () => router.dismissTo('/');

export default function GameScreen() {
  const { settings } = useGameSettings();
  const [gameNumber, setGameNumber] = useState(0);
  const fade = useState(() => new Animated.Value(1))[0];

  const playAgain = () => {
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver }).start(() => {
      setGameNumber((n) => n + 1);
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver }).start();
    });
  };

  return (
    <Animated.View style={[styles.fill, { opacity: fade }]}>
      {/* A new key per game resets everything and fetches new questions. */}
      <Game key={gameNumber} settings={settings} onPlayAgain={playAgain} />
    </Animated.View>
  );
}

// One game: streams its questions in (from stock, downloads or the built-in
// backup) and shows them as they arrive, so play can start before all are ready.
function Game({ settings, onPlayAgain }: { settings: GameSettings; onPlayAgain: () => void }) {
  const [plan] = useState(() => buildPlan(settings));
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    streamQuestions(
      plan,
      (question) => setQuestions((prev) => [...prev, toRoundQuestion(question)]),
      () => cancelled,
    )
      .then(() => !cancelled && setDone(true))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [plan, attempt]);

  const retry = () => {
    setQuestions([]);
    setDone(false);
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  if (questions.length === 0) {
    if (failed) return <ErrorScreen onRetry={retry} onHome={goHome} />;
    if (done) return <EmptyScreen onRetry={retry} onHome={goHome} />;
    return <LoadingScreen message="Finding your questions…" />;
  }
  return (
    <RoundView
      questions={questions}
      total={plan.length}
      timerSeconds={settings.timerSeconds}
      onPlayAgain={onPlayAgain}
    />
  );
}

type RoundProps = {
  // The questions loaded so far; grows until it reaches `total`.
  questions: RoundQuestion[];
  total: number;
  timerSeconds: number | null;
  onPlayAgain: () => void;
};

function RoundView({ questions, total, timerSeconds, onPlayAgain }: RoundProps) {
  const theme = useAppTheme();
  const compact = useCompactLayout();
  const [picks, setPicks] = useState<(string | null)[]>(() => Array(total).fill(null));
  const [slide, setSlide] = useState(0);
  // The furthest card shown so far; a question's timer starts once it's been shown.
  const [furthest, setFurthest] = useState(0);
  // The one-per-game 50/50: which question it was used on and the answers it removed.
  const [fiftyFifty, setFiftyFifty] = useState<{ index: number; removed: string[] } | null>(null);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const answeredCount = picks.filter((p) => p !== null).length;
  // Only slides the player has reached (and that have loaded) exist, so you can
  // swipe back to review but never past a question you haven't answered.
  const questionSlides = Math.min(answeredCount + 1, questions.length);
  const showFinal = answeredCount === total;
  const nextReady = slide + 1 < questions.length || slide + 1 === total;

  const results = picks.map((p, i) => (p === null ? null : p === questions[i]?.answer));
  const correctCount = results.filter((r) => r === true).length;
  const score = correctCount * POINTS_PER_CORRECT;
  const onFinal = slide === total;
  const answered = !onFinal && picks[slide] !== null;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    scrollRef.current?.scrollTo({ x: slide * w, animated: false });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const current = Math.round(e.nativeEvent.contentOffset.x / width);
    if (current !== slide) setSlide(current);
    if (current > furthest) setFurthest(current);
  };

  // The swipe hint's pending steps, so they can be cancelled.
  const nudgeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancelNudge = () => {
    nudgeTimers.current.forEach(clearTimeout);
    nudgeTimers.current = [];
  };
  useEffect(() => cancelNudge, []);

  const goTo = (next: number) => {
    // Moving on mid-hint would otherwise be undone by the hint sliding back.
    cancelNudge();
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  // Called with TIMED_OUT when the question's timer runs out.
  const pick = (index: number, option: string) => {
    if (picks[index] !== null) return;
    // Animates the unused answers sliding away as the feedback appears.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPicks((prev) => prev.map((p, i) => (i === index ? option : p)));
    buzz(option === questions[index].answer);
    // On the first question, peek at the next card to show it can be swiped.
    // Tapping Next or swiping cancels it.
    if (index === 0) {
      nudgeTimers.current = [
        setTimeout(() => scrollRef.current?.scrollTo({ x: NUDGE, animated: true }), 1600),
        setTimeout(() => scrollRef.current?.scrollTo({ x: 0, animated: true }), 1950),
      ];
    }
  };

  const applyFiftyFifty = () => {
    const { options, answer } = questions[slide];
    const removed = shuffle(options.filter((o) => o !== answer)).slice(0, 2);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiftyFifty({ index: slide, removed });
  };

  let footer = null;
  if (onFinal) footer = <Button label="Play again" onPress={onPlayAgain} />;
  else if (!answered && !fiftyFifty) footer = <Button label="50/50" variant="secondary" onPress={applyFiftyFifty} />;
  else if (answered && !nextReady) footer = <Button label="Loading next question…" variant="secondary" disabled onPress={() => {}} />;
  else if (answered)
    footer = <Button label={slide === total - 1 ? 'See score' : 'Next'} arrow onPress={() => goTo(slide + 1)} />;

  return (
    <SafeAreaView style={styles.safe}>
      {compact ? (
        // Short phones: Home and the score share one row to leave room for the card.
        <View style={[styles.header, styles.topBar]}>
          <PillButton label="Home" icon={<ChevronLeft color={theme.accent} />} onPress={goHome} />
          <View style={styles.scoreInline}>
            <ScoreCard score={score} results={results} current={slide} />
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.topBar}>
            <PillButton label="Home" icon={<ChevronLeft color={theme.accent} />} onPress={goHome} />
            <View style={styles.brand}>
              <BulbIcon color={theme.accent} size={24} />
              <AppText weight="black" style={styles.brandText}>
                {theme.title}
              </AppText>
            </View>
          </View>
          <ScoreCard score={score} results={results} current={slide} />
        </View>
      )}

      <View style={styles.viewport} onLayout={onLayout}>
        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onScrollBeginDrag={cancelNudge}
            scrollEventThrottle={16}
          >
            {questions.slice(0, questionSlides).map((item, i) => (
              <ScrollView
                key={item.question.id}
                style={{ width }}
                contentContainerStyle={styles.slide}
                nestedScrollEnabled
              >
                <QuestionCard
                  item={item}
                  index={i}
                  total={total}
                  picked={picks[i]}
                  onPick={(option) => pick(i, option)}
                  timerSeconds={timerSeconds}
                  started={i <= furthest}
                  onTimeout={() => pick(i, TIMED_OUT)}
                  removed={fiftyFifty?.index === i ? fiftyFifty.removed : []}
                />
              </ScrollView>
            ))}
            {showFinal && (
              <View style={[styles.slide, { width }]}>
                <FinalCard score={score} correctCount={correctCount} total={total} />
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Space is kept for the button so the card doesn't jump when it appears. */}
      <View style={styles.footer}>{footer ?? <View style={styles.footerSpacer} />}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreInline: { flex: 1, marginLeft: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontSize: 20 },
  viewport: { flex: 1, marginTop: 10 },
  slide: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 12 },
  footer: { paddingHorizontal: 16, paddingBottom: 12 },
  footerSpacer: { height: 60 },
});
