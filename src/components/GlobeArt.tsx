import { Circle, G, Path } from 'react-native-svg';

type Props = {
  color: string;
  // Optional fill for the globe's disc.
  fill?: string;
  // Draw the dotted flight route around the globe.
  route?: boolean;
  // Thicken the lines when drawing small, e.g. as an icon.
  strokeScale?: number;
};

// A tilted wireframe globe drawn in a 200×200 viewBox.
export function GlobeArt({ color, fill = 'none', route = true, strokeScale = 1 }: Props) {
  const outline = 3 * strokeScale;
  const line = 2 * strokeScale;
  return (
    <G stroke={color} fill="none">
      <G transform="rotate(-20 100 100)">
        <Circle cx={100} cy={100} r={80} strokeWidth={outline} fill={fill} />
        {[28, 54].map((rx) => (
          <Path
            key={rx}
            d={`M 100 20 A ${rx} 80 0 0 0 100 180 A ${rx} 80 0 0 0 100 20`}
            strokeWidth={line}
          />
        ))}
        <Path d="M 100 20 L 100 180" strokeWidth={line} />
        {[-50, -25, 0, 25, 50].map((dy) => {
          const half = Math.sqrt(80 * 80 - dy * dy);
          return (
            <Path
              key={dy}
              d={`M ${100 - half} ${100 + dy} Q 100 ${100 + dy + 8} ${100 + half} ${100 + dy}`}
              strokeWidth={line}
            />
          );
        })}
      </G>
      {route && (
        <>
          <Path
            d="M 8 150 Q 60 196 150 176 T 196 96"
            strokeWidth={3}
            strokeDasharray="2 9"
            strokeLinecap="round"
          />
          <Circle cx={196} cy={96} r={5} fill={color} stroke="none" />
        </>
      )}
    </G>
  );
}
