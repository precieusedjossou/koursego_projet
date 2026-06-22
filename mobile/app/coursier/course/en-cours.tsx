// app/coursier/course/en-cours.tsx — ✅ Expo Go compatible + Supabase + simulation animée
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Dimensions, ScrollView, Linking, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import MapWebView, { MapWebViewHandle } from '../../../components/shared/MapWebView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type EtatSimulation =
  | 'idle'
  | 'en_route_magasin'
  | 'arrive_magasin'
  | 'collecte_ok'
  | 'en_route_client'
  | 'arrive_client'
  | 'termine';

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
};

const ETAT_CONFIG: Record<EtatSimulation, { label: string; color: string }> = {
  idle: { label: 'Prêt à démarrer', color: Colors.primary },
  en_route_magasin: { label: 'En route vers le magasin...', color: '#F59E0B' },
  arrive_magasin: { label: 'Arrivé au magasin !', color: '#3B82F6' },
  collecte_ok: { label: 'Articles collectés ✓', color: '#10B981' },
  en_route_client: { label: 'En route vers le client...', color: '#F59E0B' },
  arrive_client: { label: 'Arrivé chez le client !', color: '#3B82F6' },
  termine: { label: 'Course terminée ✓', color: '#10B981' },
};

// Position de départ simulée du coursier (un peu au nord du magasin)
const DEPART_COURSIER = { latitude: 6.3700, longitude: 2.4200 };
// Magasin simulé (en l'absence de coordonnées réelles dans la BDD)
const POS_MAGASIN = { latitude: 6.3654, longitude: 2.4183 };

const DUREE_TRAJET_MAGASIN = 4000; // ms — vers le magasin
const DUREE_TRAJET_CLIENT = 5000;  // ms — vers le client

