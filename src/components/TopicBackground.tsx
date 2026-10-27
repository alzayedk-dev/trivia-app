import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Topic, useTopicTheme } from '../theme';

// Full-screen decorative backdrop. Art is kept faint so it never competes with
// the question cards; each topic can provide its own.
export function TopicBackground() {
  const theme = useTopicTheme();
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
        {ART[theme.topic](line)}
      </Svg>
    </View>
  );
}

const ART: Record<Topic, (line: string) => ReactNode> = {
  geography: (line) => <GeographyArt line={line} />,
};

// A faint world-map grid: curved latitude lines, globe meridians, a dotted
// flight path and a compass rose.
function GeographyArt({ line }: { line: string }) {
  const latitudes = [80, 180, 280, 380, 480, 580, 680, 780];
  const meridians = [70, 140, 210, 280];

  return (
    <G stroke={line} fill="none">
      {latitudes.map((y) => (
        <Path key={y} d={`M -20 ${y} Q 200 ${y + 22} 420 ${y}`} strokeWidth={1} opacity={0.28} />
      ))}
      {meridians.map((rx) => (
        <Path
          key={rx}
          d={`M 200 -40 A ${rx} 460 0 0 0 200 840 A ${rx} 460 0 0 0 200 -40`}
          strokeWidth={1}
          opacity={0.18}
        />
      ))}
      <Path d="M 200 -40 L 200 840" strokeWidth={1} opacity={0.18} />

      <Path
        d="M 36 130 Q 200 20 364 110"
        strokeWidth={2}
        strokeDasharray="2 8"
        strokeLinecap="round"
        opacity={0.45}
      />
      <Circle cx={36} cy={130} r={4} fill={line} opacity={0.45} />
      <Circle cx={364} cy={110} r={4} fill={line} opacity={0.45} />

      <G transform="translate(336 724)" opacity={0.3}>
        <Circle r={34} strokeWidth={1.5} />
        <Circle r={26} strokeWidth={1} />
        <Path d="M 0 -44 L 7 0 L 0 44 L -7 0 Z" fill={line} stroke="none" />
        <Path d="M -44 0 L 0 -7 L 44 0 L 0 7 Z" fill={line} stroke="none" opacity={0.6} />
      </G>
    </G>
  );
}
