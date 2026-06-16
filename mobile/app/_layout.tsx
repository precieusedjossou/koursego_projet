// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '../cache/tokenCache';
import { KkiapayProvider } from '@kkiapay-org/react-native-sdk';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const router = useRouter();

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

  // ── Listener session Supabase ─────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          router.replace('/auth/login');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FF8C00' }} />;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KkiapayProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="client" />
            <Stack.Screen name="coursier" />
          </Stack>
        </KkiapayProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}