import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from './data/categories';
import { Difficulty } from './data/questions';

export const MIN_QUESTIONS = 5;
export const MAX_QUESTIONS = 15;
// Seconds per question; null means no timer.
export const TIMER_OPTIONS: (number | null)[] = [null, 15, 30, 45, 60, 75, 90, 105, 120];

export type CategoryChoice = { id: number; difficulty: Difficulty };

export type GameSettings = {
  categories: CategoryChoice[];
  questionCount: number;
  timerSeconds: number | null;
};

export const DEFAULT_SETTINGS: GameSettings = {
  categories: [
    { id: 9, difficulty: 'easy' },
    { id: 22, difficulty: 'medium' },
  ],
  questionCount: 10,
  timerSeconds: 30,
};

const STORAGE_KEY = 'trivia-night/settings-v1';

// Drops anything unexpected from saved settings (e.g. from an older version).
function sanitize(raw: Partial<GameSettings> | null): GameSettings {
  if (!raw) return DEFAULT_SETTINGS;
  const validIds = new Set(CATEGORIES.map((c) => c.id));
  const categories = (raw.categories ?? []).filter(
    (c) => validIds.has(c.id) && ['easy', 'medium', 'hard'].includes(c.difficulty),
  );
  const count = Number(raw.questionCount);
  return {
    categories: categories.length ? categories : DEFAULT_SETTINGS.categories,
    questionCount:
      count >= MIN_QUESTIONS && count <= MAX_QUESTIONS ? Math.round(count) : DEFAULT_SETTINGS.questionCount,
    timerSeconds: TIMER_OPTIONS.includes(raw.timerSeconds ?? null)
      ? (raw.timerSeconds ?? null)
      : DEFAULT_SETTINGS.timerSeconds,
  };
}

type SettingsContextValue = {
  settings: GameSettings;
  update: (change: Partial<GameSettings>) => void;
};

const SettingsContext = createContext<SettingsContextValue>({ settings: DEFAULT_SETTINGS, update: () => {} });

// Holds the player's game setup and remembers it on the device between visits.
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSettings(sanitize(raw ? JSON.parse(raw) : null)))
      .catch(() => {});
  }, []);

  const update = useCallback((change: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...change };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useGameSettings() {
  return useContext(SettingsContext);
}
