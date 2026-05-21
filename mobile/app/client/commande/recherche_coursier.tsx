// app/client/commande/recherche-coursier.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import { supabase } from '../../../lib/supabase';

export default function RechercheCoursierScreen() {
  const router = useRouter();
  const { id_demande, adresse_livraison, description_articles, total } =
    useLocalSearchParams<{ id_demande: string; adresse_livraison?: string; description_articles?: string; total?: string; }>();

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Animation pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Supabase Realtime — écouter quand un coursier accepte la demande
    if (id_demande) {
      channelRef.current = supabase
        .channel(`demande_${id_demande}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public',
          table: 'demande_courses',
          filter: `id_demande=eq.${id_demande}`,
        }, (payload) => {
          const statut = payload.new?.statut_demande;
          if (statut === 'acceptee' || statut === 'en_cours') {
            channelRef.current?.unsubscribe();
            router.replace({ pathname: '/client/commande/confirmation', params: { id_demande } });
          }
          if (statut === 'annulee') {
            Alert.alert('Demande annulée', 'Votre demande a été annulée.');
            router.replace('/client/home');
          }
        })
        .subscribe();
    }

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [id_demande]);

  const handleAnnuler = () => {
    Alert.alert('Annuler la demande ?', "L'annulation est gratuite tant qu'aucun coursier n'est en route.", [
      { text: 'Non, attendre', style: 'cancel' },
      {
        text: 'Oui, annuler', style: 'destructive',
        onPress: async () => {
          if (id_demande) {
            await supabase.from('demande_courses')
              .update({ statut_demande: 'annulee' })
              .eq('id_demande', id_demande);
          }
          router.replace('/client/home');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAnnuler} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la commande</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.devisBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.devisText}>Devis validé</Text>
        </View>

        <View style={styles.animWrapper}>
          <Animated.View style={[styles.pulseRing3, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.pulseRing2, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.pulseRing1, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.iconCircle}>
            <Ionicons name="bicycle" size={36} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.title}>Recherche de coursier{'\n'}en cours...</Text>

        <View style={styles.connexionBadge}>
          <View style={styles.connexionDot} />
          <Text style={styles.connexionText}>Connexion aux coursiers</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Livraison à</Text>
              <Text style={styles.infoVal}>{adresse_livraison || '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="bag-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Articles</Text>
              <Text style={styles.infoVal} numberOfLines={2}>{description_articles || '—'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Total estimé</Text>
              <Text style={styles.infoValPrimary}>
                {total ? `${parseInt(total).toLocaleString('fr-FR')} FCFA` : '—'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.annulerBtn} onPress={handleAnnuler} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.annulerText}>Annuler la demande</Text>
        </TouchableOpacity>
        <Text style={styles.noteAnnulation}>
          L'annulation reste possible sans frais tant qu'un coursier n'a pas encore accepté.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.white },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.base, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:         { padding: 4 },
  headerTitle:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  content:         { flex: 1, alignItems: 'center', paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.xl },
  devisBadge:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.successLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, marginBottom: Spacing.xl },
  devisText:       { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.success },
  animWrapper:     { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  pulseRing3:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255, 140, 0, 0.08)' },
  pulseRing2:      { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255, 140, 0, 0.13)' },
  pulseRing1:      { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 140, 0, 0.18)' },
  iconCircle:      { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  title:           { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, textAlign: 'center', lineHeight: 32, marginBottom: Spacing.md },
  connexionBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primarySoft, paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, marginBottom: Spacing.xl },
  connexionDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  connexionText:   { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  infoCard:        { width: '100%', backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.xl, ...Shadows.sm },
  infoRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  infoIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  infoTexts:       { flex: 1 },
  infoLabel:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  infoVal:         { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary, marginTop: 2 },
  infoValPrimary:  { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.primary, marginTop: 2 },
  divider:         { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  annulerBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, backgroundColor: Colors.surfaceGray, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  annulerText:     { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textSecondary },
  noteAnnulation:  { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md },
});