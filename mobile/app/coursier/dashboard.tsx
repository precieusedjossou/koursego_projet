// app/coursier/dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import { supabase } from '../../lib/supabase';

const formatDate = (iso: string) => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000)  return `Aujourd'hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 172800000) return `Hier`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

export default function CoursierDashboard() {
  const router = useRouter();
  const [disponible, setDisponible]           = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [prenom, setPrenom]                   = useState('');
  const [coursesRecentes, setCoursesRecentes] = useState<any[]>([]);
  const [courseEnCours, setCourseEnCours]     = useState<any>(null);
  const [nbAnnonces, setNbAnnonces]           = useState(0);
  const [stats, setStats]                     = useState({ total: 0, gains: 0, note: '—' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Infos utilisateur
    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('nom_complet')
      .eq('id', user.id)
      .single();
    if (profil) setPrenom(profil.nom_complet?.split(' ')[0] || '');

    // Infos coursier
    const { data: coursier } = await supabase
      .from('coursier')
      .select('disponibilite, note_moyenne, nombre_courses')
      .eq('id', user.id)
      .single();
    if (coursier) {
      setDisponible(coursier.disponibilite || false);
      setStats(prev => ({
        ...prev,
        total: coursier.nombre_courses || 0,
        note:  coursier.note_moyenne ? coursier.note_moyenne.toFixed(1) : '—',
      }));
    }

    // Gains du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: coursesJour } = await supabase
      .from('commande')
      .select('montant_course')
      .eq('id_coursier', user.id)
      .eq('statut_commande', 'livree')
      .gte('date_commande', today.toISOString());
    if (coursesJour) {
      const gains = coursesJour.reduce((s, c) => s + (c.montant_course || 0), 0);
      setStats(prev => ({ ...prev, gains }));
    }

    // Course en cours
    const { data: enCours } = await supabase
      .from('commande')
      .select('id_commande, description_articles, adresse_livraison')
      .eq('id_coursier', user.id)
      .eq('statut_commande', 'en_cours')
      .maybeSingle();
    setCourseEnCours(enCours);

    // 5 dernières courses
    const { data: recentes } = await supabase
      .from('commande')
      .select('id_commande, description_articles, adresse_livraison, montant_course, date_commande')
      .eq('id_coursier', user.id)
      .eq('statut_commande', 'livree')
      .order('date_commande', { ascending: false })
      .limit(5);
    if (recentes) setCoursesRecentes(recentes);

    // Nb annonces disponibles
    const { count } = await supabase
      .from('commande')
      .select('id_commande', { count: 'exact', head: true })
      .eq('statut_commande', 'en_attente')
      .is('id_coursier', null);
    setNbAnnonces(count || 0);
  };

  const toggleDisponibilite = async (val: boolean) => {
    setDisponible(val);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('coursier').update({ disponibilite: val }).eq('id', user.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {prenom || 'Coursier'} 👋</Text>
          <Text style={styles.date}>Cotonou · {today}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/coursier/profil')} style={styles.avatarBtn}>
          <Ionicons name="person" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
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
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={disponible ? Colors.primary : Colors.white}
          />
        </View>

        {/* Stats du jour */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Courses totales',  val: String(stats.total),              icon: 'bicycle-outline'  },
            { label: 'Gains du jour',    val: stats.gains.toLocaleString(),      icon: 'cash-outline', suffix: 'FCFA' },
            { label: 'Note moyenne',     val: String(stats.note),               icon: 'star-outline'     },
            { label: 'Annonces dispo',   val: String(nbAnnonces),               icon: 'megaphone-outline'},
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
                <Text style={styles.activeTitle} numberOfLines={1}>
                  {courseEnCours.description_articles?.split(',')[0] || 'Course en cours'}
                </Text>
                <Text style={styles.activeSub} numberOfLines={1}>
                  {courseEnCours.adresse_livraison}
                </Text>
                <View style={styles.activeProgress}>
                  <View style={styles.activeProgressBar} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Dernières courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses récentes</Text>
            <TouchableOpacity onPress={() => router.push('/coursier/gains')}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {coursesRecentes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
              <Text style={{ fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textMuted }}>
                Aucune course récente
              </Text>
            </View>
          ) : (
            coursesRecentes.map((c) => (
              <View key={c.id_commande} style={styles.courseCard}>
                <View style={styles.courseIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseClient} numberOfLines={1}>
                    {c.description_articles?.split(',')[0] || 'Course'}
                  </Text>
                  <Text style={styles.courseAdresse} numberOfLines={1}>{c.adresse_livraison}</Text>
                </View>
                <Text style={styles.courseMontant}>{c.montant_course?.toLocaleString()} FCFA</Text>
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
          <Text style={styles.annoncesBtnText}>
            Voir les nouvelles annonces {nbAnnonces > 0 ? `(${nbAnnonces})` : ''}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing['2xl'], paddingTop: 56, paddingBottom: Spacing.base, backgroundColor: Colors.white },
  greeting:          { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.textPrimary },
  date:              { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dispoCard:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: Spacing['2xl'], marginBottom: Spacing.base, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  dispoLeft:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dispoDot:          { width: 12, height: 12, borderRadius: 6 },
  dispoOn:           { backgroundColor: Colors.success },
  dispoOff:          { backgroundColor: Colors.error },
  dispoTitle:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  dispoSub:          { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  statCard:          { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
  statIcon:          { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal:           { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  statSuffix:        { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  statLabel:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section:           { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
  sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle:      { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.sm },
  voirTout:          { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  activeCard:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.md },
  activePulse:       { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  activeTitle:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
  activeSub:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  activeProgress:    { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 8 },
  activeProgressBar: { width: '60%', height: '100%', backgroundColor: Colors.white, borderRadius: 2 },
  courseCard:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  courseIcon:        { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  courseClient:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  courseAdresse:     { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  courseMontant:     { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
  annoncesBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: Spacing['2xl'], backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: 16, ...Shadows.md },
  annoncesBtnText:   { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});