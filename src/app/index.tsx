import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { ShareIcon } from '../components/Icons';
import { PillButton } from '../components/PillButton';
import { ShareSheet } from '../components/ShareSheet';
import { BulbArt, RaysArt } from '../components/TriviaArt';
import {
  availableDifficulties,
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
  MIN_QUESTIONS,
  TIMER_OPTIONS,
  useGameSettings,
} from '../settings';
import { SHARE_MESSAGE, SHARE_URL } from '../share';
import { colors, DIFFICULTY_COLORS, useAppTheme, useCompactLayout } from '../theme';

// Page title and description for the web version (also used in link previews).
export function generateMetadata(): Metadata {
  return { title: 'Trivia Night', description: SHARE_MESSAGE };
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const SOURCES: { value: QuestionSource; label: string; hint: string }[] = [
  { value: 'live', label: 'Live questions', hint: 'Fresh questions from the Open Trivia Database. Needs internet.' },
  { value: 'mine', label: 'My questions', hint: 'Your own question set. Works offline.' },
];
// Wait for the player to stop tapping before downloading for new picks.
const WARM_UP_DELAY_MS = 1200;

// Home doubles as the game setup: question source, categories, difficulty per
// category, number of questions and time per question, all remembered on the device.
export default function HomeScreen() {
  const theme = useAppTheme();
  const compact = useCompactLayout();
  const { settings, update, setPicks } = useGameSettings();
  const [sharing, setSharing] = useState(false);
  const { source, questionCount, timerSeconds } = settings;
  const picks = activePicks(settings);

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
    setPicks(picked ? picks.filter((c) => c.id !== id) : [...picks, { id, difficulty: defaultDifficulty(source, id) }]);
  };

  const setDifficulty = (id: number, difficulty: Difficulty) =>
    setPicks(picks.map((c) => (c.id === id ? { ...c, difficulty } : c)));

  // Shown when a picked category is missing a level, to explain the greyed-out buttons.
  const someUnavailable = picks.some((c) => availableDifficulties(source, c.id).length < DIFFICULTIES.length);
  const sourceHint = SOURCES.find((s) => s.value === source)?.hint;

  const nameOf = (choice: CategoryChoice) => CATEGORIES.find((c) => c.id === choice.id)?.name ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        {SHARE_URL && (
          <PillButton label="Share" icon={<ShareIcon color={theme.accent} />} onPress={() => setSharing(true)} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Svg width={compact ? 72 : 96} height={compact ? 72 : 96} viewBox="0 0 200 200">
            <RaysArt color={theme.highlight} />
            <BulbArt color={theme.accent} fill={theme.highlightSoft} />
          </Svg>
          <AppText weight="black" style={[styles.title, compact && styles.titleCompact]}>
            {theme.title}
          </AppText>
          <AppText weight="regular" muted style={styles.tagline}>
            {theme.tagline}
          </AppText>
        </View>

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
                  style={[styles.sourceOption, selected && { backgroundColor: theme.accent }]}
                >
                  <AppText style={[styles.sourceLabel, { color: selected ? theme.accentText : theme.ink }]}>
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

        <Section title="Categories" hint="Pick one or more">
          <View style={styles.chips}>
            {sourceCategories(source).map((category) => (
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
                    const available = availableDifficulties(source, choice.id).includes(difficulty);
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
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Start" arrow onPress={() => router.push('/game')} />
        {/* Required credit for the Open Trivia Database (CC BY-SA 4.0). */}
        {source === 'live' && (
          <AppText weight="regular" muted style={styles.credit}>
            Questions from Open Trivia Database (opentdb.com), CC BY-SA 4.0
          </AppText>
        )}
      </View>

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
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: theme.accent, borderColor: theme.accent },
        pressed && styles.pressed,
      ]}
    >
      <AppText style={[styles.chipText, { color: selected ? theme.accentText : theme.ink }]}>{label}</AppText>
    </Pressable>
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
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: theme.accentSoft },
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
  segmentUnavailable: { opacity: 0.3, borderStyle: 'dashed' },
  sourceSwitch: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: colors.option },
  sourceOption: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceLabel: { fontSize: 15 },
  sourceHint: { fontSize: 13, lineHeight: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  step: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  stepDisabled: { opacity: 0.35 },
  stepText: { fontSize: 30, lineHeight: 34 },
  count: { fontSize: 40, minWidth: 56, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 },
  credit: { fontSize: 12, textAlign: 'center' },
});
