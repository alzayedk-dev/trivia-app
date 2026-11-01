import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../theme';
import { QUESTION_MARK, SPARKLE } from './TriviaArt';

// Faint question marks and sparkles scattered across the page. Phones get a
// hand-placed set drawn in a 400×800 box; wider windows get a set generated to
// fit their exact size, so the art never stretches.
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

// Below this width the phone art is used.
const WIDE_MIN_WIDTH = 600;
// Wide windows are split into squares of this size, each holding one shape.
const CELL = 240;

// A repeatable pseudo-random number from 0 to 1, so the pattern is the same on every visit.
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function scatter(width: number, height: number) {
  const marks: { x: number; y: number; scale: number; rotate: number }[] = [];
  const sparkles: { x: number; y: number; scale: number }[] = [];
  const dots: { x: number; y: number }[] = [];
  for (let row = 0; row * CELL < height; row++) {
    for (let col = 0; col * CELL < width; col++) {
      const seed = row * 100 + col + 1;
      const x = (col + 0.15 + rand(seed) * 0.7) * CELL;
      const y = (row + 0.15 + rand(seed + 0.5) * 0.7) * CELL;
      const kind = Math.floor(rand(seed + 0.9) * 5);
      if (kind <= 1) marks.push({ x, y, scale: 0.24 + rand(seed + 0.2) * 0.2, rotate: (rand(seed + 0.3) - 0.5) * 40 });
      else if (kind <= 3) sparkles.push({ x, y, scale: 0.6 + rand(seed + 0.4) * 0.5 });
      else dots.push({ x, y });
    }
  }
  return { marks, sparkles, dots };
}

// Full-screen decorative backdrop, kept faint so it never competes with the cards.
export function AppBackground() {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const { top, bottom, line } = theme.background;
  const wide = width >= WIDE_MIN_WIDTH;
  const art = wide ? scatter(width, height) : { marks: MARKS, sparkles: SPARKLES, dots: DOTS };
  // Phones draw in a fixed 400×800 box that fills the screen; wide windows draw in real pixels.
  const boxWidth = wide ? width : 400;
  const boxHeight = wide ? height : 800;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${boxWidth} ${boxHeight}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={boxWidth} height={boxHeight} fill="url(#bg)" />
        <G opacity={0.22}>
          {art.marks.map(({ x, y, scale, rotate }) => (
            <G key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
              <Path
                d={QUESTION_MARK}
                stroke={line}
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Circle cx={100} cy={132} r={9} fill={line} />
            </G>
          ))}
        </G>
        <G opacity={0.45}>
          {art.sparkles.map(({ x, y, scale }) => (
            <Path
              key={`${x}-${y}`}
              d={SPARKLE}
              fill={theme.highlight}
              transform={`translate(${x} ${y}) scale(${scale})`}
            />
          ))}
        </G>
        <G opacity={0.3}>
          {art.dots.map(({ x, y }) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill={line} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
