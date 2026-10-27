import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, useTopicTheme } from '../theme';
import { AppText } from './AppText';
import { ArrowRight } from './Icons';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  // Show a forward arrow after the label.
  arrow?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', arrow, style }: Props) {
  const theme = useTopicTheme();
  const primary = variant === 'primary';
  const textColor = primary ? theme.accentText : theme.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? { backgroundColor: theme.accent } : [styles.secondary, { borderColor: theme.accent }],
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        <AppText weight="black" style={[styles.label, { color: textColor }]}>
          {label}
        </AppText>
        {arrow && <ArrowRight color={textColor} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 60,
    borderRadius: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.card, borderWidth: 2 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { fontSize: 19, textAlign: 'center' },
});
