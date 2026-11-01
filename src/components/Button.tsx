import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, PressState, useAppTheme } from '../theme';
import { AppText } from './AppText';
import { useStrings } from '../strings';
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
  const { rtl } = useStrings();
  const primary = variant === 'primary';
  const textColor = primary ? theme.accentText : theme.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: PressState) => [
        styles.base,
        primary ? { backgroundColor: theme.accent } : [styles.secondary, { borderColor: theme.accent }],
        // A mouse resting on an enabled button lifts it slightly.
        hovered && !disabled && (primary ? styles.hoverPrimary : { backgroundColor: theme.accentSoft }),
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        <AppText weight="black" style={[styles.label, { color: textColor }]}>
          {label}
        </AppText>
        {arrow && (
          <View style={rtl && styles.flip}>
            <ArrowRight color={textColor} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flip: { transform: [{ scaleX: -1 }] },
  base: {
    minHeight: 60,
    borderRadius: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.card, borderWidth: 2 },
  disabled: { opacity: 0.5 },
  hoverPrimary: { opacity: 0.92, transform: [{ translateY: -1 }] },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { fontSize: 19, textAlign: 'center' },
});
