// app/index.tsx — Splash Screen KourseGO
import { useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { FontFamily, FontSize } from '../constants/Typography';

export default function SplashPage() {
  const router = useRouter();
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      // TODO: vérifier si l'utilisateur est connecté via Supabase
      // Si connecté → router.replace('/client') ou '/coursier' selon le rôle
      // Sinon →
      router.replace('/auth/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../assets/images/logo_white_bg.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Vos courses, livrées vite</Text>
      </Animated.View>

      <Text style={styles.footer}>Bénin 🇧🇯</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 220,
    height: 80,
    tintColor: Colors.white,
  },
  tagline: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
});
