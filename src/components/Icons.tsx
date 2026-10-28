import Svg, { Path } from 'react-native-svg';
import { BulbArt } from './TriviaArt';

type Props = { color: string; size?: number };

export function ChevronLeft({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5 L8 12 L15 19" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function ArrowRight({ color, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 12 H19 M13 6 L19 12 L13 18"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ClockIcon({ color, size = 16 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3 A9 9 0 1 1 11.99 3 Z M12 7 V12 L15.5 14"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Box with an arrow leaving it: the common "share" symbol.
export function ShareIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3 V15 M7 8 L12 3 L17 8 M5 12 V20 H19 V12"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// The Trivia Night logo: a small lightbulb with a question mark.
export function BulbIcon({ color, size = 26 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <BulbArt color={color} strokeScale={1.8} />
    </Svg>
  );
}
