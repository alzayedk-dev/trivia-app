import { ComponentType, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNativeDriver } from '../animation';
import { colors, FONTS, Topic, useTopicTheme } from '../theme';

type Props = { correct: boolean; points: number };

// One-shot animation over the question card when an answer is picked. Each
// topic supplies its own pair; Geography drops a map pin when you're right and
// spins a lost compass when you're wrong.
export function AnswerFeedback({ correct, points }: Props) {
  const theme = useTopicTheme();
  const { Correct, Incorrect } = ANIMATIONS[theme.topic];
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {correct ? <Correct points={points} /> : <Incorrect />}
    </View>
  );
}

const ANIMATIONS: Record<Topic, { Correct: ComponentType<{ points: number }>; Incorrect: ComponentType }> = {
  geography: { Correct: PinDrop, Incorrect: LostCompass },
};

function useProgress(duration: number, easing = Easing.linear) {
  const progress = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration, easing, useNativeDriver }).start();
  }, [progress, duration, easing]);
  return progress;
}

const PIN = 72;

// A location pin drops onto the card, sends out "found it" ripples, and the
// points float up.
function PinDrop({ points }: { points: number }) {
  const theme = useTopicTheme();
  const progress = useProgress(1600);

  const fadeOut = progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
  const drop = progress.interpolate({
    inputRange: [0, 0.22, 0.3, 0.36, 1],
    outputRange: [-170, 0, -18, 0, 0],
  });
  const squash = progress.interpolate({
    inputRange: [0, 0.22, 0.26, 0.32, 1],
    outputRange: [1, 1, 0.82, 1, 1],
  });
  const ripple = (start: number) => ({
    opacity: progress.interpolate({
      inputRange: [0, start, start + 0.01, 1],
      outputRange: [0, 0, 0.7, 0],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, start, 1],
          outputRange: [0.2, 0.2, 2.6],
          extrapolate: 'clamp',
        }),
      },
      { scaleY: 0.45 },
    ],
  });

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.ripple, { borderColor: colors.correct }, ripple(0.22)]} />
      <Animated.View style={[styles.ripple, { borderColor: colors.correct }, ripple(0.36)]} />
      <Animated.View
        style={{
          position: 'absolute',
          top: 100 - PIN,
          opacity: fadeOut,
          transform: [{ translateY: drop }, { scaleY: squash }],
        }}
      >
        <Svg width={PIN} height={PIN} viewBox="0 0 48 48">
          <Path
            d="M24 46 C24 46 7 28 7 18 A17 17 0 0 1 41 18 C41 28 24 46 24 46 Z"
            fill={colors.correct}
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />
          <Circle cx={24} cy={18} r={6.5} fill="#FFFFFF" />
        </Svg>
      </Animated.View>
      <Animated.Text
        style={[
          styles.points,
          { color: theme.accent },
          {
            opacity: progress.interpolate({ inputRange: [0, 0.3, 0.4, 0.8, 1], outputRange: [0, 0, 1, 1, 0] }),
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [10, 10, -40] }) }],
          },
        ]}
      >
        +{points}
      </Animated.Text>
    </View>
  );
}

const COMPASS = 110;

// A compass whose needle spins wildly, wobbles, and settles: you've lost your bearings.
function LostCompass() {
  const progress = useProgress(1500, Easing.out(Easing.cubic));

  const fade = progress.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const pop = progress.interpolate({ inputRange: [0, 0.12, 0.2, 1], outputRange: [0.5, 1.08, 1, 1] });
  const needle = progress.interpolate({
    inputRange: [0, 0.45, 0.6, 0.72, 0.82, 1],
    outputRange: ['0deg', '900deg', '820deg', '880deg', '850deg', '860deg'],
  });

  return (
    <Animated.View style={[styles.stage, { opacity: fade, transform: [{ scale: pop }] }]}>
      <View style={styles.compass}>
        <Svg width={COMPASS} height={COMPASS} viewBox="0 0 100 100">
          <Circle cx={50} cy={50} r={46} fill="#FFFFFF" stroke={colors.wrong} strokeWidth={4} />
          <Circle cx={50} cy={50} r={38} fill="none" stroke={colors.wrongSoft} strokeWidth={2} />
          {[0, 90, 180, 270].map((angle) => (
            <Path
              key={angle}
              d="M50 8 L50 16"
              stroke={colors.wrong}
              strokeWidth={3}
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: needle }] }]}>
          <Svg width={COMPASS} height={COMPASS} viewBox="0 0 100 100">
            <Path d="M50 16 L57 50 L43 50 Z" fill={colors.wrong} />
            <Path d="M50 84 L57 50 L43 50 Z" fill="#B8C7CF" />
            <Circle cx={50} cy={50} r={5} fill="#FFFFFF" stroke={colors.wrong} strokeWidth={2} />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  stage: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ripple: {
    position: 'absolute',
    top: 100 - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  points: {
    position: 'absolute',
    bottom: 10,
    fontFamily: FONTS.black,
    fontSize: 36,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  compass: { width: COMPASS, height: COMPASS },
});
