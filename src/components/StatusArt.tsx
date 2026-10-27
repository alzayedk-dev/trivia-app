import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors } from '../theme';
import { GlobeArt } from './GlobeArt';

type Props = { color: string; size?: number };

// Something went wrong: a plane that has strayed off its dotted route around
// the globe, with a small warning badge.
export function OffCourseArt({ color, size = 180 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <G transform="translate(30 30) scale(0.7)">
        <GlobeArt color={color} fill={colors.card} route={false} />
      </G>
      {/* The planned route, then the detour. */}
      <Path d="M 18 150 Q 40 186 100 182" stroke={color} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      <Path d="M 100 182 Q 150 178 168 120" stroke={colors.wrong} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      {/* Plane heading the wrong way, nose up and to the right. */}
      <G transform="translate(156 92) rotate(-60) scale(1.5)">
        <Path
          d="M10 0 C10 -0.7 9.4 -1 8.8 -1 L5.5 -1 L2.4 -6 L1 -6 L2.6 -1 L-1.4 -1 L-2.4 -2.6 L-3.4 -2.6 L-2.8 0 L-3.4 2.6 L-2.4 2.6 L-1.4 1 L2.6 1 L1 6 L2.4 6 L5.5 1 L8.8 1 C9.4 1 10 0.7 10 0 Z"
          fill={colors.wrong}
        />
      </G>
      <Circle cx={160} cy={40} r={18} fill={colors.wrongSoft} stroke={colors.wrong} strokeWidth={3} />
      <Path d="M160 30 V42" stroke={colors.wrong} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={160} cy={50} r={2.6} fill={colors.wrong} />
    </Svg>
  );
}

// Nothing to show: an empty map with a hollow location pin and a magnifying glass.
export function EmptyMapArt({ color, size = 180 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Folded paper map. */}
      <Path
        d="M 30 60 L 75 45 L 125 60 L 170 45 L 170 150 L 125 165 L 75 150 L 30 165 Z"
        fill={colors.card}
        stroke={color}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path d="M 75 45 V 150 M 125 60 V 165" stroke={color} strokeWidth={3} opacity={0.5} />
      {/* Hollow pin: nothing found here. */}
      <Path
        d="M100 118 C100 118 82 98 82 86 A18 18 0 0 1 118 86 C118 98 100 118 100 118 Z"
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray="6 6"
        strokeLinejoin="round"
      />
      {/* Magnifying glass. */}
      <Circle cx={146} cy={132} r={20} fill={colors.card} stroke={color} strokeWidth={5} />
      <Path d="M160 146 L178 164" stroke={color} strokeWidth={7} strokeLinecap="round" />
    </Svg>
  );
}
