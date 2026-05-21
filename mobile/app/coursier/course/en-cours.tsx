// app/coursier/course/en-cours.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Dimensions, Linking, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import MapWebView from '../../../components/shared/MapWebView';
import { supabase } from '../../../lib/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CourseActive {
  id_course: number;
  id_demande: number;
  id_client: string;
  nom_client: string;
  telephone_client: string;
  adresse_livraison: string;
  magasins: string;
  latitude_livraison: number | null;
  longitude_livraison: number | null;
}

export default function CourseEnCours() {
  const router = useRouter();

  const [etape, setEtape]           = useState<'aller_magasin' | 'en_livraison'>('aller_magasin');
  const [course, setCourse]         = useState<CourseActive | null>(null);
  const [loading, setLoading]       = useState(true);
  const [finishing, setFinishing]   = useState(false);
  const [userId, setUserId]         = useState<string | null>(null);
  // Position GPS du coursier
  const [myLat, setMyLat]           = useState(6.3700);
  const [myLng, setMyLng]           = useState(2.4200);

  const locationSubRef = useRef<any>(null);

  // ── Chargement ───────────────────────────────────────────
  useEffect(() => {
    init();
    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

  const init = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    await Promise.all([
      loadCourseActive(user.id),
      startLocationTracking(user.id),
    ]);
    setLoading(false);
  };

  // ── Charger la course active du coursier ─────────────────
  const loadCourseActive = async (uid: string) => {
    const { data: courseData } = await supabase
      .from('courses')
      .select('id_course, id_demande, statut_course')
      .eq('id_livreur', uid)
      .in('statut_course', ['acceptee', 'en_cours'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!courseData) return;

    // Si déjà en_livraison → changer l'étape
    if (courseData.statut_course === 'en_cours') {
      setEtape('en_livraison');
    }

    // Charger la demande
    const { data: demande } = await supabase
      .from('demande_courses')
      .select('id_demande, id_client, adresse_livraison, magasins, latitude_livraison, longitude_livraison')
      .eq('id_demande', courseData.id_demande)
      .single();

    if (!demande) return;

    // Charger le client
    const { data: client } = await supabase
      .from('utilisateurs')
      .select('nom_complet, telephone')
      .eq('id', demande.id_client)
      .single();

    setCourse({
      id_course:          courseData.id_course,
      id_demande:         courseData.id_demande,
      id_client:          demande.id_client,
      nom_client:         client?.nom_complet ?? 'Client',
      telephone_client:   client?.telephone ?? '',
      adresse_livraison:  demande.adresse_livraison ?? '—',
      magasins:           demande.magasins ?? '—',
      latitude_livraison: demande.latitude_livraison,
      longitude_livraison: demande.longitude_livraison,
    });
  };

  // ── Tracking GPS du coursier ─────────────────────────────
  const startLocationTracking = async (uid: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Position initiale
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setMyLat(loc.coords.latitude);
      setMyLng(loc.coords.longitude);
      await updatePositionSupabase(uid, loc.coords.latitude, loc.coords.longitude);

      // Suivi continu toutes les 5 secondes
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10, // mettre à jour tous les 10m
        },
        async (location) => {
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          setMyLat(lat);
          setMyLng(lng);
          await updatePositionSupabase(uid, lat, lng);
        }
      );
    } catch (err) {
      console.error('Erreur GPS:', err);
    }
  };

  // ── Mettre à jour la position dans Supabase ──────────────
  const updatePositionSupabase = async (uid: string, lat: number, lng: number) => {
    // Upsert dans suivi_localisation
    await supabase
      .from('suivi_localisation')
      .upsert({
        id_livreur:   uid,
        latitude:     lat,
        longitude:    lng,
        date_position: new Date().toISOString(),
      }, { onConflict: 'id_livreur' });
  };

  // ── Étape suivante ───────────────────────────────────────
  const handleEtapeSuivante = async () => {
    if (!course || !userId) return;

    if (etape === 'aller_magasin') {
      // Passer à "en_livraison" → mettre à jour le statut de la course
      setEtape('en_livraison');
      await supabase
        .from('courses')
        .update({ statut_course: 'en_cours' })
        .eq('id_course', course.id_course);

      // Mettre à jour la demande
      await supabase
        .from('demande_courses')
        .update({ statut_demande: 'en_cours' })
        .eq('id_demande', course.id_demande);

      // Notifier le client
      await supabase.from('notifications').insert({
        id_utilisateur: course.id_client,
        id_demande:     course.id_demande,
        id_course:      course.id_course,
        titre:          'Votre coursier est en route ! 🚴',
        message:        'Votre coursier a récupéré vos articles et se dirige vers vous.',
        type:           'en_livraison',
        is_read:        false,
      });

    } else {
      // Terminer la course
      Alert.alert(
        'Terminer la course ?',
        'Confirmez que vous avez bien livré les articles au client.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: '✅ Confirmer la livraison',
            onPress: terminerCourse,
          },
        ]
      );
    }
  };

  // ── Terminer la course ───────────────────────────────────
  const terminerCourse = async () => {
    if (!course || !userId) return;
    setFinishing(true);
    try {
      // 1. Mettre à jour la course → livree
      await supabase
        .from('courses')
        .update({
          statut_course: 'livree',
          date_fin: new Date().toISOString(),
        })
        .eq('id_course', course.id_course);

      // 2. Mettre à jour la demande
      await supabase
        .from('demande_courses')
        .update({ statut_demande: 'livree' })
        .eq('id_demande', course.id_demande);

      // 3. Incrémenter nombre_courses du livreur
      const { data: livreur } = await supabase
        .from('livreurs')
        .select('nombre_courses')
        .eq('id_utilisateur', userId)
        .single();

      if (livreur) {
        await supabase
          .from('livreurs')
          .update({ nombre_courses: (livreur.nombre_courses ?? 0) + 1 })
          .eq('id_utilisateur', userId);
      }

      // 4. Notifier le client
      await supabase.from('notifications').insert({
        id_utilisateur: course.id_client,
        id_demande:     course.id_demande,
        id_course:      course.id_course,
        titre:          'Course livrée ! ✅',
        message:        'Votre commande a été livrée. Merci de noter votre coursier.',
        type:           'livree',
        is_read:        false,
      });

      // 5. Arrêter le GPS
      if (locationSubRef.current) locationSubRef.current.remove();

      router.replace('/coursier/gains');

    } catch (err) {
      Alert.alert('Erreur', 'Impossible de terminer la course. Réessayez.');
    } finally {
      setFinishing(false);
    }
  };

  // ── Appeler le client ────────────────────────────────────
  const appelClient = () => {
    const tel = course?.telephone_client?.replace(/\s/g, '');
    if (!tel) return;
    Linking.openURL(`tel:${tel}`);
  };

  // ── Navigation ───────────────────────────────────────────
  const ouvrirMaps = () => {
    const dest = etape === 'aller_magasin'
      ? course?.magasins
      : `${course?.latitude_livraison},${course?.longitude_livraison}`;
    if (!dest) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`);
  };

  // ── Destination sur la carte ─────────────────────────────
  const destMarker = etape === 'aller_magasin'
    ? { latitude: 6.3654, longitude: 2.4183, title: course?.magasins ?? 'Magasin', color: 'orange' as const }
    : {
        latitude:  course?.latitude_livraison  ?? 6.3554,
        longitude: course?.longitude_livraison ?? 2.4083,
        title: course?.adresse_livraison ?? 'Livraison',
        color: 'red' as const,
      };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapWebView
        latitude={myLat}
        longitude={myLng}
        zoom={14}
        height={SCREEN_HEIGHT * 0.50}
        markers={[
          { latitude: myLat, longitude: myLng, title: 'Vous', color: 'blue' },
          destMarker,
        ]}
        showRoute
      />

      {/* Header flottant */}
      <View style={styles.headerFloat}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course #{course?.id_course ?? '—'}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>

        {/* Étapes */}
        <View style={styles.etapesRow}>
          {[
            { label: 'Magasin',   icon: 'storefront' as const },
            { label: 'Livraison', icon: 'home'       as const },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.etapeDot, (i === 0 || etape === 'en_livraison') && styles.etapeDotActive]}>
                  <Ionicons name={step.icon} size={12} color={Colors.white} />
                </View>
                <Text style={styles.etapeLabel}>{step.label}</Text>
              </View>
              {i === 0 && (
                <View style={[styles.etapeLine, etape === 'en_livraison' && styles.etapeLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Destination */}
        <View style={styles.destCard}>
          <View style={[styles.destIcon, {
            backgroundColor: etape === 'en_livraison' ? Colors.successLight : Colors.primarySoft
          }]}>
            <Ionicons
              name={etape === 'en_livraison' ? 'home-outline' : 'storefront-outline'}
              size={22}
              color={etape === 'en_livraison' ? Colors.success : Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destLabel}>
              {etape === 'en_livraison' ? 'Adresse de livraison' : 'Magasin à visiter'}
            </Text>
            <Text style={styles.destVal}>
              {etape === 'en_livraison' ? course?.adresse_livraison : course?.magasins}
            </Text>
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={ouvrirMaps}>
            <Ionicons name="navigate" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Client */}
        <View style={styles.clientRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientNom}>{course?.nom_client ?? '—'}</Text>
            <Text style={styles.clientInfo}>Client · {course?.telephone_client || 'Pas de téléphone'}</Text>
          </View>
          {course?.telephone_client ? (
            <TouchableOpacity style={styles.actionBtn} onPress={appelClient}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({
              pathname: '/client/course/chat',
              params: { id_demande: course?.id_demande?.toString() ?? '' },
            })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Bouton étape */}
        <TouchableOpacity
          style={[styles.etapeBtn, finishing && styles.etapeBtnLoading]}
          onPress={handleEtapeSuivante}
          activeOpacity={0.85}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons
                name={etape === 'en_livraison' ? 'checkmark-circle-outline' : 'arrow-forward-circle-outline'}
                size={20} color={Colors.white}
              />
              <Text style={styles.etapeBtnText}>
                {etape === 'en_livraison' ? 'Confirmer la livraison ✓' : "J'arrive au magasin →"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.white },
  headerFloat:     { position: 'absolute', top: 52, left: Spacing.base, right: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadows.md },
  iconBtn:         { padding: 4 },
  headerTitle:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  bottomSheet:     { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, marginTop: -20, ...Shadows.lg },
  etapesRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  etapeDot:        { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  etapeDotActive:  { backgroundColor: Colors.primary },
  etapeLine:       { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 8, marginBottom: 20 },
  etapeLineActive: { backgroundColor: Colors.primary },
  etapeLabel:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  destCard:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  destIcon:        { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  destLabel:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  destVal:         { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  navBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  clientRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  avatar:          { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clientNom:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  clientInfo:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actionBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  etapeBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: 16 },
  etapeBtnLoading: { backgroundColor: Colors.primaryLight },
  etapeBtnText:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});