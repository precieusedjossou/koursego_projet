// app/client/course/chat.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';

interface Msg { id: string; text: string; fromMe: boolean; time: string; }

const INITIAL: Msg[] = [
  { id: '1', text: 'Bonjour ! Je viens de prendre votre commande.', fromMe: false, time: '14:02' },
  { id: '2', text: 'Parfait ! Merci. Le riz est au fond du marché, stand 14.', fromMe: true, time: '14:03' },
  { id: '3', text: "D'accord, je trouve facilement. Je suis déjà sur place.", fromMe: false, time: '14:05' },
  { id: '4', text: 'Super ! Appelez-moi à l\'arrivée, porte bleue 🙏', fromMe: true, time: '14:06' },
];

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg: Msg = {
      id: Date.now().toString(),
      text: text.trim(),
      fromMe: true,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMsg = ({ item }: { item: Msg }) => (
    <View style={[styles.msgRow, item.fromMe && styles.msgRowMe]}>
      {!item.fromMe && (
        <View style={styles.avatarSmall}>
          <Ionicons name="person" size={14} color={Colors.primary} />
        </View>
      )}
      <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, item.fromMe && styles.bubbleTextMe]}>{item.text}</Text>
        <Text style={[styles.time, item.fromMe && styles.timeMe]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
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
            <Ionicons name="person" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerName}>Moussa Elabidi</Text>
            <Text style={styles.headerSub}>Coursier · En ligne</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Ionicons name="call-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* WhatsApp redirect */}
      <TouchableOpacity style={styles.waBtn}>
        <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
        <Text style={styles.waBtnText}>Continuer sur WhatsApp</Text>
      </TouchableOpacity>

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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white, ...Shadows.sm,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginLeft: Spacing.sm },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  headerName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.success },
  callBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  listContent: { padding: Spacing.base, gap: Spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: 4 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%', padding: Spacing.md,
    borderRadius: BorderRadius.xl, gap: 4,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4, ...Shadows.sm,
  },
  bubbleText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  time: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'right' },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    margin: Spacing.base, marginTop: 0, padding: Spacing.sm,
    backgroundColor: '#E8F8F0', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: '#25D366',
  },
  waBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: '#25D366' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.base, paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.base,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
