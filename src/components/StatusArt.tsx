import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { BulbArt } from './TriviaArt';

type Props = { color: string; size?: number };

// Something went wrong: a blown lightbulb with a crack and a warning badge.
export function BlownBulbArt({ color, size = 180 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <G transform="translate(20 14) scale(0.8)">
        <BulbArt color={color} fill="#F1F1F7" mark={false} />
        {/* Crack across the glass. */}
        <Path
          d="M70 70 L92 88 L82 102 L106 120 L98 136"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
      <Circle cx={158} cy={44} r={20} fill={colors.wrongSoft} stroke={colors.wrong} strokeWidth={3} />
      <Path d="M158 33 V46" stroke={colors.wrong} strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={158} cy={54} r={2.8} fill={colors.wrong} />
    </Svg>
  );
}

// Nothing to show: two blank question cards and a magnifying glass.
export function EmptyCardsArt({ color, size = 180 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <G transform="rotate(-10 90 100)">
        <Rect x={40} y={50} width={90} height={110} rx={14} fill={colors.card} stroke={color} strokeWidth={4} opacity={0.6} />
      </G>
      <Rect x={62} y={44} width={90} height={110} rx={14} fill={colors.card} stroke={color} strokeWidth={4} />
      {/* Dashed question mark: no question here. */}
      <Path
        d="M94 84 Q94 70 107 70 Q121 70 121 83 Q121 93 111 98 Q107 100 107 108"
        stroke={color}
        strokeWidth={6}
        strokeDasharray="6 7"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={107} cy={122} r={4} fill={color} opacity={0.6} />
      <Circle cx={150} cy={142} r={20} fill={colors.card} stroke={color} strokeWidth={5} />
      <Path d="M164 156 L182 174" stroke={color} strokeWidth={7} strokeLinecap="round" />
    </Svg>
  );
}
