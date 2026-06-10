// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '../cache/tokenCache';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Poppins-Light':    require('../assets/fonts/Poppins-Light.ttf'),
          'Poppins-Regular':  require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium':   require('../assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold':     require('../assets/fonts/Poppins-Bold.ttf'),
        });
      } catch (e) {
        console.warn('Poppins absentes, polices système utilisées.');
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  // ✅ ClerkProvider toujours monté, même pendant le chargement
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      {!fontsLoaded ? (
        <View style={{ flex: 1, backgroundColor: '#FF8C00' }} />
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="client" />
            <Stack.Screen name="coursier" />
          </Stack>
        </GestureHandlerRootView>
      )}
    </ClerkProvider>
  );
}