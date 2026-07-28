// App.tsx

import React, { useEffect } from 'react';
import { I18nManager, View, Text, Pressable, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { verifyIntegrity } from './src/data/integrityCheck';

SplashScreen.preventAutoHideAsync();
I18nManager.allowRTL(true);

// ── Error boundary ────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  message:  string;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={errStyles.container}>
        <Text style={errStyles.title}>بِسْمِ ٱللَّهِ</Text>
        <Text style={errStyles.heading}>Something went wrong</Text>
        <Text style={errStyles.body}>
          The app encountered an unexpected error. Your bookmarks and reading
          progress are safe — restart the app to continue.
        </Text>
        {__DEV__ && (
          <Text style={errStyles.devMessage}>{this.state.message}</Text>
        )}
        <Pressable
          style={({ pressed }) => [errStyles.btn, pressed && errStyles.btnPressed]}
          onPress={this.handleReset}
        >
          <Text style={errStyles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const errStyles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#070B14', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title:      { fontFamily: 'System', fontSize: 28, color: '#C8A44A', marginBottom: 24, textAlign: 'center' },
  heading:    { fontFamily: 'System', fontSize: 18, fontWeight: '600', color: '#C8D8EC', marginBottom: 12, textAlign: 'center' },
  body:       { fontFamily: 'System', fontSize: 14, color: '#506070', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  devMessage: { fontFamily: 'System', fontSize: 11, color: '#DD0008', textAlign: 'center', marginBottom: 24, opacity: 0.8 },
  btn:        { backgroundColor: '#C8A44A', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  btnPressed: { opacity: 0.8 },
  btnText:    { fontFamily: 'System', fontSize: 15, fontWeight: '700', color: '#070B14' },
});

// ── ThemedStatusBar ───────────────────────────────────────────────
// StatusBar must sit inside ThemeProvider to read the active mode.
// A small dedicated component avoids lifting useTheme() into App,
// which cannot call hooks because it contains a class component.
function ThemedStatusBar() {
  const { mode } = useTheme();
  // 'dark' mode → light text on dark background
  // 'light' mode → dark text on light background
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

// ── App root ──────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    'ScheherazadeNew': require('./assets/fonts/ScheherazadeNew-Regular.ttf'),
    'NotoSansArabic':  require('./assets/fonts/NotoSansArabic-Regular.ttf'),
    'Literata-Bold':   require('./assets/fonts/Literata-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;
    verifyIntegrity().then(result => {
      if (!result.ok && __DEV__) {
        console.warn(
          `[App] Integrity check failed for surah(s): ${result.failures.join(', ')}. ` +
          `Re-run scripts/downloadQuran.js and rebuild.`
        );
      }
    });
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          {/* ThemedStatusBar sits inside ThemeProvider so it can
              call useTheme() and switch between light/dark text. */}
          <ThemedStatusBar />
          <AppNavigator />
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
