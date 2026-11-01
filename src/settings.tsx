import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  availableDifficulties,
  CategorySource,
  defaultDifficulty,
  QuestionSource,
  sourceCategories,
} from './data/availability';
import { Difficulty } from './data/questions';

export const MIN_QUESTIONS = 5;
export const MAX_QUESTIONS = 15;
// AI mode: the longest topic a player can type, and the shortest worth sending.
export const MAX_TOPIC_LENGTH = 80;
export const MIN_TOPIC_LENGTH = 2;
// Seconds per question; null means no timer.
export const TIMER_OPTIONS: (number | null)[] = [null, 15, 30, 45, 60, 75, 90, 105, 120];

export type CategoryChoice = { id: number; difficulty: Difficulty };

export type GameSettings = {
  source: QuestionSource;
  // Picked categories for each source, so switching source keeps both setups.
  picks: Record<CategorySource, CategoryChoice[]>;
  // The topic typed for AI mode, remembered for next time.
  aiTopic: string;
  questionCount: number;
  timerSeconds: number | null;
};

export const DEFAULT_SETTINGS: GameSettings = {
  source: 'live',
  picks: {
    live: [
      { id: 9, difficulty: 'easy' },
      { id: 22, difficulty: 'medium' },
    ],
    mine: [
      { id: 9, difficulty: 'medium' },
      { id: 22, difficulty: 'medium' },
    ],
  },
  aiTopic: '',
  questionCount: 10,
  timerSeconds: 30,
};

// The categories picked for the current source.
export function activePicks(settings: GameSettings): CategoryChoice[] {
  return settings.source === 'ai' ? [] : settings.picks[settings.source];
}

const STORAGE_KEY = 'trivia-night/settings-v2';
const OLD_STORAGE_KEY = 'trivia-night/settings-v1';

// Keeps only categories the source has, each at a difficulty it has.
function cleanPicks(source: CategorySource, raw: unknown): CategoryChoice[] {
  const valid = new Set(sourceCategories(source).map((c) => c.id));
  const picks = (Array.isArray(raw) ? raw : [])
    .filter((c): c is CategoryChoice => valid.has(c?.id))
    .map((c) => ({
      id: c.id,
      difficulty: availableDifficulties(source, c.id).includes(c.difficulty)
        ? c.difficulty
        : defaultDifficulty(source, c.id),
    }));
  return picks.length ? picks : DEFAULT_SETTINGS.picks[source];
}

// Drops anything unexpected from saved settings (e.g. from an older version).
function sanitize(raw: (Partial<GameSettings> & { categories?: unknown }) | null): GameSettings {
  if (!raw) return DEFAULT_SETTINGS;
  const count = Number(raw.questionCount);
  return {
    source: raw.source === 'mine' || raw.source === 'ai' ? raw.source : 'live',
    picks: {
      // Version 1 kept a single "categories" list for live questions.
      live: cleanPicks('live', raw.picks?.live ?? raw.categories),
      mine: cleanPicks('mine', raw.picks?.mine),
    },
    aiTopic: typeof raw.aiTopic === 'string' ? raw.aiTopic.slice(0, MAX_TOPIC_LENGTH) : '',
    questionCount:
      count >= MIN_QUESTIONS && count <= MAX_QUESTIONS ? Math.round(count) : DEFAULT_SETTINGS.questionCount,
    timerSeconds: TIMER_OPTIONS.includes(raw.timerSeconds ?? null)
      ? (raw.timerSeconds ?? null)
      : DEFAULT_SETTINGS.timerSeconds,
  };
}

type SettingsContextValue = {
  settings: GameSettings;
  // False until the settings saved on the device have been read.
  loaded: boolean;
  update: (change: Partial<GameSettings>) => void;
  setPicks: (picks: CategoryChoice[]) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: true,
  update: () => {},
  setPicks: () => {},
});

// Holds the player's game setup and remembers it on the device between visits.
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(OLD_STORAGE_KEY));
      setSettings(sanitize(raw ? JSON.parse(raw) : null));
    })()
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((change: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...change };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Replaces the picked categories for the current source.
  const setPicks = useCallback(
    (picks: CategoryChoice[]) =>
      setSettings((prev) => {
        // AI mode has no category list to change.
        if (prev.source === 'ai') return prev;
        const next = { ...prev, picks: { ...prev.picks, [prev.source]: picks } };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      }),
    [],
  );

  const value = useMemo(() => ({ settings, loaded, update, setPicks }), [settings, loaded, update, setPicks]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useGameSettings() {
  return useContext(SettingsContext);
}
