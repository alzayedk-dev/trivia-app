import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useNativeDriver } from '../animation';
import { useAppTheme } from '../theme';
import { AppBackground } from './AppBackground';
import { BulbArt, RaysArt } from './TriviaArt';

const BULB = 150;

// Shown while the app or a game is loading: a lightbulb whose glow pulses and
// whose rays slowly turn. Uses the system font, since the app font may not be ready.
export function LoadingScreen({ message = 'Setting up the quiz…' }: { message?: string }) {
  const theme = useAppTheme();
  const pulse = useState(() => new Animated.Value(0))[0];
  const spin = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver }),
          Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        ]),
      ),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver })),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [pulse, spin]);

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <AppBackground />
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: theme.highlightSoft,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.05] }) }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.layer,
            { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
          ]}
        >
          <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
            <RaysArt color={theme.highlight} />
          </Svg>
        </Animated.View>
        <View style={styles.layer}>
          <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
            <BulbArt color={theme.accent} fill={theme.highlightSoft} markColor={theme.accent} />
          </Svg>
        </View>
      </View>
      <Text style={[styles.title, { color: theme.ink }]}>{theme.title}</Text>
      <Text style={[styles.caption, { color: theme.inkMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stage: { width: BULB + 40, height: BULB + 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  glow: { position: 'absolute', width: BULB, height: BULB, borderRadius: BULB / 2 },
  layer: { position: 'absolute', width: BULB, height: BULB },
  title: { fontSize: 28, fontWeight: '900' },
  caption: { fontSize: 16, fontWeight: '600' },
});
