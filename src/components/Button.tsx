import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, useAppTheme } from '../theme';
import { AppText } from './AppText';
import { ArrowRight } from './Icons';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  // Show a forward arrow after the label.
  arrow?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', arrow, disabled, style }: Props) {
  const theme = useAppTheme();
  const primary = variant === 'primary';
  const textColor = primary ? theme.accentText : theme.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? { backgroundColor: theme.accent } : [styles.secondary, { borderColor: theme.accent }],
        disabled && styles.disabled,
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
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { fontSize: 19, textAlign: 'center' },
});
