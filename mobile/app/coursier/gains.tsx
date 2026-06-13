// app/coursier/gains.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

type Periode = 'jour' | 'semaine' | 'mois';
type Action = 'depot' | 'retrait' | null;
type Reseau = 'mtn' | 'moov' | 'celtis';

const SOLDE = 4200;
const MINIMUM_RETRAIT = 1000;

const RESEAUX = [
  { key: 'mtn' as Reseau, label: 'MTN MoMo', color: '#FFCC00', bg: '#FFF9E6' },
  { key: 'moov' as Reseau, label: 'Moov Money', color: '#00A0E3', bg: '#E6F5FC' },
  { key: 'celtis' as Reseau, label: 'Celtis Money', color: '#E63946', bg: '#FDECEA' },
];

const HISTORIQUE_TRANSACTIONS = [
  { id: 't1', type: 'gain', label: 'Course — Fidjrossè', montant: 1500, date: "Aujourd'hui 14h32" },
  { id: 't2', type: 'commission', label: 'Commission KourseGO', montant: -300, date: "Aujourd'hui 14h32" },
  { id: 't3', type: 'gain', label: 'Course — Akpakpa', montant: 2000, date: 'Hier 10h15' },
  { id: 't4', type: 'commission', label: 'Commission KourseGO', montant: -400, date: 'Hier 10h15' },
  { id: 't5', type: 'depot', label: 'Dépôt MTN MoMo', montant: 5000, date: '10 juin' },
  { id: 't6', type: 'retrait', label: 'Retrait Moov Money', montant: -3000, date: '8 juin' },
];

const HISTORIQUE_COURSES = [
  { id: '1', client: 'Restaurant au Jours', type: 'achat', montant: 3500, date: "Aujourd'hui 14h30" },
  { id: '2', client: 'Sylvie Koffi', type: 'recuperation_colis', montant: 2000, date: "Aujourd'hui 11h12" },
  { id: '3', client: 'Kodjo Mensah', type: 'achat', montant: 1800, date: 'Hier 18h00' },
  { id: '4', client: 'Jean Dupont', type: 'achat', montant: 1500, date: 'Hier 13h45' },
  { id: '5', client: 'Marie Agossou', type: 'recuperation_colis', montant: 2500, date: '16/04 10h00' },
];

