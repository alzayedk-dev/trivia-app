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
import { AI_QUESTION_COUNT, fetchAiQuestions } from '../aiQuestions';
import { recordScore } from '../bestScores';
import { useNativeDriver } from '../animation';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Direction } from '../components/Direction';
import { FinalCard } from '../components/FinalCard';
import { BulbIcon, ChevronLeft, OfflineIcon, RefreshIcon } from '../components/Icons';
import { LoadingScreen } from '../components/LoadingScreen';
import { PillButton } from '../components/PillButton';
import { QuestionCard } from '../components/QuestionCard';
import { ScoreCard } from '../components/ScoreCard';
import { EmptyScreen, ErrorScreen } from '../components/StatusScreen';
import { buildPlan, POINTS_PER_CORRECT, RoundQuestion, shuffle, TIMED_OUT, toRoundQuestion } from '../game';
import { streamQuestions } from '../questionBank';
import { GameSettings, useGameSettings } from '../settings';
import { SHARE_MESSAGE } from '../share';
import { LanguageProvider, useStrings } from '../strings';
import { useAppTheme, useCompactLayout, useDesktopLayout } from '../theme';

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
  const { settings, loaded } = useGameSettings();
  const [gameNumber, setGameNumber] = useState(0);
  const fade = useState(() => new Animated.Value(1))[0];

  const playAgain = () => {
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver }).start(() => {
      setGameNumber((n) => n + 1);
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver }).start();
    });
  };

  // On a refresh, wait for the saved settings so the game starts the right way.
  if (!loaded) return <LoadingScreen />;

  // An AI game in Arabic is written in Arabic and the screens read right to left.
  const language = settings.source === 'ai' ? settings.aiLanguage : 'en';
  return (
    <LanguageProvider value={language}>
      <Animated.View style={[styles.fill, { opacity: fade }]}>
        <Direction rtl={language === 'ar'} style={styles.fill}>
          {/* A new key per game resets everything and fetches new questions. */}
          <Game key={gameNumber} settings={settings} onPlayAgain={playAgain} />
        </Direction>
      </Animated.View>
    </LanguageProvider>
  );
}

// One game. Live and My questions stream in (from stock, downloads or the
// built-in backup) and show as they arrive, so play can start before all are
// ready. AI games wait for the AI to write all 5 questions.
function Game({ settings, onPlayAgain }: { settings: GameSettings; onPlayAgain: () => void }) {
  const { t } = useStrings();
  const isAi = settings.source === 'ai';
  // AI games have no category plan: the AI writes the questions from a topic.
  const [plan] = useState(() => (isAi ? [] : buildPlan(settings)));
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [offline, setOffline] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  // The small line under the AI error message, e.g. "Error 429 · …".
  const [aiDetail, setAiDetail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (settings.source === 'ai') {
      const style = { difficulty: settings.aiDifficulty, language: settings.aiLanguage, model: settings.aiModel };
      fetchAiQuestions(settings.aiTopic, style).then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setQuestions(result.questions.map(toRoundQuestion));
          setDone(true);
        } else {
          setAiDetail(result.detail);
          setFailed(true);
        }
      });
    } else {
      streamQuestions(
        plan,
        settings.source,
        ({ question, offlineBackup }) => {
          setQuestions((prev) => [...prev, toRoundQuestion(question)]);
          if (offlineBackup) setOffline(true);
        },
        () => cancelled,
      )
        .then(() => !cancelled && setDone(true))
        .catch(() => !cancelled && setFailed(true));
    }
    return () => {
      cancelled = true;
    };
  }, [plan, settings.source, settings.aiTopic, settings.aiDifficulty, settings.aiLanguage, settings.aiModel, attempt]);

  const retry = () => {
    setQuestions([]);
    setOffline(false);
    setDone(false);
    setFailed(false);
    setAiDetail('');
    setAttempt((n) => n + 1);
  };

  if (questions.length === 0) {
    if (failed) {
      return isAi ? (
        <ErrorScreen message={t.aiError} detail={aiDetail} onRetry={retry} onHome={goHome} />
      ) : (
        <ErrorScreen onRetry={retry} onHome={goHome} />
      );
    }
    if (done) return <EmptyScreen onRetry={retry} onHome={goHome} />;
    return <LoadingScreen message={isAi ? t.writing : 'Finding your questions…'} />;
  }
  return (
    <RoundView
      questions={questions}
      // If some slots couldn't be filled without repeating a question from this
      // session, the game is just shorter.
      total={isAi ? AI_QUESTION_COUNT : done ? questions.length : plan.length}
      offline={offline}
      timerSeconds={settings.timerSeconds}
      onPlayAgain={onPlayAgain}
      // AI games can be swapped for a fresh set on the same topic, and keep a best score per topic.
      topic={isAi ? settings.aiTopic : undefined}
    />
  );
}

type RoundProps = {
  // The questions loaded so far; grows until it reaches `total`.
  questions: RoundQuestion[];
  total: number;
  // Some questions are my questions because the server couldn't be reached.
  offline: boolean;
  timerSeconds: number | null;
  onPlayAgain: () => void;
  // The topic of an AI game.
  topic?: string;
};

