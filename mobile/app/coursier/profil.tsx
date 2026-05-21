// app/coursier/profil.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

// ── Types ────────────────────────────────────────────────────
interface ProfilCoursier {
  nom_complet: string;
  email: string;
  telephone: string;
  statut_validation: string;
  disponibilite: boolean;
  note_moyenne: number;
  nombre_courses: number;
  type_document: string | null;
  photo_document: string | null;
  photo_selfie: string | null;
}

interface AvisRecent {
  id_avis: number;
  note: number;
  commentaire: string | null;
  date_avis: string;
  nom_client: string;
}

interface StatsCoursier {
  gains_mois: number;
}

export default function ProfilCoursierScreen() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────
  const [profil, setProfil]             = useState<ProfilCoursier | null>(null);
  const [avis, setAvis]                 = useState<AvisRecent[]>([]);
  const [stats, setStats]               = useState<StatsCoursier>({ gains_mois: 0 });
  const [disponible, setDisponible]     = useState(false);
  const [loading, setLoading]           = useState(true);
  const [togglingDispo, setTogglingDispo] = useState(false);
  const [userId, setUserId]             = useState<string | null>(null);

  // ── Chargement ───────────────────────────────────────────
  useEffect(() => {
    loadProfil();
  }, []);

  const loadProfil = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    await Promise.all([
      loadInfosProfil(user.id),
      loadAvis(user.id),
      loadStatsMois(user.id),
    ]);
    setLoading(false);
  };

  // ── Infos profil ─────────────────────────────────────────
  const loadInfosProfil = async (uid: string) => {
    // Infos utilisateur
    const { data: userData } = await supabase
      .from('utilisateurs')
      .select('nom_complet, email, telephone')
      .eq('id', uid)
      .single();

    // Infos livreur
    const { data: livreurData } = await supabase
      .from('livreurs')
      .select('statut_validation, disponibilite, note_moyenne, nombre_courses, type_document, photo_document, photo_selfie')
      .eq('id_utilisateur', uid)
      .single();

    if (userData && livreurData) {
      const p: ProfilCoursier = {
        nom_complet:       userData.nom_complet ?? '',
        email:             userData.email ?? '',
        telephone:         userData.telephone ?? '',
        statut_validation: livreurData.statut_validation ?? '',
        disponibilite:     livreurData.disponibilite ?? false,
        note_moyenne:      Number(livreurData.note_moyenne) || 0,
        nombre_courses:    livreurData.nombre_courses ?? 0,
        type_document:     livreurData.type_document ?? null,
        photo_document:    livreurData.photo_document ?? null,
        photo_selfie:      livreurData.photo_selfie ?? null,
      };
      setProfil(p);
      setDisponible(p.disponibilite);
    }
  };

  // ── Avis récents ─────────────────────────────────────────
  const loadAvis = async (uid: string) => {
    // Récupérer les avis du coursier
    const { data: avisData } = await supabase
      .from('avis')
      .select('id_avis, note, commentaire, date_avis, id_client')
      .eq('id_coursier', uid)
      .order('date_avis', { ascending: false })
      .limit(5);

    if (!avisData || avisData.length === 0) return;

    // Récupérer les noms des clients
    const clientIds = avisData.map(a => a.id_client).filter(Boolean);
    let clientsMap: Record<string, string> = {};

    if (clientIds.length > 0) {
      const { data: clientsData } = await supabase
        .from('utilisateurs')
        .select('id, nom_complet')
        .in('id', clientIds);
      (clientsData ?? []).forEach(c => { clientsMap[c.id] = c.nom_complet; });
    }

    const mapped: AvisRecent[] = avisData.map(a => ({
      id_avis:    a.id_avis,
      note:       a.note,
      commentaire: a.commentaire,
      date_avis:  a.date_avis,
      nom_client: clientsMap[a.id_client] ?? 'Client',
    }));

    setAvis(mapped);
  };

  // ── Gains du mois ────────────────────────────────────────
  const loadStatsMois = async (uid: string) => {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    // Courses livrées ce mois
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id_demande')
      .eq('id_livreur', uid)
      .eq('statut_course', 'livree')
      .gte('created_at', debutMois.toISOString());

    if (!coursesData || coursesData.length === 0) return;

    const demandeIds = coursesData.map(c => c.id_demande).filter(Boolean);
    if (demandeIds.length === 0) return;

    const { data: demandesData } = await supabase
      .from('demande_courses')
      .select('commission_coursier')
      .in('id_demande', demandeIds);

    const gainsMois = (demandesData ?? []).reduce(
      (sum, d) => sum + (Number(d.commission_coursier) || 0), 0
    );

    setStats({ gains_mois: gainsMois });
  };

  // ── Toggle disponibilité ─────────────────────────────────
  const toggleDisponibilite = async (val: boolean) => {
    if (!userId || togglingDispo) return;
    setTogglingDispo(true);
    setDisponible(val); // optimistic

    const { error } = await supabase
      .from('livreurs')
      .update({ disponibilite: val })
      .eq('id_utilisateur', userId);

    if (error) {
      setDisponible(!val); // rollback
      console.error('Erreur toggle dispo:', error);
    }
    setTogglingDispo(false);
  };

  // ── Basculer en mode client ──────────────────────────────
  const handleSwitchToClient = () => {
    Alert.alert(
      'Passer en mode Client',
      'Vous allez basculer vers votre espace client. Vos infos coursier sont sauvegardées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Basculer',
          onPress: async () => {
            await supabase
              .from('utilisateurs')
              .update({ mode_actuel: 'client' })
              .eq('id', userId);
            router.replace('/client/home');
          },
        },
      ]
    );
  };

  // ── Déconnexion ──────────────────────────────────────────
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

  const menuItems = [
    { icon: 'person-outline',      label: 'Informations personnelles', onPress: () => {} },
    { icon: 'card-outline',        label: "Documents d'identité",       onPress: () => {} },
    { icon: 'bicycle-outline',     label: 'Passer en mode Client',      onPress: handleSwitchToClient },
    { icon: 'help-circle-outline', label: 'Aide & Support',             onPress: () => {} },
    { icon: 'log-out-outline',     label: 'Se déconnecter', danger: true, onPress: handleDeconnexion },
  ];

  // ── RENDER ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
          <Text style={styles.userName}>{profil?.nom_complet || '—'}</Text>
          <Text style={styles.userSub}>
            {profil?.statut_validation === 'approuve' ? 'Coursier validé' : 'En attente de validation'} · Cotonou, Bénin
          </Text>

          {/* Disponibilité */}
          <View style={styles.dispoRow}>
            <View style={[styles.dispoDot, disponible ? styles.dispoOn : styles.dispoOff]} />
            <Text style={styles.dispoText}>{disponible ? 'Disponible' : 'Hors ligne'}</Text>
            <Switch
              value={disponible}
              onValueChange={toggleDisponibilite}
              disabled={togglingDispo}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={disponible ? Colors.primary : Colors.white}
              style={{ marginLeft: Spacing.md }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>
              {profil?.note_moyenne ? profil.note_moyenne.toFixed(1) : '—'}
            </Text>
            <Ionicons name="star" size={14} color={Colors.primary} />
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{profil?.nombre_courses ?? 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.gains_mois.toLocaleString('fr-FR')}</Text>
            <Text style={styles.statLabel}>FCFA ce mois</Text>
          </View>
        </View>

        {/* Avis récents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DERNIERS AVIS</Text>
          {avis.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun avis pour l'instant</Text>
            </View>
          ) : (
            <View style={styles.avisCard}>
              {avis.map((a, i) => (
                <View key={a.id_avis} style={[styles.avisRow, i > 0 && styles.avisRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.avisClient}>{a.nom_client}</Text>
                    <Text style={styles.avisComm}>{a.commentaire || 'Aucun commentaire'}</Text>
                  </View>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={12}
                        color={s <= a.note ? Colors.primary : Colors.border} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOCUMENTS</Text>
          <View style={styles.docCard}>
            {[
              { label: profil?.type_document ?? 'Document identité', url: profil?.photo_document, icon: 'card-outline' },
              { label: 'Photo selfie',  url: profil?.photo_selfie,   icon: 'camera-outline' },
            ].map((doc, i) => (
              <View key={i} style={[styles.docRow, i > 0 && styles.docRowBorder]}>
                <Ionicons name={doc.icon as any} size={18} color={Colors.textSecondary} />
                <Text style={styles.docLabel}>{doc.label}</Text>
                {doc.url ? (
                  <View style={styles.valide}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={styles.valideText}>Validé</Text>
                  </View>
                ) : (
                  <View style={styles.valide}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={[styles.valideText, { color: Colors.textSecondary }]}>Non fourni</Text>
                  </View>
                )}
                {doc.url && (
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.voirDoc}>Voir</Text>
                  </TouchableOpacity>
                )}
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
                <Ionicons name={item.icon as any} size={20}
                  color={item.danger ? Colors.error : Colors.textSecondary} />
                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
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
  emptyCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', ...Shadows.sm,
  },
  emptyText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textLight },
  avisCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  avisRow: { padding: Spacing.base, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  avisRowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  avisClient: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  avisComm: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },
  docCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  docRowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  docLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  valide: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valideText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.success },
  voirDoc: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  menuCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  menuLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  menuLabelDanger: { color: Colors.error },
});