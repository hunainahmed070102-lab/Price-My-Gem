import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { ToastProvider } from './src/components/ToastProvider';
import { COLORS } from './src/constants/config';
import { FONT_FAMILIES } from './src/constants/typography';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.surfaceLight,
    secondary: COLORS.secondary,
    secondaryContainer: '#EDE9FE',
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceLight,
    error: COLORS.error,
    text: COLORS.darkText,
    onSurface: COLORS.darkText,
    onBackground: COLORS.darkText,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    outline: COLORS.border,
  },
  roundness: 12,
};

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          [FONT_FAMILIES.light]: require('./assets/fonts/RobotoCondensed-Light.ttf'),
          [FONT_FAMILIES.regular]: require('./assets/fonts/RobotoCondensed-Regular.ttf'),
          [FONT_FAMILIES.medium]: require('./assets/fonts/RobotoCondensed-Medium.ttf'),
          [FONT_FAMILIES.semiBold]: require('./assets/fonts/RobotoCondensed-SemiBold.ttf'),
          [FONT_FAMILIES.bold]: require('./assets/fonts/RobotoCondensed-Bold.ttf'),
        });
      } catch (e) {
        console.warn('Font loading note:', e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ToastProvider>
          <NotificationsProvider>
            <PaperProvider theme={theme}>
              <StatusBar style="dark" backgroundColor={COLORS.background} />
              <AppNavigator />
            </PaperProvider>
          </NotificationsProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </View>
  );
}
