// app/coursier/annonces.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

type TypeCourse = 'achat' | 'recuperation_colis';

interface Annonce {
  id_demande: number;
  id_client: string;
  nom_client: string;
  type_course: TypeCourse;
  description_articles: string;
  magasins: string;
  adresse_livraison: string;
  montant_articles: number;
  commission_coursier: number;
  date_demande: string;
}

export default function AnnoncesScreen() {
  const router = useRouter();
  const [annonces, setAnnonces]       = useState<Annonce[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [filtre, setFiltre]           = useState<'toutes' | TypeCourse>('toutes');
  const [userId, setUserId]           = useState<string | null>(null);

  useEffect(() => {
    init();
    const channel = supabase
      .channel('annonces-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demande_courses' }, () => {
        loadAnnonces();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
    await loadAnnonces();
  };

  const loadAnnonces = async () => {
    try {
      // Toutes les demandes en_attente
      const { data: demandes, error } = await supabase
        .from('demande_courses')
        .select('id_demande, id_client, description_articles, magasins, adresse_livraison, montant_articles, commission_coursier, date_demande')
        .eq('statut_demande', 'en_attente')
        .order('date_demande', { ascending: false });

      if (error) { console.error('Erreur:', error); return; }
      if (!demandes?.length) { setAnnonces([]); return; }

      // Noms des clients
      const clientIds = [...new Set(demandes.map(d => d.id_client).filter(Boolean))];
      let clientsMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('utilisateurs').select('id, nom_complet').in('id', clientIds);
        (clients ?? []).forEach(c => { clientsMap[c.id] = c.nom_complet; });
      }

      setAnnonces(demandes.map(d => ({
        id_demande:           d.id_demande,
        id_client:            d.id_client,
        nom_client:           clientsMap[d.id_client] ?? 'Client',
        type_course:          (d.description_articles?.toLowerCase().includes('colis') ||
                               d.magasins?.toLowerCase().includes('récup'))
                               ? 'recuperation_colis' : 'achat',
        description_articles: d.description_articles ?? '—',
        magasins:             d.magasins ?? '—',
        adresse_livraison:    d.adresse_livraison ?? '—',
        montant_articles:     Number(d.montant_articles) || 0,
        commission_coursier:  Number(d.commission_coursier) || 0,
        date_demande:         d.date_demande,
      })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadAnnonces(); }, []);

  // ── Accepter une course ──────────────────────────────────
  const accepterCourse = async (annonce: Annonce) => {
    if (!userId) return;

    Alert.alert(
      'Accepter cette course ?',
      `Livraison : ${annonce.adresse_livraison}\nGain : ${annonce.commission_coursier.toLocaleString('fr-FR')} FCFA`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✅ Accepter',
          onPress: async () => {
            setAcceptingId(annonce.id_demande);
            try {
              // 1. Créer la course
              const { data: course, error: courseError } = await supabase
                .from('courses')
                .insert({
                  id_demande:    annonce.id_demande,
                  id_livreur:    userId,
                  statut_course: 'acceptee',
                  date_debut:    new Date().toISOString(),
                })
                .select().single();

              if (courseError) throw courseError;

              // 2. Mettre à jour la demande
              await supabase
                .from('demande_courses')
                .update({ statut_demande: 'acceptee' })
                .eq('id_demande', annonce.id_demande);

              // 3. Notifier le client
              await supabase.from('notifications').insert({
                id_utilisateur: annonce.id_client,
                id_demande:     annonce.id_demande,
                id_course:      course?.id_course ?? null,
                titre:          'Coursier trouvé ! 🎉',
                message:        'Un coursier a accepté votre demande et est en route vers vous.',
                type:           'course_acceptee',
                is_read:        false,
              });

              // 4. Retirer de la liste
              setAnnonces(prev => prev.filter(a => a.id_demande !== annonce.id_demande));

              Alert.alert('Course acceptée !', 'Bonne route !', [
                { text: 'Voir la course', onPress: () => router.push('/coursier/course/en-cours') },
              ]);
            } catch (err) {
              Alert.alert('Erreur', "Impossible d'accepter. Réessayez.");
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const formatTemps = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return new Date(iso).toLocaleDateString('fr-FR');
  };

  const filtrees = annonces.filter(a => filtre === 'toutes' || a.type_course === filtre);

  return (
    <View style={styles.container}>
      <Header showLogo />

      <View style={styles.titleRow}>
        <Text style={styles.title}>Annonces disponibles</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtrees.length}</Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtresRow}>
        {[
          { key: 'toutes',             label: 'Toutes' },
          { key: 'achat',              label: '🛒 Achats' },
          { key: 'recuperation_colis', label: '📦 Colis' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnActive]}
            onPress={() => setFiltre(f.key as any)}
          >
            <Text style={[styles.filtreTxt, filtre === f.key && styles.filtreTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des annonces...</Text>
        </View>
      ) : (
        <FlatList
          data={filtrees}
          keyExtractor={(a) => a.id_demande.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>Aucune annonce disponible</Text>
              <Text style={styles.emptyText}>Tirez vers le bas pour actualiser.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.clientInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.clientNom}>{item.nom_client}</Text>
                </View>
                <View style={[styles.typeBadge, item.type_course === 'achat' ? styles.typeBadgeAchat : styles.typeBadgeColis]}>
                  <Text style={[styles.typeText, item.type_course === 'achat' ? styles.typeTextAchat : styles.typeTextColis]}>
                    {item.type_course === 'achat' ? '🛒 Achat' : '📦 Colis'}
                  </Text>
                </View>
              </View>

              <Text style={styles.desc} numberOfLines={2}>{item.description_articles}</Text>

              <View style={styles.trajetRow}>
                {item.magasins !== '—' && (
                  <View style={styles.trajetItem}>
                    <Ionicons name="storefront-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.trajetText} numberOfLines={1}>{item.magasins}</Text>
                  </View>
                )}
                <View style={styles.trajetItem}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.trajetText} numberOfLines={1}>{item.adresse_livraison}</Text>
                </View>
              </View>

              <View style={styles.metasRow}>
                {item.montant_articles > 0 && (
                  <View style={styles.meta}>
                    <Ionicons name="bag-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.metaVal}>{item.montant_articles.toLocaleString('fr-FR')} FCFA</Text>
                  </View>
                )}
                <View style={styles.meta}>
                  <Ionicons name="cash-outline" size={14} color={Colors.success} />
                  <Text style={[styles.metaVal, { color: Colors.success }]}>
                    {item.commission_coursier > 0
                      ? `+${item.commission_coursier.toLocaleString('fr-FR')} FCFA`
                      : 'Gain à définir'}
                  </Text>
                </View>
              </View>

              <Text style={styles.publie}>Publié {formatTemps(item.date_demande)}</Text>

              <TouchableOpacity
                style={[styles.acceptBtn, acceptingId === item.id_demande && styles.acceptBtnLoading]}
                activeOpacity={0.85}
                onPress={() => accepterCourse(item)}
                disabled={acceptingId !== null}
              >
                {acceptingId === item.id_demande ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.acceptBtnText}>Accepter cette course</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:      { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  titleRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, backgroundColor: Colors.white },
  title:            { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  countBadge:       { backgroundColor: Colors.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  countText:        { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.white },
  filtresRow:       { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtreBtn:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceGray },
  filtreBtnActive:  { backgroundColor: Colors.primary },
  filtreTxt:        { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  filtreTxtActive:  { color: Colors.white },
  list:             { padding: Spacing.base, gap: Spacing.md },
  emptyContainer:   { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  emptyText:        { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  card:             { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  clientInfo:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar:           { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clientNom:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  typeBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  typeBadgeAchat:   { backgroundColor: Colors.primarySoft },
  typeBadgeColis:   { backgroundColor: Colors.infoLight },
  typeText:         { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  typeTextAchat:    { color: Colors.primary },
  typeTextColis:    { color: Colors.info },
  desc:             { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  trajetRow:        { gap: 4, marginBottom: Spacing.sm },
  trajetItem:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trajetText:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
  metasRow:         { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs },
  meta:             { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaVal:          { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  publie:           { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  acceptBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14 },
  acceptBtnLoading: { backgroundColor: Colors.primaryLight },
  acceptBtnText:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});