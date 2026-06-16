// app/client/commande/paiement.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKkiapay } from '@kkiapay-org/react-native-sdk';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

const KKIAPAY_API_KEY = '13a23c704c9a11f186a5c7d49039c99b';
const SANDBOX = true; // Clé Sandbox active

type Moyen = 'en_ligne' | 'especes';
type Reseau = 'mtn' | 'moov' | 'celtis';

const RESEAUX = [
  { key: 'mtn' as Reseau, label: 'MTN MoMo', color: '#FFCC00', bg: '#FFF9E6' },
  { key: 'moov' as Reseau, label: 'Moov Money', color: '#00A0E3', bg: '#E6F5FC' },
  { key: 'celtis' as Reseau, label: 'Celtis Money', color: '#E63946', bg: '#FDECEA' },
];

export default function PaiementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const commandeId        = (params.commandeId as string) || '';
  const totalParam        = parseFloat((params.total as string) || '0');
  const montantArt        = parseFloat((params.montantArticles as string) || '0');
  const commissionParam   = parseFloat((params.commission as string) || '0');
  const montantPlateforme = Math.round(commissionParam * 0.15);
  const montantCoursier   = commissionParam - montantPlateforme;

  const [moyen, setMoyen]               = useState<Moyen>('en_ligne');
  const [showReseaux, setShowReseaux]   = useState(false);
  const [reseauChoisi, setReseauChoisi] = useState<Reseau | null>(null);
  const [loading, setLoading]           = useState(false);
  const [userEmail, setUserEmail]       = useState('');
  const [userPhone, setUserPhone]       = useState('');
  const [userName, setUserName]         = useState('');

  const { openKkiapayWidget, addSuccessListener, addFailedListener } = useKkiapay();

  useEffect(() => {
    // Récupérer infos utilisateur
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');
      const { data } = await supabase
        .from('utilisateur')
        .select('nom_complet, telephone')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserName(data.nom_complet || '');
        setUserPhone(data.telephone || '');
      }
    })();

    // Succès KKiaPay → enregistrer et aller au suivi
    addSuccessListener(async (data: { transactionId: string }) => {
      await enregistrerPaiement(data.transactionId, 'mobile_money');
    });

    // Échec KKiaPay
    addFailedListener(() => {
      Alert.alert('Paiement échoué', 'Votre paiement n\'a pas pu être traité. Réessayez.');
      setLoading(false);
    });
  }, []);

  // ── Enregistrer paiement + mettre à jour commande ────────────
  const enregistrerPaiement = async (transactionId: string, type: string) => {
    setLoading(true);
    try {
      await supabase.from('paiement').insert({
        id_course:          parseInt(commandeId),
        montant_articles:   montantArt,
        montant_commission: montantCoursier,
        montant_plateforme: montantPlateforme,
        montant_total:      totalParam,
        moyen_paiement:     type,
        numero_mobile:      userPhone || null,
        preuve_paiement:    transactionId || null,
        statut_paiement:    'paye',
        date_paiement:      new Date().toISOString(),
      });

      // Mettre à jour le solde du coursier (seulement pour paiement en ligne)
      // Récupérer id_coursier depuis la commande
      const { data: commande } = await supabase
        .from('commande')
        .select('id_coursier')
        .eq('id_commande', commandeId)
        .single();

      if (commande?.id_coursier && type === 'mobile_money') {
        // Récupérer solde actuel
        const { data: coursier } = await supabase
          .from('coursier')
          .select('solde')
          .eq('id', commande.id_coursier)
          .single();

        const soldeActuel  = coursier?.solde ?? 0;
        const nouveauSolde = soldeActuel + montantCoursier;

        await supabase
          .from('coursier')
          .update({ solde: nouveauSolde })
          .eq('id', commande.id_coursier);
      }

      await supabase
        .from('commande')
        .update({ statut_commande: 'en_cours' })
        .eq('id_commande', commandeId);

      router.replace({
        pathname: '/client/course/suivi',
        params: { commandeId },
      });
    } catch (e) {
      Alert.alert('Erreur', 'Paiement reçu mais erreur de mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const handleChoixReseau = (reseau: Reseau) => {
    setReseauChoisi(reseau);
    setShowReseaux(false);
  };

  const handlePay = async () => {
    if (moyen === 'especes') {
      // Espèces → enregistrer et aller directement au suivi
      setLoading(true);
      try {
        await supabase.from('paiement').insert({
          id_course:          parseInt(commandeId),
          montant_articles:   montantArt,
          montant_commission: montantCoursier,
          montant_plateforme: montantPlateforme,
          montant_total:      totalParam,
          moyen_paiement:     'especes',
          statut_paiement:    'en_attente',
          date_paiement:      new Date().toISOString(),
        });

        await supabase
          .from('commande')
          .update({ statut_commande: 'en_cours' })
          .eq('id_commande', commandeId);

        router.replace({
          pathname: '/client/course/suivi',
          params: { commandeId },
        });
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de confirmer le paiement espèces.');
        setLoading(false);
      }
      return;
    }

    // Paiement en ligne
    if (!reseauChoisi) {
      setShowReseaux(true);
      return;
    }

    // Ouvrir le widget KKiaPay
    openKkiapayWidget({
      amount:  totalParam,
      api_key: KKIAPAY_API_KEY,
      sandbox: SANDBOX,
      email:   userEmail,
      phone:   userPhone,
      name:    userName,
      reason:  `KourseGo #${commandeId}`,
    });
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Paiement" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Récap montant */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant total</Text>
          <Text style={styles.amount}>{totalParam > 0 ? `${totalParam.toLocaleString()} FCFA` : '0 FCFA'}</Text>
          {montantArt > 0 && (
            <Text style={styles.amountSub}>
              Articles : {montantArt.toLocaleString()} · Coursier : {commissionParam.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Mode de paiement */}
        <Text style={styles.sectionTitle}>Mode de paiement</Text>

        <TouchableOpacity
          style={[styles.moyenCard, moyen === 'en_ligne' && styles.moyenCardActive]}
          onPress={() => setMoyen('en_ligne')}
          activeOpacity={0.8}
        >
          <View style={[styles.moyenIcon, { backgroundColor: '#E6F5FC' }]}>
            <Ionicons name="wifi-outline" size={24} color="#00A0E3" />
          </View>
          <View style={styles.moyenTexts}>
            <Text style={[styles.moyenLabel, moyen === 'en_ligne' && styles.moyenLabelActive]}>
              Paiement en ligne
            </Text>
            <Text style={styles.moyenSub}>MTN, Moov ou Celtis Money</Text>
          </View>
          <View style={[styles.radio, moyen === 'en_ligne' && styles.radioActive]}>
            {moyen === 'en_ligne' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.moyenCard, moyen === 'especes' && styles.moyenCardActive]}
          onPress={() => { setMoyen('especes'); setReseauChoisi(null); }}
          activeOpacity={0.8}
        >
          <View style={[styles.moyenIcon, { backgroundColor: '#E8F8F0' }]}>
            <Ionicons name="cash-outline" size={24} color={Colors.success} />
          </View>
          <View style={styles.moyenTexts}>
            <Text style={[styles.moyenLabel, moyen === 'especes' && styles.moyenLabelActive]}>
              Espèces au coursier
            </Text>
            <Text style={styles.moyenSub}>Payer directement à la livraison</Text>
          </View>
          <View style={[styles.radio, moyen === 'especes' && styles.radioActive]}>
            {moyen === 'especes' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Réseau choisi */}
        {moyen === 'en_ligne' && reseauChoisi && (
          <TouchableOpacity
            style={styles.reseauChoisiRow}
            onPress={() => setShowReseaux(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.reseauDot, { backgroundColor: RESEAUX.find(r => r.key === reseauChoisi)?.color }]} />
            <Text style={styles.reseauChoisiText}>
              {RESEAUX.find(r => r.key === reseauChoisi)?.label}
            </Text>
            <Text style={styles.reseauChanger}>Changer</Text>
          </TouchableOpacity>
        )}

        {/* Note espèces */}
        {moyen === 'especes' && (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>
              Vous remettrez l'argent directement au coursier à la fin de la course.
            </Text>
          </View>
        )}

        <Button
          title={
            moyen === 'especes'
              ? 'Confirmer & démarrer →'
              : reseauChoisi
              ? 'Payer maintenant →'
              : 'Choisir le réseau →'
          }
          onPress={handlePay}
          loading={loading}
          style={{ marginTop: Spacing.xl }}
        />
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal choix réseau */}
      <Modal visible={showReseaux} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReseaux(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choisir le réseau</Text>
            <Text style={styles.modalSub}>Sélectionnez votre opérateur Mobile Money</Text>

            {RESEAUX.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.reseauCard, reseauChoisi === r.key && styles.reseauCardActive]}
                onPress={() => handleChoixReseau(r.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.reseauIconBox, { backgroundColor: r.bg }]}>
                  <Ionicons name="phone-portrait-outline" size={26} color={r.color} />
                </View>
                <Text style={styles.reseauLabel}>{r.label}</Text>
                <View style={[styles.radio, reseauChoisi === r.key && styles.radioActive]}>
                  {reseauChoisi === r.key && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}

            <View style={{ height: 16 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  content:          { padding: Spacing['2xl'] },
  amountCard:       { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl, ...Shadows.md },
  amountLabel:      { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  amount:           { fontFamily: FontFamily.bold, fontSize: FontSize['4xl'], color: Colors.white, marginVertical: 4 },
  amountSub:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  sectionTitle:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  moyenCard:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm },
  moyenCardActive:  { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  moyenIcon:        { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moyenTexts:       { flex: 1 },
  moyenLabel:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  moyenLabelActive: { color: Colors.primary },
  moyenSub:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  reseauChoisiRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  reseauDot:        { width: 10, height: 10, borderRadius: 5 },
  reseauChoisiText: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  reseauChanger:    { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  radio:            { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:      { borderColor: Colors.primary },
  radioInner:       { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  noteBox:          { flexDirection: 'row', gap: 8, backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  noteText:         { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing['2xl'], paddingTop: Spacing.md },
  modalHandle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle:       { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: 4 },
  modalSub:         { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
  reseauCard:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border },
  reseauCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  reseauIconBox:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reseauLabel:      { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
});