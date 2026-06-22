// app/client/course/suivi.tsx — ✅ Expo Go compatible + Supabase + simulation animée
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, Linking, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import MapWebView, { MapWebViewHandle } from '../../../components/shared/MapWebView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Commande = {
  id_commande: number;
  adresse_livraison: string;
  description_articles: string;
  magasins: string;
  latitude_livraison: number | null;
  longitude_livraison: number | null;
  statut_commande: string;
  montant_articles: number;
  montant_course: number;
  id_client: string;
};

type Utilisateur = {
  id: string;
  nom_complet: string;
  telephone: string | null;
  note_moyenne?: number | null;
  nombre_courses?: number;
};

const ETAPES = ['Acceptée', 'En cours', 'En route', 'Arrivée'];

const statutToEtape: Record<string, number> = {
  en_attente: 0,
  en_cours: 1,
  en_livraison: 2,
  livree: 3,
};

const statutConfig: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente d'un coursier...", color: '#F59E0B' },
  en_cours: { label: 'Coursier en route vers le magasin', color: '#3B82F6' },
  en_livraison: { label: 'Coursier en route vers vous', color: '#F59E0B' },
  livree: { label: 'Livraison effectuée ✓', color: '#10B981' },
};

// Mêmes points simulés que côté coursier, pour cohérence visuelle pendant la démo
const DEPART_COURSIER = { latitude: 6.3700, longitude: 2.4200 };
const POS_MAGASIN = { latitude: 6.3654, longitude: 2.4183 };
const DUREE_TRAJET_MAGASIN = 4000;
const DUREE_TRAJET_CLIENT = 5000;

