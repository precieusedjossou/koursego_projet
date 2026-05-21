// app/client/course/chat.tsx
// Chat entre le client et le coursier pour une commande donnée
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import { supabase } from '../../../lib/supabase';

// ── Types ────────────────────────────────────────────────────
interface Message {
  id_message: number;
  id_expediteur: string;
  contenu: string;
  type_message: string | null;
  lu: boolean;
  date_envoi: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id_demande } = useLocalSearchParams<{ id_demande: string }>();

  const [messages, setMessages]       = useState<Message[]>([]);
  const [newMessage, setNewMessage]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [userId, setUserId]           = useState<string | null>(null);
  const [idConversation, setIdConversation] = useState<number | null>(null);
  const [nomCoursier, setNomCoursier] = useState('Coursier');

  const flatListRef = useRef<FlatList>(null);
  const channelRef  = useRef<any>(null);

  // ── Chargement ───────────────────────────────────────────
  useEffect(() => {
    if (id_demande) init();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [id_demande]);

  const init = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    await Promise.all([
      loadOrCreateConversation(user.id, Number(id_demande)),
    ]);
    setLoading(false);
  };

  // ── Trouver ou créer la conversation ────────────────────
  const loadOrCreateConversation = async (uid: string, idDemande: number) => {
    // Trouver le livreur assigné à cette demande
    const { data: course } = await supabase
      .from('courses')
      .select('id_livreur')
      .eq('id_demande', idDemande)
      .in('statut_course', ['acceptee', 'en_cours', 'livree'])
      .single();

    if (!course?.id_livreur) {
      Alert.alert('Chat indisponible', 'Aucun coursier assigné pour l\'instant.');
      router.back();
      return;
    }

    // Nom du coursier
    const { data: livreurUser } = await supabase
      .from('utilisateurs')
      .select('nom_complet')
      .eq('id', course.id_livreur)
      .single();
    setNomCoursier(livreurUser?.nom_complet ?? 'Coursier');

    // Chercher une conversation existante pour cette demande
    const { data: convExist } = await supabase
      .from('conversations')
      .select('id_conversation')
      .eq('id_demande', idDemande)
      .single();

    let convId: number;

    if (convExist) {
      convId = convExist.id_conversation;
    } else {
      // Créer une nouvelle conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          id_demande:  idDemande,
          id_client:   uid,
          id_coursier: course.id_livreur,
          statut_conversation: 'active',
        })
        .select()
        .single();

      if (convError || !newConv) {
        Alert.alert('Erreur', 'Impossible de créer la conversation.');
        router.back();
        return;
      }
      convId = newConv.id_conversation;
    }

    setIdConversation(convId);
    await loadMessages(convId);
    subscribeToMessages(convId);
  };

  // ── Charger les messages ─────────────────────────────────
  const loadMessages = async (convId: number) => {
    const { data } = await supabase
      .from('messages')
      .select('id_message, id_expediteur, contenu, type_message, lu, date_envoi')
      .eq('id_conversation', convId)
      .order('date_envoi', { ascending: true });

    setMessages(data ?? []);

    // Marquer les messages reçus comme lus
    if (userId) {
      await supabase
        .from('messages')
        .update({ lu: true })
        .eq('id_conversation', convId)
        .neq('id_expediteur', userId)
        .eq('lu', false);
    }
  };

  // ── Realtime messages ────────────────────────────────────
  const subscribeToMessages = (convId: number) => {
    channelRef.current = supabase
      .channel(`chat-${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `id_conversation=eq.${convId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          // Éviter les doublons
          if (prev.some(m => m.id_message === newMsg.id_message)) return prev;
          return [...prev, newMsg];
        });
        // Marquer comme lu si c'est un message reçu
        if (userId && newMsg.id_expediteur !== userId) {
          supabase.from('messages')
            .update({ lu: true })
            .eq('id_message', newMsg.id_message);
        }
        // Scroll vers le bas
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
  };

  // ── Envoyer un message ───────────────────────────────────
  const envoyerMessage = async () => {
    const texte = newMessage.trim();
    if (!texte || !idConversation || !userId || sending) return;

    setSending(true);
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        id_conversation: idConversation,
        id_expediteur:   userId,
        contenu:         texte,
        type_message:    'texte',
        lu:              false,
      });

    if (error) {
      console.error('Erreur envoi:', error);
      setNewMessage(texte); // restaurer le texte si erreur
    }

    setSending(false);
  };

  // ── Formatage heure ──────────────────────────────────────
  const formatHeure = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
  };

  // ── Grouper par date ─────────────────────────────────────
  const messagesAvecDates = () => {
    const result: (Message | { type: 'date'; date: string })[] = [];
    let lastDate = '';
    messages.forEach(m => {
      const dateStr = formatDate(m.date_envoi);
      if (dateStr !== lastDate) {
        result.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
      }
      result.push(m);
    });
    return result;
  };

  // ── RENDER ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="bicycle" size={16} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{nomCoursier}</Text>
            <Text style={styles.headerSub}>Votre coursier · Commande #{id_demande}</Text>
          </View>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messagesAvecDates()}
        keyExtractor={(item, index) =>
          'type' in item ? `date-${index}` : item.id_message.toString()
        }
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Démarrez la conversation avec votre coursier</Text>
          </View>
        }
        renderItem={({ item }) => {
          // Séparateur de date
          if ('type' in item && item.type === 'date') {
            return (
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>{item.date}</Text>
              </View>
            );
          }

          const msg = item as Message;
          const isMine = msg.id_expediteur === userId;

          return (
            <View style={[styles.messageWrapper, isMine ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
              {!isMine && (
                <View style={styles.senderAvatar}>
                  <Ionicons name="bicycle" size={14} color={Colors.primary} />
                </View>
              )}
              <View style={[styles.messageBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
                  {msg.contenu}
                </Text>
                <View style={styles.messageMeta}>
                  <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeTheirs]}>
                    {formatHeure(msg.date_envoi)}
                  </Text>
                  {isMine && (
                    <Ionicons
                      name={msg.lu ? 'checkmark-done' : 'checkmark'}
                      size={12}
                      color={msg.lu ? Colors.primary : 'rgba(255,255,255,0.6)'}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Votre message..."
          placeholderTextColor={Colors.textLight}
          multiline
          maxLength={500}
          onSubmitEditing={envoyerMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
          onPress={envoyerMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Ionicons name="send" size={18} color={Colors.white} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...Shadows.sm,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, marginLeft: Spacing.sm },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:    { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  // Messages
  messagesList: { padding: Spacing.base, paddingBottom: Spacing.md },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText:    { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  dateSeparator: { alignItems: 'center', marginVertical: Spacing.md },
  dateSeparatorText: {
    fontFamily: FontFamily.medium, fontSize: FontSize.xs,
    color: Colors.textLight, backgroundColor: Colors.surfaceGray,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full,
  },

  messageWrapper:      { flexDirection: 'row', marginBottom: Spacing.sm, alignItems: 'flex-end' },
  messageWrapperRight: { justifyContent: 'flex-end' },
  messageWrapperLeft:  { justifyContent: 'flex-start', gap: 6 },

  senderAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  messageBubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine:   { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadows.sm },

  messageText:       { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: 20 },
  messageTextMine:   { color: Colors.white },
  messageTextTheirs: { color: Colors.textPrimary },

  messageMeta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
  messageTime:       { fontFamily: FontFamily.regular, fontSize: 10 },
  messageTimeMine:   { color: 'rgba(255,255,255,0.7)' },
  messageTimeTheirs: { color: Colors.textLight },

  // Input
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.base, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceGray, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
    fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.primaryLight },
});