// app/coursier/annonces.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

const formatDate = (iso: string) => {
  const diff = new Date().getTime() - new Date(iso).getTime();
  if (diff < 3600000)  return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
  return new Date(iso).toLocaleDateString('fr-FR');
};

export default function AnnoncesScreen() {
  const router = useRouter();
  const [filtre, setFiltre]     = useState<'toutes' | 'achat' | 'recuperation_colis'>('toutes');
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchAnnonces();

    // Temps réel
    const channel = supabase
      .channel('annonces-channel')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'commande',
      }, (payload) => {
        if (payload.new?.statut_commande === 'en_attente' && !payload.new?.id_coursier) {
          setAnnonces((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAnnonces = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('commande')
      .select('id_commande, description_articles, magasins, adresse_livraison, estimation_prix, montant_course, poids_colis, aller_retour, date_commande, id_client')
      .eq('statut_commande', 'en_attente')
      .is('id_coursier', null)
      .order('date_commande', { ascending: false });

    if (error) console.error('Erreur annonces:', error);
    if (data)  setAnnonces(data);
    setLoading(false);
  };

  const filtrees = annonces.filter((a) => {
    if (filtre === 'toutes') return true;
    // Colis = poids_colis défini OU aller_retour activé
    const isColis = !!a.poids_colis || !!a.aller_retour;
    return filtre === 'achat' ? !isColis : isColis;
  });

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
          { key: 'toutes',             label: 'Toutes'    },
          { key: 'achat',              label: '🛒 Achats' },
          { key: 'recuperation_colis', label: '📦 Colis'  },
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

      <FlatList
        data={filtrees}
        keyExtractor={(a) => String(a.id_commande)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchAnnonces}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Ionicons name="megaphone-outline" size={48} color={Colors.textMuted} />
              <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted }}>
                Aucune annonce disponible
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          // Colis = poids_colis défini OU aller_retour
          const isAchat = !item.poids_colis && !item.aller_retour;
          const type    = isAchat ? 'achat' : 'recuperation_colis';

          return (
            <View style={styles.card}>
              {/* Header card */}
              <View style={styles.cardHeader}>
                <View style={styles.clientInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.clientNom}>Client</Text>
                </View>
                <View style={styles.badgesRow}>
                  {/* Badge poids pour colis */}
                  {!isAchat && item.poids_colis && (
                    <View style={[styles.poidsBadge, item.poids_colis === 'lourd' ? styles.poidsBadgeLourd : styles.poidsBadgeLeger]}>
                      <Text style={[styles.poidsText, { color: item.poids_colis === 'lourd' ? Colors.error : Colors.success }]}>
                        {item.poids_colis === 'lourd' ? '🏋️ Lourd' : '🪶 Léger'}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.typeBadge, isAchat ? styles.typeBadgeAchat : styles.typeBadgeColis]}>
                    <Text style={[styles.typeText, isAchat ? styles.typeTextAchat : styles.typeTextColis]}>
                      {isAchat ? '🛒 Achat' : '📦 Colis'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.desc} numberOfLines={2}>
                {item.description_articles}
              </Text>

              {/* Infos trajet */}
              <View style={styles.trajetRow}>
                {item.magasins && (
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

              {/* Métas */}
              <View style={styles.metasRow}>
                <View style={styles.meta}>
                  <Ionicons name="cash-outline" size={14} color={Colors.success} />
                  <Text style={[styles.metaVal, { color: Colors.success }]}>
                    {item.montant_course?.toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
                  <Text style={styles.metaVal}>
                    Total : {item.estimation_prix?.toLocaleString()} FCFA
                  </Text>
                </View>
                {item.aller_retour && (
                  <View style={styles.meta}>
                    <Ionicons name="swap-horizontal-outline" size={14} color={Colors.primary} />
                    <Text style={styles.metaVal}>A/R</Text>
                  </View>
                )}
              </View>

              <Text style={styles.publie}>Publié {formatDate(item.date_commande)}</Text>

              {/* Bouton */}
              <TouchableOpacity
                style={styles.acceptBtn}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/coursier/course/detail',
                  params: { id: item.id_commande },
                })}
              >
                <Text style={styles.acceptBtnText}>Voir les détails & accepter</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
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
  card:             { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  clientInfo:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar:           { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clientNom:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  badgesRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  poidsBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  poidsBadgeLeger:  { backgroundColor: Colors.successLight },
  poidsBadgeLourd:  { backgroundColor: '#FDECEA' },
  poidsText:        { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
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
  metasRow:         { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs, flexWrap: 'wrap' },
  meta:             { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaVal:          { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  publie:           { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  acceptBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14 },
  acceptBtnText:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});