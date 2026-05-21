// app/auth/role-choice.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

export default function RoleChoiceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ── L'utilisateur veut devenir coursier ──────────────────────
  const handleDevenirCoursier = async () => {
    setLoading(true);
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        router.replace('/auth/login');
        return;
      }
      
      // Mettre à jour le mode_actuel → 'coursier' dans la table utilisateurs
      const { error } = await supabase
        .from('utilisateurs')
        .update({ mode_actuel: 'coursier' })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
        return;
      }

      // Rediriger vers le formulaire KYC du coursier
      router.push('/auth/kyc-coursier');

    } catch (err) {
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ── L'utilisateur veut rester client ────────────────────────
  const handleResterClient = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        router.replace('/auth/login');
        return;
      }

      // S'assurer que mode_actuel est bien 'client' en base
      await supabase
        .from('utilisateurs')
        .update({ mode_actuel: 'client' })
        .eq('id', user.id);

      // Rediriger vers l'accueil client
      router.replace('/client/home');

    } catch (err) {
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero image — identique à l'original */}
      <View style={styles.hero}>
        <View style={styles.heroImage}>
          <Ionicons name="bicycle" size={80} color={Colors.white} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Logo + titre — identique à l'original */}
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/images/logo_orange.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          Bienvenue sur{'\n'}
          <Text style={styles.titleBrand}>KourseGO</Text>
        </Text>
        <Text style={styles.subtitle}>
          Voulez-vous devenir coursier sur notre plateforme ?
        </Text>

        {/* Bouton : devenir coursier */}
        <TouchableOpacity
          style={[styles.btnCoursier, loading && styles.btnDisabled]}
          activeOpacity={0.85}
          onPress={handleDevenirCoursier}
          disabled={loading}
        >
          <Ionicons name="bicycle-outline" size={20} color={Colors.white} />
          <Text style={styles.btnCoursierText}>
            {loading ? 'Chargement...' : 'Oui, devenir coursier'}
          </Text>
        </TouchableOpacity>

        {/* Bouton : rester client */}
        <TouchableOpacity
          style={[styles.btnClient, loading && styles.btnClientDisabled]}
          activeOpacity={0.85}
          onPress={handleResterClient}
          disabled={loading}
        >
          <Ionicons name="bag-handle-outline" size={20} color={Colors.primary} />
          <Text style={styles.btnClientText}>Non, je veux commander</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles identiques à l'original de ta collègue ───────────
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
    width: 140,
    height: 40,
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
  btnDisabled: {
    opacity: 0.6,
  },
  btnClientDisabled: {
    opacity: 0.6,
  },
});