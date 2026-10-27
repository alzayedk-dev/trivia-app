import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useRef, useState } from 'react';
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
import { ChevronLeft, GlobeIcon } from '../components/Icons';
import { PillButton } from '../components/PillButton';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreCard } from '../components/ScoreCard';
import { pickRound, POINTS_PER_CORRECT, QUESTIONS_PER_ROUND, shuffle, TIMED_OUT } from '../game';
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

export default function GameScreen() {
  const theme = useTopicTheme();
  const compact = useCompactLayout();
  // Questions seen this session, so "Play again" brings new ones.
  const seenIds = useState(() => new Set<string>())[0];
  const [round, setRound] = useState(() => pickRound(seenIds));
  const [picks, setPicks] = useState<(string | null)[]>(() => Array(QUESTIONS_PER_ROUND).fill(null));
  const [slide, setSlide] = useState(0);
  // The furthest card shown so far; a question's timer starts once it's been shown.
  const [furthest, setFurthest] = useState(0);
  // The one-per-round 50/50: which question it was used on and the answers it removed.
  const [fiftyFifty, setFiftyFifty] = useState<{ index: number; removed: string[] } | null>(null);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const fade = useState(() => new Animated.Value(1))[0];

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

  const goTo = (next: number) => scrollRef.current?.scrollTo({ x: next * width, animated: true });

  // Called with TIMED_OUT when the question's timer runs out.
  const pick = (index: number, option: string) => {
    if (picks[index] !== null) return;
    // Animates the unused answers sliding away as the feedback appears.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPicks((prev) => prev.map((p, i) => (i === index ? option : p)));
    buzz(option === round[index].answer);
    // On the first question, peek at the next card to show it can be swiped.
    if (index === 0) {
      setTimeout(() => scrollRef.current?.scrollTo({ x: NUDGE, animated: true }), 1600);
      setTimeout(() => scrollRef.current?.scrollTo({ x: 0, animated: true }), 1950);
    }
  };

  const applyFiftyFifty = () => {
    const { options, answer } = round[slide];
    const removed = shuffle(options.filter((o) => o !== answer)).slice(0, 2);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiftyFifty({ index: slide, removed });
  };

  const playAgain = () => {
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver }).start(() => {
      setRound(pickRound(seenIds));
      setPicks(Array(QUESTIONS_PER_ROUND).fill(null));
      setSlide(0);
      setFurthest(0);
      setFiftyFifty(null);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver }).start();
    });
  };

  // Leaves mid-game. If the game was opened directly, this replaces it with Home.
  const goHome = () => router.dismissTo('/');

  let footer = null;
  if (onFinal) footer = <Button label="Play again" onPress={playAgain} />;
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

      <Animated.View style={[styles.viewport, { opacity: fade }]} onLayout={onLayout}>
        {width > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {round.slice(0, questionSlides).map((item, i) => (
              <ScrollView
                // Remount cards on a new round so their animations start fresh.
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
      </Animated.View>

      {/* Space is kept for the button so the card doesn't jump when it appears. */}
      <View style={styles.footer}>{footer ?? <View style={styles.footerSpacer} />}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
