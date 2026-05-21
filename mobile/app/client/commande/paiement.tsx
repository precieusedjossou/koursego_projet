// app/client/commande/paiement.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

// ================================================================
// KKIAPAY — clés (sandbox pour tests, live quand compte activé)
// ================================================================
const KKIAPAY_PUBLIC_KEY = '13a23c704c9a11f186a5c7d49039c99b'; // sandbox
const KKIAPAY_SANDBOX    = true; // mettre false + clé live quand compte activé

type Moyen = 'momo' | 'moov' | 'especes';

export default function PaiementScreen() {
  const router = useRouter();
  const { id_demande, total } = useLocalSearchParams<{ id_demande: string; total: string }>();

  const [moyen, setMoyen]         = useState<Moyen>('momo');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading]     = useState(false);

  const montantTotal = total ? parseInt(total) : 0;

  const moyens = [
    { key: 'momo'    as Moyen, label: 'MTN MoMo',           icon: 'phone-portrait-outline', color: '#FFCC00' },
    { key: 'moov'    as Moyen, label: 'Moov Money',          icon: 'phone-portrait-outline', color: '#00A0E3' },
    { key: 'especes' as Moyen, label: 'Espèces au coursier', icon: 'cash-outline',           color: Colors.success },
  ];

  // ── Flux complet après paiement confirmé ────────────────────
  const onPaiementReussi = async (methode: string, reference: string) => {
    try {
      // 1. Enregistrer le paiement
      await supabase.from('paiements').insert({
        id_demande:            parseInt(id_demande),
        montant_total:         montantTotal,
        moyen_paiement:        methode,
        numero_mobile:         telephone || null,
        statut_paiement:       'confirme',
        reference_transaction: reference || null,
        date_paiement:         new Date().toISOString(),
      });

      // 2. Mettre à jour statut demande → payee
      await supabase
        .from('demande_courses')
        .update({ statut_demande: 'payee' })
        .eq('id_demande', id_demande);

      // 3. Récupérer le coursier assigné
      const { data: course } = await supabase
        .from('courses')
        .select('id_livreur, id_course')
        .eq('id_demande', id_demande)
        .single();

      if (course) {
        // 4. Notifier le coursier que le paiement est reçu
        await supabase.from('notifications').insert({
          id_utilisateur: course.id_livreur,
          titre:          '💰 Paiement reçu — démarrez la course !',
          message:        `Le client a payé ${montantTotal.toLocaleString('fr-FR')} FCFA. Vous pouvez démarrer la course maintenant.`,
          type:           'paiement_confirme',
          id_demande:     parseInt(id_demande),
          id_course:      course.id_course,
          is_read:        false,
        });

        // 5. Mettre à jour statut course → en_cours
        await supabase
          .from('courses')
          .update({ statut_course: 'en_cours', date_debut: new Date().toISOString() })
          .eq('id_course', course.id_course);
      }

      // 6. Notifier le client que sa course démarre
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('notifications').insert({
          id_utilisateur: user.id,
          titre:          '🛵 Votre course démarre !',
          message:        'Paiement confirmé. Votre coursier est en route vers le magasin.',
          type:           'course_demarree',
          id_demande:     parseInt(id_demande),
          is_read:        false,
        });
      }

      // 7. Rediriger vers suivi
      Alert.alert(
        'Paiement confirmé ! 🎉',
        'Votre coursier a été notifié et démarre la course.',
        [
          {
            text: 'Suivre ma course →',
            onPress: () => (router as any).replace({
              pathname: '/client/course/suivi',
              params: { id_demande },
            }),
          },
        ]
      );

    } catch (e) {
      console.error('Erreur flux paiement:', e);
      Alert.alert('Erreur', 'Une erreur est survenue. Contactez le support.');
    } finally {
      setLoading(false);
    }
  };

  // ── Paiement Mobile Money (KkiaPay) ─────────────────────────
  const handlePaiementMobile = async () => {
    if (!telephone.trim()) {
      Alert.alert('Champ manquant', 'Veuillez entrer votre numéro de téléphone.');
      return;
    }

    setLoading(true);

    // Pour la soutenance : simulation directe car compte KkiaPay inactif
    // À remplacer par le vrai flux KkiaPay quand le compte sera activé
    Alert.alert(
      'Confirmer le paiement',
      `Payer ${montantTotal.toLocaleString('fr-FR')} FCFA via ${moyen === 'momo' ? 'MTN MoMo' : 'Moov Money'} depuis le ${telephone} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setLoading(false),
        },
        {
          text: 'Confirmer',
          onPress: () => onPaiementReussi(
            moyen === 'momo' ? 'mtn_momo' : 'moov_money',
            `TXN_${Date.now()}`
          ),
        },
      ]
    );
  };

  // ── Paiement espèces ─────────────────────────────────────────
  const handlePaiementEspeces = async () => {
    setLoading(true);
    try {
      // 1. Enregistrer paiement espèces (en attente — sera confirmé à la livraison)
      await supabase.from('paiements').insert({
        id_demande:      parseInt(id_demande),
        montant_total:   montantTotal,
        moyen_paiement:  'especes',
        statut_paiement: 'en_attente', // confirmé à la réception
        date_paiement:   new Date().toISOString(),
      });

      // 2. Mettre à jour statut demande
      await supabase
        .from('demande_courses')
        .update({ statut_demande: 'en_cours' })
        .eq('id_demande', id_demande);

      // 3. Notifier le coursier
      const { data: course } = await supabase
        .from('courses')
        .select('id_livreur, id_course')
        .eq('id_demande', id_demande)
        .single();

      if (course) {
        await supabase.from('notifications').insert({
          id_utilisateur: course.id_livreur,
          titre:          '🛵 Démarrez la course — paiement en espèces',
          message:        `Le client paiera ${montantTotal.toLocaleString('fr-FR')} FCFA en espèces à la livraison.`,
          type:           'paiement_confirme',
          id_demande:     parseInt(id_demande),
          id_course:      course.id_course,
          is_read:        false,
        });

        await supabase
          .from('courses')
          .update({ statut_course: 'en_cours', date_debut: new Date().toISOString() })
          .eq('id_course', course.id_course);
      }

      // 4. Rediriger vers suivi
      (router as any).replace({
        pathname: '/client/course/suivi',
        params: { id_demande },
      });

    } catch (e) {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Paiement" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Récap montant */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant total</Text>
          <Text style={styles.amount}>{montantTotal.toLocaleString('fr-FR')} FCFA</Text>
          <Text style={styles.amountSub}>KourseGO — Paiement sécurisé</Text>
        </View>

        {/* Info escrow */}
        <View style={styles.escrowBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
          <Text style={styles.escrowText}>
            Votre argent est sécurisé. Il sera versé au coursier uniquement après confirmation de la livraison.
          </Text>
        </View>

        {/* Moyens de paiement */}
        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        {moyens.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.moyenCard, moyen === m.key && styles.moyenCardActive]}
            onPress={() => setMoyen(m.key)}
            activeOpacity={0.8}
          >
            <View style={[styles.moyenIcon, { backgroundColor: m.color + '22' }]}>
              <Ionicons name={m.icon as any} size={24} color={m.color} />
            </View>
            <Text style={[styles.moyenLabel, moyen === m.key && styles.moyenLabelActive]}>
              {m.label}
            </Text>
            <View style={[styles.radio, moyen === m.key && styles.radioActive]}>
              {moyen === m.key && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Numéro téléphone */}
        {(moyen === 'momo' || moyen === 'moov') && (
          <Input
            label="Numéro de téléphone"
            placeholder="+229 XX XX XX XX"
            value={telephone}
            onChangeText={setTelephone}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />
        )}

        {/* Note espèces */}
        {moyen === 'especes' && (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>
              Vous remettrez l'argent directement au coursier à la livraison. La course démarrera immédiatement.
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Traitement en cours...</Text>
          </View>
        ) : (
          <Button
            title={moyen === 'especes' ? 'Confirmer & démarrer la course →' : 'Payer maintenant →'}
            onPress={moyen === 'especes' ? handlePaiementEspeces : handlePaiementMobile}
            style={{ marginTop: Spacing.xl }}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  content:         { padding: Spacing['2xl'] },
  amountCard:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.md },
  amountLabel:     { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  amount:          { fontFamily: FontFamily.bold, fontSize: 36, color: Colors.white, marginVertical: 4 },
  amountSub:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  escrowBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.successLight, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.xl, borderLeftWidth: 3, borderLeftColor: Colors.success },
  escrowText:      { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.success, lineHeight: 18 },
  sectionTitle:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  moyenCard:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm },
  moyenCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  moyenIcon:       { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moyenLabel:      { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  moyenLabelActive:{ color: Colors.primary },
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:     { borderColor: Colors.primary },
  radioInner:      { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  noteBox:         { flexDirection: 'row', gap: 8, backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  noteText:        { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  loadingBox:      { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  loadingText:     { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
});