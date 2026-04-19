// app/coursier/gains.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';

const HISTORIQUE = [
  { id: '1', client: 'Restaurant au Jours', type: 'achat', montant: 3500, date: "Aujourd'hui 14h30", statut: 'verse' },
  { id: '2', client: 'Sylvie Koffi', type: 'recuperation_colis', montant: 2000, date: "Aujourd'hui 11h12", statut: 'verse' },
  { id: '3', client: 'Kodjo Mensah', type: 'achat', montant: 1800, date: 'Hier 18h00', statut: 'verse' },
  { id: '4', client: 'Jean Dupont', type: 'achat', montant: 1500, date: 'Hier 13h45', statut: 'verse' },
  { id: '5', client: 'Marie Agossou', type: 'recuperation_colis', montant: 2500, date: '16/04 10h00', statut: 'verse' },
];

type Periode = 'jour' | 'semaine' | 'mois';

export default function GainsScreen() {
  const [periode, setPeriode] = useState<Periode>('semaine');

  const GAINS: Record<Periode, { total: number; courses: number; moy: number }> = {
    jour: { total: 7500, courses: 3, moy: 2500 },
    semaine: { total: 45250, courses: 18, moy: 2514 },
    mois: { total: 180000, courses: 72, moy: 2500 },
  };

  const g = GAINS[periode];

  return (
    <View style={styles.container}>
      <Header showLogo />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Sélecteur période */}
        <View style={styles.periodeRow}>
          {(['jour', 'semaine', 'mois'] as Periode[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodeBtn, periode === p && styles.periodeBtnActive]}
              onPress={() => setPeriode(p)}
            >
              <Text style={[styles.periodeTxt, periode === p && styles.periodeTxtActive]}>
                {{ jour: 'Aujourd\'hui', semaine: 'Semaine', mois: 'Mois' }[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total gains */}
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

        {/* Graphique simplifié (barres) */}
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

        {/* Historique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses terminées</Text>
          {HISTORIQUE.map((item) => (
            <View key={item.id} style={styles.histCard}>
              <View style={styles.histIcon}>
                <Ionicons
                  name={item.type === 'achat' ? 'cart-outline' : 'cube-outline'}
                  size={18}
                  color={Colors.primary}
                />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  periodeRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    padding: Spacing.sm, margin: Spacing['2xl'], marginBottom: 0,
    borderRadius: BorderRadius.xl, gap: Spacing.xs, ...Shadows.sm,
  },
  periodeBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg, alignItems: 'center' },
  periodeBtnActive: { backgroundColor: Colors.primary },
  periodeTxt: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  periodeTxtActive: { color: Colors.white },
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
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing['2xl'], padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
  barWrapper: { alignItems: 'center', gap: 4, flex: 1 },
  bar: { width: 28, backgroundColor: Colors.primary, borderRadius: 6, opacity: 0.85 },
  barLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  histCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  histIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  histClient: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  histDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  histRight: { alignItems: 'flex-end', gap: 4 },
  histMontant: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.success },
  verseBadge: {
    backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verseText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.success },
});
