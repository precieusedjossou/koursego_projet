// app/client/alertes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  commande:  { icon: 'bag-outline',        color: Colors.primary, bg: Colors.primarySoft  },
  message:   { icon: 'chatbubble-outline', color: Colors.info,    bg: Colors.infoLight    },
  promo:     { icon: 'flash-outline',      color: Colors.warning, bg: Colors.warningLight },
  paiement:  { icon: 'card-outline',       color: Colors.success, bg: Colors.successLight },
  securite:  { icon: 'shield-outline',     color: Colors.error,   bg: Colors.errorLight   },
  coursier:  { icon: 'bicycle-outline',    color: Colors.primary, bg: Colors.primarySoft  },
  livraison: { icon: 'checkmark-circle-outline', color: Colors.success, bg: Colors.successLight },
};

const formatDate = (iso: string) => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000)   return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000)  return `Il y a ${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000) return 'Hier';
  return `Il y a ${Math.floor(diff / 86400000)} jours`;
};

export default function AlertesScreen() {
  const [notifs, setNotifs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Notifs privées (pour cet utilisateur) + notifs publiques (promos)
    const { data } = await supabase
      .from('notification')
      .select('*')
      .or(`id_utilisateur.eq.${user.id},type_notification.eq.promo`)
      .order('created_at', { ascending: false });

    if (data) setNotifs(data);
    setLoading(false);
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('id_utilisateur', user.id)
      .eq('is_read', false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id: number) => {
    await supabase.from('notification').update({ is_read: true }).eq('id_notification', id);
    setNotifs((prev) => prev.map((n) => n.id_notification === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

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
        keyExtractor={(n) => String(n.id_notification)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchNotifs}
        refreshing={loading}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Ionicons name="notifications-outline" size={48} color={Colors.textMuted} />
            <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted }}>
              Aucune notification
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.commande;
          return (
            <TouchableOpacity
              style={[styles.card, !item.is_read && styles.cardUnread]}
              activeOpacity={0.8}
              onPress={() => markOneRead(item.id_notification)}
            >
              <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={styles.info}>
                <View style={styles.infoTop}>
                  <Text style={styles.notifTitre}>{item.titre}</Text>
                  {!item.is_read && <View style={styles.dot} />}
                </View>
                <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifDate}>{formatDate(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  markRead:     { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  subHeader:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:        { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  unreadBadge:  { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  unreadText:   { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.white },
  list:         { padding: Spacing.base, gap: Spacing.sm },
  card:         { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  cardUnread:   { borderLeftWidth: 3, borderLeftColor: Colors.primary, backgroundColor: Colors.primaryUltraLight },
  iconBox:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info:         { flex: 1 },
  infoTop:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  notifTitre:   { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMsg:     { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  notifDate:    { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
});