import { Platform, View, ViewProps } from 'react-native';

type Props = ViewProps & { rtl: boolean };

// A View that lays its children out left to right or right to left (rows flip and text
// aligns to the reading side). React Native Web takes the `dir` attribute; phones take
// the `direction` style.
export function Direction({ rtl, style, ...rest }: Props) {
  if (Platform.OS === 'web') {
    const web = { dir: rtl ? 'rtl' : 'ltr' } as object;
    return <View {...rest} {...web} style={style} />;
  }
  return <View {...rest} style={[style, { direction: rtl ? 'rtl' : 'ltr' }]} />;
}
