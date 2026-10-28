import { Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { DefaultTheme, ErrorBoundaryProps, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBackground } from '../components/AppBackground';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/StatusScreen';
import { SettingsProvider } from '../settings';
import { THEME, ThemeContext } from '../theme';

// Shown instead of a blank or broken screen if anything in the app crashes.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <ErrorScreen
      withBackground
      message="Something unexpected happened on our side. Let's try that again."
      onRetry={retry}
      onHome={() => {
        router.replace('/');
        retry();
      }}
    />
  );
}

// Make the navigator itself see-through so the shared background shows.
const NAV_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });

  return (
    <ThemeContext.Provider value={THEME}>
      <SafeAreaProvider>
        <SettingsProvider>
          <StatusBar style="dark" />
          {/* Wait for the font so text doesn't flash in the system font first. If it
              fails to load, carry on with the system font rather than getting stuck. */}
          {!fontsLoaded && !fontError ? (
            <LoadingScreen />
          ) : (
            // The background sits behind every screen, so screens slide over it.
            <View style={styles.root}>
              <AppBackground />
              <ThemeProvider value={NAV_THEME}>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                  {/* The game is swiped sideways, so the iOS swipe-back gesture is off there. */}
                  <Stack.Screen name="game" options={{ gestureEnabled: false }} />
                </Stack>
              </ThemeProvider>
            </View>
          )}
        </SettingsProvider>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
