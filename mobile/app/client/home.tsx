// app/client/home.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

interface Commande {
  id_demande: number;
  adresse_livraison: string;
  statut_demande: string;
  estimation_prix: number | null;
  date_demande: string;
}

interface Profil {
  nom_complet: string;
}

// Mapper le statut en français lisible
const statutLabel = (statut: string): string => {
  const map: Record<string, string> = {
    en_attente:    'En attente',
    en_discussion: 'En discussion',
    acceptee:      'Acceptée',
    payee:         'Payée',
    en_cours:      'En cours',
    livree:        'Terminée',
    annulee:       'Annulée',
  };
  return map[statut] ?? statut;
};

const isActif = (statut: string) =>
  ['en_attente', 'en_discussion', 'acceptee', 'payee', 'en_cours'].includes(statut);

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function ClientHomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing]   = useState(false);
  const [profil, setProfil]           = useState<Profil | null>(null);
  const [commandes, setCommandes]     = useState<Commande[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [nbNotifs, setNbNotifs]       = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }

      // Profil utilisateur
      const { data: p } = await supabase
        .from('utilisateurs')
        .select('nom_complet')
        .eq('id', user.id)
        .single();
      if (p) setProfil(p);

      // 3 dernières commandes
      const { data: c } = await supabase
        .from('demande_courses')
        .select('id_demande, adresse_livraison, statut_demande, estimation_prix, date_demande')
        .eq('id_client', user.id)
        .order('date_demande', { ascending: false })
        .limit(3);
      if (c) setCommandes(c);

      // Nombre de notifications non lues
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('id_utilisateur', user.id)
        .eq('is_read', false);
      setNbNotifs(count ?? 0);

    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prénom seulement (premier mot du nom complet)
  const prenom = profil?.nom_complet?.split(' ')[0] ?? '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {prenom ? `Bonjour, ${prenom} 👋` : 'Vos saveurs locales,'}
          </Text>
          <Text style={styles.greetingBold}>livrées chez vous 🛵</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/client/alertes')}
          style={styles.notifBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          {nbNotifs > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Bannière */}
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Commandez vite,{'\n'}livré encore plus vite !</Text>
            <Text style={styles.bannerSub}>Cotonou & environs 🇧🇯</Text>
          </View>
          <Ionicons name="bicycle" size={64} color="rgba(255,255,255,0.3)" />
        </View>

        {/* 2 boutons principaux */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardOutline]}
            activeOpacity={0.8}
            onPress={() => router.push('/client/trouver-coursier')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primarySoft }]}>
              <Ionicons name="search-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Trouver un{'\n'}coursier</Text>
            <Text style={styles.actionSub}>Disponibles maintenant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardFilled]}
            activeOpacity={0.8}
            onPress={() => router.push('/client/commande/nouvelle')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="add-circle-outline" size={28} color={Colors.white} />
            </View>
            <Text style={[styles.actionTitle, { color: Colors.white }]}>Lancer une{'\n'}course</Text>
            <Text style={[styles.actionSub, { color: 'rgba(255,255,255,0.8)' }]}>Achats & colis</Text>
          </TouchableOpacity>
        </View>

        {/* Dernières commandes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières commandes</Text>
            <TouchableOpacity onPress={() => router.push('/client/commandes')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {loadingData ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
          ) : commandes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bag-outline" size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>Aucune commande pour l'instant</Text>
              <TouchableOpacity onPress={() => router.push('/client/commande/nouvelle')}>
                <Text style={styles.emptyLink}>Lancer ma première course →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            commandes.map((order) => (
              <TouchableOpacity
                key={order.id_demande}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => (router as any).push({
                  pathname: '/client/commande/recapitulatif',
                  params: { id_demande: order.id_demande.toString() },
                })}
              >
                <View style={styles.orderIcon}>
                  <Ionicons name="bag-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle} numberOfLines={1}>
                    {order.adresse_livraison || 'Commande'}
                  </Text>
                  <Text style={styles.orderDate}>{formatDate(order.date_demande)}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>
                    {order.estimation_prix
                      ? `${order.estimation_prix.toLocaleString('fr-FR')} FCFA`
                      : '— FCFA'}
                  </Text>
                  <View style={[
                    styles.badge,
                    isActif(order.statut_demande) ? styles.badgeActive : styles.badgeDone,
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      isActif(order.statut_demande) ? styles.badgeTextActive : styles.badgeTextDone,
                    ]}>
                      {statutLabel(order.statut_demande)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Promo */}
        <View style={styles.promoCard}>
          <Ionicons name="flash" size={24} color={Colors.primary} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.promoTitle}>Livraison rapide garantie</Text>
            <Text style={styles.promoSub}>Vos courses effectuées en moins de 2h à Cotonou</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base, backgroundColor: Colors.white },
  greeting:        { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  greetingBold:    { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  notifBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceGray, alignItems: 'center', justifyContent: 'center' },
  notifDot:        { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error, borderWidth: 1.5, borderColor: Colors.white },
  banner:          { margin: Spacing['2xl'], marginBottom: Spacing.base, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...Shadows.md },
  bannerText:      { flex: 1 },
  bannerTitle:     { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.white, lineHeight: 26, marginBottom: 4 },
  bannerSub:       { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  actionsRow:      { flexDirection: 'row', paddingHorizontal: Spacing['2xl'], gap: Spacing.md, marginBottom: Spacing.base },
  actionCard:      { flex: 1, borderRadius: BorderRadius.xl, padding: Spacing.base, gap: Spacing.xs, ...Shadows.sm },
  actionCardOutline: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  actionCardFilled:  { backgroundColor: Colors.primary },
  actionIcon:      { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionTitle:     { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  actionSub:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  section:         { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:    { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  seeAll:          { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  emptyCard:       { alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.sm, ...Shadows.sm },
  emptyText:       { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textLight },
  emptyLink:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  orderCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  orderIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  orderInfo:       { flex: 1 },
  orderTitle:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  orderDate:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  orderRight:      { alignItems: 'flex-end', gap: 4 },
  orderAmount:     { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.textPrimary },
  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeActive:     { backgroundColor: Colors.successLight },
  badgeDone:       { backgroundColor: Colors.surfaceGray },
  badgeText:       { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  badgeTextActive: { color: Colors.success },
  badgeTextDone:   { color: Colors.textSecondary },
  promoCard:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing['2xl'], backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.xl, padding: Spacing.base, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  promoTitle:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: 2 },
  promoSub:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
});