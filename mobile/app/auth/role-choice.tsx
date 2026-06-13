// app/auth/role-choice.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

export default function RoleChoiceScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDevenirCoursier = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        router.replace('/auth/login');
        return;
      }

      // Vérifier si le coursier a déjà soumis un dossier
      const { data: coursier } = await supabase
        .from('coursier')
        .select('statut_validation')
        .eq('id', user.id)
        .single();

      if (coursier) {
        // Dossier déjà soumis → page d'attente directement
        router.replace('/auth/kyc-success');
        return;
      }

      // Pas encore de dossier → mettre mode coursier + aller aux conditions
      await supabase
        .from('utilisateurs')
        .update({ mode: 'coursier' })
        .eq('id', user.id);

      router.push('/auth/conditionCoursier');
    } catch (err) {
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleResterClient = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        router.replace('/auth/login');
        return;
      }
      // Repasser en mode client même si dossier coursier en attente
      await supabase
        .from('utilisateurs')
        .update({ mode: 'client' })
        .eq('id', user.id);

      router.replace('/client/home');
    } catch (err) {
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Bienvenue sur{'\n'}
          <Text style={styles.titleBrand}>KourseGO</Text>
        </Text>
        <Text style={styles.subtitle}>
          Voulez-vous devenir coursier sur notre plateforme ?
        </Text>

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

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.white },
  content:           { flex: 1, padding: Spacing['2xl'], alignItems: 'center', justifyContent: 'center' },
  title:             { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  titleBrand:        { color: Colors.primary },
  subtitle:          { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'], lineHeight: 22 },
  btnCoursier:       { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: 16, marginBottom: Spacing.md, ...Shadows.md },
  btnCoursierText:   { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.white },
  btnClient:         { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingVertical: 16, borderWidth: 1.5, borderColor: Colors.primary },
  btnClientText:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.md, color: Colors.primary },
  btnDisabled:       { opacity: 0.6 },
  btnClientDisabled: { opacity: 0.6 },
});