function RoundView({ questions, total, offline, timerSeconds, onPlayAgain, topic }: RoundProps) {
  const { t, rtl } = useStrings();
  const theme = useAppTheme();
  const compact = useCompactLayout();
  const desktop = useDesktopLayout();
  // Sized for the planned number of questions; if the game comes up short, only the first `total` are used.
  const [picks, setPicks] = useState<(string | null)[]>(() => Array(total).fill(null));
  const [slide, setSlide] = useState(0);
  // The furthest card shown so far; a question's timer starts once it's been shown.
  const [furthest, setFurthest] = useState(0);
  // The one-per-game 50/50: which question it was used on and the answers it removed.
  const [fiftyFifty, setFiftyFifty] = useState<{ index: number; removed: string[] } | null>(null);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const answeredCount = picks.slice(0, total).filter((p) => p !== null).length;
  // Only slides the player has reached (and that have loaded) exist, so you can
  // swipe back to review but never past a question you haven't answered.
  const questionSlides = Math.min(answeredCount + 1, questions.length);
  const showFinal = answeredCount === total;
  const nextReady = slide + 1 < questions.length || slide + 1 === total;

  const results = picks.slice(0, total).map((p, i) => (p === null ? null : p === questions[i]?.answer));
  const correctCount = results.filter((r) => r === true).length;
  const score = correctCount * POINTS_PER_CORRECT;
  const onFinal = slide === total;
  const answered = !onFinal && picks[slide] !== null;

  // When an AI game ends, save the score if it's the best for the topic so far.
  const [bestNote, setBestNote] = useState('');
  useEffect(() => {
    if (!showFinal || !topic) return;
    recordScore(topic, score, total * POINTS_PER_CORRECT).then(({ previous, isBest }) => {
      if (isBest && previous !== null) setBestNote(t.newBest);
      else if (!isBest && previous !== null) setBestNote(t.bestScore(previous));
    });
    // Runs once, when the last question is answered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFinal]);

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

  const homeButton = (
    <PillButton
      label={t.home}
      icon={
        <View style={rtl && styles.flip}>
          <ChevronLeft color={theme.accent} />
        </View>
      }
      onPress={goHome}
    />
  );
  // AI games: throw these questions away and get a fresh set on the same topic.
  const newSetButton = topic ? (
    <PillButton
      label={t.newSet}
      icon={compact ? <RefreshIcon color={theme.accent} /> : undefined}
      iconOnly={compact}
      onPress={onPlayAgain}
    />
  ) : null;
  const buttonStyle = desktop ? styles.footerButtonDesktop : undefined;
  let footer = null;
  if (onFinal) footer = <Button label={t.playAgain} onPress={onPlayAgain} style={buttonStyle} />;
  else if (!answered && !fiftyFifty)
    footer = <Button label="50/50" variant="secondary" onPress={applyFiftyFifty} style={buttonStyle} />;
  else if (answered && !nextReady)
    footer = (
      <Button label="Loading next question…" variant="secondary" disabled onPress={() => {}} style={buttonStyle} />
    );
  else if (answered)
    footer = (
      <Button
        label={slide === total - 1 ? t.seeScore : t.next}
        arrow
        onPress={() => goTo(slide + 1)}
        style={buttonStyle}
      />
    );

  return (
    <SafeAreaView style={[styles.safe, desktop && styles.safeDesktop]}>
      {compact ? (
        // Short phones: Home and the score share one row to leave room for the card.
        <View style={[styles.header, styles.topBar, desktop && styles.gutterDesktop]}>
          {homeButton}
          <View style={styles.scoreInline}>
            <ScoreCard score={score} results={results} current={slide} />
          </View>
          {newSetButton}
        </View>
      ) : (
        <View style={[styles.header, desktop && styles.gutterDesktop]}>
          <View style={styles.topBar}>
            {homeButton}
            {newSetButton ?? (
              <View style={styles.brand}>
                <BulbIcon color={theme.accent} size={24} />
                <AppText weight="black" style={styles.brandText}>
                  {theme.title}
                </AppText>
              </View>
            )}
          </View>
          <ScoreCard score={score} results={results} current={slide} />
        </View>
      )}

      {offline && (
        <View
          style={[styles.notice, desktop && styles.noticeDesktop, { backgroundColor: theme.highlightSoft }]}
          accessibilityRole="alert"
        >
          <OfflineIcon color={theme.ink} />
          <AppText weight="regular" style={styles.noticeText}>
            Can’t reach the question server, so you’re playing with the app’s built-in questions.
          </AppText>
        </View>
      )}

      {/* The card pager keeps swiping left to right even in Arabic; the cards inside read right to left. */}
      <Direction rtl={false} style={styles.viewport} onLayout={onLayout}>
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
                contentContainerStyle={[styles.slide, desktop && styles.slideDesktop]}
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
              <View style={[styles.slide, desktop && styles.slideDesktop, { width }]}>
                <FinalCard score={score} correctCount={correctCount} total={total} note={bestNote} />
              </View>
            )}
          </ScrollView>
        )}
      </Direction>

      {/* Space is kept for the button so the card doesn't jump when it appears. */}
      <View style={[styles.footer, desktop && styles.footerDesktop]}>
        {footer ?? <View style={styles.footerSpacer} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flip: { transform: [{ scaleX: -1 }] },
  safe: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  // Computers: a wider column, with the card centred in it and roomier margins.
  safeDesktop: { maxWidth: 920 },
  gutterDesktop: { paddingHorizontal: 24 },
  noticeDesktop: { marginHorizontal: 24 },
  slideDesktop: { paddingHorizontal: 24, justifyContent: 'center' },
  footerDesktop: { paddingHorizontal: 24, alignItems: 'center' },
  footerButtonDesktop: { width: '100%', maxWidth: 440 },
  header: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreInline: { flex: 1, marginHorizontal: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontSize: 20 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  viewport: { flex: 1, marginTop: 10 },
  slide: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 12 },
  footer: { paddingHorizontal: 16, paddingBottom: 12 },
  footerSpacer: { height: 60 },
});
