// app/client/commande/recherche-coursier.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import { supabase } from '../../../lib/supabase';

interface Article {
  id: string; nom: string; quantite: string; magasin: string; prix: string;
}

export default function RechercheCoursierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Paramètres reçus depuis recapitulatif
  const commandeId       = (params.commandeId as string) || '';
  const adresseLivraison = (params.adresseLivraison as string) || '';
  const typeCourse       = (params.typeCourse as string) || 'achat';
  const nomCourse        = (params.nomCourse as string) || '';
  const total            = parseFloat((params.total as string) || '0');
  const articles: Article[] = params.articles ? JSON.parse(params.articles as string) : [];

  // Résumé articles pour affichage
  const resumeArticles = typeCourse === 'achat'
    ? articles.map((a) => `${a.nom} ×${a.quantite}`).join(', ')
    : nomCourse || 'Récupération de colis';
  const nbArticles = typeCourse === 'achat' ? articles.length : 1;

  // Animation pulsation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation pulsation infinie
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    if (!commandeId) return;

    // ── Supabase Realtime : écoute la mise à jour de la commande ──
    // Dès qu'un coursier accepte (via la fonction RPC accepter_commande) →
    // statut_commande passe à 'en_cours' et id_coursier est rempli
    // → on récupère ses infos et on navigue vers confirmation
    console.log('[Realtime] Abonnement au channel pour commandeId =', commandeId);
    const channel = supabase
      .channel(`commande-${commandeId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'commande',
          filter: `id_commande=eq.${commandeId}`,
        },
        async (payload) => {
          console.log('[Realtime] Événement UPDATE reçu:', JSON.stringify(payload.new));
          const updated = payload.new as any;

          if (updated.statut_commande === 'en_cours' && updated.id_coursier) {
            console.log('[Realtime] Condition matchée, récupération coursier...');
            // Récupérer les infos du coursier (table coursier + utilisateurs séparément,
            // plus fiable que la jointure imbriquée si la relation FK n'est pas nommée)
            const { data: coursierRaw } = await supabase
              .from('coursier')
              .select('id, nombre_courses')
              .eq('id', updated.id_coursier)
              .single();

            console.log('[Realtime] id_coursier reçu:', JSON.stringify(updated.id_coursier), 'typeof:', typeof updated.id_coursier);

            // Appel RPC (SECURITY DEFINER) — contourne les blocages RLS
            // imprévisibles rencontrés sur les lectures directes de utilisateurs
            const { data: infoCoursier, error: rpcError } = await supabase
              .rpc('get_coursier_info', { p_id_coursier: updated.id_coursier })
              .single();

            if (rpcError) console.error('[Realtime] Erreur RPC get_coursier_info:', JSON.stringify(rpcError));
            console.log('[Realtime] Info coursier RPC:', JSON.stringify(infoCoursier));

            const utilisateur = infoCoursier ? {
              nom_complet: (infoCoursier as any).nom_complet,
              telephone: (infoCoursier as any).telephone,
              photo_profil_url: (infoCoursier as any).photo_profil_url,
            } : null;

            const noteMoyenne = infoCoursier
              ? Number((infoCoursier as any).note_moyenne).toFixed(1)
              : '5.0';

            const nombreCoursesVal = infoCoursier
              ? (infoCoursier as any).nombre_courses?.toString() || '0'
              : (coursierRaw?.nombre_courses?.toString() || '0');

            // Naviguer vers confirmation avec toutes les infos
            router.replace({
              pathname: '/client/commande/confirmation',
              params: {
                commandeId,
                coursierNom:      utilisateur?.nom_complet     || 'Coursier',
                coursierTel:      utilisateur?.telephone       || '',
                coursierPhoto:    utilisateur?.photo_profil_url || '',
                coursierNote:     noteMoyenne,
                coursierCourses:  nombreCoursesVal,
                // Infos commande
                adresseLivraison,
                typeCourse,
                articles:         JSON.stringify(articles),
                nomCourse,
                total:            total.toFixed(0),
                montantArticles:  (params.montantArticles as string) || '0',
                commission:       (params.commission as string) || '0',
              },
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Statut abonnement:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [commandeId]);

  const handleAnnuler = () => {
    Alert.alert(
      'Annuler la demande ?',
      "L'annulation est gratuite tant qu'aucun coursier n'est en route.",
      [
        { text: 'Non, attendre', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            if (commandeId) {
              await supabase
                .from('commande')
                .update({ statut_commande: 'annulee' })
                .eq('id_commande', commandeId);
            }
            router.replace('/client/home');
          },
        },
      ]
    );
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Badge devis validé */}
        <View style={styles.devisBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.devisText}>Devis validé</Text>
        </View>

        {/* Animation pulsation */}
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
          <Text style={styles.connexionText}>Connexion aux coursiers disponibles</Text>
        </View>

        {/* Récapitulatif léger de la commande */}
        <View style={styles.infoCard}>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Livraison à</Text>
              <Text style={styles.infoVal} numberOfLines={2}>{adresseLivraison}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="bag-outline" size={18} color={Colors.textSecondary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>
                {typeCourse === 'achat' ? 'Articles' : 'Colis'}
              </Text>
              <Text style={styles.infoVal} numberOfLines={2}>
                {resumeArticles}
                {typeCourse === 'achat' && ` • ${nbArticles} article${nbArticles > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Total à payer</Text>
              <Text style={styles.infoValPrimary}>{total.toLocaleString()} FCFA</Text>
            </View>
          </View>

        </View>

        {/* Bouton annuler */}
        <TouchableOpacity style={styles.annulerBtn} onPress={handleAnnuler} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.annulerText}>Annuler la demande</Text>
        </TouchableOpacity>

        <Text style={styles.noteAnnulation}>
          L'annulation reste possible sans frais tant qu'un coursier n'a pas encore accepté.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.white },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.base, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:        { padding: 4 },
  headerTitle:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  content:        { alignItems: 'center', paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.xl, paddingBottom: 40 },
  devisBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.successLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, marginBottom: Spacing.xl },
  devisText:      { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.success },
  animWrapper:    { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  pulseRing3:     { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,140,0,0.08)' },
  pulseRing2:     { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,140,0,0.13)' },
  pulseRing1:     { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,140,0,0.18)' },
  iconCircle:     { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  title:          { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, textAlign: 'center', lineHeight: 32, marginBottom: Spacing.md },
  connexionBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primarySoft, paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, marginBottom: Spacing.xl },
  connexionDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  connexionText:  { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  infoCard:       { width: '100%', backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.xl, ...Shadows.sm },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  infoIconWrapper:{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  infoTexts:      { flex: 1 },
  infoLabel:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  infoVal:        { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary, marginTop: 2 },
  infoValPrimary: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.primary, marginTop: 2 },
  divider:        { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  annulerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', paddingVertical: 14, borderRadius: BorderRadius.xl, backgroundColor: Colors.surfaceGray, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  annulerText:    { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textSecondary },
  noteAnnulation: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md },
});