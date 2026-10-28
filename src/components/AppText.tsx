import { Text, TextProps } from 'react-native';
import { FONTS, useAppTheme } from '../theme';

type Props = TextProps & {
  weight?: keyof typeof FONTS;
  muted?: boolean;
};

// All text goes through here so the font and ink colour stay consistent.
export function AppText({ weight = 'bold', muted, style, ...rest }: Props) {
  const theme = useAppTheme();
  return (
    <Text {...rest} style={[{ fontFamily: FONTS[weight], color: muted ? theme.inkMuted : theme.ink }, style]} />
  );
}
