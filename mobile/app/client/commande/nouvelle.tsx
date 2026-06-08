// app/client/commande/nouvelle.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface Article {
  id: string;
  nom: string;
  quantite: string;
  prix: string;       // ← prix saisi par le client
  magasin: string;
}

export default function NouvelleCommande() {
  const router = useRouter();
  const [adresseLivraison, setAdresseLivraison] = useState('');
  const [instructions, setInstructions] = useState('');
  const [articles, setArticles] = useState<Article[]>([
    { id: '1', nom: '', quantite: '1', prix: '', magasin: '' },
  ]);

  // ─── Calcul total articles (affiché en live) ───────────────────────────
  const totalArticles = articles.reduce((sum, a) => {
    const prix = parseFloat(a.prix) || 0;
    const qte = parseInt(a.quantite) || 1;
    return sum + prix * qte;
  }, 0);

  const formatFCFA = (val: number) =>
    val > 0 ? val.toLocaleString('fr-FR') + ' FCFA' : '—';

  // ─── Actions articles ─────────────────────────────────────────────────
  const addArticle = () => {
    setArticles((prev) => [
      ...prev,
      { id: Date.now().toString(), nom: '', quantite: '1', prix: '', magasin: '' },
    ]);
  };

  const removeArticle = (id: string) => {
    if (articles.length === 1) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const updateArticle = (id: string, key: keyof Article, val: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: val } : a))
    );
  };

  // ─── Validation et navigation ─────────────────────────────────────────
  const handleContinue = () => {
    if (articles.some((a) => !a.nom.trim())) {
      Alert.alert('Champ manquant', 'Veuillez nommer tous les articles');
      return;
    }
    if (articles.some((a) => !a.prix.trim() || parseFloat(a.prix) <= 0)) {
      Alert.alert('Prix manquant', 'Veuillez entrer le prix de chaque article');
      return;
    }
    if (!adresseLivraison.trim()) {
      Alert.alert('Champ manquant', "Veuillez entrer l'adresse de livraison");
      return;
    }
    // TODO: sauvegarder articles + adresse dans le commandeStore
    // useCommandeStore.getState().setArticles(articles)
    // useCommandeStore.getState().setAdresseLivraison(adresseLivraison)
    router.push('/client/commande/recapitulatif');
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Nouvelle demande" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Articles ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Articles à acheter</Text>

        {articles.map((art, idx) => (
          <View key={art.id} style={styles.articleCard}>

            {/* En-tête */}
            <View style={styles.articleHeader}>
              <View style={styles.numBadge}>
                <Text style={styles.numBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={styles.articleLabel}>Article {idx + 1}</Text>
              {articles.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeArticle(art.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Nom de l'article */}
            <Input
              placeholder="Nom de l'article (ex: Riz local, savon...)"
              value={art.nom}
              onChangeText={(v) => updateArticle(art.id, 'nom', v)}
              leftIcon="pricetag-outline"
            />

            {/* Quantité + Prix */}
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
              <View style={{ flex: 2.2, marginLeft: Spacing.sm }}>
                {/* ← Champ prix — le backend calculera commission + frais plateforme */}
                <Input
                  placeholder="Prix unitaire (FCFA)"
                  value={art.prix}
                  onChangeText={(v) => updateArticle(art.id, 'prix', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  leftIcon="cash-outline"
                />
              </View>
            </View>

            {/* Magasin */}
            <Input
              placeholder="Magasin / Lieu d'achat (ex: Marché Dantokpa)"
              value={art.magasin}
              onChangeText={(v) => updateArticle(art.id, 'magasin', v)}
              leftIcon="storefront-outline"
            />

            {/* Sous-total de cet article */}
            {parseFloat(art.prix) > 0 && (
              <View style={styles.subtotalRow}>
                <Ionicons name="calculator-outline" size={13} color={Colors.primary} />
                <Text style={styles.subtotalText}>
                  Sous-total :{' '}
                  <Text style={styles.subtotalVal}>
                    {formatFCFA((parseFloat(art.prix) || 0) * (parseInt(art.quantite) || 1))}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Bouton ajouter article */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={addArticle}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Ajouter un article</Text>
        </TouchableOpacity>

        {/* ── Résumé montant articles ────────────────────────────────────── */}
        {totalArticles > 0 && (
          <View style={styles.resumeCard}>
            <View style={styles.resumeRow}>
              <Text style={styles.resumeLabel}>Montant total articles</Text>
              <Text style={styles.resumeVal}>{formatFCFA(totalArticles)}</Text>
            </View>
            <View style={styles.resumeDivider} />
            <View style={styles.resumeRow}>
              <Text style={styles.resumeHint}>
                Commission livreur + frais plateforme calculés par le serveur
              </Text>
              <Ionicons name="server-outline" size={14} color={Colors.textLight} />
            </View>
          </View>
        )}

        {/* ── Livraison ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Livraison</Text>

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

        {/* Bouton continuer */}
        <Button
          title="Voir le récapitulatif →"
          onPress={handleContinue}
          style={{ marginTop: Spacing.lg }}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing['2xl'] },

  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Carte article
  articleCard: {
    backgroundColor: Colors.surfaceGray,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  numBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  articleLabel: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Sous-total article
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginTop: -Spacing.xs,
  },
  subtotalText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  subtotalVal: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },

  // Bouton ajouter
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.xl,
  },
  addBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.primary,
  },

  // Résumé montant
  resumeCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  resumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumeLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  resumeVal: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  resumeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  resumeHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textLight,
    flex: 1,
    marginRight: Spacing.sm,
    fontStyle: 'italic',
  },
});
