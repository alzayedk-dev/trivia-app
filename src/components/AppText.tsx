import { Text, TextProps } from 'react-native';
import { FONTS, useTopicTheme } from '../theme';

type Props = TextProps & {
  weight?: keyof typeof FONTS;
  muted?: boolean;
};

// All text goes through here so the font and the topic's ink colour stay consistent.
export function AppText({ weight = 'bold', muted, style, ...rest }: Props) {
  const theme = useTopicTheme();
  return (
    <Text {...rest} style={[{ fontFamily: FONTS[weight], color: muted ? theme.inkMuted : theme.ink }, style]} />
  );
}
