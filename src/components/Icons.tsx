import Svg, { Path } from 'react-native-svg';
import { GlobeArt } from './GlobeArt';

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

// A plane seen from above, nose pointing right.
export function PlaneIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 12 C22 11 21 10.5 20 10.5 L15 10.5 L10 3 L8 3 L10.5 10.5 L5 10.5 L3.5 8 L2 8 L3 12 L2 16 L3.5 16 L5 13.5 L10.5 13.5 L8 21 L10 21 L15 13.5 L20 13.5 C21 13.5 22 13 22 12 Z"
        fill={color}
      />
    </Svg>
  );
}

export function GlobeIcon({ color, size = 26 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <GlobeArt color={color} route={false} strokeScale={2.2} />
    </Svg>
  );
}
