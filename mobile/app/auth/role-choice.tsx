// app/auth/role-choice.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';

export default function RoleChoiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Hero image */}
      <View style={styles.hero}>
        {/* Illustration placeholder - coursier sur moto */}
        <View style={styles.heroImage}>
          <Ionicons name="bicycle" size={80} color={Colors.white} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Logo + titre */}
        

        <Text style={styles.title}>
          Bienvenue sur{'\n'}
          <Text style={styles.titleBrand}>KourseGO</Text>
        </Text>
        <Text style={styles.subtitle}>Voulez-vous devenir coursier sur notre plateforme ?</Text>

        {/* Bouton : devenir coursier */}
        <TouchableOpacity
          style={styles.btnCoursier}
          activeOpacity={0.85}
          onPress={() => router.push('/auth/kyc-coursier')}
        >
          <Ionicons name="bicycle-outline" size={20} color={Colors.white} />
          <Text style={styles.btnCoursierText}>Oui, devenir coursier</Text>
        </TouchableOpacity>

        {/* Bouton : rester client */}
        <TouchableOpacity
          style={styles.btnClient}
          activeOpacity={0.85}
          onPress={() => router.replace('/client/home')}
        >
          <Ionicons name="bag-handle-outline" size={20} color={Colors.primary} />
          <Text style={styles.btnClientText}>Non, je veux commander</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  hero: {
    height: '40%',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  logoRow: {
    marginBottom: Spacing.base,
  },
  logo: {
    width: 0,
    height:0 ,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  titleBrand: {
    color: Colors.primary,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
  },
  btnCoursier: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  btnCoursierText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  btnClient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btnClientText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
});
