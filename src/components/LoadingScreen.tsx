import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { useNativeDriver } from '../animation';
import { useAppTheme } from '../theme';
import { AppBackground } from './AppBackground';
import { BulbArt, RaysArt } from './TriviaArt';

const LOGO = 150;

// Shown while the app or a game is loading: the Trivia Night logo (the same
// bulb with a question mark as on the home screen), gently pulsing with a soft
// glow behind it. Uses the system font, since the app font may not be ready.
export function LoadingScreen({ message = 'Setting up the quiz…' }: { message?: string }) {
  const theme = useAppTheme();
  const pulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <AppBackground />
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: theme.highlightSoft,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) }],
            },
          ]}
        />
        <Animated.View
          style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }}
        >
          <Svg width={LOGO} height={LOGO} viewBox="0 0 200 200">
            <RaysArt color={theme.highlight} />
            <BulbArt color={theme.accent} fill={theme.highlightSoft} />
          </Svg>
        </Animated.View>
      </View>
      <Text style={[styles.title, { color: theme.ink }]}>{theme.title}</Text>
      <Text style={[styles.caption, { color: theme.inkMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stage: { width: LOGO + 40, height: LOGO + 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  glow: { position: 'absolute', width: LOGO, height: LOGO, borderRadius: LOGO / 2 },
  title: { fontSize: 28, fontWeight: '900' },
  caption: { fontSize: 16, fontWeight: '600' },
});
