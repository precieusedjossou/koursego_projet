// app/client/course/chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import { supabase } from '../../../lib/supabase';

interface Msg {
  id_message: number;
  id_conversation: number;
  id_expediteur: string;
  contenu: string;
  lu: boolean;
  date_envoi: string;
}

export default function ChatScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams();

  const coursierNom = (params.coursierNom as string) || 'Coursier';
  const coursierTel = (params.coursierTel as string) || '';
  const commandeId  = (params.commandeId as string)  || '';

  const [messages, setMessages]             = useState<Msg[]>([]);
  const [text, setText]                     = useState('');
  const [loading, setLoading]               = useState(true);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [userId, setUserId]                 = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    initChat();
    return () => { supabase.removeAllChannels(); };
  }, []);

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Chercher conversation existante pour cette commande
    let { data: conv } = await supabase
      .from('conversation')
      .select('id_conversation')
      .eq('id_cours', parseInt(commandeId))
      .maybeSingle();

    // Créer si inexistante
    if (!conv) {
      const { data: commande } = await supabase
        .from('commande')
        .select('id_coursier, id_client')
        .eq('id_commande', parseInt(commandeId))
        .single();

      const { data: newConv } = await supabase
        .from('conversation')
        .insert({
          id_cours:            parseInt(commandeId),
          id_client:           commande?.id_client   || user.id,
          id_coursier:         commande?.id_coursier || '',
          statut_conversation: 'active',
        })
        .select('id_conversation')
        .single();
      conv = newConv;
    }

    if (!conv) { setLoading(false); return; }
    setConversationId(conv.id_conversation);

    // Charger les messages existants
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('id_conversation', conv.id_conversation)
      .order('date_envoi', { ascending: true });

    if (msgs) setMessages(msgs);
    setLoading(false);

    // Marquer comme lus
    await supabase
      .from('messages')
      .update({ lu: true })
      .eq('id_conversation', conv.id_conversation)
      .neq('id_expediteur', user.id);

    // Realtime nouveaux messages
    supabase
      .channel(`chat-${conv.id_conversation}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `id_conversation=eq.${conv.id_conversation}`,
      }, (payload) => {
        const newMsg = payload.new as Msg;
        setMessages((prev) => {
          if (prev.find((m) => m.id_message === newMsg.id_message)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        if (newMsg.id_expediteur !== user.id) {
          supabase.from('messages').update({ lu: true }).eq('id_message', newMsg.id_message);
        }
      })
      .subscribe();
  };

  const sendMessage = async () => {
    if (!text.trim() || !conversationId || !userId) return;
    const contenu = text.trim();
    setText('');
    await supabase.from('messages').insert({
      id_conversation: conversationId,
      id_expediteur:   userId,
      contenu,
      type_message:    'texte',
      lu:              false,
    });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMsg = ({ item }: { item: Msg }) => {
    const fromMe = item.id_expediteur === userId;
    const heure  = new Date(item.date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[styles.msgRow, fromMe && styles.msgRowMe]}>
        {!fromMe && (
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={14} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, fromMe && styles.bubbleTextMe]}>{item.contenu}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <Text style={[styles.time, fromMe && styles.timeMe]}>{heure}</Text>
            {fromMe && (
              <Ionicons
                name={item.lu ? 'checkmark-done' : 'checkmark'}
                size={12}
                color={item.lu ? '#93c5fd' : 'rgba(255,255,255,0.6)'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerName}>{coursierNom}</Text>
            <Text style={styles.headerSub}>Coursier · En ligne</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => coursierTel && Linking.openURL(`tel:${coursierTel}`)}
        >
          <Ionicons name="call-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id_message.toString()}
          renderItem={renderMsg}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
              <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted }}>
                Démarrez la conversation
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:         { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.base, backgroundColor: Colors.white, ...Shadows.sm },
  backBtn:        { padding: 4 },
  headerCenter:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginLeft: Spacing.sm },
  headerAvatar:   { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  headerName:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.success },
  callBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  listContent:    { padding: Spacing.base, gap: Spacing.sm },
  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: 4 },
  msgRowMe:       { flexDirection: 'row-reverse' },
  avatarSmall:    { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  bubble:         { maxWidth: '75%', padding: Spacing.md, borderRadius: BorderRadius.xl, gap: 4 },
  bubbleMe:       { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem:     { backgroundColor: Colors.white, borderBottomLeftRadius: 4, ...Shadows.sm },
  bubbleText:     { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMe:   { color: Colors.white },
  time:           { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'right' },
  timeMe:         { color: 'rgba(255,255,255,0.7)' },
  waBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: Spacing.base, marginTop: 0, padding: Spacing.sm, backgroundColor: '#E8F8F0', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: '#25D366' },
  waBtnText:      { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: '#25D366' },
  inputBar:       { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.base, paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.base, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  input:          { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary },
  sendBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: Colors.border },
});