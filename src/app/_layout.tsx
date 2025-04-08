import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext } from 'react';
import 'react-native-reanimated';
import AuthProvider from '@/providers/AuthProvider';
import QueryProvider from '@/providers/QueryProvider';
import { useColorScheme } from '../components/useColorScheme';
import { Provider } from 'react-redux';
import { store } from './store';
import { TransportModalProvider } from './TransportModalContext';
import NotificationProvider from '@/providers/NotificationProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <TransportModalProvider>
      <Provider store={store}>
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
          <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
            <AuthProvider>
              <QueryProvider>
                <NotificationProvider>
                 <Stack>
                  <Stack.Screen name="(user)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                 </Stack>
                </NotificationProvider>
              </QueryProvider>
            </AuthProvider>
          </ThemeProvider>
        </ThemeContext.Provider>
      </Provider>
    </TransportModalProvider>
  );
}
