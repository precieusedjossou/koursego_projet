// app/coursier/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

// ── Types ────────────────────────────────────────────────────
interface CourseRecente {
  id_course: number;
  adresse_livraison: string;
  montant_total: number;
  statut_course: string;
  created_at: string;
}

interface StatsJour {
  nb_courses: number;
  gains: number;
  note_moyenne: number;
}

interface CourseEnCours {
  id_course: number;
  adresse_livraison: string;
  statut_course: string;
}

export default function CoursierDashboard() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────
  const [disponible, setDisponible]         = useState(false);
  const [nomCoursier, setNomCoursier]       = useState('');
  const [loading, setLoading]               = useState(true);
  const [stats, setStats]                   = useState<StatsJour>({ nb_courses: 0, gains: 0, note_moyenne: 0 });
  const [coursesRecentes, setCoursesRecentes] = useState<CourseRecente[]>([]);
  const [courseEnCours, setCourseEnCours]   = useState<CourseEnCours | null>(null);
  const [userId, setUserId]                 = useState<string | null>(null);
  const [togglingDispo, setTogglingDispo]   = useState(false);

  // ── Chargement initial ───────────────────────────────────
  useEffect(() => {
    loadAll();

    // Realtime : écouter les nouvelles courses assignées
    const channel = supabase
      .channel('coursier-courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadCourses();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfil(), loadCourses()]);
    setLoading(false);
  };

  // ── Charger le profil du coursier ───────────────────────
  const loadProfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Infos utilisateur
    const { data: userData } = await supabase
      .from('utilisateurs')
      .select('nom_complet')
      .eq('id', user.id)
      .single();

    if (userData) setNomCoursier(userData.nom_complet?.split(' ')[0] ?? '');

    // Disponibilité depuis livreurs
    const { data: livreurData } = await supabase
      .from('livreurs')
      .select('disponibilite, note_moyenne')
      .eq('id_utilisateur', user.id)
      .single();

    if (livreurData) {
      setDisponible(livreurData.disponibilite ?? false);
      setStats(prev => ({ ...prev, note_moyenne: Number(livreurData.note_moyenne) || 0 }));
    }
  };

  // ── Charger les courses ──────────────────────────────────
  const loadCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Toutes les courses du coursier
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id_course, statut_course, id_demande, created_at')
      .eq('id_livreur', user.id)
      .order('created_at', { ascending: false });

    if (!coursesData || coursesData.length === 0) return;

    // Course en cours
    const enCours = coursesData.find(c =>
      c.statut_course === 'en_cours' || c.statut_course === 'acceptee'
    );

    // IDs des demandes
    const demandeIds = coursesData.map(c => c.id_demande).filter(Boolean);

    // Récupérer les demandes liées
    const { data: demandesData } = await supabase
      .from('demande_courses')
      .select('id_demande, adresse_livraison, montant_articles, commission_coursier, part_plateforme')
      .in('id_demande', demandeIds);

    const demandesMap: Record<number, any> = {};
    (demandesData ?? []).forEach(d => { demandesMap[d.id_demande] = d; });

    // Course en cours avec adresse
    if (enCours) {
      const d = demandesMap[enCours.id_demande] ?? {};
      setCourseEnCours({
        id_course: enCours.id_course,
        adresse_livraison: d.adresse_livraison ?? '—',
        statut_course: enCours.statut_course,
      });
    } else {
      setCourseEnCours(null);
    }

    // Courses récentes (terminées)
    const terminees = coursesData
      .filter(c => c.statut_course === 'livree')
      .slice(0, 5)
      .map(c => {
        const d = demandesMap[c.id_demande] ?? {};
        return {
          id_course: c.id_course,
          adresse_livraison: d.adresse_livraison ?? '—',
          montant_total: (Number(d.montant_articles) || 0) + (Number(d.commission_coursier) || 0),
          statut_course: c.statut_course,
          created_at: c.created_at,
        };
      });
    setCoursesRecentes(terminees);

    // Stats du jour
    const coursesAujourdhui = coursesData.filter(c => {
      return new Date(c.created_at) >= today && c.statut_course === 'livree';
    });

    const gainsJour = coursesAujourdhui.reduce((sum, c) => {
      const d = demandesMap[c.id_demande] ?? {};
      return sum + (Number(d.commission_coursier) || 0);
    }, 0);

    setStats(prev => ({
      ...prev,
      nb_courses: coursesAujourdhui.length,
      gains: gainsJour,
    }));
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

  // ── Formatage ────────────────────────────────────────────
  const formatMontant = (n: number) =>
    `${n.toLocaleString('fr-FR')} FCFA`;

  const formatHeure = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return new Date(iso).toLocaleDateString('fr-FR');
  };

  // ── Jour de la semaine ───────────────────────────────────
  const jourTexte = () => {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois  = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const d = new Date();
    return `Cotonou · ${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]}`;
  };

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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {nomCoursier || 'Coursier'} 👋</Text>
          <Text style={styles.date}>{jourTexte()}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/coursier/profil')} style={styles.avatarBtn}>
          <Ionicons name="person" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Disponibilité */}
        <View style={styles.dispoCard}>
          <View style={styles.dispoLeft}>
            <View style={[styles.dispoDot, disponible ? styles.dispoOn : styles.dispoOff]} />
            <View>
              <Text style={styles.dispoTitle}>
                {disponible ? 'Vous êtes disponible' : 'Vous êtes hors ligne'}
              </Text>
              <Text style={styles.dispoSub}>
                {disponible ? 'Les annonces sont visibles' : 'Activez pour recevoir des courses'}
              </Text>
            </View>
          </View>
          <Switch
            value={disponible}
            onValueChange={toggleDisponibilite}
            disabled={togglingDispo}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={disponible ? Colors.primary : Colors.white}
          />
        </View>

        {/* Stats du jour */}
        <View style={styles.statsGrid}>
          {[
            { label: "Courses aujourd'hui", val: `${stats.nb_courses}`, icon: 'bicycle-outline' },
            { label: 'Gains du jour', val: stats.gains.toLocaleString('fr-FR'), icon: 'cash-outline', suffix: 'FCFA' },
            { label: 'Note moyenne', val: stats.note_moyenne > 0 ? stats.note_moyenne.toFixed(1) : '—', icon: 'star-outline' },
            { label: 'Total courses', val: `${coursesRecentes.length}`, icon: 'navigate-outline' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name={s.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statVal}>
                {s.val} <Text style={styles.statSuffix}>{s.suffix}</Text>
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Course en cours */}
        {courseEnCours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course en cours</Text>
            <TouchableOpacity
              style={styles.activeCard}
              onPress={() => router.push('/coursier/course/en-cours')}
            >
              <View style={styles.activePulse}>
                <Ionicons name="bicycle" size={24} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>Course #{courseEnCours.id_course}</Text>
                <Text style={styles.activeSub}>{courseEnCours.adresse_livraison}</Text>
                <View style={styles.activeProgress}>
                  <View style={[
                    styles.activeProgressBar,
                    { width: courseEnCours.statut_course === 'en_cours' ? '60%' : '20%' }
                  ]} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Courses récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses récentes</Text>
            <TouchableOpacity onPress={() => router.push('/coursier/gains')}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {coursesRecentes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bicycle-outline" size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>Aucune course terminée pour l'instant</Text>
            </View>
          ) : (
            coursesRecentes.map((c) => (
              <View key={c.id_course} style={styles.courseCard}>
                <View style={styles.courseIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseClient}>Course #{c.id_course}</Text>
                  <Text style={styles.courseAdresse}>{c.adresse_livraison}</Text>
                  <Text style={[styles.courseAdresse, { marginTop: 2 }]}>{formatHeure(c.created_at)}</Text>
                </View>
                <Text style={styles.courseMontant}>{formatMontant(c.montant_total)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Voir annonces */}
        <TouchableOpacity
          style={styles.annoncesBtn}
          onPress={() => router.push('/coursier/annonces')}
        >
          <Ionicons name="megaphone-outline" size={20} color={Colors.white} />
          <Text style={styles.annoncesBtnText}>Voir les nouvelles annonces</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base,
    backgroundColor: Colors.white,
  },
  greeting: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  dispoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: Spacing['2xl'], marginBottom: Spacing.base,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  dispoLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dispoDot: { width: 12, height: 12, borderRadius: 6 },
  dispoOn: { backgroundColor: Colors.success },
  dispoOff: { backgroundColor: Colors.error },
  dispoTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  dispoSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statVal: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  statSuffix: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.sm },
  voirTout: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.md,
  },
  activePulse: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  activeTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
  activeSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  activeProgress: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 8 },
  activeProgressBar: { height: '100%', backgroundColor: Colors.white, borderRadius: 2 },
  emptyCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: 8, ...Shadows.sm,
  },
  emptyText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textLight },
  courseCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  courseIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  courseClient: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  courseAdresse: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  courseMontant: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
  annoncesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing['2xl'], backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, paddingVertical: 16, ...Shadows.md,
  },
  annoncesBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});