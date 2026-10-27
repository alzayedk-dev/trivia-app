import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, useTopicTheme } from '../theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
};

// Small rounded button for the top bar (Home, Share). Still at least 44pt tall
// so it's easy to hit.
export function PillButton({ label, icon, onPress }: Props) {
  const theme = useTopicTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, pressed && { backgroundColor: theme.accentSoft }]}
    >
      {icon}
      <AppText style={[styles.label, { color: theme.accent }]}>{label}</AppText>
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
  label: { fontSize: 16 },
});
