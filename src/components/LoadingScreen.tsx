import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useNativeDriver } from '../animation';
import { useTopicTheme } from '../theme';
import { GlobeArt } from './GlobeArt';
import { GlobeIcon, PlaneIcon } from './Icons';
import { TopicBackground } from './TopicBackground';

const GLOBE = 150;
const ORBIT = 210;

// Shown while the app's fonts load: a spinning globe with a plane circling it.
// Uses the system font, since the app font isn't ready yet.
export function LoadingScreen() {
  const theme = useTopicTheme();
  const spin = useState(() => new Animated.Value(0))[0];
  const orbit = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loops = [
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver })),
      Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver })),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [spin, orbit]);

  const rotate = (value: Animated.Value) =>
    value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <TopicBackground />
      <View style={styles.stage}>
        <Animated.View style={{ width: GLOBE, height: GLOBE, transform: [{ rotate: rotate(spin) }] }}>
          <Svg width="100%" height="100%" viewBox="0 0 200 200">
            <GlobeArt color={theme.accent} fill={theme.accentSoft} route={false} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.orbit, { transform: [{ rotate: rotate(orbit) }] }]}>
          {/* The plane sits at the top of the orbit, facing along it. */}
          <View style={styles.plane}>
            <PlaneIcon color={theme.ink} />
          </View>
        </Animated.View>
      </View>
      <View style={styles.titleRow}>
        <GlobeIcon color={theme.accent} />
        <Text style={[styles.title, { color: theme.ink }]}>{theme.title}</Text>
      </View>
      <Text style={[styles.caption, { color: theme.inkMuted }]}>Packing your passport…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stage: { width: ORBIT, height: ORBIT, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  orbit: { position: 'absolute', width: ORBIT, height: ORBIT, alignItems: 'center' },
  plane: { marginTop: -4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '900' },
  caption: { fontSize: 16, fontWeight: '600' },
});
