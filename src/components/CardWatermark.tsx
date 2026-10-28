import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useAppTheme } from '../theme';
import { QuestionMarkArt } from './TriviaArt';

type Props = {
  // Size of the art, in points.
  size: number;
  // How far the art hangs off the card's bottom-right corner.
  offset?: number;
  opacity?: number;
  // Match the card's border radius so the art is clipped to its corners.
  radius?: number;
};

// A big faint question mark printed in a card's corner. It never takes touches.
export function CardWatermark({ size, offset = 0, opacity = 0.07, radius = 26 }: Props) {
  const theme = useAppTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}>
      <View style={{ position: 'absolute', right: -offset, bottom: -offset, width: size, height: size, opacity }}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <QuestionMarkArt color={theme.accent} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
