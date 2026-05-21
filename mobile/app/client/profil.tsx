// app/client/profil.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

interface Profil {
  nom_complet: string;
  email: string;
  telephone: string;
  date_inscription: string;
  mode_actuel: string;
}

interface Stats {
  nb_courses: number;
  total_depense: number;
}

export default function ProfilClientScreen() {
  const router = useRouter();
  const [profil, setProfil]       = useState<Profil | null>(null);
  const [stats, setStats]         = useState<Stats>({ nb_courses: 0, total_depense: 0 });
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [isCoursier, setIsCoursier] = useState(false);

  // ── Charger le profil depuis Supabase ────────────────────────
  useEffect(() => {
    loadProfil();
  }, []);

  const loadProfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }

      // Récupérer les infos du profil
      const { data: profilData } = await supabase
        .from('utilisateurs')
        .select('nom_complet, email, telephone, date_inscription, mode_actuel')
        .eq('id', user.id)
        .single();

      if (profilData) {
        setProfil(profilData);
        setIsCoursier(profilData.mode_actuel === 'coursier');
      }

      // Récupérer les stats (nombre de courses + total dépensé)
      const { data: coursesData } = await supabase
        .from('demande_courses')
        .select('id_demande')
        .eq('id_client', user.id)
        .eq('statut_demande', 'livree');

      const { data: paiementsData } = await supabase
        .from('paiements')
        .select('montant_total')
        .eq('statut_paiement', 'confirme');

      const totalDepense = paiementsData?.reduce(
        (sum, p) => sum + (p.montant_total || 0), 0
      ) ?? 0;

      setStats({
        nb_courses: coursesData?.length ?? 0,
        total_depense: totalDepense,
      });

    } catch (err) {
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoadingProfil(false);
    }
  };

  // ── Switch client ↔ coursier ─────────────────────────────────
  const handleRoleSwitch = async (val: boolean) => {
    if (!val) return;

    Alert.alert(
      'Passer en mode Coursier',
      'Vous allez basculer vers votre espace coursier.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Basculer',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Vérifier si KYC complété
            const { data: livreur } = await supabase
              .from('livreurs')
              .select('statut_validation')
              .eq('id_utilisateur', user.id)
              .single();

            if (!livreur) {
              // KYC pas encore fait
              router.push('/auth/kyc-coursier');
              return;
            }

            if (livreur.statut_validation === 'en_attente') {
              Alert.alert(
                'En attente de validation',
                'Votre dossier est en cours de vérification. Vous serez notifié dès validation.'
              );
              return;
            }

            if (livreur.statut_validation === 'rejete') {
              Alert.alert(
                'Dossier rejeté',
                'Votre dossier a été rejeté. Contactez le support.'
              );
              return;
            }

            // Approuvé → basculer
            await supabase
              .from('utilisateurs')
              .update({ mode_actuel: 'coursier' })
              .eq('id', user.id);

            setIsCoursier(true);
            router.replace('/coursier/dashboard');
          },
        },
      ]
    );
  };

  // ── Déconnexion ──────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  // ── Format date ──────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  if (loadingProfil) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const menuItems = [
    { icon: 'person-outline',      label: 'Informations personnelles', onPress: () => {} },
    { icon: 'lock-closed-outline', label: 'Paramètres de notification', onPress: () => {} },
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
    { icon: 'star-outline',         label: 'Mes avis donnés',   onPress: () => {} },
    { icon: 'help-circle-outline',  label: 'Aide & Support',    onPress: () => {} },
    { icon: 'log-out-outline',      label: 'Se déconnecter',    onPress: handleLogout, danger: true },
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
          <Text style={styles.userName}>{profil?.nom_complet || 'Utilisateur'}</Text>
          <Text style={styles.userRole}>
            {isCoursier ? 'Coursier' : 'Client'} · Cotonou, Bénin
          </Text>
          <Text style={styles.userSince}>
            Membre depuis {profil?.date_inscription ? formatDate(profil.date_inscription) : '—'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.nb_courses}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>—</Text>
            <Text style={styles.statLabel}>Ma note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {stats.total_depense > 0
                ? `${stats.total_depense.toLocaleString('fr-FR')}`
                : '0'}
            </Text>
            <Text style={styles.statLabel}>FCFA dépensé</Text>
          </View>
        </View>

        {/* Infos personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
          <View style={styles.infoCard}>
            {[
              { icon: 'person-outline', val: profil?.nom_complet || '—' },
              { icon: 'mail-outline',   val: profil?.email       || '—' },
              { icon: 'call-outline',   val: profil?.telephone   || '—' },
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
                  name={item.icon as any} size={20}
                  color={(item as any).danger ? Colors.error : Colors.textSecondary}
                />
                <Text style={[styles.menuLabel, (item as any).danger && styles.menuLabelDanger]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  profileHeader:    { backgroundColor: Colors.white, alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatarWrapper:    { position: 'relative', marginBottom: Spacing.md },
  avatar:           { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primary },
  editAvatarBtn:    { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  userName:         { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  userRole:         { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 2 },
  userSince:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  statsRow:         { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing['2xl'], marginTop: Spacing.base, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  statCard:         { flex: 1, alignItems: 'center' },
  statDivider:      { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statVal:          { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary },
  statLabel:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section:          { paddingHorizontal: Spacing['2xl'], marginTop: Spacing.xl },
  sectionTitle:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textLight, letterSpacing: 0.8, marginBottom: Spacing.sm },
  infoCard:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  infoRow:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  infoRowBorder:    { borderTopWidth: 1, borderTopColor: Colors.divider },
  infoVal:          { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  menuCard:         { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  menuItem:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  menuItemBorder:   { borderTopWidth: 1, borderTopColor: Colors.divider },
  menuLabel:        { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  menuLabelDanger:  { color: Colors.error },
});