import { router, useFocusEffect } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { AI_DIFFICULTIES, AI_LANGUAGES, AI_MODELS, AI_TOPICS } from '../aiOptions';
import { AI_QUESTION_COUNT } from '../aiQuestions';
import { BestScore, loadBestScores } from '../bestScores';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { ShareIcon } from '../components/Icons';
import { PillButton } from '../components/PillButton';
import { ShareSheet } from '../components/ShareSheet';
import { BulbArt, RaysArt } from '../components/TriviaArt';
import {
  availableDifficulties,
  CategorySource,
  defaultDifficulty,
  DIFFICULTIES,
  QuestionSource,
  sourceCategories,
} from '../data/availability';
import { CATEGORIES } from '../data/categories';
import { Difficulty } from '../data/questions';
import { warmUp } from '../questionBank';
import {
  activePicks,
  CategoryChoice,
  MAX_QUESTIONS,
  MAX_TOPIC_LENGTH,
  MIN_QUESTIONS,
  MIN_TOPIC_LENGTH,
  TIMER_OPTIONS,
  useGameSettings,
} from '../settings';
import { SHARE_MESSAGE, SHARE_URL } from '../share';
import {
  colors,
  DIFFICULTY_COLORS,
  FONTS,
  PressState,
  useAppTheme,
  useCompactLayout,
  useDesktopLayout,
} from '../theme';

