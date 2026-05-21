// app/client/commandes.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

type Filtre = 'toutes' | 'en_cours' | 'terminees' | 'annulees';

interface Commande {
  id_demande: number;
  description_articles: string;
  adresse_livraison: string;
  statut_demande: string;
  estimation_prix: number | null;
  date_demande: string;
  nom_coursier?: string;
}

// Mapper statut BD → groupe filtre
const getGroupe = (statut: string): Filtre => {
  if (['en_attente', 'en_discussion', 'acceptee', 'payee', 'en_cours'].includes(statut))
    return 'en_cours';
  if (statut === 'livree') return 'terminees';
  if (statut === 'annulee') return 'annulees';
  return 'en_cours';
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  en_attente:    { label: 'En attente',   color: Colors.warning,  bg: Colors.warningLight,  icon: 'time-outline' },
  en_discussion: { label: 'En discussion', color: Colors.info,     bg: Colors.infoLight,     icon: 'chatbubble-outline' },
  acceptee:      { label: 'Acceptée',     color: Colors.success,  bg: Colors.successLight,  icon: 'checkmark-outline' },
  payee:         { label: 'Payée',        color: Colors.success,  bg: Colors.successLight,  icon: 'card-outline' },
  en_cours:      { label: 'En cours',     color: Colors.success,  bg: Colors.successLight,  icon: 'bicycle-outline' },
  livree:        { label: 'Terminée',     color: Colors.primary,  bg: Colors.primarySoft,   icon: 'checkmark-circle-outline' },
  annulee:       { label: 'Annulée',      color: Colors.error,    bg: Colors.errorLight,    icon: 'close-circle-outline' },
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff === 1) return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
    ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Titre lisible depuis description_articles ou adresse
const getTitre = (c: Commande): string => {
  if (c.description_articles) {
    // Prendre le premier article
    const first = c.description_articles.split(',')[0];
    return first.length > 30 ? first.substring(0, 30) + '...' : first;
  }
  return c.adresse_livraison || 'Commande';
};

export default function CommandesScreen() {
  const router = useRouter();
  const [filtre, setFiltre]       = useState<Filtre>('toutes');
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadCommandes(); }, []);

  const loadCommandes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer toutes les commandes du client avec le nom du coursier
      const { data } = await supabase
        .from('demande_courses')
        .select(`
          id_demande,
          description_articles,
          adresse_livraison,
          statut_demande,
          estimation_prix,
          date_demande,
          courses (
            utilisateurs (
              nom_complet
            )
          )
        `)
        .eq('id_client', user.id)
        .order('date_demande', { ascending: false });

      if (data) {
        const mapped = data.map((d: any) => ({
          id_demande:           d.id_demande,
          description_articles: d.description_articles,
          adresse_livraison:    d.adresse_livraison,
          statut_demande:       d.statut_demande,
          estimation_prix:      d.estimation_prix,
          date_demande:         d.date_demande,
          nom_coursier:         d.courses?.[0]?.utilisateurs?.nom_complet ?? 'En recherche...',
        }));
        setCommandes(mapped);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  // Filtrer selon l'onglet sélectionné
  const filtrees = commandes.filter(c =>
    filtre === 'toutes' || getGroupe(c.statut_demande) === filtre
  );

  const handleCardPress = (item: Commande) => {
    const groupe = getGroupe(item.statut_demande);
    if (groupe === 'en_cours') {
      // Commande active → aller au récapitulatif ou suivi
      if (['acceptee', 'payee', 'en_cours'].includes(item.statut_demande)) {
        (router as any).push({
          pathname: '/client/commande/confirmation',
          params: { id_demande: item.id_demande.toString() },
        });
      } else {
        (router as any).push({
          pathname: '/client/commande/recapitulatif',
          params: { id_demande: item.id_demande.toString() },
        });
      }
    }
    // Commandes terminées/annulées → pas de navigation pour l'instant
  };

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtrees}
          keyExtractor={(item) => item.id_demande.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); loadCommandes(); }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bag-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucune commande</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUT_CONFIG[item.statut_demande] ?? STATUT_CONFIG['en_attente'];
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleCardPress(item)}
              >
                <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitre} numberOfLines={1}>{getTitre(item)}</Text>
                  <Text style={styles.cardDate}>
                    {formatDate(item.date_demande)} · {item.nom_coursier}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardMontant}>
                    {item.estimation_prix
                      ? `${item.estimation_prix.toLocaleString('fr-FR')} FCFA`
                      : '— FCFA'}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

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
  container:        { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filtresRow:       { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtreBtn:        { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceGray },
  filtreBtnActive:  { backgroundColor: Colors.primary },
  filtreTxt:        { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary },
  filtreTxtActive:  { color: Colors.white },
  list:             { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 80 },
  card:             { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  cardIcon:         { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo:         { flex: 1 },
  cardTitre:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  cardDate:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  cardRight:        { alignItems: 'flex-end', gap: 4 },
  cardMontant:      { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeTxt:         { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  empty:            { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText:        { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted },
  fab:              { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.lg },
});