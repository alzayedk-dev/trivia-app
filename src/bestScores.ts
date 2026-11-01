import AsyncStorage from '@react-native-async-storage/async-storage';

// The best score for each AI topic the player has tried, kept on this device.
const STORAGE_KEY = 'trivia-night/best-scores-v1';
// Only the most recently played topics are kept, so the list stays short.
const MAX_TOPICS = 30;

export type BestScore = {
  // The topic as the player typed it (the most recent spelling).
  topic: string;
  best: number;
  // The most the game could give, e.g. 250 for five questions.
  outOf: number;
  playedAt: number;
};

const keyOf = (topic: string) => topic.replace(/\s+/g, ' ').trim().toLowerCase();

async function readAll(): Promise<Record<string, BestScore>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, BestScore>) : {};
  } catch {
    return {};
  }
}

// Saves a finished game. `previous` is the old best for the topic (null the first time), and
// `isBest` says whether this game beat it.
export async function recordScore(
  topic: string,
  score: number,
  outOf: number,
): Promise<{ previous: number | null; isBest: boolean }> {
  const key = keyOf(topic);
  if (!key) return { previous: null, isBest: false };
  const all = await readAll();
  const previous = all[key]?.best ?? null;
  const isBest = previous === null || score > previous;
  all[key] = {
    topic: topic.replace(/\s+/g, ' ').trim(),
    best: isBest ? score : (previous ?? score),
    outOf,
    playedAt: Date.now(),
  };
  const kept = Object.entries(all)
    .sort(([, a], [, b]) => b.playedAt - a.playedAt)
    .slice(0, MAX_TOPICS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(kept))).catch(() => {});
  return { previous, isBest };
}

// Every topic tried, most recently played first.
export async function loadBestScores(): Promise<BestScore[]> {
  const all = await readAll();
  return Object.values(all)
    .filter((entry) => entry && typeof entry.topic === 'string' && typeof entry.best === 'number')
    .sort((a, b) => b.playedAt - a.playedAt);
}
