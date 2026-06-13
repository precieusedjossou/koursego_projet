// app/client/commande/nouvelle.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

type TypeCourse = 'achat' | 'recuperation_colis';
type PoidsColis = 'leger' | 'lourd' | null;

interface Article {
  id: string;
  nom: string;
  quantite: string;
  magasin: string;
}

export default function NouvelleCommande() {
  const router = useRouter();
  const [typeCourse, setTypeCourse] = useState<TypeCourse>('achat');
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [instructions, setInstructions] = useState('');
  const [articles, setArticles] = useState<Article[]>([
    { id: '1', nom: '', quantite: '1', magasin: '' },
  ]);

  const [nomCourse, setNomCourse] = useState('');
  const [adresseDepart, setAdresseDepart] = useState('');
  const [descriptionColis, setDescriptionColis] = useState('');
  const [poidsColis, setPoidsColis] = useState<PoidsColis>(null);
  const [allerRetour, setAllerRetour] = useState(false);
  const [poidsError, setPoidsError] = useState(false);

  const addArticle = () => {
    setArticles((prev) => [
      ...prev,
      { id: Date.now().toString(), nom: '', quantite: '1', magasin: '' },
    ]);
  };

  const removeArticle = (id: string) => {
    if (articles.length === 1) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const updateArticle = (id: string, key: keyof Article, val: string) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: val } : a)));
  };

  const handleContinue = () => {
    if (!adresseLivraison.trim()) {
      Alert.alert('Champ manquant', "Veuillez entrer l'adresse de livraison");
      return;
    }
    if (typeCourse === 'achat' && articles.some((a) => !a.nom.trim())) {
      Alert.alert('Champ manquant', 'Veuillez nommer tous les articles');
      return;
    }
    if (typeCourse === 'recuperation_colis') {
      if (!nomCourse.trim()) {
        Alert.alert('Champ manquant', 'Veuillez donner un nom à cette course');
        return;
      }
      if (!poidsColis) {
        setPoidsError(true);
        Alert.alert('Champ manquant', 'Veuillez indiquer le poids du colis');
        return;
      }
    }
    router.push('/client/commande/recapitulatif');
  };

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

        {/* Formulaire selon type */}
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
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Input
                      placeholder="Qté"
                      value={art.quantite}
                      onChangeText={(v) => updateArticle(art.id, 'quantite', v)}
                      keyboardType="number-pad"
                      leftIcon="layers-outline"
                    />
                  </View>
                  <View style={{ flex: 2, marginLeft: Spacing.sm }}>
                    <Input
                      placeholder="Magasin / Lieu"
                      value={art.magasin}
                      onChangeText={(v) => updateArticle(art.id, 'magasin', v)}
                      leftIcon="storefront-outline"
                    />
                  </View>
                </View>
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

            <Input
              label="Nom de la course"
              placeholder="Ex: Colis Marché Dantokpa, Commande Jumia..."
              value={nomCourse}
              onChangeText={setNomCourse}
              leftIcon="bookmark-outline"
            />
            <Input
              label="Adresse de récupération"
              placeholder="Où chercher le colis ?"
              value={adresseDepart}
              onChangeText={setAdresseDepart}
              leftIcon="location-outline"
            />
            <Input
              label="Description du colis"
              placeholder="Ex: Colis Amazon, boîte bleue, 2kg..."
              value={descriptionColis}
              onChangeText={setDescriptionColis}
              leftIcon="cube-outline"
              multiline
              numberOfLines={3}
            />

            {/* ── Poids du colis ── */}
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
                style={[
                  styles.poidsOption,
                  poidsColis === 'leger' && styles.poidsOptionActive,
                  poidsError && !poidsColis && styles.poidsOptionError,
                ]}
                onPress={() => { setPoidsColis('leger'); setPoidsError(false); }}
                activeOpacity={0.8}
              >
                <View style={[styles.poidsCheckbox, poidsColis === 'leger' && styles.poidsCheckboxActive]}>
                  {poidsColis === 'leger' && (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  )}
                </View>
                <View style={styles.poidsIconBox}>
                  <Text style={styles.poidsEmoji}>🪶</Text>
                </View>
                <View style={styles.poidsTexts}>
                  <Text style={[styles.poidsOptionTitle, poidsColis === 'leger' && styles.poidsOptionTitleActive]}>
                    Colis léger
                  </Text>
                  <Text style={styles.poidsOptionSub}>Moins de 10 kg — sac, boîte légère</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.poidsOption,
                  poidsColis === 'lourd' && styles.poidsOptionActive,
                  poidsError && !poidsColis && styles.poidsOptionError,
                ]}
                onPress={() => { setPoidsColis('lourd'); setPoidsError(false); }}
                activeOpacity={0.8}
              >
                <View style={[styles.poidsCheckbox, poidsColis === 'lourd' && styles.poidsCheckboxActive]}>
                  {poidsColis === 'lourd' && (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  )}
                </View>
                <View style={styles.poidsIconBox}>
                  <Text style={styles.poidsEmoji}>🏋️</Text>
                </View>
                <View style={styles.poidsTexts}>
                  <Text style={[styles.poidsOptionTitle, poidsColis === 'lourd' && styles.poidsOptionTitleActive]}>
                    Colis lourd
                  </Text>
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
                <Ionicons
                  name="swap-horizontal-outline"
                  size={22}
                  color={allerRetour ? Colors.white : Colors.primary}
                />
                <View>
                  <Text style={[styles.allerRetourTitle, allerRetour && styles.allerRetourTitleActive]}>
                    Aller & Retour
                  </Text>
                  <Text style={[styles.allerRetourSub, allerRetour && styles.allerRetourSubActive]}>
                    Le coursier revient après livraison
                  </Text>
                </View>
              </View>
              <View style={[styles.toggle, allerRetour && styles.toggleActive]}>
                <View style={[styles.toggleThumb, allerRetour && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Adresse livraison */}
        <Text style={styles.sectionTitle}>Livraison</Text>
        <Input
          label="Adresse de livraison"
          placeholder="Où livrer ?"
          value={adresseLivraison}
          onChangeText={setAdresseLivraison}
          leftIcon="home-outline"
        />
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
            Le coût total sera estimé (articles + commission coursier) avant confirmation.
          </Text>
        </View>

        <Button title="Voir le récapitulatif →" onPress={handleContinue} style={{ marginTop: Spacing.lg }} />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing['2xl'] },
  label: {
    fontFamily: FontFamily.medium, fontSize: FontSize.sm,
    color: Colors.textSecondary, marginBottom: Spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.white },

  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base,
    color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm,
  },

  // Articles
  articleCard: {
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.md,
  },
  articleHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  articleNum: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  addArticleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.primary, borderStyle: 'dashed', marginBottom: Spacing.xl,
  },
  addArticleText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.primary },

  // Poids
  poidsSection: { marginBottom: Spacing.lg },
  poidsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  poidsObligatoire: {
    fontFamily: FontFamily.regular, fontSize: FontSize.xs,
    color: Colors.error, marginBottom: Spacing.md,
  },
  poidsAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.sm,
  },
  poidsAlertText: {
    fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.error,
  },
  poidsOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, padding: Spacing.base,
    marginBottom: Spacing.sm, backgroundColor: Colors.white,
  },
  poidsOptionActive: {
    borderColor: Colors.primary, backgroundColor: Colors.primarySoft,
  },
  poidsOptionError: {
    borderColor: Colors.error,
  },
  poidsCheckbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  poidsCheckboxActive: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  poidsIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.surfaceGray,
    alignItems: 'center', justifyContent: 'center',
  },
  poidsEmoji: { fontSize: 22 },
  poidsTexts: { flex: 1 },
  poidsOptionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary,
  },
  poidsOptionTitleActive: { color: Colors.primary },
  poidsOptionSub: {
    fontFamily: FontFamily.regular, fontSize: FontSize.xs,
    color: Colors.textSecondary, marginTop: 2,
  },

  // Aller-retour
  allerRetourBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft, marginBottom: Spacing.lg,
  },
  allerRetourBtnActive: { backgroundColor: Colors.primary },
  allerRetourLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  allerRetourTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.primary },
  allerRetourTitleActive: { color: Colors.white },
  allerRetourSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  allerRetourSubActive: { color: 'rgba(255,255,255,0.8)' },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary },
  toggleThumbActive: { backgroundColor: Colors.white, alignSelf: 'flex-end' },

  // Info
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.infoLight, padding: Spacing.md,
    borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  infoText: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs,
    color: Colors.info, lineHeight: 18,
  },
});