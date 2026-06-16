// app/client/commandes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

type Filtre = 'toutes' | 'en_attente' | 'en_cours' | 'livree' | 'annulee';

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  en_attente: { label: 'En attente', color: Colors.warning, bg: Colors.warningLight,  icon: 'time-outline' },
  en_cours:   { label: 'En cours',   color: Colors.success, bg: Colors.successLight,  icon: 'bicycle-outline' },
  livree:     { label: 'Terminée',   color: Colors.primary, bg: Colors.primarySoft,   icon: 'checkmark-circle-outline' },
  annulee:    { label: 'Annulée',    color: Colors.error,   bg: Colors.errorLight,    icon: 'close-circle-outline' },
};

const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'toutes',     label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'en_cours',   label: 'En cours' },
  { key: 'livree',     label: 'Terminées' },
  { key: 'annulee',    label: 'Annulées' },
];

const formatDate = (iso: string) => {
  const d   = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000)  return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 172800000) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export default function CommandesScreen() {
  const router = useRouter();
  const [filtre, setFiltre]       = useState<Filtre>('toutes');
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchCommandes(); }, []);

  const fetchCommandes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('commande')
      .select(`
        id_commande,
        description_articles,
        magasins,
        adresse_livraison,
        statut_commande,
        estimation_prix,
        date_commande
      `)
      .eq('id_client', user.id)
      .order('date_commande', { ascending: false });

    if (error) console.error('Erreur fetch commandes:', error);
    if (data) setCommandes(data);
    setLoading(false);
  };

  // Filtre selon statut_commande (le bon nom de colonne)
  const filtrees = commandes.filter(
    (c) => filtre === 'toutes' || c.statut_commande === filtre
  );

  return (
    <View style={styles.container}>
      <Header showLogo rightIcon="search-outline" />

      {/* Filtres */}
      <View style={styles.filtresRow}>
        {FILTRES.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnActive]}
            onPress={() => setFiltre(f.key)}
          >
            <Text style={[styles.filtreTxt, filtre === f.key && styles.filtreTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtrees}
        keyExtractor={(item) => item.id_commande?.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchCommandes}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune commande</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statut = item.statut_commande || 'en_attente';
          const cfg    = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente;
          const titre  = item.description_articles?.split(',')[0] || 'Course';

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                if (statut === 'en_cours') {
                  router.push({
                    pathname: '/client/course/suivi',
                    params: { commandeId: item.id_commande },
                  });
                }
              }}
            >
              <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitre} numberOfLines={1}>{titre}</Text>
                <Text style={styles.cardDate}>
                  {formatDate(item.date_commande)}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardMontant}>
                  {item.estimation_prix?.toLocaleString()} FCFA
                </Text>
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
  container:       { flex: 1, backgroundColor: Colors.background },
  filtresRow:      { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtreBtn:       { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceGray },
  filtreBtnActive: { backgroundColor: Colors.primary },
  filtreTxt:       { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary },
  filtreTxtActive: { color: Colors.white },
  list:            { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 80 },
  card:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  cardIcon:        { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo:        { flex: 1 },
  cardTitre:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  cardDate:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  cardRight:       { alignItems: 'flex-end', gap: 4 },
  cardMontant:     { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeTxt:        { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  empty:           { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText:       { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted },
  fab:             { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.lg },
});