// Page title and description for the web version (also used in link previews).
export function generateMetadata(): Metadata {
  return { title: 'Trivia Night', description: SHARE_MESSAGE };
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const AI_DIFFICULTY_OPTIONS = AI_DIFFICULTIES.map((value) =>
  value === 'mixed'
    ? { value, label: 'Mixed' }
    : { value, label: DIFFICULTY_LABELS[value], tone: DIFFICULTY_COLORS[value] },
);
const SOURCES: { value: QuestionSource; label: string; hint: string }[] = [
  { value: 'live', label: 'Live questions', hint: 'Fresh questions from the Open Trivia Database. Needs internet.' },
  { value: 'ai', label: 'AI mode', hint: 'Type any topic and an AI writes questions about it. Needs internet.' },
];
// How many best scores the home screen lists.
const MAX_BEST_ROWS = 6;
// Wait for the player to stop tapping before downloading for new picks.
const WARM_UP_DELAY_MS = 1200;

// Home doubles as the game setup: question source, categories, difficulty per
// category, number of questions and time per question, all remembered on the device.
// AI mode swaps the categories, difficulty and question count for a typed topic.
export default function HomeScreen() {
  const theme = useAppTheme();
  const compact = useCompactLayout();
  const { settings, update, setPicks } = useGameSettings();
  const [sharing, setSharing] = useState(false);
  const { source, questionCount, timerSeconds, aiTopic, aiDifficulty, aiLanguage, aiModel } = settings;
  // The best score for each AI topic tried, refreshed whenever Home comes back into view.
  const [bests, setBests] = useState<BestScore[]>([]);
  useFocusEffect(
    useCallback(() => {
      loadBestScores().then(setBests);
    }, []),
  );
  const picks = activePicks(settings);
  const isAi = source === 'ai';
  // The category lists belong to Live and My questions; AI mode doesn't show them.
  const listSource: CategorySource = isAi ? 'live' : source;
  // AI mode needs a topic before it can start.
  const canStart = !isAi || aiTopic.trim().length >= MIN_TOPIC_LENGTH;
  const startGame = () => {
    if (canStart) router.push('/game');
  };

  // Start downloading live questions for the current picks in the background.
  useEffect(() => {
    if (source !== 'live') return;
    const timer = setTimeout(
      () => warmUp(picks.map((c) => ({ categoryId: c.id, difficulty: c.difficulty }))),
      WARM_UP_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [source, picks]);

  const toggleCategory = (id: number) => {
    const picked = picks.some((c) => c.id === id);
    // At least one category stays picked.
    if (picked && picks.length === 1) return;
    setPicks(
      picked ? picks.filter((c) => c.id !== id) : [...picks, { id, difficulty: defaultDifficulty(listSource, id) }],
    );
  };

  const setDifficulty = (id: number, difficulty: Difficulty) =>
    setPicks(picks.map((c) => (c.id === id ? { ...c, difficulty } : c)));

  // Shown when a picked category is missing a level, to explain the greyed-out buttons.
  const someUnavailable = picks.some((c) => availableDifficulties(listSource, c.id).length < DIFFICULTIES.length);
  const sourceHint = SOURCES.find((s) => s.value === source)?.hint;

  const nameOf = (choice: CategoryChoice) => CATEGORIES.find((c) => c.id === choice.id)?.name ?? '';

  const desktop = useDesktopLayout();
  const logoSize = desktop ? (compact ? 120 : 168) : compact ? 72 : 96;

  const hero = (
    <View style={[styles.hero, desktop && styles.heroDesktop]}>
      <Svg width={logoSize} height={logoSize} viewBox="0 0 200 200">
        <RaysArt color={theme.highlight} />
        <BulbArt color={theme.accent} fill={theme.highlightSoft} />
      </Svg>
      <AppText weight="black" style={[styles.title, compact && styles.titleCompact, desktop && styles.titleDesktop]}>
        {theme.title}
      </AppText>
      <AppText weight="regular" muted style={[styles.tagline, desktop && styles.taglineDesktop]}>
        {theme.tagline}
      </AppText>
    </View>
  );

  const setup = (
    <>
      <Section title="Questions from">
        <View style={styles.sourceSwitch} accessibilityRole="radiogroup">
          {SOURCES.map((option) => {
            const selected = source === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                onPress={() => update({ source: option.value })}
                style={({ hovered }: PressState) => [
                  styles.sourceOption,
                  hovered && !selected && { backgroundColor: theme.accentSoft },
                  selected && { backgroundColor: theme.accent },
                ]}
              >
                <AppText
                  numberOfLines={2}
                  style={[styles.sourceLabel, { color: selected ? theme.accentText : theme.ink }]}
                >
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText weight="regular" muted style={styles.sourceHint}>
          {sourceHint}
        </AppText>
      </Section>

      {isAi ? (
        <>
          <Section title="Your topic" hint="Type one or tap one">
            <TextInput
              value={aiTopic}
              onChangeText={(text) => update({ aiTopic: text })}
              placeholder="e.g. Volcanoes, 90s hip hop, Formula 1"
              placeholderTextColor={theme.inkMuted}
              selectionColor={theme.accent}
              accessibilityLabel="Topic for the AI"
              maxLength={MAX_TOPIC_LENGTH}
              returnKeyType="go"
              onSubmitEditing={startGame}
              style={[styles.topicInput, { color: theme.ink }]}
            />
            <View style={styles.chips}>
              {AI_TOPICS[aiLanguage].map((label) => (
                <Chip
                  key={label}
                  label={label}
                  selected={aiTopic.trim().toLowerCase() === label.toLowerCase()}
                  onPress={() => update({ aiTopic: label })}
                />
              ))}
            </View>
            <AppText weight="regular" muted style={styles.sourceHint}>
              The AI writes {AI_QUESTION_COUNT} questions about it. Tap Let’s start when you’re ready.
            </AppText>
          </Section>

          <Section title="Language" hint="Arabic reads right to left">
            <Segmented
              label="Language"
              options={AI_LANGUAGES}
              value={aiLanguage}
              onChange={(value) => update({ aiLanguage: value })}
            />
          </Section>

          <Section title="Difficulty" hint="Mixed goes easy to hard">
            <Segmented
              label="Difficulty"
              options={AI_DIFFICULTY_OPTIONS}
              value={aiDifficulty}
              onChange={(value) => update({ aiDifficulty: value })}
            />
          </Section>

          <Section title="AI model" hint="All free">
            <Segmented
              label="AI model"
              options={AI_MODELS}
              value={aiModel}
              onChange={(value) => update({ aiModel: value })}
            />
            <AppText weight="regular" muted style={styles.sourceHint}>
              {AI_MODELS.find((m) => m.value === aiModel)?.hint}
            </AppText>
          </Section>
        </>
      ) : (
        <>
          <Section title="Categories" hint="Pick one or more">
            <View style={styles.chips}>
              {sourceCategories(listSource).map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={picks.some((c) => c.id === category.id)}
                  onPress={() => toggleCategory(category.id)}
                />
              ))}
            </View>
          </Section>

          <Section title="Difficulty" hint="For each category">
            <View style={styles.rows}>
              {picks.map((choice) => (
                <View key={choice.id} style={styles.difficultyRow}>
                  <AppText style={styles.rowLabel} numberOfLines={2}>
                    {nameOf(choice)}
                  </AppText>
                  <View style={styles.segments}>
                    {DIFFICULTIES.map((difficulty) => {
                      const selected = choice.difficulty === difficulty;
                      // A level the category has no questions for can't be picked.
                      const available = availableDifficulties(listSource, choice.id).includes(difficulty);
                      const tone = DIFFICULTY_COLORS[difficulty];
                      const label = `${nameOf(choice)}: ${DIFFICULTY_LABELS[difficulty]}`;
                      return (
                        <Pressable
                          key={difficulty}
                          accessibilityRole="radio"
                          accessibilityState={{ selected, disabled: !available }}
                          accessibilityLabel={available ? label : `${label} (not available)`}
                          disabled={!available}
                          onPress={() => setDifficulty(choice.id, difficulty)}
                          style={[
                            styles.segment,
                            selected && { backgroundColor: tone.background, borderColor: tone.text },
                            !available && styles.segmentUnavailable,
                          ]}
                        >
                          <AppText style={[styles.segmentText, { color: selected ? tone.text : theme.inkMuted }]}>
                            {DIFFICULTY_LABELS[difficulty]}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
            {someUnavailable && (
              <AppText weight="regular" muted style={styles.sourceHint}>
                Greyed-out levels have no questions for that category.
              </AppText>
            )}
          </Section>

          <Section title="Questions" hint={`${MIN_QUESTIONS} to ${MAX_QUESTIONS}`}>
            <View style={styles.stepper}>
              <StepButton
                label="−"
                accessibilityLabel="Fewer questions"
                disabled={questionCount <= MIN_QUESTIONS}
                onPress={() => update({ questionCount: questionCount - 1 })}
              />
              <AppText weight="black" style={[styles.count, { color: theme.accent }]}>
                {questionCount}
              </AppText>
              <StepButton
                label="+"
                accessibilityLabel="More questions"
                disabled={questionCount >= MAX_QUESTIONS}
                onPress={() => update({ questionCount: questionCount + 1 })}
              />
            </View>
          </Section>
        </>
      )}

      <Section title="Time per question">
        <View style={styles.chips}>
          {TIMER_OPTIONS.map((seconds) => (
            <Chip
              key={seconds ?? 'off'}
              label={seconds === null ? 'No timer' : `${seconds}s`}
              selected={timerSeconds === seconds}
              onPress={() => update({ timerSeconds: seconds })}
            />
          ))}
        </View>
      </Section>

      {isAi && bests.length > 0 && (
        <Section title="Your best scores" hint="Tap one to play it again">
          <View style={styles.rows}>
            {bests.slice(0, MAX_BEST_ROWS).map((entry) => (
              <Pressable
                key={entry.topic.toLowerCase()}
                accessibilityRole="button"
                accessibilityLabel={`${entry.topic}: best score ${entry.best} out of ${entry.outOf}`}
                onPress={() => update({ aiTopic: entry.topic })}
                style={({ hovered }: PressState) => [styles.bestRow, hovered && { backgroundColor: theme.accentSoft }]}
              >
                <AppText numberOfLines={1} style={styles.rowLabel}>
                  {entry.topic}
                </AppText>
                <AppText weight="black" style={{ color: theme.accent }}>
                  {entry.best}
                  <AppText weight="regular" muted>
                    {' '}
                    / {entry.outOf}
                  </AppText>
                </AppText>
              </Pressable>
            ))}
          </View>
        </Section>
      )}
    </>
  );

  const start = (
    <View style={[styles.footer, desktop && styles.startDesktop]}>
      <Button
        label={isAi ? 'Let’s start' : 'Start'}
        arrow
        disabled={!canStart}
        onPress={startGame}
        style={desktop ? styles.startButtonDesktop : undefined}
      />
      {/* Required credit for the Open Trivia Database (CC BY-SA 4.0). */}
      {source === 'live' && (
        <AppText weight="regular" muted style={styles.credit}>
          Questions from Open Trivia Database (opentdb.com), CC BY-SA 4.0
        </AppText>
      )}
      {isAi && (
        <AppText weight="regular" muted style={styles.credit}>
          Questions written by AI, so some answers may be wrong
        </AppText>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, desktop && styles.safeDesktop]}>
      <View style={[styles.topBar, desktop && styles.topBarDesktop]}>
        {SHARE_URL && (
          <PillButton label="Share" icon={<ShareIcon color={theme.accent} />} onPress={() => setSharing(true)} />
        )}
      </View>

      {desktop ? (
        // Computers: the logo and Start button on the left, the settings on the right.
        <View style={styles.deskRow}>
          <View style={styles.deskLeft}>
            {hero}
            {start}
          </View>
          <ScrollView
            style={styles.deskRight}
            contentContainerStyle={styles.deskContent}
            keyboardShouldPersistTaps="handled"
          >
            {setup}
          </ScrollView>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {hero}
            {setup}
          </ScrollView>
          {start}
        </>
      )}

      {SHARE_URL && (
        <ShareSheet url={SHARE_URL} message={SHARE_MESSAGE} visible={sharing} onClose={() => setSharing(false)} />
      )}
    </SafeAreaView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText weight="black" style={styles.sectionTitle}>
          {title}
        </AppText>
        {hint && (
          <AppText weight="regular" muted style={styles.sectionHint}>
            {hint}
          </AppText>
        )}
      </View>
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed, hovered }: PressState) => [
        styles.chip,
        hovered && !selected && { borderColor: theme.accent },
        selected && { backgroundColor: theme.accent, borderColor: theme.accent },
        pressed && styles.pressed,
      ]}
    >
      <AppText style={[styles.chipText, { color: selected ? theme.accentText : theme.ink }]}>{label}</AppText>
    </Pressable>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  options: { value: T; label: string; tone?: { text: string; background: string } }[];
  value: T;
  onChange: (value: T) => void;
};

// A row of equal-width choices where exactly one is picked.
function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const theme = useAppTheme();
  return (
    <View style={styles.segmentRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        const tone = option.tone ?? { text: theme.accent, background: theme.accentSoft };
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              styles.segmentFlex,
              selected && { backgroundColor: tone.background, borderColor: tone.text },
            ]}
          >
            <AppText numberOfLines={1} style={[styles.segmentText, { color: selected ? tone.text : theme.inkMuted }]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

type StepProps = { label: string; accessibilityLabel: string; disabled: boolean; onPress: () => void };

function StepButton({ label, accessibilityLabel, disabled, onPress }: StepProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: PressState) => [
        styles.step,
        { backgroundColor: hovered && !disabled ? theme.accentHover : theme.accentSoft },
        disabled && styles.stepDisabled,
        pressed && styles.pressed,
      ]}
    >
      <AppText weight="black" style={[styles.stepText, { color: theme.accent }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8, minHeight: 52 },
  content: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  // Computers
  safeDesktop: { maxWidth: 1160 },
  topBarDesktop: { paddingHorizontal: 24 },
  deskRow: { flex: 1, flexDirection: 'row', gap: 48, paddingHorizontal: 24, paddingBottom: 16 },
  deskLeft: { width: 400, justifyContent: 'center', gap: 24 },
  deskRight: { flex: 1 },
  deskContent: { gap: 14, paddingBottom: 24, paddingRight: 8 },
  heroDesktop: { gap: 8 },
  titleDesktop: { fontSize: 54, lineHeight: 62, marginTop: 8 },
  taglineDesktop: { fontSize: 19 },
  startDesktop: { paddingHorizontal: 0, paddingBottom: 0 },
  startButtonDesktop: { minHeight: 68 },
  hero: { alignItems: 'center', gap: 4, marginBottom: 4 },
  title: { fontSize: 40, lineHeight: 48 },
  titleCompact: { fontSize: 32, lineHeight: 40 },
  tagline: { fontSize: 16, textAlign: 'center' },
  section: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18 },
  sectionHint: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.optionBorder,
    backgroundColor: colors.option,
    justifyContent: 'center',
  },
  chipText: { fontSize: 15 },
  pressed: { opacity: 0.8 },
  rows: { gap: 10 },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { flex: 1, fontSize: 15 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: {
    minHeight: 40,
    minWidth: 68,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.optionBorder,
    backgroundColor: colors.option,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: 14 },
  segmentRow: { flexDirection: 'row', gap: 6 },
  segmentFlex: { flex: 1, minWidth: 0 },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.option,
  },
  segmentUnavailable: { opacity: 0.3, borderStyle: 'dashed' },
  sourceSwitch: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: colors.option },
  sourceOption: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLabel: { fontSize: 14, lineHeight: 18, textAlign: 'center' },
  topicInput: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.optionBorder,
    backgroundColor: colors.option,
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  sourceHint: { fontSize: 13, lineHeight: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  step: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  stepDisabled: { opacity: 0.35 },
  stepText: { fontSize: 30, lineHeight: 34 },
  count: { fontSize: 40, minWidth: 56, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 },
  credit: { fontSize: 12, textAlign: 'center' },
});
