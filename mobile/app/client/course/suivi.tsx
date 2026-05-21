// app/client/course/suivi.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Linking, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import MapWebView from '../../../components/shared/MapWebView';
import { supabase } from '../../../lib/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CoursierPosition {
  latitude: number;
  longitude: number;
  date_position: string;
}

interface InfosCourse {
  id_course: number;
  nom_coursier: string;
  telephone_coursier: string;
  note_moyenne: number;
  nombre_courses: number;
  adresse_livraison: string;
  latitude_livraison: number | null;
  longitude_livraison: number | null;
  statut_course: string;
  id_livreur: string;
}

export default function SuiviCourseScreen() {
  const router = useRouter();
  const { id_demande } = useLocalSearchParams<{ id_demande: string }>();

  const [infos, setInfos]           = useState<InfosCourse | null>(null);
  const [position, setPosition]     = useState<CoursierPosition | null>(null);
  const [loading, setLoading]       = useState(true);
  const [etapeIndex, setEtapeIndex] = useState(0); // 0=acceptée 1=en_route 2=livrée

  const channelRef = useRef<any>(null);

  // ── Chargement ───────────────────────────────────────────
  useEffect(() => {
    if (id_demande) init();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [id_demande]);

  const init = async () => {
    setLoading(true);
    await Promise.all([
      loadInfosCourse(),
    ]);
    setLoading(false);
  };

  // ── Charger les infos de la course ───────────────────────
  const loadInfosCourse = async () => {
    // Course active pour cette demande
    const { data: course } = await supabase
      .from('courses')
      .select('id_course, id_livreur, statut_course')
      .eq('id_demande', id_demande)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!course) return;

    // Déterminer l'étape
    if (course.statut_course === 'acceptee') setEtapeIndex(0);
    else if (course.statut_course === 'en_cours') setEtapeIndex(1);
    else if (course.statut_course === 'livree') setEtapeIndex(2);

    // Infos coursier
    const { data: livreurUser } = await supabase
      .from('utilisateurs')
      .select('nom_complet, telephone')
      .eq('id', course.id_livreur)
      .single();

    const { data: livreurStats } = await supabase
      .from('livreurs')
      .select('note_moyenne, nombre_courses')
      .eq('id_utilisateur', course.id_livreur)
      .single();

    // Infos demande
    const { data: demande } = await supabase
      .from('demande_courses')
      .select('adresse_livraison, latitude_livraison, longitude_livraison')
      .eq('id_demande', id_demande)
      .single();

    setInfos({
      id_course:           course.id_course,
      nom_coursier:        livreurUser?.nom_complet ?? 'Coursier',
      telephone_coursier:  livreurUser?.telephone ?? '',
      note_moyenne:        Number(livreurStats?.note_moyenne) || 0,
      nombre_courses:      livreurStats?.nombre_courses ?? 0,
      adresse_livraison:   demande?.adresse_livraison ?? '—',
      latitude_livraison:  demande?.latitude_livraison ?? null,
      longitude_livraison: demande?.longitude_livraison ?? null,
      statut_course:       course.statut_course,
      id_livreur:          course.id_livreur,
    });

    // Charger la position actuelle du coursier
    await loadPosition(course.id_livreur);

    // Écouter les mises à jour en temps réel
    subscribeToUpdates(course.id_livreur, course.id_course);
  };

  // ── Position GPS du coursier ─────────────────────────────
  const loadPosition = async (id_livreur: string) => {
    const { data } = await supabase
      .from('suivi_localisation')
      .select('latitude, longitude, date_position')
      .eq('id_livreur', id_livreur)
      .single();

    if (data) setPosition(data as CoursierPosition);
  };

  // ── Realtime — position + statut course ──────────────────
  const subscribeToUpdates = (id_livreur: string, id_course: number) => {
    channelRef.current = supabase
      .channel(`suivi-${id_demande}`)

      // Position GPS du coursier
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'suivi_localisation',
        filter: `id_livreur=eq.${id_livreur}`,
      }, (payload) => {
        const p = payload.new;
        setPosition({
          latitude:     p.latitude,
          longitude:    p.longitude,
          date_position: p.date_position,
        });
      })

      // Statut de la course
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'courses',
        filter: `id_course=eq.${id_course}`,
      }, (payload) => {
        const statut = payload.new?.statut_course;
        if (statut === 'en_cours') setEtapeIndex(1);
        if (statut === 'livree') {
          setEtapeIndex(2);
          // Rediriger vers la page fin après 2 secondes
          setTimeout(() => {
            router.replace({
              pathname: '/client/course/fin',
              params: { id_demande },
            });
          }, 2000);
        }
      })

      .subscribe();
  };

  // ── Appeler le coursier ──────────────────────────────────
  const appelCoursier = () => {
    const tel = infos?.telephone_coursier?.replace(/\s/g, '');
    if (!tel) return;
    Linking.openURL(`tel:${tel}`);
  };

  // ── Formatage ────────────────────────────────────────────
  const formatMaj = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 10) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff}s`;
    return `Il y a ${Math.floor(diff / 60)} min`;
  };

  // ── Coordonnées de la carte ──────────────────────────────
  const mapCenter = {
    lat: position?.latitude ?? infos?.latitude_livraison ?? 6.360,
    lng: position?.longitude ?? infos?.longitude_livraison ?? 2.413,
  };

  const markers: any[] = [];
  if (position) {
    markers.push({
      latitude: position.latitude,
      longitude: position.longitude,
      title: `${infos?.nom_coursier ?? 'Coursier'}`,
      color: 'orange',
    });
  }
  if (infos?.latitude_livraison && infos?.longitude_livraison) {
    markers.push({
      latitude: infos.latitude_livraison,
      longitude: infos.longitude_livraison,
      title: 'Votre adresse',
      color: 'red',
    });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Carte */}
      <MapWebView
        latitude={mapCenter.lat}
        longitude={mapCenter.lng}
        zoom={14}
        height={SCREEN_HEIGHT * 0.52}
        showRoute={markers.length >= 2}
        markers={markers}
      />

      {/* Header flottant */}
      <View style={styles.headerFloat}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course en cours</Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/client/course/chat',
            params: { id_demande },
          })}
          style={styles.iconBtn}
        >
          <Ionicons name="chatbubble-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Indicateur position */}
      {position && (
        <View style={styles.positionBadge}>
          <View style={styles.positionDot} />
          <Text style={styles.positionText}>
            Mis à jour {formatMaj(position.date_position)}
          </Text>
        </View>
      )}

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>

        {/* Coursier */}
        <View style={styles.coursierRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coursierNom}>{infos?.nom_coursier ?? '—'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="star" size={13} color={Colors.primary} />
              <Text style={styles.ratingText}>
                {infos?.note_moyenne ? infos.note_moyenne.toFixed(1) : 'Nouveau'}
                {' · '}{infos?.nombre_courses ?? 0} courses
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {infos?.telephone_coursier ? (
              <TouchableOpacity style={styles.actionBtn} onPress={appelCoursier}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push({
                pathname: '/client/course/chat',
                params: { id_demande },
              })}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barre de statut */}
        <View style={styles.statutBar}>
          {['Acceptée', 'En route', 'Livrée'].map((step, i) => (
            <React.Fragment key={step}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.statutDot, i <= etapeIndex && styles.statutDotActive]}>
                  {i < etapeIndex && (
                    <Ionicons name="checkmark" size={8} color={Colors.white} />
                  )}
                </View>
                <Text style={[styles.statutStepText, i <= etapeIndex && styles.statutStepTextActive]}>
                  {step}
                </Text>
              </View>
              {i < 2 && (
                <View style={[styles.statutLine, i < etapeIndex && styles.statutLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ETA */}
        <View style={styles.etaRow}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.etaText}>
            {etapeIndex === 2
              ? '✅ Course livrée !'
              : etapeIndex === 1
              ? 'Votre coursier est en route vers vous'
              : 'Votre coursier récupère vos articles'}
          </Text>
        </View>

        {/* Adresse */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: Spacing.base }}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={{ flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary }}>
            {infos?.adresse_livraison ?? '—'}
          </Text>
        </View>

        {/* Bouton confirmer réception (seulement si en_cours) */}
        {etapeIndex >= 1 && etapeIndex < 2 && (
          <TouchableOpacity
            style={styles.finBtn}
            onPress={() => router.push({ pathname: '/client/course/fin', params: { id_demande } })}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.finBtnText}>Confirmer la réception</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.white },
  headerFloat:  { position: 'absolute', top: 52, left: Spacing.base, right: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadows.md },
  iconBtn:      { padding: 4 },
  headerTitle:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  positionBadge: { position: 'absolute', top: 110, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, ...Shadows.sm },
  positionDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  positionText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary },
  bottomSheet:  { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, marginTop: -20, ...Shadows.lg },
  coursierRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.base },
  avatar:       { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  coursierNom:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  ratingText:   { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  actionBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  statutBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  statutDot:    { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.border, marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  statutDotActive: { backgroundColor: Colors.primary },
  statutLine:      { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 20 },
  statutLineActive: { backgroundColor: Colors.primary },
  statutStepText:  { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  statutStepTextActive: { color: Colors.primary, fontFamily: FontFamily.medium },
  etaRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  etaText:      { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  finBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: 16, ...Shadows.md },
  finBtnText:   { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});