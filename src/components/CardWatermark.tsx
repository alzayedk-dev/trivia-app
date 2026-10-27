import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Topic, useTopicTheme } from '../theme';
import { GlobeArt } from './GlobeArt';

type Props = {
  // Diameter of the art, in points.
  size: number;
  // How far the art hangs off the card's bottom-right corner.
  offset?: number;
  opacity?: number;
  // Match the card's border radius so the art is clipped to its corners.
  radius?: number;
};

// Faint topic art printed inside a card. It never takes touches.
export function CardWatermark({ size, offset = 0, opacity = 0.1, radius = 26 }: Props) {
  const theme = useTopicTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}>
      <View style={{ position: 'absolute', right: -offset, bottom: -offset, width: size, height: size, opacity }}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          {ART[theme.topic](theme.accent)}
        </Svg>
      </View>
    </View>
  );
}

const ART: Record<Topic, (color: string) => ReactNode> = {
  geography: (color) => <GlobeArt color={color} />,
};

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