export default function SuiviCourseScreen() {
  const router = useRouter();
  const { id_commande } = useLocalSearchParams<{ id_commande: string }>();
  const mapRef = useRef<MapWebViewHandle>(null);

  const [commande, setCommande] = useState<Commande | null>(null);
  const [coursier, setCoursier] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [etapeLocale, setEtapeLocale] = useState<'attente' | 'vers_magasin' | 'collecte' | 'vers_client' | 'arrive'>('attente');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const aDejaAnimeMagasin = useRef(false);
  const aDejaAnimeClient = useRef(false);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id_commande) return;
    chargerDonnees();
  }, [id_commande]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const { data: cmd, error } = await supabase
        .from('commande')
        .select('*')
        .eq('id_commande', id_commande)
        .single();

      if (error || !cmd) throw error;
      setCommande(cmd);
      appliquerStatutInitial(cmd.statut_commande);

      const { data: conv } = await supabase
        .from('conversation')
        .select('id_coursier')
        .eq('id_course', id_commande)
        .single();

      if (conv?.id_coursier) {
        const { data: infoCoursier, error: rpcErr } = await supabase
          .rpc('get_coursier_info', { p_id_coursier: conv.id_coursier })
          .single();

        if (rpcErr) console.error('[Suivi] Erreur RPC get_coursier_info:', rpcErr);

        if (infoCoursier) {
          setCoursier({
            id: conv.id_coursier,
            nom_complet: (infoCoursier as any).nom_complet,
            telephone: (infoCoursier as any).telephone,
            note_moyenne: (infoCoursier as any).note_moyenne,
            nombre_courses: (infoCoursier as any).nombre_courses,
          });
        }
      }
    } catch (err) {
      console.error('Erreur chargement suivi:', err);
    } finally {
      setLoading(false);
    }
  };

  const appliquerStatutInitial = (statut: string) => {
    if (statut === 'livree') setEtapeLocale('arrive');
    else if (statut === 'en_cours' || statut === 'en_livraison') setEtapeLocale('vers_magasin');
    else setEtapeLocale('attente');
  };

  // ── Écoute temps réel : dès que le coursier change le statut, on anime ────
  useEffect(() => {
    if (!id_commande) return;

    const channel = supabase
      .channel(`commande_${id_commande}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'commande',
          filter: `id_commande=eq.${id_commande}`,
        },
        (payload) => {
          const updated = payload.new as Commande;
          setCommande(prev => prev ? { ...prev, statut_commande: updated.statut_commande } : prev);

          if (updated.statut_commande === 'en_cours' && !aDejaAnimeMagasin.current) {
            aDejaAnimeMagasin.current = true;
            setEtapeLocale('vers_magasin');
            mapRef.current?.moveMarkerTo('coursier', POS_MAGASIN.latitude, POS_MAGASIN.longitude, DUREE_TRAJET_MAGASIN);
            setTimeout(() => setEtapeLocale('collecte'), DUREE_TRAJET_MAGASIN);
          }

          if (updated.statut_commande === 'livree' && !aDejaAnimeClient.current) {
            aDejaAnimeClient.current = true;
            setEtapeLocale('vers_client');
            const lat = updated.latitude_livraison ?? 6.3510;
            const lng = updated.longitude_livraison ?? 2.4050;
            mapRef.current?.moveMarkerTo('coursier', lat, lng, DUREE_TRAJET_CLIENT);
            setTimeout(() => {
              setEtapeLocale('arrive');
              // Alerte explicite : le coursier a confirmé la livraison,
              // le client doit confirmer la réception à son tour.
              Alert.alert(
                '📦 Livraison effectuée !',
                'Votre coursier a livré votre commande. Merci de confirmer la réception.',
                [{ text: 'Confirmer la réception', onPress: () => router.push(`/client/course/fin?id_commande=${id_commande}`) }]
              );
            }, DUREE_TRAJET_CLIENT);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id_commande]);

  // ── Si la commande était DÉJÀ en_cours/terminee au chargement (pas de transition captée) ──
  useEffect(() => {
    if (!commande) return;
    if (commande.statut_commande === 'en_cours' && !aDejaAnimeMagasin.current) {
      aDejaAnimeMagasin.current = true;
      mapRef.current?.moveMarkerTo('coursier', POS_MAGASIN.latitude, POS_MAGASIN.longitude, 800);
    }
    if (commande.statut_commande === 'livree' && !aDejaAnimeClient.current) {
      aDejaAnimeClient.current = true;
      const lat = commande.latitude_livraison ?? 6.3510;
      const lng = commande.longitude_livraison ?? 2.4050;
      mapRef.current?.moveMarkerTo('coursier', lat, lng, 800);
    }
  }, [commande?.id_commande]);

  // ── Animation pulsation ───────────────────────────────────────────────────
  useEffect(() => {
    const isActif = commande?.statut_commande !== 'livree';
    if (isActif) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [commande?.statut_commande]);

  const appelerCoursier = () => {
    if (!coursier?.telephone) return;
    Linking.openURL(`tel:${coursier.telephone}`);
  };
  const chatCoursier = () => router.push(`/client/course/chat?id_commande=${id_commande}&from=client&origin=suivi`);

  const statut = commande?.statut_commande ?? 'en_attente';
  const config = statutConfig[statut] ?? statutConfig['en_attente'];
  const etapeIndex = statutToEtape[statut] ?? 0;

  const markersInitiaux = [
    { id: 'coursier', latitude: DEPART_COURSIER.latitude, longitude: DEPART_COURSIER.longitude, title: coursier?.nom_complet ?? 'Coursier', color: 'orange' as const },
    { id: 'magasin', latitude: POS_MAGASIN.latitude, longitude: POS_MAGASIN.longitude, title: commande?.magasins ?? 'Magasin', color: 'blue' as const },
    {
      id: 'client',
      latitude: commande?.latitude_livraison ?? 6.3510,
      longitude: commande?.longitude_livraison ?? 2.4050,
      title: 'Votre adresse',
      color: 'red' as const,
    },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement du suivi...</Text>
      </View>
    );
  }

  if (!commande) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.loadingText}>Commande introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapWebView
        ref={mapRef}
        latitude={DEPART_COURSIER.latitude}
        longitude={DEPART_COURSIER.longitude}
        zoom={14}
        height={SCREEN_HEIGHT * 0.44}
        markers={markersInitiaux}
        showRoute
      />

      <View style={styles.headerFloat}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi — #{commande.id_commande}</Text>
        {coursier ? (
          <TouchableOpacity onPress={chatCoursier} style={styles.iconBtn}>
            <Ionicons name="chatbubble-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      <ScrollView
        style={styles.bottomSheet}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Statut */}
        <View style={[styles.statutBanner, { backgroundColor: config.color + '18' }]}>
          <Animated.View style={[
            styles.statutDot,
            { backgroundColor: config.color, transform: [{ scale: pulseAnim }] }
          ]} />
          <Text style={[styles.statutText, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* Progression */}
        <View style={styles.progressBar}>
          {ETAPES.map((step, i) => (
            <React.Fragment key={step}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.progDot, i <= etapeIndex && { backgroundColor: config.color }]}>
                  {i < etapeIndex
                    ? <Ionicons name="checkmark" size={10} color="#fff" />
                    : i === etapeIndex
                      ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                      : null
                  }
                </View>
                <Text style={[styles.progLabel, i <= etapeIndex && { color: config.color }]}>{step}</Text>
              </View>
              {i < ETAPES.length - 1 && (
                <View style={[styles.progLine, i < etapeIndex && { backgroundColor: config.color }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Coursier */}
        {coursier ? (
          <>
            <Text style={styles.sectionTitle}>🛵 Votre coursier</Text>
            <View style={styles.coursierCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={26} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coursierNom}>{coursier.nom_complet}</Text>
                {coursier.note_moyenne != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {coursier.note_moyenne.toFixed(1)} · {coursier.nombre_courses ?? 0} courses
                    </Text>
                  </View>
                )}
                <Text style={styles.coursierTel}>{coursier.telephone ?? 'Téléphone non renseigné'}</Text>
              </View>
              <View style={{ gap: Spacing.sm }}>
                <TouchableOpacity style={styles.actionBtn} onPress={appelerCoursier}>
                  <Ionicons name="call" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={chatCoursier}>
                  <Ionicons name="chatbubble" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.attenteBanner}>
            <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
            <Text style={styles.attenteText}>Recherche d'un coursier disponible...</Text>
          </View>
        )}

        {/* Magasin */}
        <Text style={styles.sectionTitle}>🛒 Articles commandés</Text>
        <View style={styles.magasinCard}>
          <View style={styles.magasinHeader}>
            <View style={[
              styles.magasinDot,
              statut === 'livree' && { backgroundColor: '#10B981' }
            ]}>
              {statut === 'livree'
                ? <Ionicons name="checkmark" size={13} color="#fff" />
                : <Ionicons name="storefront-outline" size={13} color="#fff" />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.magasinNom}>{commande.magasins}</Text>
            </View>
            <View style={[styles.statutPill, {
              backgroundColor: statut === 'livree' ? '#D1FAE5' :
                               statut === 'en_cours' ? '#DBEAFE' : '#FEF3C7',
            }]}>
              <Text style={[styles.statutPillText, {
                color: statut === 'livree' ? '#065F46' :
                       statut === 'en_cours' ? '#1E40AF' : '#92400E',
              }]}>
                {statut === 'livree' ? 'Livré' :
                 statut === 'en_cours' ? 'En collecte' : 'En attente'}
              </Text>
            </View>
          </View>
          <Text style={[styles.articlesText, statut === 'livree' && { textDecorationLine: 'line-through', color: Colors.textLight }]}>
            {commande.description_articles}
          </Text>
        </View>

        {/* Adresse livraison */}
        <View style={styles.adresseCard}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.adresseLabel}>Votre adresse de livraison</Text>
            <Text style={styles.adresseVal}>{commande.adresse_livraison}</Text>
          </View>
        </View>

        {/* Montant */}
        <View style={styles.montantCard}>
          <View style={styles.montantRow}>
            <Text style={styles.montantLabel}>Articles</Text>
            <Text style={styles.montantVal}>{commande.montant_articles} FCFA</Text>
          </View>
          <View style={styles.montantRow}>
            <Text style={styles.montantLabel}>Frais de course</Text>
            <Text style={styles.montantVal}>{commande.montant_course} FCFA</Text>
          </View>
          <View style={[styles.montantRow, styles.montantTotal]}>
            <Text style={styles.montantTotalLabel}>Total</Text>
            <Text style={styles.montantTotalVal}>
              {(commande.montant_articles + commande.montant_course)} FCFA
            </Text>
          </View>
        </View>

        {/* Bouton confirmer réception */}
        {statut === 'livree' && (
          <TouchableOpacity
            style={styles.finBtn}
            onPress={() => router.push(`/client/course/fin?id_commande=${id_commande}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.finBtnText}>Confirmer la réception</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  headerFloat: {
    position: 'absolute', top: 52, left: Spacing.base, right: Spacing.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadows.md,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  bottomSheet: {
    flex: 1, backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -20, ...Shadows.lg,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl,
  },
  statutBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  statutDot: { width: 12, height: 12, borderRadius: 6 },
  statutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, flex: 1 },
  progressBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  progDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  progLabel: {
    fontFamily: FontFamily.regular, fontSize: 9,
    color: Colors.textLight, textAlign: 'center', maxWidth: 55,
  },
  progLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 18, marginHorizontal: 2 },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.xs,
    color: Colors.textSecondary, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  coursierCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  coursierNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  ratingText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  coursierTel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  attenteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF9EE', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  attenteText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#92400E', flex: 1 },
  magasinCard: {
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  magasinHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  magasinDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  magasinNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  statutPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statutPillText: { fontFamily: FontFamily.semiBold, fontSize: 10 },
  articlesText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  adresseCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  adresseLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  adresseVal: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  montantCard: {
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  montantRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  montantTotal: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    marginTop: 4, paddingTop: 8,
  },
  montantLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  montantVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  montantTotalLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary },
  montantTotalVal: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.primary },
  finBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    paddingVertical: 16, ...Shadows.md,
  },
  finBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});