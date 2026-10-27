import { Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { DefaultTheme, ErrorBoundaryProps, router, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/StatusScreen';
import { TopicBackground } from '../components/TopicBackground';
import { topUpStock } from '../questionBank';
import { ACTIVE_TOPIC, TOPIC_THEMES, TopicThemeContext } from '../theme';

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

// Make the navigator itself see-through so the shared map background shows.
const NAV_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

export default function RootLayout() {
  const theme = TOPIC_THEMES[ACTIVE_TOPIC];
  const [fontsLoaded, fontError] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });

  // Start downloading questions as soon as the app opens, so Start is instant.
  useEffect(() => {
    void topUpStock();
  }, []);

  return (
    <TopicThemeContext.Provider value={theme}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {/* Wait for the font so text doesn't flash in the system font first. If it
            fails to load, carry on with the system font rather than getting stuck. */}
        {!fontsLoaded && !fontError ? (
          <LoadingScreen />
        ) : (
          // The map background sits behind every screen, so screens slide over it.
          <View style={styles.root}>
            <TopicBackground />
            <ThemeProvider value={NAV_THEME}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                {/* The game is swiped sideways, so the iOS swipe-back gesture is off there. */}
                <Stack.Screen name="game" options={{ gestureEnabled: false }} />
              </Stack>
            </ThemeProvider>
          </View>
        )}
      </SafeAreaProvider>
    </TopicThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
