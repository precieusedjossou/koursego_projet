// app/coursier/profil.tsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';

export default function ProfilCoursierScreen() {
  const router = useRouter();
  const [disponible, setDisponible] = React.useState(true);
  const [showSupport, setShowSupport] = React.useState(false);
  const [sujet, setSujet] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loadingSupport, setLoadingSupport] = React.useState(false);

  const handleSwitchToClient = () => {
    Alert.alert(
      'Passer en mode Client',
      'Vous allez basculer vers votre espace client. Vos infos coursier sont sauvegardées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Basculer', onPress: () => router.replace('/client/home') },
      ]
    );
  };

  const handleEnvoyerSupport = () => {
    if (!sujet.trim()) { Alert.alert('Champ manquant', 'Veuillez entrer un sujet'); return; }
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

  const menuItems = [
    { icon: 'person-outline', label: 'Informations personnelles', onPress: () => {} },
    { icon: 'card-outline', label: "Documents d'identité", onPress: () => {} },
    { icon: 'bicycle-outline', label: 'Passer en mode Client', onPress: handleSwitchToClient },
    { icon: 'help-circle-outline', label: 'Aide & Support', onPress: () => setShowSupport(true) },
    {
      icon: 'log-out-outline', label: 'Se déconnecter', danger: true,
      onPress: () => Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
        { text: 'Annuler' },
        { text: 'Déconnecter', style: 'destructive', onPress: () => router.replace('/auth/login') },
      ]),
    },
  ];

  const SUJETS = ['Problème technique', 'Litige course', 'Paiement', 'Compte suspendu', 'Autre'];

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
          <Text style={styles.userSub}>Coursier validé · Cotonou, Bénin</Text>
          <View style={styles.dispoRow}>
            <View style={[styles.dispoDot, disponible ? styles.dispoOn : styles.dispoOff]} />
            <Text style={styles.dispoText}>{disponible ? 'Disponible' : 'Hors ligne'}</Text>
            <Switch
              value={disponible}
              onValueChange={setDisponible}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={disponible ? Colors.primary : Colors.white}
              style={{ marginLeft: Spacing.md }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>4.8</Text>
            <Ionicons name="star" size={14} color={Colors.primary} />
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>1 248</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>45 250</Text>
            <Text style={styles.statLabel}>FCFA ce mois</Text>
          </View>
        </View>

        {/* Avis récents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DERNIERS AVIS</Text>
          <View style={styles.avisCard}>
            {[
              { client: 'Super Beco SN', note: 5, commentaire: 'Très rapide et professionnel !' },
              { client: 'Yaovi M.', note: 4, commentaire: 'Bonne prestation, merci.' },
            ].map((avis, i) => (
              <View key={i} style={[styles.avisRow, i > 0 && styles.avisRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.avisClient}>{avis.client}</Text>
                  <Text style={styles.avisComm}>{avis.commentaire}</Text>
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={12} color={s <= avis.note ? Colors.primary : Colors.border} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOCUMENTS</Text>
          <View style={styles.docCard}>
            {[
              { label: 'Carte CIP', statut: 'Validé', icon: 'card-outline' },
              { label: 'Photo selfie', statut: 'Validé', icon: 'camera-outline' },
            ].map((doc, i) => (
              <View key={i} style={[styles.docRow, i > 0 && styles.docRowBorder]}>
                <Ionicons name={doc.icon as any} size={18} color={Colors.textSecondary} />
                <Text style={styles.docLabel}>{doc.label}</Text>
                <View style={styles.valide}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.valideText}>{doc.statut}</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.voirDoc}>Voir</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i > 0 && styles.menuItemBorder]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon as any} size={20} color={item.danger ? Colors.error : Colors.textSecondary} />
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
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
  userSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  dispoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: Spacing.md, backgroundColor: Colors.surfaceGray,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  dispoDot: { width: 10, height: 10, borderRadius: 5 },
  dispoOn: { backgroundColor: Colors.success },
  dispoOff: { backgroundColor: Colors.error },
  dispoText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    marginHorizontal: Spacing['2xl'], marginTop: Spacing.base,
    borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statVal: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing['2xl'], marginTop: Spacing.xl },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.xs,
    color: Colors.textLight, letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  avisCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  avisRow: { padding: Spacing.base, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  avisRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  avisClient: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  avisComm: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },
  docCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  docRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  docLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  valide: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valideText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.success },
  voirDoc: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
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