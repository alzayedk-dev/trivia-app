import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useNativeDriver } from '../animation';
import { SECONDS_PER_QUESTION } from '../game';
import { colors, useTopicTheme } from '../theme';
import { AppText } from './AppText';
import { ClockIcon } from './Icons';

const WARN_AT = 10;

type Props = {
  // Counting down; false before the question is shown and once it's answered.
  running: boolean;
  onTimeout: () => void;
};

// Counts down from 30 while running and freezes where it is once stopped.
export function useQuestionTimer({ running, onTimeout }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);
  const progress = useState(() => new Animated.Value(1))[0];
  // Keep the latest callback without restarting the countdown when it changes.
  const timeoutRef = useRef(onTimeout);
  useEffect(() => {
    timeoutRef.current = onTimeout;
  }, [onTimeout]);

  const ticking = running && secondsLeft > 0;

  useEffect(() => {
    if (!ticking) {
      progress.stopAnimation();
      if (secondsLeft === 0) progress.setValue(0);
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: secondsLeft * 1000,
      easing: Easing.linear,
      useNativeDriver,
    }).start();
    const tick = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1);
      if (secondsLeft - 1 === 0) timeoutRef.current();
    }, 1000);
    return () => clearTimeout(tick);
  }, [ticking, secondsLeft, progress]);

  return { secondsLeft, progress };
}

export function TimerPill({ secondsLeft }: { secondsLeft: number }) {
  const theme = useTopicTheme();
  const warn = secondsLeft <= WARN_AT;
  const color = warn ? colors.wrong : theme.accent;
  return (
    <View
      style={[styles.pill, { backgroundColor: warn ? colors.wrongSoft : theme.accentSoft }]}
      accessibilityLabel={`${secondsLeft} seconds left`}
    >
      <ClockIcon color={color} />
      <AppText weight="black" style={[styles.seconds, { color }]}>
        {secondsLeft}s
      </AppText>
    </View>
  );
}

export function TimerBar({ progress, secondsLeft }: { progress: Animated.Value; secondsLeft: number }) {
  const theme = useTopicTheme();
  const warn = secondsLeft <= WARN_AT;
  return (
    <View style={[styles.track, { backgroundColor: theme.accentSoft }]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: warn ? colors.wrong : theme.accent, transform: [{ scaleX: progress }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seconds: { fontSize: 14, minWidth: 26, textAlign: 'right' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: -4 },
  fill: { flex: 1, borderRadius: 3, transformOrigin: 'left' },
});
