import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { LoadingScreen } from '../components/LoadingScreen';
import { ChevronLeft, GlobeIcon } from '../components/Icons';
import { PillButton } from '../components/PillButton';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreCard } from '../components/ScoreCard';
import { EmptyScreen, ErrorScreen } from '../components/StatusScreen';
import { nextRound, POINTS_PER_CORRECT, QUESTIONS_PER_ROUND, RoundQuestion, shuffle, TIMED_OUT } from '../game';
import { SHARE_MESSAGE } from '../share';
import { useCompactLayout, useTopicTheme } from '../theme';

const FINAL_SLIDE = QUESTIONS_PER_ROUND;
const NUDGE = 40;

function buzz(correct: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

export function generateMetadata(): Metadata {
  return { title: 'Geo Trivia', description: SHARE_MESSAGE };
}

// Fetches each round (from the question bank, which may download) and shows it.
type Status = 'loading' | 'ready' | 'error' | 'empty';
type LoadResult = { status: 'ready'; questions: RoundQuestion[] } | { status: 'error' | 'empty' };

// Gets the next round and reports how it went: 'empty' if there weren't enough
// questions, 'error' if something failed along the way.
async function loadRound(): Promise<LoadResult> {
  try {
    const questions = await nextRound();
    if (questions.length < QUESTIONS_PER_ROUND) return { status: 'empty' };
    return { status: 'ready', questions };
  } catch {
    return { status: 'error' };
  }
}

export default function GameScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [round, setRound] = useState<RoundQuestion[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);
  const fade = useState(() => new Animated.Value(1))[0];
  const loading = useRef(false);

  // Shows a fetched round, or the empty / error screen if it didn't work out.
  const show = useCallback((result: LoadResult) => {
    if (result.status === 'ready') {
      setRound(result.questions);
      setRoundNumber((n) => n + 1);
    }
    setStatus(result.status);
  }, []);

  useEffect(() => {
    let active = true;
    loadRound().then((result) => active && show(result));
    return () => {
      active = false;
    };
  }, [show]);

  const retry = () => {
    setStatus('loading');
    loadRound().then(show);
  };

  const playAgain = () => {
    if (loading.current) return;
    loading.current = true;
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver }).start(async () => {
      show(await loadRound());
      loading.current = false;
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver }).start();
    });
  };

  const goHome = () => router.dismissTo('/');

  if (status === 'loading') return <LoadingScreen message="Finding your questions…" />;
  if (status === 'error') return <ErrorScreen onRetry={retry} onHome={goHome} />;
  if (status === 'empty') return <EmptyScreen onRetry={retry} onHome={goHome} />;
  return (
    <Animated.View style={[styles.fill, { opacity: fade }]}>
      {/* A new key per round resets the picks, timers, 50/50 and scroll position. */}
      <RoundView key={roundNumber} round={round} onPlayAgain={playAgain} />
    </Animated.View>
  );
}

function RoundView({ round, onPlayAgain }: { round: RoundQuestion[]; onPlayAgain: () => void }) {
  const theme = useTopicTheme();
  const compact = useCompactLayout();
  const [picks, setPicks] = useState<(string | null)[]>(() => Array(QUESTIONS_PER_ROUND).fill(null));
  const [slide, setSlide] = useState(0);
  // The furthest card shown so far; a question's timer starts once it's been shown.
  const [furthest, setFurthest] = useState(0);
  // The one-per-round 50/50: which question it was used on and the answers it removed.
  const [fiftyFifty, setFiftyFifty] = useState<{ index: number; removed: string[] } | null>(null);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const answeredCount = picks.filter((p) => p !== null).length;
  // Only slides the player has reached exist, so you can swipe back to review
  // but never past a question you haven't answered.
  const questionSlides = Math.min(answeredCount + 1, QUESTIONS_PER_ROUND);
  const showFinal = answeredCount === QUESTIONS_PER_ROUND;

  const results = round.map((q, i) => (picks[i] === null ? null : picks[i] === q.answer));
  const correctCount = results.filter((r) => r === true).length;
  const score = correctCount * POINTS_PER_CORRECT;
  const onFinal = slide === FINAL_SLIDE;
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
    buzz(option === round[index].answer);
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
    const { options, answer } = round[slide];
    const removed = shuffle(options.filter((o) => o !== answer)).slice(0, 2);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiftyFifty({ index: slide, removed });
  };

  // Leaves mid-game. If the game was opened directly, this replaces it with Home.
  const goHome = () => router.dismissTo('/');

  let footer = null;
  if (onFinal) footer = <Button label="Play again" onPress={onPlayAgain} />;
  else if (!answered && !fiftyFifty) footer = <Button label="50/50" variant="secondary" onPress={applyFiftyFifty} />;
  else if (answered)
    footer = (
      <Button label={slide === QUESTIONS_PER_ROUND - 1 ? 'See score' : 'Next'} arrow onPress={() => goTo(slide + 1)} />
    );

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
              <GlobeIcon color={theme.accent} size={22} />
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
            {round.slice(0, questionSlides).map((item, i) => (
              <ScrollView
                key={item.question.id}
                style={{ width }}
                contentContainerStyle={styles.slide}
                nestedScrollEnabled
              >
                <QuestionCard
                  item={item}
                  index={i}
                  picked={picks[i]}
                  onPick={(option) => pick(i, option)}
                  started={i <= furthest}
                  onTimeout={() => pick(i, TIMED_OUT)}
                  removed={fiftyFifty?.index === i ? fiftyFifty.removed : []}
                />
              </ScrollView>
            ))}
            {showFinal && (
              <View style={[styles.slide, { width }]}>
                <FinalCard score={score} correctCount={correctCount} />
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