export default function CourseEnCours() {
  const router = useRouter();
  const { id_commande } = useLocalSearchParams<{ id_commande: string }>();
  const mapRef = useRef<MapWebViewHandle>(null);

  const [commande, setCommande] = useState<Commande | null>(null);
  const [client, setClient] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [etat, setEtat] = useState<EtatSimulation>('idle');
  const [simulationActive, setSimulationActive] = useState(false);
  // Le coursier ne peut démarrer que si le paiement a bien été confirmé
  const [paiementConfirme, setPaiementConfirme] = useState(true); // ⚠️ DEMO: déverrouillé par défaut

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!id_commande) return;
    chargerDonnees();
  }, [id_commande]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const { data: cmd, error: errCmd } = await supabase
        .from('commande')
        .select('*')
        .eq('id_commande', id_commande)
        .single();

      if (errCmd || !cmd) throw errCmd;
      setCommande(cmd);

      const { data: usr, error: usrError } = await supabase
        .rpc('get_utilisateur_info', { p_id: cmd.id_client })
        .single();

      if (usrError) console.error('[EnCours] Erreur RPC get_utilisateur_info:', JSON.stringify(usrError));
      if (usr) setClient({ id: cmd.id_client, nom_complet: (usr as any).nom_complet, telephone: (usr as any).telephone });

      // Le paiement est confirmé si la commande est déjà en_cours/terminee
      // (paiement.tsx passe le statut à en_cours après paiement réussi)
      // OU s'il existe une ligne dans la table paiement pour cette commande.
      const { data: paiementData } = await supabase
        .from('paiement')
        .select('id_paiement, statut_paiement')
        .eq('id_course', cmd.id_commande)
        .maybeSingle();

      if (paiementData) {
        setPaiementConfirme(true);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger la commande.');
    } finally {
      setLoading(false);
    }
  };

  // ── Écoute en temps réel : dès qu'un paiement est enregistré pour cette
  // commande, on alerte visuellement le coursier et on débloque le bouton ──
  useEffect(() => {
    if (!id_commande) return;

    const channel = supabase
      .channel(`paiement-${id_commande}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'paiement',
          filter: `id_course=eq.${id_commande}`,
        },
        (payload) => {
          const moyen = (payload.new as any)?.moyen_paiement;
          setPaiementConfirme(true);
          Alert.alert(
            '💰 Paiement reçu !',
            moyen === 'especes'
              ? 'Le client paiera en espèces à la livraison. Vous pouvez démarrer la course.'
              : 'Le paiement en ligne a été confirmé. Vous pouvez démarrer la course.'
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id_commande]);

  useEffect(() => {
    if (simulationActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [simulationActive]);

  const mettreAJourStatut = async (statut: string) => {
    await supabase
      .from('commande')
      .update({ statut_commande: statut })
      .eq('id_commande', id_commande);
  };

  // ── Simulation : le coursier BOUGE réellement sur la carte ────────────────
  const lancerSimulation = async () => {
    if (etat !== 'idle' || simulationActive) return;
    if (!paiementConfirme) {
      Alert.alert('Paiement en attente', "Vous ne pouvez démarrer que lorsque le paiement du client est confirmé.");
      return;
    }
    setSimulationActive(true);
    await mettreAJourStatut('en_cours');

    setEtat('en_route_magasin');

    // 1) Déplacement animé vers le magasin
    mapRef.current?.moveMarkerTo('coursier', POS_MAGASIN.latitude, POS_MAGASIN.longitude, DUREE_TRAJET_MAGASIN);

    setTimeout(() => {
      setEtat('arrive_magasin');

      setTimeout(() => {
        setEtat('collecte_ok');

        setTimeout(() => {
          setEtat('en_route_client');

          // 2) Déplacement animé vers le client
          const destLat = commande?.latitude_livraison ?? 6.3510;
          const destLng = commande?.longitude_livraison ?? 2.4050;
          mapRef.current?.moveMarkerTo('coursier', destLat, destLng, DUREE_TRAJET_CLIENT);

          setTimeout(() => {
            setEtat('arrive_client');
            setSimulationActive(false);
            setTimeout(() => demanderConfirmation(), 1200);
          }, DUREE_TRAJET_CLIENT);
        }, 2000);
      }, 2200);
    }, DUREE_TRAJET_MAGASIN);
  };

  const demanderConfirmation = () => {
    Alert.alert(
      '📦 Confirmer la livraison ?',
      `Confirmez que les articles ont bien été livrés à ${client?.nom_complet ?? 'le client'}.`,
      [
        { text: 'Pas encore', style: 'cancel' },
        {
          text: 'Confirmer ✓',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // RPC : passe la commande à 'terminee' ET notifie le client
              const { error } = await supabase.rpc('confirmer_livraison', {
                p_id_commande: Number(id_commande),
                p_id_coursier: user.id,
              });

              if (error) {
                console.error('[EnCours] Erreur confirmer_livraison:', error);
                Alert.alert('Erreur', "Impossible de confirmer la livraison.");
                return;
              }

              setEtat('termine');
              setTimeout(() => router.replace('/coursier/gains'), 1000);
            } catch (e) {
              Alert.alert('Erreur', "Une erreur est survenue.");
            }
          },
        },
      ]
    );
  };

  const appelerClient = () => {
    if (!client?.telephone) return Alert.alert('Téléphone non disponible');
    Linking.openURL(`tel:${client.telephone}`);
  };
  const chatClient = () => router.push(`/client/course/chat?id_commande=${id_commande}&from=coursier`);
  const ouvrirNav = () => {
    const lat = commande?.latitude_livraison ?? 6.3510;
    const lng = commande?.longitude_livraison ?? 2.4050;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  // Markers initiaux (le coursier sera ensuite déplacé via mapRef, pas en re-render)
  const markersInitiaux = [
    { id: 'coursier', latitude: DEPART_COURSIER.latitude, longitude: DEPART_COURSIER.longitude, title: 'Vous', color: 'blue' as const },
    { id: 'magasin', latitude: POS_MAGASIN.latitude, longitude: POS_MAGASIN.longitude, title: commande?.magasins ?? 'Magasin', color: 'orange' as const },
    {
      id: 'client',
      latitude: commande?.latitude_livraison ?? 6.3510,
      longitude: commande?.longitude_livraison ?? 2.4050,
      title: 'Client',
      color: 'red' as const,
    },
  ];

  const config = ETAT_CONFIG[etat];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement de la course...</Text>
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
        <Text style={styles.headerTitle}>Course #{commande.id_commande}</Text>
        <View style={{ width: 30 }} />
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

        {/* Magasin */}
        <Text style={styles.sectionTitle}>🛒 Magasin à visiter</Text>
        <View style={styles.magasinCard}>
          <View style={styles.magasinHeader}>
            <View style={[
              styles.magasinNumero,
              ['collecte_ok','en_route_client','arrive_client','termine'].includes(etat) && { backgroundColor: '#10B981' }
            ]}>
              {['collecte_ok','en_route_client','arrive_client','termine'].includes(etat)
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={styles.magasinNumeroText}>1</Text>
              }
            </View>
            <Text style={[styles.magasinNom, { flex: 1 }]}>{commande.magasins}</Text>
            <TouchableOpacity style={styles.navSmallBtn} onPress={ouvrirNav}>
              <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.articlesBox}>
            <Text style={styles.articlesLabel}>Articles à collecter :</Text>
            <Text style={styles.articlesText}>{commande.description_articles}</Text>
          </View>
          <View style={styles.montantRow}>
            <View style={styles.montantItem}>
              <Text style={styles.montantLabel}>Articles</Text>
              <Text style={styles.montantVal}>{commande.montant_articles} FCFA</Text>
            </View>
            <View style={styles.montantDivider} />
            <View style={styles.montantItem}>
              <Text style={styles.montantLabel}>Ma commission</Text>
              <Text style={[styles.montantVal, { color: Colors.primary }]}>{commande.montant_course} FCFA</Text>
            </View>
          </View>
        </View>

        {/* Adresse livraison */}
        <View style={styles.adresseCard}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.adresseLabel}>Adresse de livraison</Text>
            <Text style={styles.adresseVal}>{commande.adresse_livraison}</Text>
          </View>
        </View>

        {/* Client */}
        <Text style={styles.sectionTitle}>👤 Client</Text>
        <View style={styles.clientCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientNom}>{client?.nom_complet ?? '—'}</Text>
            <Text style={styles.clientTel}>{client?.telephone ?? 'Téléphone non renseigné'}</Text>
          </View>
          <View style={{ gap: Spacing.sm }}>
            <TouchableOpacity style={styles.actionBtn} onPress={appelerClient}>
              <Ionicons name="call" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={chatClient}>
              <Ionicons name="chatbubble" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statut paiement (bloque le démarrage tant que non payé) */}
        {!paiementConfirme && etat === 'idle' && (
          <View style={styles.paiementAttenteBanner}>
            <Ionicons name="time-outline" size={18} color="#92400E" />
            <Text style={styles.paiementAttenteText}>
              En attente de la confirmation du paiement par le client...
            </Text>
          </View>
        )}

        {/* Bouton principal */}
        <TouchableOpacity
          style={[
            styles.etapeBtn,
            { backgroundColor: etat === 'termine' ? '#10B981' : Colors.primary },
            (simulationActive || etat === 'termine' || !paiementConfirme) && styles.etapeBtnDisabled,
          ]}
          onPress={lancerSimulation}
          disabled={simulationActive || etat === 'termine' || !paiementConfirme}
          activeOpacity={0.85}
        >
          <Ionicons
            name={etat === 'termine' ? 'checkmark-circle' : !paiementConfirme ? 'lock-closed-outline' : 'play-circle-outline'}
            size={22}
            color={Colors.white}
          />
          <Text style={styles.etapeBtnText}>
            {!paiementConfirme ? '🔒  En attente du paiement' :
             etat === 'idle' ? '▶  Démarrer la course' :
             etat === 'termine' ? '✓  Terminée' :
             simulationActive ? 'En cours...' : config.label}
          </Text>
        </TouchableOpacity>

        {etat === 'arrive_client' && (
          <TouchableOpacity
            style={[styles.etapeBtn, { backgroundColor: '#10B981', marginTop: Spacing.sm }]}
            onPress={demanderConfirmation}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} />
            <Text style={styles.etapeBtnText}>Confirmer la livraison</Text>
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
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.base,
  },
  statutDot: { width: 12, height: 12, borderRadius: 6 },
  statutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, flex: 1 },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.xs,
    color: Colors.textSecondary, marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  magasinCard: {
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  magasinHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  magasinNumero: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  magasinNumeroText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: '#fff' },
  magasinNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  navSmallBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  articlesBox: { marginBottom: Spacing.md },
  articlesLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
  articlesText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  montantRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  montantItem: { flex: 1, alignItems: 'center' },
  montantDivider: { width: 1, backgroundColor: Colors.border },
  montantLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  montantVal: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary, marginTop: 2 },
  adresseCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  adresseLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  adresseVal: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  clientNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  clientTel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  etapeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: BorderRadius.xl, paddingVertical: 16, ...Shadows.md,
  },
  etapeBtnDisabled: { opacity: 0.6 },
  etapeBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
  paiementAttenteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF9EE', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  paiementAttenteText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: '#92400E', flex: 1 },
});