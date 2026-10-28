import { Circle, G, Path, Rect } from 'react-native-svg';

// Shapes drawn in a 200×200 viewBox, shared by the logo, loading screen,
// answer animations and status screens.

const BULB = 'M100 28 A57 57 0 0 1 137 128 C130 135 126 143 126 152 H74 C74 143 70 135 63 128 A57 57 0 0 1 100 28 Z';
export const QUESTION_MARK = 'M84 74 Q84 56 100 56 Q118 56 118 73 Q118 86 105 92 Q100 95 100 104 V110';
// Angles for the glow rays around the bulb (none pointing down at the base).
const RAY_ANGLES = [-90, -50, -10, 30, 150, 190, 230];

type BulbProps = {
  color: string;
  // Glass fill: white when off, gold when lit.
  fill?: string;
  // Draw a question mark inside the glass.
  mark?: boolean;
  markColor?: string;
  // Thicken the lines when drawing small, e.g. as an icon.
  strokeScale?: number;
};

// A lightbulb with a question mark inside: the Trivia Night symbol.
export function BulbArt({ color, fill = '#FFFFFF', mark = true, markColor, strokeScale = 1 }: BulbProps) {
  const w = 6 * strokeScale;
  return (
    <G>
      <Path d={BULB} fill={fill} stroke={color} strokeWidth={w} strokeLinejoin="round" />
      <Rect x={74} y={158} width={52} height={10} rx={5} fill={color} />
      <Rect x={78} y={172} width={44} height={10} rx={5} fill={color} />
      <Path d="M88 186 H112 Q108 196 100 196 Q92 196 88 186 Z" fill={color} />
      {mark && (
        <G>
          <Path
            d={QUESTION_MARK}
            stroke={markColor ?? color}
            strokeWidth={10 * strokeScale}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={100} cy={128} r={6.5 * strokeScale} fill={markColor ?? color} />
        </G>
      )}
    </G>
  );
}

// Short rays around the bulb, for "lit up" moments.
export function RaysArt({ color, length = 18, strokeWidth = 7 }: { color: string; length?: number; strokeWidth?: number }) {
  return (
    <G>
      {RAY_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const inner = 76;
        const x1 = 100 + Math.cos(rad) * inner;
        const y1 = 86 + Math.sin(rad) * inner;
        const x2 = 100 + Math.cos(rad) * (inner + length);
        const y2 = 86 + Math.sin(rad) * (inner + length);
        return (
          <Path
            key={angle}
            d={`M ${x1} ${y1} L ${x2} ${y2}`}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}
    </G>
  );
}

// A big outlined question mark, used faintly in card corners.
export function QuestionMarkArt({ color }: { color: string }) {
  return (
    <G transform="translate(-30 -40) scale(1.3)">
      <Path d={QUESTION_MARK} stroke={color} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={100} cy={134} r={10} fill={color} />
    </G>
  );
}

// Four-point sparkle centred on (0, 0), about 20 units across.
export const SPARKLE = 'M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z';
