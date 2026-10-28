import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useNativeDriver } from '../animation';
import { colors, FONTS, useAppTheme } from '../theme';
import { BulbArt, RaysArt } from './TriviaArt';

type Props = { correct: boolean; points: number };

const BULB = 110;

// One-shot animation over the question card when an answer is picked: the
// lightbulb switches on for a right answer and fizzles out for a wrong one.
export function AnswerFeedback({ correct, points }: Props) {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {correct ? <BulbOn points={points} /> : <BulbFizzle />}
    </View>
  );
}

function useProgress(duration: number) {
  const progress = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration, easing: Easing.linear, useNativeDriver }).start();
  }, [progress, duration]);
  return progress;
}

// Right answer: the bulb pops in, lights up gold, its rays burst out, and the
// points float up.
function BulbOn({ points }: { points: number }) {
  const theme = useAppTheme();
  const progress = useProgress(1600);

  const fadeOut = progress.interpolate({ inputRange: [0, 0.78, 1], outputRange: [1, 1, 0] });
  const pop = progress.interpolate({ inputRange: [0, 0.15, 0.25, 1], outputRange: [0.4, 1.12, 1, 1] });
  const lit = progress.interpolate({ inputRange: [0, 0.18, 0.28, 1], outputRange: [0, 0, 1, 1] });
  const rays = progress.interpolate({ inputRange: [0, 0.25, 0.45, 1], outputRange: [0.6, 0.6, 1.15, 1.05] });

  return (
    <Animated.View style={[styles.stage, { opacity: fadeOut, transform: [{ scale: pop }] }]}>
      <Animated.View style={[styles.glow, { backgroundColor: theme.highlightSoft, opacity: lit, transform: [{ scale: rays }] }]} />
      <Animated.View style={[styles.layer, { opacity: lit, transform: [{ scale: rays }] }]}>
        <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
          <RaysArt color={theme.highlight} />
        </Svg>
      </Animated.View>
      {/* Unlit bulb underneath, lit bulb fading in on top. */}
      <View style={styles.layer}>
        <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
          <BulbArt color={theme.accent} />
        </Svg>
      </View>
      <Animated.View style={[styles.layer, { opacity: lit }]}>
        <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
          <BulbArt color={theme.accent} fill={theme.highlight} markColor="#FFFFFF" />
        </Svg>
      </Animated.View>
      <Animated.Text
        style={[
          styles.points,
          { color: colors.correct },
          {
            opacity: progress.interpolate({ inputRange: [0, 0.3, 0.4, 1], outputRange: [0, 0, 1, 1] }),
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [10, 10, -30] }) }],
          },
        ]}
      >
        +{points}
      </Animated.Text>
    </Animated.View>
  );
}

// Wrong answer: the bulb flickers on and off, shakes, and goes dark.
function BulbFizzle() {
  const theme = useAppTheme();
  const progress = useProgress(1500);

  const fade = progress.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const flicker = progress.interpolate({
    inputRange: [0, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 1],
    outputRange: [0, 0.9, 0.1, 0.7, 0, 0.4, 0, 0],
  });
  const shake = progress.interpolate({
    inputRange: [0.4, 0.46, 0.52, 0.58, 0.64, 0.7],
    outputRange: [0, -8, 8, -5, 5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.stage, { opacity: fade, transform: [{ translateX: shake }] }]}>
      <View style={styles.layer}>
        <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
          <BulbArt color={colors.wrong} fill="#F1F1F7" markColor={colors.wrong} />
        </Svg>
      </View>
      <Animated.View style={[styles.layer, { opacity: flicker }]}>
        <Svg width={BULB} height={BULB} viewBox="0 0 200 200">
          <BulbArt color={colors.wrong} fill={theme.highlightSoft} markColor={colors.wrong} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  stage: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', width: BULB, height: BULB },
  glow: { position: 'absolute', width: BULB, height: BULB, borderRadius: BULB / 2 },
  points: {
    position: 'absolute',
    bottom: 6,
    fontFamily: FONTS.black,
    fontSize: 34,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
