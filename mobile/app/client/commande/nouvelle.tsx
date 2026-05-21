// app/client/commande/nouvelle.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

type TypeCourse = 'achat' | 'recuperation_colis';

interface Article {
  id: string;
  nom: string;
  quantite: string;
  magasin: string;
  prix: string;
}

export default function NouvelleCommande() {
  const router = useRouter();
  const [typeCourse, setTypeCourse]             = useState<TypeCourse>('achat');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [instructions, setInstructions]         = useState('');
  const [loading, setLoading]                   = useState(false);
  const [locationLoading, setLocationLoading]   = useState(false);
  const [gpsCoords, setGpsCoords]               = useState<{ lat: number; lon: number } | null>(null);
  const [articles, setArticles]                 = useState<Article[]>([
    { id: '1', nom: '', quantite: '1', magasin: '', prix: '' },
  ]);
  const [adresseDepart, setAdresseDepart]       = useState('');
  const [descriptionColis, setDescriptionColis] = useState('');

  useEffect(() => { getLocation(); }, []);

  // ── Géolocalisation GPS du téléphone ────────────────────────
  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });

      // Géocodage inverse pour pré-remplir l'adresse
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
      });
      if (addr) {
        setAdresseLivraison([addr.street, addr.district, addr.city].filter(Boolean).join(', '));
      }
    } catch (e) {
      console.log('GPS non disponible:', e);
    } finally {
      setLocationLoading(false);
    }
  };

  const addArticle    = () => setArticles(p => [...p, { id: Date.now().toString(), nom: '', quantite: '1', magasin: '', prix: '' }]);
  const removeArticle = (id: string) => { if (articles.length > 1) setArticles(p => p.filter(a => a.id !== id)); };
  const updateArticle = (id: string, key: keyof Article, val: string) =>
    setArticles(p => p.map(a => a.id === id ? { ...a, [key]: val } : a));

  const handleContinue = async () => {
    if (!adresseLivraison.trim()) { Alert.alert('Champ manquant', "Veuillez entrer l'adresse de livraison"); return; }
    if (typeCourse === 'achat' && articles.some(a => !a.nom.trim())) { Alert.alert('Champ manquant', 'Veuillez nommer tous les articles'); return; }
    if (typeCourse === 'recuperation_colis' && !adresseDepart.trim()) { Alert.alert('Champ manquant', "Veuillez entrer l'adresse de récupération"); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }

      const descriptionArticles = typeCourse === 'achat'
        ? articles.map(a => `${a.quantite}x ${a.nom} (${a.magasin || 'lieu non précisé'})`).join(', ')
        : descriptionColis;

      const magasins = typeCourse === 'achat'
        ? [...new Set(articles.map(a => a.magasin).filter(Boolean))].join(', ')
        : adresseDepart;

      const { data: demande, error } = await supabase
        .from('demande_courses')
        .insert({
          id_client:            user.id,
          description_articles: descriptionArticles,
          magasins,
          adresse_livraison:    adresseLivraison.trim(),
          // Coordonnées GPS du point de livraison (position actuelle du client)
          latitude_livraison:   gpsCoords?.lat  ?? null,
          longitude_livraison:  gpsCoords?.lon  ?? null,
          statut_demande:       'en_attente',
          date_demande:         new Date().toISOString(),
        })
        .select().single();

      if (error || !demande) { Alert.alert('Erreur', 'Impossible de créer la demande.'); return; }

      if (typeCourse === 'achat') {
        await supabase.from('articles').insert(
          articles.map(a => ({
            id_demande:  demande.id_demande,
            nom:         a.nom.trim(),
            quantite:    parseInt(a.quantite) || 1,
            magasin:     a.magasin.trim(),
            prix_estime: a.prix ? parseInt(a.prix) : null,
          }))
        );
      }

      router.push({
        pathname: '/client/commande/recapitulatif',
        params: { id_demande: demande.id_demande.toString() },
      });
    } catch { Alert.alert('Erreur', 'Une erreur réseau est survenue.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Nouvelle demande" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Type de course */}
        <Text style={styles.label}>Type de course</Text>
        <View style={styles.typeRow}>
          {(['achat', 'recuperation_colis'] as TypeCourse[]).map(type => (
            <TouchableOpacity key={type}
              style={[styles.typeBtn, typeCourse === type && styles.typeBtnActive]}
              onPress={() => setTypeCourse(type)} activeOpacity={0.8}>
              <Ionicons name={type === 'achat' ? 'cart-outline' : 'cube-outline'} size={20}
                color={typeCourse === type ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.typeBtnText, typeCourse === type && styles.typeBtnTextActive]}>
                {type === 'achat' ? 'Achat en magasin' : 'Récupération colis'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Achat */}
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
                <Input placeholder="Nom de l'article" value={art.nom}
                  onChangeText={v => updateArticle(art.id, 'nom', v)} leftIcon="pricetag-outline" />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Input placeholder="Qté" value={art.quantite}
                      onChangeText={v => updateArticle(art.id, 'quantite', v)}
                      keyboardType="number-pad" leftIcon="layers-outline" />
                  </View>
                  <View style={{ flex: 2, marginLeft: Spacing.sm }}>
                    <Input placeholder="Magasin / Lieu" value={art.magasin}
                      onChangeText={v => updateArticle(art.id, 'magasin', v)} leftIcon="storefront-outline" />
                  </View>
                </View>
                <Input placeholder="Prix estimé (FCFA)" value={art.prix}
                  onChangeText={v => updateArticle(art.id, 'prix', v)}
                  keyboardType="number-pad" leftIcon="cash-outline" />
              </View>
            ))}
            <TouchableOpacity style={styles.addArticleBtn} onPress={addArticle}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addArticleText}>Ajouter un article</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Informations du colis</Text>
            <Input label="Adresse de récupération" placeholder="Où chercher le colis ?"
              value={adresseDepart} onChangeText={setAdresseDepart} leftIcon="location-outline" />
            <Input label="Description du colis" placeholder="Ex: Colis Amazon, boîte bleue, 2kg..."
              value={descriptionColis} onChangeText={setDescriptionColis}
              leftIcon="cube-outline" multiline numberOfLines={3} />
          </>
        )}

        {/* Livraison */}
        <Text style={styles.sectionTitle}>Livraison</Text>
        <TouchableOpacity style={styles.geoBtn} onPress={getLocation} disabled={locationLoading}>
          {locationLoading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Ionicons name="locate-outline" size={18} color={Colors.primary} />}
          <Text style={styles.geoBtnText}>
            {locationLoading ? 'Localisation...' : gpsCoords ? '📍 Position détectée — actualiser' : 'Utiliser ma position actuelle'}
          </Text>
        </TouchableOpacity>

        <Input label="Adresse de livraison" placeholder="Ex: Fidjrossè, Cotonou"
          value={adresseLivraison} onChangeText={setAdresseLivraison} leftIcon="home-outline" />
        <Input label="Instructions (optionnel)" placeholder="Ex: Appeler à l'arrivée, porte bleue..."
          value={instructions} onChangeText={setInstructions}
          leftIcon="chatbubble-outline" multiline numberOfLines={2} />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.infoText}>Le coût sera calculé automatiquement selon la distance réelle.</Text>
        </View>

        <Button title="Voir le récapitulatif →" onPress={handleContinue} loading={loading} style={{ marginTop: Spacing.lg }} />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.white },
  content:         { padding: Spacing['2xl'] },
  label:           { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  typeRow:         { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  typeBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  typeBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText:     { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.white },
  sectionTitle:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  articleCard:     { backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md },
  articleHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  articleNum:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  row:             { flexDirection: 'row', alignItems: 'flex-start' },
  addArticleBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', marginBottom: Spacing.xl },
  addArticleText:  { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.primary },
  geoBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primarySoft, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary },
  geoBtnText:      { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary, flex: 1 },
  infoBox:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.infoLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  infoText:        { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.info, lineHeight: 18 },
});