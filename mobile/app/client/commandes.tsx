// app/client/commandes.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';

type Filtre = 'toutes' | 'en_cours' | 'terminees' | 'annulees';

const COMMANDES = [
  { id: '1', titre: 'Courses Dantokpa', statut: 'en_cours', montant: '17 500 FCFA', date: "Aujourd'hui 14h30", coursier: 'Moussa E.' },
  { id: '2', titre: 'Récupération colis', statut: 'terminees', montant: '8 200 FCFA', date: 'Hier 10h12', coursier: 'Roméo D.' },
  { id: '3', titre: 'La Barge Restaurant', statut: 'terminees', montant: '5 400 FCFA', date: '14/04 09h00', coursier: 'Yaovi M.' },
  { id: '4', titre: 'Super Beco SN', statut: 'annulees', montant: '12 000 FCFA', date: '10/04 16h45', coursier: 'N/A' },
];

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  en_cours: { label: 'En cours', color: Colors.success, bg: Colors.successLight, icon: 'bicycle-outline' },
  terminees: { label: 'Terminée', color: Colors.primary, bg: Colors.primarySoft, icon: 'checkmark-circle-outline' },
  annulees: { label: 'Annulée', color: Colors.error, bg: Colors.errorLight, icon: 'close-circle-outline' },
};

export default function CommandesScreen() {
  const router = useRouter();
  const [filtre, setFiltre] = useState<Filtre>('toutes');

  const filtrees = COMMANDES.filter((c) => filtre === 'toutes' || c.statut === filtre);

  return (
    <View style={styles.container}>
      <Header showLogo rightIcon="search-outline" />

      {/* Filtres */}
      <View style={styles.filtresRow}>
        {(['toutes', 'en_cours', 'terminees', 'annulees'] as Filtre[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreBtn, filtre === f && styles.filtreBtnActive]}
            onPress={() => setFiltre(f)}
          >
            <Text style={[styles.filtreTxt, filtre === f && styles.filtreTxtActive]}>
              {{ toutes: 'Toutes', en_cours: 'En cours', terminees: 'Terminées', annulees: 'Annulées' }[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtrees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune commande</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STATUT_CONFIG[item.statut];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => item.statut === 'en_cours' && router.push('/client/course/suivi')}
            >
              <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitre}>{item.titre}</Text>
                <Text style={styles.cardDate}>{item.date} · {item.coursier}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardMontant}>{item.montant}</Text>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/client/commande/nouvelle')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filtresRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm, gap: Spacing.xs,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filtreBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceGray,
  },
  filtreBtnActive: { backgroundColor: Colors.primary },
  filtreTxt: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary },
  filtreTxtActive: { color: Colors.white },
  list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 80 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitre: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  cardDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardMontant: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeTxt: { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.lg,
  },
});
