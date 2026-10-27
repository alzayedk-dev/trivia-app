import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { NotFoundScreen } from '../components/StatusScreen';

// Kept as plain "Geo Trivia": the web tab title isn't updated when you then
// navigate on, so a "not found" title would linger into the game.
export function generateMetadata(): Metadata {
  return { title: 'Geo Trivia' };
}

// Shown for any link that doesn't match a screen, e.g. an old or mistyped URL.
export default function NotFound() {
  return <NotFoundScreen onHome={() => router.replace('/')} />;
}
