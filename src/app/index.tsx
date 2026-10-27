import { router } from 'expo-router';
import type { Metadata } from 'expo-router/server';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { useNativeDriver } from '../animation';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { GlobeArt } from '../components/GlobeArt';
import { ShareIcon } from '../components/Icons';
import { PillButton } from '../components/PillButton';
import { ShareSheet } from '../components/ShareSheet';
import { POINTS_PER_CORRECT, QUESTIONS_PER_ROUND } from '../game';
import { SHARE_MESSAGE, SHARE_URL } from '../share';
import { colors, useCompactLayout, useTopicTheme } from '../theme';

// Page title and description for the web version (also used in link previews).
export function generateMetadata(): Metadata {
  return { title: 'Geo Trivia', description: SHARE_MESSAGE };
}

export default function HomeScreen() {
  const theme = useTopicTheme();
  const compact = useCompactLayout();
  const [sharing, setSharing] = useState(false);
  const float = useState(() => new Animated.Value(0))[0];

  // The globe bobs gently so the home screen feels alive.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const globeSize = compact ? 150 : 200;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        {SHARE_URL && (
          <PillButton label="Share" icon={<ShareIcon color={theme.accent} />} onPress={() => setSharing(true)} />
        )}
      </View>

      <View style={styles.hero}>
        <Animated.View
          style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }}
        >
          <Svg width={globeSize} height={globeSize} viewBox="0 0 200 200">
            <GlobeArt color={theme.accent} fill={colors.card} />
          </Svg>
        </Animated.View>
        <AppText weight="black" style={[styles.title, compact && styles.titleCompact]}>
          {theme.title}
        </AppText>
        <AppText weight="regular" muted style={styles.tagline}>
          {theme.tagline}
        </AppText>
        <View style={styles.chips}>
          <AppText style={[styles.chip, { color: theme.accent, backgroundColor: theme.accentSoft }]}>
            {QUESTIONS_PER_ROUND} questions
          </AppText>
          <AppText style={[styles.chip, { color: theme.accent, backgroundColor: theme.accentSoft }]}>
            Easy to hard
          </AppText>
          <AppText style={[styles.chip, { color: theme.accent, backgroundColor: theme.accentSoft }]}>
            {POINTS_PER_CORRECT} points each
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Start" arrow onPress={() => router.push('/game')} />
        {/* Required credit for the Open Trivia Database (CC BY-SA 4.0). */}
        <AppText weight="regular" muted style={styles.credit}>
          Questions from Open Trivia Database (opentdb.com), CC BY-SA 4.0
        </AppText>
      </View>

      {SHARE_URL && (
        <ShareSheet url={SHARE_URL} message={SHARE_MESSAGE} visible={sharing} onClose={() => setSharing(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8, minHeight: 52 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  title: { fontSize: 46, lineHeight: 54, marginTop: 16 },
  titleCompact: { fontSize: 38, lineHeight: 46 },
  tagline: { fontSize: 18, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  chip: { fontSize: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' },
  footer: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  credit: { fontSize: 12, textAlign: 'center' },
});
