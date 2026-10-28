import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { BlownBulbArt, EmptyCardsArt } from './StatusArt';
import { AppBackground } from './AppBackground';

type Action = { label: string; onPress: () => void };

type Props = {
  art: ReactNode;
  title: string;
  message: string;
  primary?: Action;
  secondary?: Action;
  // Draw the map background; needed when shown outside the normal layout.
  withBackground?: boolean;
};

// Full-screen friendly message (error, empty, not found) with an illustration
// and up to two buttons at the bottom, where a thumb can reach them.
export function StatusScreen({ art, title, message, primary, secondary, withBackground }: Props) {
  return (
    <View style={styles.root}>
      {withBackground && <AppBackground />}
      <SafeAreaView style={styles.safe}>
        <View style={styles.body} accessibilityRole="alert">
          {art}
          <AppText weight="black" style={styles.title}>
            {title}
          </AppText>
          <AppText weight="regular" muted style={styles.message}>
            {message}
          </AppText>
        </View>
        <View style={styles.actions}>
          {primary && <Button label={primary.label} onPress={primary.onPress} />}
          {secondary && <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

type StateProps = {
  onRetry?: () => void;
  onHome?: () => void;
  withBackground?: boolean;
  message?: string;
};

export function ErrorScreen({
  onRetry,
  onHome,
  withBackground,
  message = 'Something went wrong while getting your questions. Check your connection and give it another go.',
}: StateProps) {
  const theme = useAppTheme();
  return (
    <StatusScreen
      art={<BlownBulbArt color={theme.accent} />}
      title="The lights flickered"
      message={message}
      primary={onRetry && { label: 'Try again', onPress: onRetry }}
      secondary={onHome && { label: 'Home', onPress: onHome }}
      withBackground={withBackground}
    />
  );
}

export function EmptyScreen({ onRetry, onHome }: StateProps) {
  const theme = useAppTheme();
  return (
    <StatusScreen
      art={<EmptyCardsArt color={theme.accent} />}
      title="No questions found"
      message="We couldn't find any new questions for your picks right now. Try again in a moment, or choose different categories."
      primary={onRetry && { label: 'Try again', onPress: onRetry }}
      secondary={onHome && { label: 'Home', onPress: onHome }}
    />
  );
}

export function NotFoundScreen({ onHome }: StateProps) {
  const theme = useAppTheme();
  return (
    <StatusScreen
      art={<EmptyCardsArt color={theme.accent} />}
      title="This page doesn't exist"
      message="The link may be old or mistyped. Let's get you back to the start."
      primary={onHome && { label: 'Go home', onPress: onHome }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  title: { fontSize: 28, lineHeight: 34, textAlign: 'center', marginTop: 12 },
  message: { fontSize: 17, lineHeight: 24, textAlign: 'center' },
  actions: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
});
