// app/coursier/gains.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

type Periode = 'jour' | 'semaine' | 'mois';
type Action  = 'depot' | 'retrait' | null;
type Reseau  = 'mtn' | 'moov' | 'celtis';

const COMMISSION_TAUX = 0.15;

const RESEAUX = [
  { key: 'mtn'    as Reseau, label: 'MTN MoMo',    color: '#FFCC00', bg: '#FFF9E6' },
  { key: 'moov'   as Reseau, label: 'Moov Money',  color: '#00A0E3', bg: '#E6F5FC' },
  { key: 'celtis' as Reseau, label: 'Celtis Money', color: '#E63946', bg: '#FDECEA' },
];

const formatDate = (iso: string) => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000)  return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 172800000) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export default function GainsScreen() {
  const [periode, setPeriode]       = useState<Periode>('semaine');
  const [action, setAction]         = useState<Action>(null);
  const [reseau, setReseau]         = useState<Reseau | null>(null);
  const [montant, setMontant]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [solde, setSolde]                   = useState(0);
  const [commissionDue, setCommissionDue]   = useState(0);
  const [courses, setCourses]               = useState<any[]>([]);
  const [stats, setStats]                   = useState({ total: 0, nbCourses: 0, moy: 0 });
  const [hasAlertCommission, setHasAlertCommission] = useState(false);

  useEffect(() => { fetchData(); }, [periode]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    let dateFrom = new Date();
    if (periode === 'jour')    dateFrom.setHours(0, 0, 0, 0);
    if (periode === 'semaine') dateFrom.setDate(now.getDate() - 7);
    if (periode === 'mois')    dateFrom.setDate(now.getDate() - 30);

    // Courses livrées dans la période — avec paiement pour distinguer espèces/en ligne
    const { data: cmds } = await supabase
      .from('commande')
      .select(`
        id_commande, description_articles, adresse_livraison,
        montant_course, estimation_prix, statut_commande, date_commande,
        client:id_client ( utilisateur:id ( nom_complet ) ),
        paiement:id_commande (
          moyen_paiement, statut_paiement, montant_commission
        )
      `)
      .eq('id_coursier', user.id)
      .eq('statut_commande', 'livree')
      .gte('date_commande', dateFrom.toISOString())
      .order('date_commande', { ascending: false });

    if (cmds) {
      setCourses(cmds);
      // Pour les gains : on compte seulement les paiements en ligne (solde)
      // Les espèces sont visibles dans l'historique mais n'accumulent pas le solde
      const totalLigne = cmds
        .filter((c: any) => c.paiement?.moyen_paiement !== 'especes')
        .reduce((s: number, c: any) => s + (c.montant_course || 0), 0);
      const totalAll  = cmds.reduce((s: number, c: any) => s + (c.montant_course || 0), 0);
      const nb        = cmds.length;
      setStats({ total: totalAll, nbCourses: nb, moy: nb > 0 ? Math.round(totalAll / nb) : 0 });
      setCommissionDue(Math.round(totalLigne * COMMISSION_TAUX));
    }

    // Solde portefeuille
    const { data: coursier } = await supabase
      .from('coursier')
      .select('solde')
      .eq('id', user.id)
      .maybeSingle();
    const soldeActuel = coursier?.solde ?? 0;
    setSolde(soldeActuel);
    setHasAlertCommission(soldeActuel < 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleConfirmer = async () => {
    if (!reseau) { Alert.alert('Réseau manquant', 'Veuillez choisir un réseau'); return; }
    if (!montant || parseInt(montant) < 100) {
      Alert.alert('Montant invalide', 'Entrez un montant valide (min 100 FCFA)'); return;
    }
    if (action === 'retrait' && parseInt(montant) > solde) {
      Alert.alert('Solde insuffisant', `Votre solde est de ${solde.toLocaleString()} FCFA`); return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const montantInt   = parseInt(montant);
      const nouveauSolde = action === 'depot' ? solde + montantInt : solde - montantInt;

      await supabase.from('coursier').update({ solde: nouveauSolde }).eq('id', user.id);

      // Enregistrer la transaction dans paiement sans id_course (transaction portefeuille)
      await supabase.from('paiement').insert({
        id_course:       0, // transaction portefeuille, pas une commande
        montant_articles: 0,
        montant_commission: 0,
        montant_plateforme: 0,
        montant_total:   montantInt,
        moyen_paiement:  reseau,
        numero_mobile:   '',
        statut_paiement: 'complete',
        date_paiement:   new Date().toISOString(),
        preuve_paiement: action === 'depot' ? 'depot_momo' : 'retrait_momo',
      });

      setSolde(nouveauSolde);
      setAction(null); setMontant(''); setReseau(null);
      Alert.alert(
        action === 'depot' ? 'Dépôt initié ✅' : 'Retrait initié ✅',
        `Votre ${action === 'depot' ? 'dépôt' : 'retrait'} de ${montantInt.toLocaleString()} FCFA est en cours.`
      );
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const peutRetirer = solde > 0;

  const BARS = [
    { label: 'Lun', h: 40 }, { label: 'Mar', h: 65 }, { label: 'Mer', h: 50 },
    { label: 'Jeu', h: 80 }, { label: 'Ven', h: 55 }, { label: 'Sam', h: 70 },
    { label: 'Dim', h: 30 },
  ];

  return (
    <View style={styles.container}>
      <Header showLogo />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {hasAlertCommission && (
          <View style={styles.alertCommission}>
            <Ionicons name="warning-outline" size={18} color={Colors.white} />
            <Text style={styles.alertCommissionText}>
              ⚠️ Commission impayée ! Effectuez un dépôt pour continuer à recevoir des courses.
            </Text>
          </View>
        )}

        {/* Solde */}
        <View style={[styles.soldeCard, solde < 0 && styles.soldeCardNegatif]}>
          <Text style={styles.soldeLabel}>Solde portefeuille</Text>
          <Text style={styles.soldeAmount}>{solde >= 0 ? '+' : ''}{solde.toLocaleString()} FCFA</Text>
          {solde < 0 && (
            <View style={styles.detteRow}>
              <Ionicons name="warning-outline" size={14} color={Colors.white} />
              <Text style={styles.detteText}>Vous avez une dette. Effectuez un dépôt pour continuer.</Text>
            </View>
          )}
          {commissionDue > 0 && (
            <View style={styles.commissionRow}>
              <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.commissionText}>
                Commission KourseGo à payer : {commissionDue.toLocaleString()} FCFA (15%)
              </Text>
            </View>
          )}
        </View>

        {/* Dépôt / Retrait */}
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
            {!peutRetirer && <Text style={styles.actionSub}>Solde insuffisant</Text>}
          </TouchableOpacity>
        </View>

        {/* Période */}
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

        {/* Gains */}
        <View style={styles.gainsCard}>
          <Text style={styles.gainsLabel}>Gains & Revenus</Text>
          <Text style={styles.gainsTotal}>{stats.total.toLocaleString()} FCFA</Text>
          <View style={styles.gainsStats}>
            <View style={styles.gainsStat}>
              <Text style={styles.gainsStatVal}>{stats.nbCourses}</Text>
              <Text style={styles.gainsStatLabel}>Courses</Text>
            </View>
            <View style={styles.gainsDivider} />
            <View style={styles.gainsStat}>
              <Text style={styles.gainsStatVal}>{stats.moy.toLocaleString()}</Text>
              <Text style={styles.gainsStatLabel}>Moy/course</Text>
            </View>
            <View style={styles.gainsDivider} />
            <View style={styles.gainsStat}>
              <Text style={styles.gainsStatVal}>{Math.round(stats.total * COMMISSION_TAUX).toLocaleString()}</Text>
              <Text style={styles.gainsStatLabel}>Commission</Text>
            </View>
          </View>
        </View>

        {/* Graphique */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activité de la semaine</Text>
          <View style={styles.barChart}>
            {BARS.map((b, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height: b.h }]} />
                <Text style={styles.barLabel}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Historique courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses effectuées</Text>
          {courses.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted }}>
                Aucune course sur cette période
              </Text>
            </View>
          ) : (
            courses.map((c: any) => {
              const nomClient  = (c.client?.utilisateur as any)?.nom_complet || 'Client';
              const titre      = c.description_articles?.split(',')[0] || 'Course';
              const commission = Math.round((c.montant_course || 0) * COMMISSION_TAUX);
              const estEspeces = c.paiement?.moyen_paiement === 'especes';
              return (
                <View key={c.id_commande} style={styles.histCard}>
                  <View style={styles.histIcon}>
                    <Ionicons name="bicycle-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histClient} numberOfLines={1}>{titre}</Text>
                    <Text style={styles.histDate}>{formatDate(c.date_commande)} · {nomClient}</Text>
                    {estEspeces ? (
                      <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary }}>
                        💵 Espèces — commission non déduite du solde
                      </Text>
                    ) : (
                      <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error }}>
                        Commission : -{commission.toLocaleString()} FCFA
                      </Text>
                    )}
                  </View>
                  <View style={styles.histRight}>
                    <Text style={styles.histMontant}>+{c.montant_course?.toLocaleString()} FCFA</Text>
                    <View style={[styles.verseBadge, estEspeces && { backgroundColor: Colors.warningLight }]}>
                      <Text style={[styles.verseText, estEspeces && { color: Colors.warning }]}>
                        {estEspeces ? 'Espèces' : 'Versé'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal dépôt/retrait */}
      <Modal visible={action !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAction(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {action === 'depot' ? '💳 Effectuer un dépôt' : '💸 Effectuer un retrait'}
            </Text>
            <Text style={styles.modalSub}>
              {action === 'depot'
                ? 'Transférez de votre compte MoMo vers votre portefeuille KourseGo'
                : `Transférez vers votre MoMo (solde disponible : ${solde.toLocaleString()} FCFA)`}
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
  container:            { flex: 1, backgroundColor: Colors.background },
  alertCommission:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.error, margin: Spacing['2xl'], marginBottom: 0, padding: Spacing.md, borderRadius: BorderRadius.lg },
  alertCommissionText:  { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.white, lineHeight: 18 },
  soldeCard:            { margin: Spacing['2xl'], marginBottom: 0, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', ...Shadows.md },
  soldeCardNegatif:     { backgroundColor: Colors.error },
  soldeLabel:           { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  soldeAmount:          { fontFamily: FontFamily.bold, fontSize: 36, color: Colors.white, marginBottom: 4 },
  detteRow:             { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: Spacing.sm },
  detteText:            { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.9)', lineHeight: 16 },
  commissionRow:        { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: Spacing.sm },
  commissionText:       { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  actionsRow:           { flexDirection: 'row', paddingHorizontal: Spacing['2xl'], gap: Spacing.md, marginVertical: Spacing.lg },
  actionBtn:            { flex: 1, alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, ...Shadows.sm },
  actionBtnDisabled:    { opacity: 0.6 },
  actionIcon:           { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionLabel:          { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  actionLabelDisabled:  { color: Colors.textLight },
  actionSub:            { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error, marginTop: 2 },
  periodeRow:           { flexDirection: 'row', backgroundColor: Colors.white, padding: Spacing.sm, marginHorizontal: Spacing['2xl'], borderRadius: BorderRadius.xl, gap: Spacing.xs, ...Shadows.sm },
  periodeBtn:           { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg, alignItems: 'center' },
  periodeBtnActive:     { backgroundColor: Colors.primary },
  periodeTxt:           { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  periodeTxtActive:     { color: Colors.white },
  gainsCard:            { margin: Spacing['2xl'], marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, alignItems: 'center', ...Shadows.lg },
  gainsLabel:           { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  gainsTotal:           { fontFamily: FontFamily.bold, fontSize: 32, color: Colors.white, marginVertical: Spacing.sm },
  gainsStats:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  gainsStat:            { alignItems: 'center' },
  gainsStatVal:         { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.white },
  gainsStatLabel:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  gainsDivider:         { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  card:                 { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginHorizontal: Spacing['2xl'], padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  cardTitle:            { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  barChart:             { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  barWrapper:           { alignItems: 'center', gap: 4, flex: 1 },
  bar:                  { width: 28, backgroundColor: Colors.primary, borderRadius: 6, opacity: 0.85 },
  barLabel:             { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  section:              { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  sectionTitle:         { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  histCard:             { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  histIcon:             { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  histClient:           { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  histDate:             { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  histRight:            { alignItems: 'flex-end', gap: 4 },
  histMontant:          { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.success },
  verseBadge:           { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  verseText:            { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.success },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:           { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing['2xl'], paddingTop: Spacing.md },
  modalHandle:          { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitle:           { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: 4 },
  modalSub:             { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
  reseauTitle:          { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  reseauCard:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.white },
  reseauCardActive:     { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  reseauIconBox:        { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reseauLabel:          { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  radio:                { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:          { borderColor: Colors.primary },
  radioInner:           { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});