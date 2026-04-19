// app/coursier/dashboard.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';

const COURSES_RECENTES = [
  { id: '1', client: 'Restaurant au Jours', adresse: 'Fidjrossè, Cotonou', montant: '3 500 FCFA', statut: 'terminee' },
  { id: '2', client: 'Yaovi Mensah', adresse: '12 rue du Port, Cotonou', montant: '2 000 FCFA', statut: 'terminee' },
];

export default function CoursierDashboard() {
  const router = useRouter();
  const [disponible, setDisponible] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, Moussa 👋</Text>
          <Text style={styles.date}>Cotonou · Samedi 18 Avril</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/coursier/profil')} style={styles.avatarBtn}>
          <Ionicons name="person" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Disponibilité */}
        <View style={styles.dispoCard}>
          <View style={styles.dispoLeft}>
            <View style={[styles.dispoDot, disponible ? styles.dispoOn : styles.dispoOff]} />
            <View>
              <Text style={styles.dispoTitle}>
                {disponible ? 'Vous êtes disponible' : 'Vous êtes hors ligne'}
              </Text>
              <Text style={styles.dispoSub}>
                {disponible ? 'Les annonces sont visibles' : 'Activez pour recevoir des courses'}
              </Text>
            </View>
          </View>
          <Switch
            value={disponible}
            onValueChange={setDisponible}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={disponible ? Colors.primary : Colors.white}
          />
        </View>

        {/* Stats du jour */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Courses aujourd\'hui', val: '3', icon: 'bicycle-outline' },
            { label: 'Gains du jour', val: '7 500', icon: 'cash-outline', suffix: 'FCFA' },
            { label: 'Note moyenne', val: '4.8', icon: 'star-outline' },
            { label: 'Km parcourus', val: '18', icon: 'navigate-outline', suffix: 'km' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name={s.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statVal}>
                {s.val} <Text style={styles.statSuffix}>{s.suffix}</Text>
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Course en cours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course en cours</Text>
          <TouchableOpacity
            style={styles.activeCard}
            onPress={() => router.push('/coursier/course/en-cours')}
          >
            <View style={styles.activePulse}>
              <Ionicons name="bicycle" size={24} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>Course #PRF-1425</Text>
              <Text style={styles.activeSub}>À 4km · Fidjrossè, Cotonou</Text>
              <View style={styles.activeProgress}>
                <View style={styles.activeProgressBar} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Dernières courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses récentes</Text>
            <TouchableOpacity onPress={() => router.push('/coursier/gains')}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {COURSES_RECENTES.map((c) => (
            <View key={c.id} style={styles.courseCard}>
              <View style={styles.courseIcon}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseClient}>{c.client}</Text>
                <Text style={styles.courseAdresse}>{c.adresse}</Text>
              </View>
              <Text style={styles.courseMontant}>{c.montant}</Text>
            </View>
          ))}
        </View>

        {/* Voir annonces */}
        <TouchableOpacity
          style={styles.annoncesBtn}
          onPress={() => router.push('/coursier/annonces')}
        >
          <Ionicons name="megaphone-outline" size={20} color={Colors.white} />
          <Text style={styles.annoncesBtnText}>Voir les nouvelles annonces</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base,
    backgroundColor: Colors.white,
  },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  dispoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: Spacing['2xl'], marginBottom: Spacing.base,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  dispoLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dispoDot: { width: 12, height: 12, borderRadius: 6 },
  dispoOn: { backgroundColor: Colors.success },
  dispoOff: { backgroundColor: Colors.error },
  dispoTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  dispoSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statVal: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  statSuffix: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.sm },
  voirTout: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.md,
  },
  activePulse: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  activeTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
  activeSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  activeProgress: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 8 },
  activeProgressBar: { width: '60%', height: '100%', backgroundColor: Colors.white, borderRadius: 2 },
  courseCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  courseIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  courseClient: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  courseAdresse: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  courseMontant: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
  annoncesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing['2xl'], backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, paddingVertical: 16, ...Shadows.md,
  },
  annoncesBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});
