// app/client/commande/nouvelle.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import MapPicker, { Coords } from '../../../components/ui/Mappicker';
import LocationSearch from '../../../components/ui/LocationSearch';

type TypeCourse = 'achat' | 'recuperation_colis';
type PoidsColis = 'leger' | 'lourd' | null;

interface Article {
  id: string;
  nom: string;
  quantite: string;
  magasin: string;     // nom affiché du magasin
  prix: string;
  coordsMagasin?: Coords | null; // coords GPS du magasin (depuis la carte)
}

// ── Calcul distance routière réelle via OSRM (gratuit, sans clé) ──
const calculerDistanceReelle = async (start: Coords, end: Coords): Promise<number> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=false`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distance / 1000; // km
    }
    return 0;
  } catch {
    return 0;
  }
};

export default function NouvelleCommande() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ── États de base (préremplis si on vient du bouton "Modifier") ──
  const [typeCourse, setTypeCourse] = useState<TypeCourse>(
    (params.typeCourse as TypeCourse) || 'achat'
  );
  const [adresseLivraison, setAdresseLivraison] = useState(
    (params.adresseLivraison as string) || ''
  );
  const [instructions, setInstructions] = useState(
    (params.instructions as string) || ''
  );
  const [articles, setArticles] = useState<Article[]>(
    params.articles
      ? JSON.parse(params.articles as string)
      : [{ id: '1', nom: '', quantite: '1', magasin: '', prix: '' }]
  );
  const [nomCourse, setNomCourse] = useState(
    (params.nomCourse as string) || ''
  );
  const [adresseDepart, setAdresseDepart] = useState(
    (params.adresseDepart as string) || ''
  );
  const [descriptionColis, setDescriptionColis] = useState(
    (params.descriptionColis as string) || ''
  );
  const [poidsColis, setPoidsColis] = useState<PoidsColis>(
    (params.poidsColis as PoidsColis) || null
  );
  const [allerRetour, setAllerRetour] = useState(
    params.allerRetour === 'true'
  );
  const [poidsError, setPoidsError] = useState(false);

  // ── Coordonnées GPS (source de vérité pour la distance) ──────────
  // Peut venir du bouton "Ma position" OU du MapPicker
  const [coordsLivraison, setCoordsLivraison] = useState<Coords | null>(
    params.coordsLivraison ? JSON.parse(params.coordsLivraison as string) : null
  );
  const [coordsDepart, setCoordsDepart] = useState<Coords | null>(
    params.coordsDepart ? JSON.parse(params.coordsDepart as string) : null
  );

  // ── UI states ─────────────────────────────────────────────────────
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMapLivraison, setShowMapLivraison] = useState(false);
  const [showMapDepart, setShowMapDepart]       = useState(false);
  // Carte magasin : on retient l'id de l'article en cours de géolocalisation
  const [showMapMagasin, setShowMapMagasin]     = useState(false);
  const [articleMapId, setArticleMapId]         = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // Gestion des articles
  // ─────────────────────────────────────────────────────────────────
  const addArticle = () =>
    setArticles((prev) => [
      ...prev,
      { id: Date.now().toString(), nom: '', quantite: '1', magasin: '', prix: '' },
    ]);

  const removeArticle = (id: string) => {
    if (articles.length === 1) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const updateArticle = (id: string, key: keyof Article, val: string) =>
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: val } : a)));

  // Met à jour le magasin + ses coords GPS quand l'utilisateur confirme sur la carte
  const updateArticleMagasin = (id: string, coords: Coords, adresse: string) =>
    setArticles((prev) =>
      prev.map((a) => a.id === id ? { ...a, magasin: adresse, coordsMagasin: coords } : a)
    );

  const ouvrirCarteMagasin = (id: string) => {
    setArticleMapId(id);
    setShowMapMagasin(true);
  };

  // ─────────────────────────────────────────────────────────────────
  // Bouton "Ma position" → GPS du téléphone → coords + adresse texte
  // ─────────────────────────────────────────────────────────────────
  const handleFetchCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la localisation est nécessaire.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      // Sauvegarde coords GPS pour calcul OSRM
      setCoordsLivraison({ lat: latitude, lon: longitude });

      // Géocodage inversé Nominatim → affichage adresse lisible
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'KourseGo/1.0' } }
      );
      const data = await res.json();
      setAdresseLivraison(data?.display_name || `${latitude}, ${longitude}`);
    } catch {
      Alert.alert('Erreur', "Impossible de récupérer votre position.");
    } finally {
      setLoadingLocation(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Navigation vers récapitulatif
  // TOUTE la distance et la commission sont calculées ICI
  // recapitulatif.tsx reçoit juste les résultats et les affiche
  // ─────────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!adresseLivraison.trim() && !coordsLivraison) {
      Alert.alert('Position manquante', "Choisissez l'adresse de livraison");
      return;
    }
    if (typeCourse === 'achat' && articles.some((a) => !a.nom.trim())) {
      Alert.alert('Champ manquant', 'Veuillez nommer tous les articles');
      return;
    }
    if (typeCourse === 'achat' && articles.some((a) => !a.magasin.trim())) {
      Alert.alert('Champ manquant', 'Veuillez indiquer le magasin de chaque article');
      return;
    }
    if (typeCourse === 'recuperation_colis' && !adresseDepart.trim() && !coordsDepart) {
      Alert.alert('Position manquante', "Choisissez l'adresse de récupération");
      return;
    }
    if (typeCourse === 'recuperation_colis' && !poidsColis) {
      setPoidsError(true);
      Alert.alert('Champ manquant', 'Veuillez indiquer le poids du colis');
      return;
    }

    // Afficher un loader pendant le calcul
    setLoadingLocation(true);

    try {
      let distanceKm    = 0;
      let commission    = 0;
      let montantArt    = 0;
      let total         = 0;
      let detailComm    = '';
      let legsJson      = '[]';

      const TARIF_KM        = 50;
      const TARIF_MAGASIN   = 250;
      const SUPP_LOURD      = 500;

      if (typeCourse === 'achat') {
        // ── Achat : trajet magasins → livraison ──────────────
        const waypoints: Coords[] = [];
        const magasinsUniques: string[] = [];
        const magasinsDejaPris = new Set<string>();
        let nbMagasins = 0;

        for (const art of articles) {
          const key = art.magasin;
          if (magasinsDejaPris.has(key)) continue;
          magasinsDejaPris.add(key);
          magasinsUniques.push(key);
          nbMagasins++;

          if (art.coordsMagasin) {
            waypoints.push(art.coordsMagasin);
          } else if (art.magasin) {
            try {
              const q   = encodeURIComponent(`${art.magasin}, Bénin`);
              const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, { headers: { 'User-Agent': 'KourseGo/1.0' } });
              const d   = await res.json();
              if (d && d.length > 0) waypoints.push({ lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
            } catch { /* skip */ }
          }
        }

        if (coordsLivraison) waypoints.push(coordsLivraison);

        if (waypoints.length >= 2) {
          try {
            const coordsStr = waypoints.map((p) => `${p.lon},${p.lat}`).join(';');
            const res  = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`);
            const data = await res.json();
            console.log('[OSRM] réponse:', JSON.stringify(data).slice(0, 200));
            if (data.code === 'Ok' && data.routes?.[0]) {
              distanceKm = data.routes[0].distance / 1000;
              console.log('[OSRM] distance:', distanceKm, 'km');
              legsJson = JSON.stringify(
                data.routes[0].legs.map((leg: any, i: number) => ({
                  de:       magasinsUniques[i] || `Étape ${i + 1}`,
                  vers:     i < magasinsUniques.length - 1 ? magasinsUniques[i + 1] : adresseLivraison,
                  distance: (leg.distance / 1000).toFixed(1),
                }))
              );
            }
          } catch (err) {
            console.log('[OSRM] erreur fetch:', err);
          }
        } else {
          console.log('[OSRM] pas assez de waypoints:', waypoints.length);
        }

        montantArt = articles.reduce((sum, a) => sum + (parseFloat(a.prix || '0') || 0) * (parseInt(a.quantite || '1', 10) || 1), 0);
        commission = Math.ceil(distanceKm) * TARIF_KM + nbMagasins * TARIF_MAGASIN;
        total      = montantArt + commission;
        detailComm = `${Math.ceil(distanceKm)} km × ${TARIF_KM} FCFA + ${nbMagasins} magasin${nbMagasins > 1 ? 's' : ''} × ${TARIF_MAGASIN} FCFA`;

      } else {
        // ── Récupération colis : départ → livraison ──────────
        if (coordsDepart && coordsLivraison) {
          const base = await calculerDistanceReelle(coordsDepart, coordsLivraison);
          distanceKm = allerRetour ? base * 2 : base;
        }

        const supp  = poidsColis === 'lourd' ? SUPP_LOURD : 0;
        commission  = Math.ceil(distanceKm) * TARIF_KM + supp;
        total       = commission;
        detailComm  = `${Math.ceil(distanceKm)} km × ${TARIF_KM} FCFA${allerRetour ? ' (aller-retour)' : ''}${supp ? ` + ${SUPP_LOURD} FCFA (lourd)` : ''}`;
      }

      router.push({
        pathname: '/client/commande/recapitulatif',
        params: {
          typeCourse,
          adresseLivraison,
          instructions,
          articles:        JSON.stringify(articles),
          nomCourse,
          adresseDepart,
          descriptionColis,
          poidsColis:      poidsColis || '',
          allerRetour:     allerRetour.toString(),
          // Résultats calculés → recapitulatif affiche juste
          distanceKm:      distanceKm.toFixed(2),
          montantArticles: montantArt.toFixed(0),
          commission:      commission.toFixed(0),
          total:           total.toFixed(0),
          detailCommission: detailComm,
          legs:            legsJson,
          coordsLivraison: coordsLivraison ? JSON.stringify(coordsLivraison) : '',
          coordsDepart:    coordsDepart    ? JSON.stringify(coordsDepart)    : '',
        },
      });
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de calculer la distance. Vérifiez votre connexion.');
    } finally {
      setLoadingLocation(false);
    }
  }; // fin handleContinue

  // ─────────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Header showBack title="Nouvelle demande" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Type de course */}
        <Text style={styles.label}>Type de course</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, typeCourse === 'achat' && styles.typeBtnActive]}
            onPress={() => setTypeCourse('achat')}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={20} color={typeCourse === 'achat' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.typeBtnText, typeCourse === 'achat' && styles.typeBtnTextActive]}>
              Achat en magasin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, typeCourse === 'recuperation_colis' && styles.typeBtnActive]}
            onPress={() => setTypeCourse('recuperation_colis')}
            activeOpacity={0.8}
          >
            <Ionicons name="cube-outline" size={20} color={typeCourse === 'recuperation_colis' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.typeBtnText, typeCourse === 'recuperation_colis' && styles.typeBtnTextActive]}>
              Récupération colis
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── ACHAT EN MAGASIN ─────────────────────────────────── */}
        {typeCourse === 'achat' ? (
          <>
            <Text style={styles.sectionTitle}>Articles à acheter</Text>
            {articles.map((art, idx) => (
              <View key={art.id} style={styles.articleCard}>
                <View style={styles.articleHeader}>
                  <Text style={styles.articleNum}>Article {idx + 1}</Text>
                  {articles.length > 1 && (
                    <TouchableOpacity onPress={() => removeArticle(art.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <Input
                  placeholder="Nom de l'article"
                  value={art.nom}
                  onChangeText={(v) => updateArticle(art.id, 'nom', v)}
                  leftIcon="pricetag-outline"
                />
                {/* Quantité */}
                <Input
                  placeholder="Quantité"
                  value={art.quantite}
                  onChangeText={(v) => updateArticle(art.id, 'quantite', v)}
                  keyboardType="number-pad"
                  leftIcon="layers-outline"
                />
                {/* Magasin : autocomplétion + option carte */}
                <LocationSearch
                  placeholder="Nom ou adresse du magasin..."
                  value={art.magasin}
                  onSelect={(adresse, coords) => {
                    updateArticle(art.id, 'magasin', adresse);
                    setArticles((prev) => prev.map((a) =>
                      a.id === art.id ? { ...a, coordsMagasin: coords } : a
                    ));
                  }}
                  leftIcon="storefront-outline"
                />
                <TouchableOpacity
                  style={[styles.mapBtn, art.coordsMagasin && styles.mapBtnSelected]}
                  onPress={() => ouvrirCarteMagasin(art.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={art.coordsMagasin ? 'checkmark-circle' : 'map-outline'}
                    size={16}
                    color={art.coordsMagasin ? Colors.white : Colors.primary}
                  />
                  <Text style={[styles.mapBtnText, art.coordsMagasin && styles.mapBtnTextSelected]}>
                    {art.coordsMagasin ? '📍 Magasin localisé' : '🗺️ Ou localiser sur la carte'}
                  </Text>
                </TouchableOpacity>
                <Input
                  placeholder="Prix estimé (FCFA)"
                  value={art.prix}
                  onChangeText={(v) => updateArticle(art.id, 'prix', v)}
                  keyboardType="number-pad"
                  leftIcon="cash-outline"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addArticleBtn} onPress={addArticle}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addArticleText}>Ajouter un article</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ── RÉCUPÉRATION COLIS ─────────────────────────────── */
          <>
            <Text style={styles.sectionTitle}>Informations du colis</Text>
            <Input
              label="Nom de la course"
              placeholder="Ex: Colis Dantokpa, Commande Jumia..."
              value={nomCourse}
              onChangeText={setNomCourse}
              leftIcon="bookmark-outline"
            />

            {/* Adresse de récupération : autocomplétion + option carte */}
            <Text style={styles.label}>Adresse de récupération *</Text>
            <LocationSearch
              placeholder="Tapez le quartier ou l'adresse..."
              value={adresseDepart}
              onSelect={(adresse, coords) => {
                setAdresseDepart(adresse);
                setCoordsDepart(coords);
              }}
              leftIcon="location-outline"
            />
            <TouchableOpacity
              style={[styles.mapBtn, coordsDepart && styles.mapBtnSelected, { marginBottom: Spacing.md }]}
              onPress={() => setShowMapDepart(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={coordsDepart ? 'checkmark-circle' : 'map-outline'}
                size={16}
                color={coordsDepart ? Colors.white : Colors.primary}
              />
              <Text style={[styles.mapBtnText, coordsDepart && styles.mapBtnTextSelected]}>
                {coordsDepart ? '📍 Position confirmée' : '🗺️ Ou choisir sur la carte'}
              </Text>
            </TouchableOpacity>

            <Input
              label="Description du colis"
              placeholder="Ex: Colis Amazon, boîte bleue, 2 kg..."
              value={descriptionColis}
              onChangeText={setDescriptionColis}
              leftIcon="cube-outline"
              multiline
              numberOfLines={3}
            />

            {/* Poids du colis */}
            <View style={styles.poidsSection}>
              <View style={styles.poidsTitleRow}>
                <Text style={styles.sectionTitle}>Poids du colis</Text>
                <Text style={styles.poidsObligatoire}>* obligatoire</Text>
              </View>
              {poidsError && !poidsColis && (
                <View style={styles.poidsAlert}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                  <Text style={styles.poidsAlertText}>Veuillez sélectionner le poids</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.poidsOption, poidsColis === 'leger' && styles.poidsOptionActive, poidsError && !poidsColis && styles.poidsOptionError]}
                onPress={() => { setPoidsColis('leger'); setPoidsError(false); }}
                activeOpacity={0.8}
              >
                <View style={[styles.poidsCheckbox, poidsColis === 'leger' && styles.poidsCheckboxActive]}>
                  {poidsColis === 'leger' && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <View style={styles.poidsIconBox}><Text style={styles.poidsEmoji}>🪶</Text></View>
                <View style={styles.poidsTexts}>
                  <Text style={[styles.poidsOptionTitle, poidsColis === 'leger' && styles.poidsOptionTitleActive]}>Colis léger</Text>
                  <Text style={styles.poidsOptionSub}>Moins de 10 kg — sac, boîte légère</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.poidsOption, poidsColis === 'lourd' && styles.poidsOptionActive, poidsError && !poidsColis && styles.poidsOptionError]}
                onPress={() => { setPoidsColis('lourd'); setPoidsError(false); }}
                activeOpacity={0.8}
              >
                <View style={[styles.poidsCheckbox, poidsColis === 'lourd' && styles.poidsCheckboxActive]}>
                  {poidsColis === 'lourd' && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <View style={styles.poidsIconBox}><Text style={styles.poidsEmoji}>🏋️</Text></View>
                <View style={styles.poidsTexts}>
                  <Text style={[styles.poidsOptionTitle, poidsColis === 'lourd' && styles.poidsOptionTitleActive]}>Colis lourd</Text>
                  <Text style={styles.poidsOptionSub}>Plus de 10 kg — électroménager, groupe...</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Aller-retour */}
            <TouchableOpacity
              style={[styles.allerRetourBtn, allerRetour && styles.allerRetourBtnActive]}
              onPress={() => setAllerRetour((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={styles.allerRetourLeft}>
                <Ionicons name="swap-horizontal-outline" size={22} color={allerRetour ? Colors.white : Colors.primary} />
                <View>
                  <Text style={[styles.allerRetourTitle, allerRetour && styles.allerRetourTitleActive]}>Aller & Retour</Text>
                  <Text style={[styles.allerRetourSub, allerRetour && styles.allerRetourSubActive]}>Le coursier revient après livraison</Text>
                </View>
              </View>
              <View style={[styles.toggle, allerRetour && styles.toggleActive]}>
                <View style={[styles.toggleThumb, allerRetour && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── ADRESSE DE LIVRAISON ─────────────────────────────── */}
        <View style={styles.deliveryHeaderRow}>
          <Text style={styles.sectionTitle}>Livraison</Text>
          <TouchableOpacity
            onPress={handleFetchCurrentLocation}
            style={styles.locationButton}
            disabled={loadingLocation}
          >
            {loadingLocation
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <><Ionicons name="locate" size={16} color={Colors.primary} /><Text style={styles.locationButtonText}>Ma position</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Autocomplétion : l'utilisateur tape → suggestions Nominatim → coords GPS */}
        <LocationSearch
          placeholder="Tapez le quartier ou l'adresse..."
          value={adresseLivraison}
          onSelect={(adresse, coords) => {
            setAdresseLivraison(adresse);
            setCoordsLivraison(coords);
          }}
          leftIcon="home-outline"
        />

        {/* Option carte pour ceux qui préfèrent pointer */}
        <TouchableOpacity
          style={[styles.mapBtn, coordsLivraison && styles.mapBtnSelected]}
          onPress={() => setShowMapLivraison(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={coordsLivraison ? 'checkmark-circle' : 'map-outline'}
            size={16}
            color={coordsLivraison ? Colors.white : Colors.primary}
          />
          <Text style={[styles.mapBtnText, coordsLivraison && styles.mapBtnTextSelected]}>
            {coordsLivraison ? '📍 Position confirmée' : '🗺️ Ou choisir sur la carte'}
          </Text>
        </TouchableOpacity>

        <Input
          label="Instructions (optionnel)"
          placeholder="Ex: Appeler à l'arrivée, porte bleue..."
          value={instructions}
          onChangeText={setInstructions}
          leftIcon="chatbubble-outline"
          multiline
          numberOfLines={2}
        />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.infoText}>
            {coordsLivraison
              ? '✅ Position GPS confirmée — la distance sera calculée précisément.'
              : 'Utilisez "Ma position" ou "Préciser sur la carte" pour un calcul de distance exact.'}
          </Text>
        </View>

        <Button title="Voir le récapitulatif →" onPress={handleContinue} style={{ marginTop: Spacing.lg }} />
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modale carte magasin ─────────────────────────────── */}
      <MapPicker
        visible={showMapMagasin}
        onClose={() => { setShowMapMagasin(false); setArticleMapId(null); }}
        title="Localiser le magasin"
        onSelect={(coords: Coords, adresse: string) => {
          if (articleMapId) updateArticleMagasin(articleMapId, coords, adresse);
        }}
        initialCoords={
          articleMapId
            ? articles.find((a) => a.id === articleMapId)?.coordsMagasin || undefined
            : undefined
        }
      />

      {/* ── Modale carte livraison ────────────────────────────── */}
      <MapPicker
        visible={showMapLivraison}
        onClose={() => setShowMapLivraison(false)}
        title="Point de livraison"
        onSelect={(coords: Coords, adresse: string) => {
          setCoordsLivraison(coords);
          setAdresseLivraison(adresse);
        }}
        initialCoords={coordsLivraison || undefined}
      />

      {/* ── Modale carte récupération colis ──────────────────── */}
      <MapPicker
        visible={showMapDepart}
        onClose={() => setShowMapDepart(false)}
        title="Point de récupération du colis"
        onSelect={(coords: Coords, adresse: string) => {
          setCoordsDepart(coords);
          setAdresseDepart(adresse);
        }}
        initialCoords={coordsDepart || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: Colors.white },
  content:                { padding: Spacing['2xl'] },
  label:                  { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  typeRow:                { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  typeBtn:                { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  typeBtnActive:          { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText:            { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  typeBtnTextActive:      { color: Colors.white },
  sectionTitle:           { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  articleCard:            { backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md },
  articleHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  articleNum:             { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  row:                    { flexDirection: 'row', alignItems: 'flex-start' },
  addArticleBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', marginBottom: Spacing.xl },
  addArticleText:         { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.primary },
  poidsSection:           { marginBottom: Spacing.lg },
  poidsTitleRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  poidsObligatoire:       { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error, marginBottom: Spacing.md },
  poidsAlert:             { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  poidsAlertText:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error },
  poidsOption:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.white },
  poidsOptionActive:      { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  poidsOptionError:       { borderColor: Colors.error },
  poidsCheckbox:          { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  poidsCheckboxActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  poidsIconBox:           { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceGray, alignItems: 'center', justifyContent: 'center' },
  poidsEmoji:             { fontSize: 22 },
  poidsTexts:             { flex: 1 },
  poidsOptionTitle:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  poidsOptionTitleActive: { color: Colors.primary },
  poidsOptionSub:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  allerRetourBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.primarySoft, marginBottom: Spacing.lg },
  allerRetourBtnActive:   { backgroundColor: Colors.primary },
  allerRetourLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  allerRetourTitle:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.primary },
  allerRetourTitleActive: { color: Colors.white },
  allerRetourSub:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  allerRetourSubActive:   { color: 'rgba(255,255,255,0.8)' },
  toggle:                 { width: 44, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', padding: 2 },
  toggleActive:           { backgroundColor: 'rgba(255,255,255,0.3)' },
  toggleThumb:            { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary },
  toggleThumbActive:      { backgroundColor: Colors.white, alignSelf: 'flex-end' },
  deliveryHeaderRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  locationButton:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  locationButtonText:     { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  infoBox:                { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.infoLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  infoText:               { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.info, lineHeight: 18 },
  // Bouton carte compact
  mapBtn:                 { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.primarySoft },
  mapBtnSelected:         { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mapBtnText:             { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary, flex: 1 },
  mapBtnTextSelected:     { color: Colors.white },
});