export default function GainsScreen() {
  const [periode, setPeriode] = useState<Periode>('semaine');
  const [action, setAction] = useState<Action>(null);
  const [reseau, setReseau] = useState<Reseau | null>(null);
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);

  const peutRetirer = SOLDE >= MINIMUM_RETRAIT;

  const GAINS: Record<Periode, { total: number; courses: number; moy: number }> = {
    jour: { total: 7500, courses: 3, moy: 2500 },
    semaine: { total: 45250, courses: 18, moy: 2514 },
    mois: { total: 180000, courses: 72, moy: 2500 },
  };
  const g = GAINS[periode];

  const handleConfirmer = () => {
    if (!reseau) { Alert.alert('Réseau manquant', 'Veuillez choisir un réseau'); return; }
    if (!montant || parseInt(montant) < 100) { Alert.alert('Montant invalide', 'Entrez un montant valide'); return; }
    if (action === 'retrait' && parseInt(montant) > SOLDE) {
      Alert.alert('Solde insuffisant', 'Le montant dépasse votre solde'); return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAction(null); setMontant(''); setReseau(null);
      Alert.alert(
        action === 'depot' ? 'Dépôt initié ✅' : 'Retrait initié ✅',
        `Votre ${action === 'depot' ? 'dépôt' : 'retrait'} de ${montant} FCFA est en cours.`
      );
    }, 2000);
  };

  const iconTransaction = (type: string) => {
    if (type === 'gain') return { name: 'arrow-down-circle', color: Colors.success };
    if (type === 'commission') return { name: 'remove-circle', color: Colors.error };
    if (type === 'depot') return { name: 'add-circle', color: '#00A0E3' };
    return { name: 'arrow-up-circle', color: Colors.warning };
  };

  return (
    <View style={styles.container}>
      <Header showLogo />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── SOLDE PORTEFEUILLE ── */}
        <View style={[styles.soldeCard, SOLDE < 0 && styles.soldeCardNegatif]}>
          <Text style={styles.soldeLabel}>Solde portefeuille</Text>
          <Text style={styles.soldeAmount}>
            {SOLDE >= 0 ? '+' : ''}{SOLDE.toLocaleString()} FCFA
          </Text>
          {SOLDE < 0 && (
            <View style={styles.detteRow}>
              <Ionicons name="warning-outline" size={14} color={Colors.white} />
              <Text style={styles.detteText}>
                Vous avez une dette. Effectuez un dépôt pour continuer à recevoir des courses.
              </Text>
            </View>
          )}
          {SOLDE >= 0 && SOLDE < MINIMUM_RETRAIT && (
            <Text style={styles.soldeMin}>
              Min. {MINIMUM_RETRAIT.toLocaleString()} FCFA requis pour retirer
            </Text>
          )}
        </View>

        {/* ── BOUTONS DÉPÔT / RETRAIT ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setAction('depot')} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: '#E6F5FC' }]}>
              <Ionicons name="add" size={26} color="#00A0E3" />
            </View>
            <Text style={styles.actionLabel}>Dépôt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, !peutRetirer && styles.actionBtnDisabled]}
            onPress={() => peutRetirer ? setAction('retrait') : null}
            activeOpacity={peutRetirer ? 0.8 : 1}
          >
            <View style={[styles.actionIcon, { backgroundColor: peutRetirer ? Colors.primarySoft : Colors.surfaceGray }]}>
              <Ionicons name="arrow-up" size={26} color={peutRetirer ? Colors.primary : Colors.textLight} />
            </View>
            <Text style={[styles.actionLabel, !peutRetirer && styles.actionLabelDisabled]}>Retrait</Text>
            {!peutRetirer && <Text style={styles.actionSub}>Min. 1 000 FCFA</Text>}
          </TouchableOpacity>
        </View>

        {/* ── SÉLECTEUR PÉRIODE ── */}
        <View style={styles.periodeRow}>
          {(['jour', 'semaine', 'mois'] as Periode[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodeBtn, periode === p && styles.periodeBtnActive]}
              onPress={() => setPeriode(p)}
            >
              <Text style={[styles.periodeTxt, periode === p && styles.periodeTxtActive]}>
                {{ jour: "Aujourd'hui", semaine: 'Semaine', mois: 'Mois' }[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CARTE GAINS ── */}
        <View style={styles.gainsCard}>
          <Text style={styles.gainsLabel}>Gains & Revenus</Text>
          <Text style={styles.gainsTotal}>{g.total.toLocaleString()} FCFA</Text>
          <View style={styles.gainsStats}>
            <View style={styles.gainsStat}>
              <Text style={styles.gainsStatVal}>{g.courses}</Text>
              <Text style={styles.gainsStatLabel}>Courses</Text>
            </View>
            <View style={styles.gainsDivider} />
            <View style={styles.gainsStat}>
              <Text style={styles.gainsStatVal}>{g.moy.toLocaleString()}</Text>
              <Text style={styles.gainsStatLabel}>Moy./course</Text>
            </View>
            <View style={styles.gainsDivider} />
            <View style={styles.gainsStat}>
              <Text style={styles.gainsStatVal}>4.8</Text>
              <Text style={styles.gainsStatLabel}>Note moy.</Text>
            </View>
          </View>
        </View>

        {/* ── GRAPHIQUE ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Évolution des gains</Text>
          <View style={styles.barChart}>
            {[60, 80, 45, 90, 70, 100, 55].map((h, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height: h * 0.8 }]} />
                <Text style={styles.barLabel}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HISTORIQUE TRANSACTIONS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transactions portefeuille</Text>
          {HISTORIQUE_TRANSACTIONS.map((item) => {
            const icon = iconTransaction(item.type);
            return (
              <View key={item.id} style={styles.transactionRow}>
                <Ionicons name={icon.name as any} size={28} color={icon.color} />
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionLabel}>{item.label}</Text>
                  <Text style={styles.transactionDate}>{item.date}</Text>
                </View>
                <Text style={[styles.transactionMontant, item.montant > 0 ? styles.montantPositif : styles.montantNegatif]}>
                  {item.montant > 0 ? '+' : ''}{item.montant.toLocaleString()} F
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── HISTORIQUE COURSES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses terminées</Text>
          {HISTORIQUE_COURSES.map((item) => (
            <View key={item.id} style={styles.histCard}>
              <View style={styles.histIcon}>
                <Ionicons name={item.type === 'achat' ? 'cart-outline' : 'cube-outline'} size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.histClient}>{item.client}</Text>
                <Text style={styles.histDate}>{item.date}</Text>
              </View>
              <View style={styles.histRight}>
                <Text style={styles.histMontant}>+{item.montant.toLocaleString()} FCFA</Text>
                <View style={styles.verseBadge}>
                  <Text style={styles.verseText}>Versé</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── MODAL DÉPÔT / RETRAIT ── */}
      <Modal visible={action !== null} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { setAction(null); setMontant(''); setReseau(null); }}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {action === 'depot' ? '💳 Dépôt' : '💸 Retrait'}
            </Text>
            <Text style={styles.modalSub}>
              {action === 'depot'
                ? 'Rechargez votre portefeuille via Mobile Money'
                : `Retirez vos gains (solde : ${SOLDE.toLocaleString()} FCFA)`}
            </Text>

            <Input
              label="Montant (FCFA)"
              placeholder="Ex: 2000"
              value={montant}
              onChangeText={setMontant}
              keyboardType="number-pad"
              leftIcon="cash-outline"
            />

            <Text style={styles.reseauTitle}>Réseau Mobile Money</Text>
            {RESEAUX.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.reseauCard, reseau === r.key && styles.reseauCardActive]}
                onPress={() => setReseau(r.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.reseauIconBox, { backgroundColor: r.bg }]}>
                  <Ionicons name="phone-portrait-outline" size={22} color={r.color} />
                </View>
                <Text style={styles.reseauLabel}>{r.label}</Text>
                <View style={[styles.radio, reseau === r.key && styles.radioActive]}>
                  {reseau === r.key && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}

            <Button
              title={action === 'depot' ? 'Confirmer le dépôt' : 'Confirmer le retrait'}
              onPress={handleConfirmer}
              loading={loading}
              style={{ marginTop: Spacing.lg }}
            />
            <View style={{ height: 16 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Solde
  soldeCard: {
    margin: Spacing['2xl'], marginBottom: 0,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', ...Shadows.md,
  },
  soldeCardNegatif: { backgroundColor: Colors.error },
  soldeLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  soldeAmount: { fontFamily: FontFamily.bold, fontSize: 36, color: Colors.white, marginBottom: 4 },
  soldeMin: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  detteRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: Spacing.sm },
  detteText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.9)', lineHeight: 16 },

  // Actions dépôt/retrait
  actionsRow: { flexDirection: 'row', paddingHorizontal: Spacing['2xl'], gap: Spacing.md, marginVertical: Spacing.lg },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, ...Shadows.sm },
  actionBtnDisabled: { opacity: 0.6 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  actionLabelDisabled: { color: Colors.textLight },
  actionSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error, marginTop: 2 },

  // Période
  periodeRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    padding: Spacing.sm, marginHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl, gap: Spacing.xs, ...Shadows.sm,
  },
  periodeBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg, alignItems: 'center' },
  periodeBtnActive: { backgroundColor: Colors.primary },
  periodeTxt: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  periodeTxtActive: { color: Colors.white },

  // Gains card
  gainsCard: {
    margin: Spacing['2xl'], marginTop: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl, alignItems: 'center', ...Shadows.lg,
  },
  gainsLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  gainsTotal: { fontFamily: FontFamily.bold, fontSize: FontSize['4xl'], color: Colors.white, marginVertical: Spacing.sm },
  gainsStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  gainsStat: { alignItems: 'center' },
  gainsStatVal: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.white },
  gainsStatLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  gainsDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Graphique
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing['2xl'], padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  barWrapper: { alignItems: 'center', gap: 4, flex: 1 },
  bar: { width: 28, backgroundColor: Colors.primary, borderRadius: 6, opacity: 0.85 },
  barLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },

  // Sections
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Transactions
  transactionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  transactionInfo: { flex: 1 },
  transactionLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  transactionDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  transactionMontant: { fontFamily: FontFamily.bold, fontSize: FontSize.base },
  montantPositif: { color: Colors.success },
  montantNegatif: { color: Colors.error },

  // Courses
  histCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  histIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  histClient: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  histDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  histRight: { alignItems: 'flex-end', gap: 4 },
  histMontant: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.success },
  verseBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  verseText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.success },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing['2xl'], paddingTop: Spacing.md },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
  reseauTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  reseauCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.white },
  reseauCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  reseauIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reseauLabel: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});