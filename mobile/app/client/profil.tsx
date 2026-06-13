// app/client/profil.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightEl?: React.ReactNode;
}

const SUJETS = ['Problème technique', 'Litige course', 'Paiement', 'Coursier introuvable', 'Autre'];

export default function ProfilClientScreen() {
  const router = useRouter();
  const [isCoursier, setIsCoursier] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  const handleRoleSwitch = (val: boolean) => {
    if (val) {
      Alert.alert(
        'Passer en mode Coursier',
        'Vous allez basculer vers votre espace coursier. Vos infos client sont sauvegardées.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Basculer',
            onPress: () => {
              setIsCoursier(true);
              router.replace('/coursier/dashboard');
            },
          },
        ]
      );
    }
  };

  const handleEnvoyerSupport = () => {
    if (!sujet.trim()) { Alert.alert('Champ manquant', 'Veuillez choisir un sujet'); return; }
    if (!message.trim()) { Alert.alert('Champ manquant', 'Veuillez écrire votre message'); return; }
    setLoadingSupport(true);
    setTimeout(() => {
      setLoadingSupport(false);
      setShowSupport(false);
      setSujet('');
      setMessage('');
      Alert.alert('Message envoyé ✅', "L'équipe KourseGO vous répondra dans les plus brefs délais.");
    }, 1500);
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Informations personnelles',
      onPress: () => {},
    },
    {
      icon: 'lock-closed-outline',
      label: 'Paramètres de notification',
      onPress: () => {},
    },
    {
      icon: 'bicycle-outline',
      label: 'Passer en mode Coursier',
      onPress: () => handleRoleSwitch(true),
      rightEl: (
        <Switch
          value={isCoursier}
          onValueChange={handleRoleSwitch}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={isCoursier ? Colors.primary : Colors.white}
        />
      ),
    },
    {
      icon: 'star-outline',
      label: 'Mes avis donnés',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      label: 'Aide & Support',
      onPress: () => setShowSupport(true),
    },
    {
      icon: 'log-out-outline',
      label: 'Se déconnecter',
      onPress: () => {
        Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
          { text: 'Annuler' },
          { text: 'Déconnecter', style: 'destructive', onPress: () => router.replace('/auth/login') },
        ]);
      },
      danger: true,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera-outline" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>Jean Dupont</Text>
          <Text style={styles.userRole}>Client · Cotonou, Bénin</Text>
          <Text style={styles.userSince}>Membre depuis Jan 2025</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>12</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>4.9</Text>
            <Text style={styles.statLabel}>Ma note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>89 500</Text>
            <Text style={styles.statLabel}>FCFA dépensé</Text>
          </View>
        </View>

        {/* Infos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
          <View style={styles.infoCard}>
            {[
              { icon: 'person-outline', val: 'Jean Dupont' },
              { icon: 'mail-outline', val: 'jean.dupont@gmail.com' },
              { icon: 'call-outline', val: '+229 97 63 24 78' },
            ].map((item, i) => (
              <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                <Ionicons name={item.icon as any} size={18} color={Colors.textSecondary} />
                <Text style={styles.infoVal}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE & RÉGLAGES</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i > 0 && styles.menuItemBorder]}
                onPress={item.rightEl ? undefined : item.onPress}
                activeOpacity={item.rightEl ? 1 : 0.7}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.danger ? Colors.error : Colors.textSecondary}
                />
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                  {item.label}
                </Text>
                {item.rightEl ?? (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL SUPPORT ── */}
      <Modal visible={showSupport} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSupport(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalTitleRow}>
              <Ionicons name="headset-outline" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Contacter l'équipe</Text>
            </View>
            <Text style={styles.modalSub}>
              Décrivez votre problème, nous vous répondrons rapidement.
            </Text>

            {/* Sujets rapides */}
            <Text style={styles.inputLabel}>Sujet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sujetsScroll}>
              {SUJETS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sujetChip, sujet === s && styles.sujetChipActive]}
                  onPress={() => setSujet(s)}
                >
                  <Text style={[styles.sujetChipText, sujet === s && styles.sujetChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Message */}
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Expliquez votre problème en détail..."
              placeholderTextColor={Colors.textLight}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Button
              title="Envoyer le message"
              onPress={handleEnvoyerSupport}
              loading={loadingSupport}
              style={{ marginTop: Spacing.lg }}
            />
            <View style={{ height: 16 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileHeader: {
    backgroundColor: Colors.white, alignItems: 'center',
    paddingTop: 60, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.primary,
  },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  userName: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  userRole: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 2 },
  userSince: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: Spacing['2xl'], marginTop: Spacing.base,
    borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statVal: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: Spacing['2xl'], marginTop: Spacing.xl },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.xs,
    color: Colors.textLight, letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  infoCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  infoVal: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  menuCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  menuLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  menuLabelDanger: { color: Colors.error },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing['2xl'], paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.xl,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  modalSub: {
    fontFamily: FontFamily.regular, fontSize: FontSize.sm,
    color: Colors.textSecondary, marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: FontFamily.medium, fontSize: FontSize.sm,
    color: Colors.textSecondary, marginBottom: Spacing.sm,
  },
  sujetsScroll: { marginBottom: Spacing.lg },
  sujetChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, marginRight: 8,
    backgroundColor: Colors.white,
  },
  sujetChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sujetChipText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  sujetChipTextActive: { color: Colors.white },
  messageInput: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, padding: Spacing.base,
    fontFamily: FontFamily.regular, fontSize: FontSize.base,
    color: Colors.textPrimary, height: 120,
    backgroundColor: Colors.surfaceGray,
  },
});