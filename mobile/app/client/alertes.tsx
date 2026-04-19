// app/client/alertes.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';

const NOTIFS = [
  { id: '1', titre: 'Commande acceptée', message: 'Moussa Elabidi a accepté votre course. Procédez au paiement.', type: 'commande', lu: false, date: 'Il y a 5 min' },
  { id: '2', titre: 'Nouveau message', message: 'Moussa : "Je suis au marché, article disponible ?"', type: 'message', lu: false, date: 'Il y a 12 min' },
  { id: '3', titre: 'Offre Flash 🔥', message: 'Livraison gratuite sur votre prochaine commande ce week-end !', type: 'promo', lu: true, date: 'Il y a 2h' },
  { id: '4', titre: 'Commande confirmée', message: 'Votre paiement de 17 500 FCFA a été reçu avec succès.', type: 'paiement', lu: true, date: 'Hier' },
  { id: '5', titre: 'Sécurité du compte', message: 'Une connexion a été détectée depuis Cotonou, Bénin.', type: 'securite', lu: true, date: 'Il y a 3 jours' },
];

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  commande: { icon: 'bag-outline', color: Colors.primary, bg: Colors.primarySoft },
  message: { icon: 'chatbubble-outline', color: Colors.info, bg: Colors.infoLight },
  promo: { icon: 'flash-outline', color: Colors.warning, bg: Colors.warningLight },
  paiement: { icon: 'card-outline', color: Colors.success, bg: Colors.successLight },
  securite: { icon: 'shield-outline', color: Colors.error, bg: Colors.errorLight },
};

export default function AlertesScreen() {
  const [notifs, setNotifs] = useState(NOTIFS);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));
  const unreadCount = notifs.filter((n) => !n.lu).length;

  return (
    <View style={styles.container}>
      <Header
        showLogo
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markRead}>Tout lire</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <View style={styles.subHeader}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount} nouvelles</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.commande;
          return (
            <TouchableOpacity
              style={[styles.card, !item.lu && styles.cardUnread]}
              activeOpacity={0.8}
              onPress={() => setNotifs((prev) => prev.map((n) => n.id === item.id ? { ...n, lu: true } : n))}
            >
              <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={styles.info}>
                <View style={styles.infoTop}>
                  <Text style={styles.notifTitre}>{item.titre}</Text>
                  {!item.lu && <View style={styles.dot} />}
                </View>
                <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  markRead: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  subHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  unreadBadge: {
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  unreadText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.white },
  list: { padding: Spacing.base, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  cardUnread: {
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    backgroundColor: Colors.primaryUltraLight,
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  infoTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  notifTitre: { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMsg: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  notifDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
});
