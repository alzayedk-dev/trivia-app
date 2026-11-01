import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, PressState, useAppTheme } from '../theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  icon?: ReactNode;
  // Show only the icon (the label still names it for screen readers), to save room.
  iconOnly?: boolean;
  onPress: () => void;
};

// Small rounded button for the top bar (Home, Share). Still at least 44pt tall
// so it's easy to hit.
export function PillButton({ label, icon, iconOnly, onPress }: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed, hovered }: PressState) => [
        styles.pill,
        iconOnly && styles.pillIconOnly,
        hovered && { backgroundColor: theme.accentSoft },
        pressed && { backgroundColor: theme.accentHover },
      ]}
    >
      {icon}
      {!iconOnly && <AppText style={[styles.label, { color: theme.accent }]}>{label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillIconOnly: { width: 44, paddingHorizontal: 0, justifyContent: 'center' },
  label: { fontSize: 16 },
});
