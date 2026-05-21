// app/client/alertes.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

interface Notif {
  id_notification: number;
  titre: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  id_demande?: number;
  id_course?: number;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  generale:           { icon: 'notifications-outline', color: Colors.primary,  bg: Colors.primarySoft  },
  nouvelle_demande:   { icon: 'bag-outline',           color: Colors.primary,  bg: Colors.primarySoft  },
  coursier_accepte:   { icon: 'bicycle-outline',       color: Colors.success,  bg: Colors.successLight },
  paiement_confirme:  { icon: 'card-outline',          color: Colors.success,  bg: Colors.successLight },
  course_demarree:    { icon: 'bicycle-outline',       color: Colors.info,     bg: Colors.infoLight    },
  course_livree:      { icon: 'checkmark-circle-outline', color: Colors.success, bg: Colors.successLight },
  course_confirmee:   { icon: 'checkmark-circle-outline', color: Colors.primary, bg: Colors.primarySoft },
  validation_approuvee: { icon: 'shield-checkmark-outline', color: Colors.success, bg: Colors.successLight },
  validation_rejetee: { icon: 'shield-outline',        color: Colors.error,    bg: Colors.errorLight   },
  message_recu:       { icon: 'chatbubble-outline',    color: Colors.info,     bg: Colors.infoLight    },
  // fallback
  general:  { icon: 'notifications-outline', color: Colors.primary, bg: Colors.primarySoft },
  commande: { icon: 'bag-outline',           color: Colors.primary, bg: Colors.primarySoft },
  message:  { icon: 'chatbubble-outline',    color: Colors.info,    bg: Colors.infoLight   },
  paiement: { icon: 'card-outline',          color: Colors.success, bg: Colors.successLight },
  securite: { icon: 'shield-outline',        color: Colors.error,   bg: Colors.errorLight  },
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // en secondes

  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function AlertesScreen() {
  const router = useRouter();
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef            = useRef<any>(null);

  useEffect(() => {
    loadNotifs();
    subscribeRealtime();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const loadNotifs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('id_utilisateur', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setNotifs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Supabase Realtime — nouvelles notifications en temps réel
  const subscribeRealtime = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    channelRef.current = supabase
      .channel(`notifs_${user.id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `id_utilisateur=eq.${user.id}`,
      }, (payload) => {
        setNotifs(prev => [payload.new as Notif, ...prev]);
      })
      .subscribe();
  };

  // Marquer une notification comme lue
  const markRead = async (id: number) => {
    setNotifs(prev => prev.map(n => n.id_notification === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id_notification', id);
  };

  // Marquer toutes comme lues
  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('id_utilisateur', user.id)
      .eq('is_read', false);
  };

  // Navigation selon le type de notification
  const handlePress = (item: Notif) => {
    markRead(item.id_notification);

    if (item.id_demande) {
      if (['coursier_accepte', 'paiement_confirme', 'course_demarree', 'course_livree'].includes(item.type)) {
        (router as any).push({ pathname: '/client/commande/confirmation', params: { id_demande: item.id_demande.toString() } });
      } else if (item.type === 'message_recu') {
        (router as any).push({ pathname: '/client/course/chat', params: { id_demande: item.id_demande.toString() } });
      } else {
        (router as any).push({ pathname: '/client/commande/recapitulatif', params: { id_demande: item.id_demande.toString() } });
      }
    }
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={n => n.id_notification.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.general;
            return (
              <TouchableOpacity
                style={[styles.card, !item.is_read && styles.cardUnread]}
                activeOpacity={0.8}
                onPress={() => handlePress(item)}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  markRead:    { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  subHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:       { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  unreadBadge: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  unreadText:  { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.white },
  list:        { padding: Spacing.base, gap: Spacing.sm },
  card:        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  cardUnread:  { borderLeftWidth: 3, borderLeftColor: Colors.primary, backgroundColor: Colors.primaryUltraLight },
  iconBox:     { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info:        { flex: 1 },
  infoTop:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  notifTitre:  { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMsg:    { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  notifDate:   { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  empty:       { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText:   { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted },
});