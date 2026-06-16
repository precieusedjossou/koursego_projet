// app/coursier/profil.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, Modal, TextInput, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

const SUJETS = ['Problème technique', 'Litige course', 'Paiement', 'Compte suspendu', 'Autre'];

export default function ProfilCoursierScreen() {
  const router = useRouter();

  const [disponible, setDisponible]         = useState(false);
  const [showSupport, setShowSupport]       = useState(false);
  const [sujet, setSujet]                   = useState('');
  const [message, setMessage]               = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Données réelles
  const [nomComplet, setNomComplet]       = useState('');
  const [email, setEmail]                 = useState('');
  const [telephone, setTelephone]         = useState('');
  const [photoProfil, setPhotoProfil]     = useState<string | null>(null);
  const [nbCourses, setNbCourses]         = useState(0);
  const [noteMoy, setNoteMoy]             = useState<number | null>(null);
  const [totalGains, setTotalGains]       = useState(0);
  const [membreSince, setMembreSince]     = useState('');
  const [statutValidation, setStatutValidation] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { fetchProfil(); }, []);

  const fetchProfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('nom_complet, email, telephone, photo_profil_url, date_inscription')
      .eq('id', user.id)
      .single();

    if (profil) {
      setNomComplet(profil.nom_complet || '');
      setEmail(profil.email || user.email || '');
      setTelephone(profil.telephone || '');
      setPhotoProfil(profil.photo_profil_url || null);
      if (profil.date_inscription) {
        const d = new Date(profil.date_inscription);
        setMembreSince(`Depuis ${d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`);
      }
    }

    const { data: coursier } = await supabase
      .from('coursier')
      .select('disponibilite, note_moyenne, nombre_courses, statut_validation')
      .eq('id', user.id)
      .single();

    if (coursier) {
      setDisponible(coursier.disponibilite || false);
      setNoteMoy(coursier.note_moyenne || null);
      setNbCourses(coursier.nombre_courses || 0);
      setStatutValidation(coursier.statut_validation || '');
    }

    // Total gains
    const { data: cmds } = await supabase
      .from('commande')
      .select('montant_course')
      .eq('id_coursier', user.id)
      .eq('statut_course', 'livree');
    if (cmds) setTotalGains(cmds.reduce((s, c) => s + (c.montant_course || 0), 0));
  };

  const toggleDisponibilite = async (val: boolean) => {
    setDisponible(val);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('coursier').update({ disponibilite: val }).eq('id', user.id);
  };

  // Changer photo de profil
  const handleChangerPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie dans les paramètres.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const uri      = result.assets[0].uri;
      const response = await fetch(uri);
      const blob     = await response.blob();
      const buffer   = await new Response(blob).arrayBuffer();
      const path     = `${user.id}/profil.jpg`;

      const { error } = await supabase.storage
        .from('documents-kyc')
        .upload(path, buffer, { contentType: 'image/jpeg', upsert: true });

      if (!error) {
        const { data } = supabase.storage.from('documents-kyc').getPublicUrl(path);
        setPhotoProfil(data.publicUrl);
        await supabase.from('utilisateurs')
          .update({ photo_profil_url: data.publicUrl })
          .eq('id', user.id);
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible de mettre à jour la photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSwitchToClient = async () => {
    Alert.alert(
      'Passer en mode Client',
      'Vous allez basculer vers votre espace client. Vos infos coursier sont sauvegardées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Basculer',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('utilisateurs').update({ mode: 'client' }).eq('id', user.id);
            router.replace('/client/home');
          },
        },
      ]
    );
  };

  const handleDeconnexion = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleEnvoyerSupport = () => {
    if (!sujet.trim())   { Alert.alert('Champ manquant', 'Veuillez entrer un sujet'); return; }
    if (!message.trim()) { Alert.alert('Champ manquant', 'Veuillez écrire votre message'); return; }
    setLoadingSupport(true);
    setTimeout(() => {
      setLoadingSupport(false);
      setShowSupport(false);
      setSujet(''); setMessage('');
      Alert.alert('Message envoyé ✅', "L'équipe KourseGO vous répondra dans les plus brefs délais.");
    }, 1500);
  };

  const menuItems = [
    { icon: 'person-outline',       label: 'Informations personnelles', onPress: () => {} },
    { icon: 'card-outline',         label: "Documents d'identité",      onPress: () => {} },
    { icon: 'bicycle-outline',      label: 'Passer en mode Client',     onPress: handleSwitchToClient },
    { icon: 'help-circle-outline',  label: 'Aide & Support',            onPress: () => setShowSupport(true) },
    { icon: 'log-out-outline',      label: 'Se déconnecter',            onPress: handleDeconnexion, danger: true },
  ];

  const statutLabel: Record<string, { label: string; color: string }> = {
    approuve:   { label: 'Coursier validé ✓',     color: Colors.success },
    en_attente: { label: 'Validation en cours...',  color: Colors.warning },
    rejete:     { label: 'Dossier rejeté',          color: Colors.error },
  };
  const statut = statutLabel[statutValidation] || { label: 'Cotonou, Bénin', color: Colors.textSecondary };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={handleChangerPhoto} disabled={uploadingPhoto}>
              {photoProfil ? (
                <Image source={{ uri: photoProfil }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color={Colors.primary} />
                </View>
              )}
              <View style={styles.editAvatarBtn}>
                <Ionicons name={uploadingPhoto ? "hourglass-outline" : "camera-outline"} size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{nomComplet || 'Coursier'}</Text>
          <Text style={[styles.userSub, { color: statut.color }]}>{statut.label}</Text>
          <Text style={styles.membreSince}>{membreSince}</Text>
          <View style={styles.dispoRow}>
            <View style={[styles.dispoDot, disponible ? styles.dispoOn : styles.dispoOff]} />
            <Text style={styles.dispoText}>{disponible ? 'Disponible' : 'Hors ligne'}</Text>
            <Switch
              value={disponible}
              onValueChange={toggleDisponibilite}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={disponible ? Colors.primary : Colors.white}
              style={{ marginLeft: Spacing.md }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{noteMoy?.toFixed(1) ?? '—'}</Text>
            <Ionicons name="star" size={14} color={Colors.primary} />
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{nbCourses}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{totalGains.toLocaleString()}</Text>
            <Text style={styles.statLabel}>FCFA gagnés</Text>
          </View>
        </View>

        {/* Infos personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
          <View style={styles.infoCard}>
            {[
              { icon: 'person-outline', val: nomComplet  || '—' },
              { icon: 'mail-outline',   val: email       || '—' },
              { icon: 'call-outline',   val: telephone   || '—' },
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

      {/* Modal Support */}
      <Modal visible={showSupport} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSupport(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Ionicons name="headset-outline" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Contacter l'équipe</Text>
            </View>
            <Text style={styles.modalSub}>Décrivez votre problème, nous vous répondrons rapidement.</Text>
            <Text style={styles.inputLabel}>Sujet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              {SUJETS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sujetChip, sujet === s && styles.sujetChipActive]}
                  onPress={() => setSujet(s)}
                >
                  <Text style={[styles.sujetChipText, sujet === s && styles.sujetChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Expliquez votre problème..."
              placeholderTextColor={Colors.textLight}
              value={message}
              onChangeText={setMessage}
              multiline numberOfLines={5} textAlignVertical="top"
            />
            <Button title="Envoyer le message" onPress={handleEnvoyerSupport} loading={loadingSupport} style={{ marginTop: Spacing.lg }} />
            <View style={{ height: 16 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  profileHeader:      { backgroundColor: Colors.white, alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarWrapper:      { position: 'relative', marginBottom: Spacing.md },
  avatar:             { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primary },
  avatarImg:          { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.primary },
  editAvatarBtn:      { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  userName:           { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  userSub:            { fontFamily: FontFamily.medium, fontSize: FontSize.base, marginTop: 2 },
  membreSince:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  dispoRow:           { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  dispoDot:           { width: 10, height: 10, borderRadius: 5 },
  dispoOn:            { backgroundColor: Colors.success },
  dispoOff:           { backgroundColor: Colors.error },
  dispoText:          { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 6 },
  statsRow:           { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing['2xl'], marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  statCard:           { flex: 1, alignItems: 'center', gap: 2 },
  statDivider:        { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statVal:            { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary },
  statLabel:          { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  section:            { paddingHorizontal: Spacing['2xl'], marginTop: Spacing.xl },
  sectionTitle:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textLight, letterSpacing: 0.8, marginBottom: Spacing.sm },
  infoCard:           { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  infoRow:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  infoRowBorder:      { borderTopWidth: 1, borderTopColor: Colors.border },
  infoVal:            { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  menuCard:           { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  menuItem:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  menuItemBorder:     { borderTopWidth: 1, borderTopColor: Colors.border },
  menuLabel:          { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  menuLabelDanger:    { color: Colors.error },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing['2xl'], paddingTop: Spacing.md },
  modalHandle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.xl },
  modalTitleRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  modalTitle:         { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  modalSub:           { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  inputLabel:         { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  sujetChip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.white },
  sujetChipActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sujetChipText:      { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  sujetChipTextActive:{ color: Colors.white },
  messageInput:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.base, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, height: 120, backgroundColor: Colors.surfaceGray },
});