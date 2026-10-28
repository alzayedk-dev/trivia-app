import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme';
import { QUESTION_MARK, SPARKLE } from './TriviaArt';

// Faint question marks and sparkles scattered across the page.
const MARKS = [
  { x: 40, y: 90, scale: 0.32, rotate: -14 },
  { x: 300, y: 150, scale: 0.26, rotate: 12 },
  { x: 70, y: 380, scale: 0.22, rotate: 18 },
  { x: 330, y: 470, scale: 0.34, rotate: -10 },
  { x: 30, y: 640, scale: 0.28, rotate: 8 },
  { x: 260, y: 700, scale: 0.24, rotate: -18 },
];
const SPARKLES = [
  { x: 190, y: 60, scale: 0.9 },
  { x: 355, y: 300, scale: 0.7 },
  { x: 150, y: 250, scale: 0.6 },
  { x: 210, y: 560, scale: 0.8 },
  { x: 110, y: 760, scale: 0.7 },
  { x: 370, y: 620, scale: 0.6 },
];
const DOTS = [
  { x: 120, y: 150 },
  { x: 250, y: 330 },
  { x: 40, y: 520 },
  { x: 320, y: 760 },
  { x: 180, y: 430 },
];

// Full-screen decorative backdrop, kept faint so it never competes with the cards.
export function AppBackground() {
  const theme = useAppTheme();
  const { top, bottom, line } = theme.background;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="800" fill="url(#bg)" />
        <G opacity={0.22}>
          {MARKS.map(({ x, y, scale, rotate }) => (
            <G key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
              <Path d={QUESTION_MARK} stroke={line} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Circle cx={100} cy={132} r={9} fill={line} />
            </G>
          ))}
        </G>
        <G opacity={0.45}>
          {SPARKLES.map(({ x, y, scale }) => (
            <Path key={`${x}-${y}`} d={SPARKLE} fill={theme.highlight} transform={`translate(${x} ${y}) scale(${scale})`} />
          ))}
        </G>
        <G opacity={0.3}>
          {DOTS.map(({ x, y }) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill={line} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
