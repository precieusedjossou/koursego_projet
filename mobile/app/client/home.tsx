// app/client/home.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';

const RECENT_ORDERS = [
  { id: '1', titre: 'La Barge', statut: 'En cours', montant: '3 200 FCFA', date: "Aujourd'hui" },
  { id: '2', titre: 'Saint Moser', statut: 'Terminée', montant: '5 800 FCFA', date: 'Hier' },
];

export default function ClientHomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Vos saveurs locales,</Text>
          <Text style={styles.greetingBold}>livrées chez vous 🛵</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/client/alertes')} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
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
          {/* ⚠️ Modification maquette : "Trouver un coursier" → page placeholder (pas encore designée) */}
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

          {RECENT_ORDERS.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.7}>
              <View style={styles.orderIcon}>
                <Ionicons name="bag-outline" size={22} color={Colors.primary} />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderTitle}>{order.titre}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>{order.montant}</Text>
                <View style={[styles.badge, order.statut === 'En cours' ? styles.badgeActive : styles.badgeDone]}>
                  <Text style={[styles.badgeText, order.statut === 'En cours' ? styles.badgeTextActive : styles.badgeTextDone]}>
                    {order.statut}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 56,
    paddingBottom: Spacing.base,
    backgroundColor: Colors.white,
  },
  greeting: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  greetingBold: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  notifBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8, right: 8,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  banner: {
    margin: Spacing['2xl'],
    marginBottom: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.white,
    lineHeight: 26,
    marginBottom: 4,
  },
  bannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  actionCardOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  actionCardFilled: {
    backgroundColor: Colors.primary,
  },
  actionIcon: {
    width: 50, height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  actionSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  orderIcon: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  orderInfo: { flex: 1 },
  orderTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  orderDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeActive: { backgroundColor: Colors.successLight },
  badgeDone: { backgroundColor: Colors.surfaceGray },
  badgeText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  badgeTextActive: { color: Colors.success },
  badgeTextDone: { color: Colors.textSecondary },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['2xl'],
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  promoTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  promoSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
