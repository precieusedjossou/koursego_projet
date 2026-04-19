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
  // Pour récupération colis
  const [adresseDepart, setAdresseDepart] = useState('');
  const [descriptionColis, setDescriptionColis] = useState('');

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

        {/* Info estimation */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.infoText}>
            Le coût total sera estimé (articles + commission coursier + frais plateforme) avant confirmation.
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
  typeBtnText: {
    fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary,
  },
  typeBtnTextActive: { color: Colors.white },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base,
    color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  articleCard: {
    backgroundColor: Colors.surfaceGray,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  articleHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  articleNum: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  addArticleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.primary, borderStyle: 'dashed',
    marginBottom: Spacing.xl,
  },
  addArticleText: {
    fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.primary,
  },
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
