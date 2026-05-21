// app/client/commande/recapitulatif.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

// ================================================================
// CONFIG PRIX (FCFA)
// ================================================================
const PRIX = {
  BASE_ACHAT:  500,   // commission de base achat en magasin
  BASE_COLIS:  250,   // commission de base récupération colis
  PAR_KM:      27,    // FCFA par km
  PLATEFORME:  0.05,  // 5%
};

const ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImJjNmE2YmY0NmRlZTRkYjM4YjI1MjgzZTM1YjQ2MzU0IiwiaCI6Im11cm11cjY0In0=';

const arrondir = (n: number) => Math.ceil(n / 50) * 50;

// Géocodage Nominatim
const geocode = async (adresse: string): Promise<[number, number] | null> => {
  try {
    const q   = encodeURIComponent(`${adresse}, Bénin`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=bj`,
      { headers: { 'User-Agent': 'KourseGO/1.0' } }
    );
    const data = await res.json();
    if (data?.length > 0) return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    return null;
  } catch { return null; }
};

// Distance via OpenRouteService
const getDistanceORS = async (dep: [number, number], arr: [number, number]): Promise<number | null> => {
  try {
    const res = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        method:  'POST',
        headers: { 'Authorization': ORS_KEY, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ coordinates: [dep, arr] }),
      }
    );
    const data = await res.json();
    const m = data?.routes?.[0]?.summary?.distance;
    if (m && m > 500) return m / 1000; // ignorer < 500m (erreur géocodage)
    return null;
  } catch { return null; }
};

interface Article { nom: string; quantite: number; magasin: string; prix_estime?: number; }
interface Demande  {
  id_demande: number;
  description_articles: string;
  magasins: string;
  adresse_livraison: string;
  latitude_livraison?: number;
  longitude_livraison?: number;
}

export default function RecapitulatifScreen() {
  const router = useRouter();
  const { id_demande } = useLocalSearchParams<{ id_demande: string }>();

  const [demande, setDemande]             = useState<Demande | null>(null);
  const [articles, setArticles]           = useState<Article[]>([]);
  const [loading, setLoading]             = useState(true);
  const [confirming, setConfirming]       = useState(false);
  const [distanceKm, setDistanceKm]       = useState<number>(3);
  const [distanceInput, setDistanceInput] = useState<string>('3');
  const [calcEnCours, setCalcEnCours]     = useState(false);
  const [isAchat, setIsAchat]             = useState(true);

  useEffect(() => { if (id_demande) loadData(); }, [id_demande]);

  const loadData = async () => {
    try {
      const { data: d } = await supabase
        .from('demande_courses').select('*').eq('id_demande', id_demande).single();
      if (!d) return;
      setDemande(d);

      const { data: a } = await supabase
        .from('articles').select('nom, quantite, magasin, prix_estime').eq('id_demande', id_demande);
      const arts = a || [];
      setArticles(arts);
      setIsAchat(arts.length > 0);

      // Calcul automatique de la distance
      await calculerDistanceAuto(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const calculerDistanceAuto = async (d: Demande) => {
    setCalcEnCours(true);
    try {
      const depAdresse = d.magasins;
      const arrAdresse = d.adresse_livraison;
      if (!depAdresse || !arrAdresse) return;

      // Coordonnées arrivée (GPS ou géocodage)
      let arrCoords: [number, number] | null = null;
      if (d.latitude_livraison && d.longitude_livraison) {
        arrCoords = [d.longitude_livraison, d.latitude_livraison];
      } else {
        arrCoords = await geocode(arrAdresse);
      }

      // Coordonnées départ (géocodage du magasin)
      const depCoords = await geocode(depAdresse);

      if (!arrCoords || !depCoords) return;

      // Essayer ORS
      const distORS = await getDistanceORS(depCoords, arrCoords);
      if (distORS && distORS > 0.5) {
        const rounded = Math.round(distORS * 10) / 10;
        setDistanceKm(rounded);
        setDistanceInput(rounded.toString());
        return;
      }

      // Fallback Haversine si ORS échoue
      const [lon1, lat1] = depCoords;
      const [lon2, lat2] = arrCoords;
      const R    = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a    =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist > 0.5) {
        const rounded = Math.round(dist * 10) / 10;
        setDistanceKm(rounded);
        setDistanceInput(rounded.toString());
      }
    } catch (e) { console.error('Distance:', e); }
    finally { setCalcEnCours(false); }
  };

  // Mise à jour manuelle de la distance
  const handleDistanceChange = (val: string) => {
    setDistanceInput(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num > 0) setDistanceKm(num);
  };

  // Calculs prix
  const montantArticles = articles.reduce((s, a) => s + ((a.prix_estime || 0) * a.quantite), 0);
  const base            = isAchat ? PRIX.BASE_ACHAT : PRIX.BASE_COLIS;
  const commission      = arrondir(base + PRIX.PAR_KM * distanceKm);
  const baseTotal       = montantArticles + commission;
  const frais           = arrondir(baseTotal * PRIX.PLATEFORME);
  const total           = arrondir(baseTotal + frais);
  const tempsMin        = Math.ceil(5 + distanceKm * 3);

  const handleConfirmer = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('demande_courses')
        .update({
          estimation_prix:     total,
          montant_articles:    montantArticles,
          commission_coursier: commission,
          part_plateforme:     frais,
          statut_demande:      'en_attente',
        })
        .eq('id_demande', id_demande);

      if (error) { Alert.alert('Erreur', 'Impossible de confirmer.'); return; }

      // ✅ Fix TypeScript : cast en any pour éviter l'erreur de pathname
      (router as any).push({
        pathname: '/client/commande/recherche_coursier',
        params: {
          id_demande,
          adresse_livraison:    demande?.adresse_livraison    ?? '',
          description_articles: demande?.description_articles ?? '',
          total:                total.toString(),
        },
      });
    } catch { Alert.alert('Erreur réseau', 'Vérifiez votre connexion.'); }
    finally { setConfirming(false); }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );

  const Ligne = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
    <View style={styles.ligne}>
      <Text style={[styles.ligneLabel, bold && styles.ligneBold]}>{label}</Text>
      <Text style={[styles.ligneValue, bold && styles.ligneValueBold]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header showBack title="Récapitulatif de commande" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Bannière */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="bicycle" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Prêt à être envoyé</Text>
            <Text style={styles.bannerSub}>Confirmez pour que les coursiers voient votre demande</Text>
          </View>
        </View>

        {/* Itinéraire */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>
          {demande?.magasins ? (
            <>
              <View style={styles.itinRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itinLabel}>Point de départ</Text>
                  <Text style={styles.itinVal}>{demande.magasins}</Text>
                </View>
              </View>
              <View style={styles.itinLine} />
            </>
          ) : null}
          <View style={styles.itinRow}>
            <View style={[styles.dot, styles.dotEnd]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Livraison</Text>
              <Text style={styles.itinVal}>{demande?.adresse_livraison || '—'}</Text>
            </View>
            <Text style={styles.itinMeta}>~{tempsMin} min</Text>
          </View>

          {/* Distance — modifiable manuellement */}
          <View style={styles.distanceBox}>
            <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
            <Text style={styles.distanceLabel}>Distance :</Text>
            {calcEnCours ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View style={styles.distanceInputRow}>
                <TextInput
                  style={styles.distanceInput}
                  value={distanceInput}
                  onChangeText={handleDistanceChange}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.distanceUnit}>km</Text>
              </View>
            )}
          </View>
          <Text style={styles.distanceHint}>
            {calcEnCours
              ? 'Calcul automatique en cours...'
              : 'Modifiez si la distance ne correspond pas à votre trajet'}
          </Text>
        </View>

        {/* Articles */}
        {isAchat && articles.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Articles commandés</Text>
            {articles.map((a, i) => (
              <View key={i} style={styles.artRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artNom}>{a.nom}{a.quantite > 1 ? ` (x${a.quantite})` : ''}</Text>
                  {a.magasin ? <Text style={styles.artMag}>{a.magasin}</Text> : null}
                </View>
                <Text style={styles.artPrix}>
                  {a.prix_estime ? `${(a.prix_estime * a.quantite).toLocaleString('fr-FR')} FCFA` : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!isAchat && demande?.description_articles && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations du colis</Text>
            <Text style={styles.colisDesc}>{demande.description_articles}</Text>
          </View>
        )}

        {/* Coûts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détail des coûts</Text>
          {isAchat && montantArticles > 0 && (
            <Ligne label="Sous-total articles" value={`${montantArticles.toLocaleString('fr-FR')} FCFA`} />
          )}
          <Ligne label="Commission coursier" value={`${commission.toLocaleString('fr-FR')} FCFA`} />
          <Ligne label="Frais de service (5%)" value={`${frais.toLocaleString('fr-FR')} FCFA`} />
          <View style={styles.divider} />
          <Ligne label="Total à payer" value={`${total.toLocaleString('fr-FR')} FCFA`} bold />
        </View>

        <View style={styles.btnsRow}>
          <Button title="Modifier" onPress={() => router.back()} variant="outline" style={styles.btn} />
          <Button title="Confirmer →" onPress={handleConfirmer} loading={confirming} style={styles.btn} />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText:      { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, marginTop: Spacing.md },
  content:          { padding: Spacing['2xl'] },
  banner:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.base, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  bannerIcon:       { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  bannerTitle:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  bannerSub:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  card:             { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  cardTitle:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  itinRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  dot:              { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4, borderWidth: 2, borderColor: Colors.primarySoft },
  dotEnd:           { backgroundColor: Colors.error },
  itinLine:         { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: 4 },
  itinLabel:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  itinVal:          { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  itinMeta:         { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  distanceBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.md, backgroundColor: Colors.primarySoft, padding: Spacing.sm, borderRadius: BorderRadius.md },
  distanceLabel:    { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  distanceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceInput:    { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.primary, minWidth: 48, textAlign: 'center', paddingVertical: 2 },
  distanceUnit:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textSecondary },
  distanceHint:     { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4, fontStyle: 'italic' },
  artRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  artNom:           { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  artMag:           { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  artPrix:          { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  colisDesc:        { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  ligne:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  ligneLabel:       { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, flex: 1 },
  ligneValue:       { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  ligneBold:        { fontFamily: FontFamily.bold, color: Colors.textPrimary, fontSize: FontSize.md },
  ligneValueBold:   { fontFamily: FontFamily.bold, color: Colors.primary, fontSize: FontSize.md },
  divider:          { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  btnsRow:          { flexDirection: 'row', gap: Spacing.md },
  btn:              { flex: 1 },
});