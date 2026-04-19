// app/client/commande/recapitulatif.tsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';

// Données de démo — en prod ces données viennent du store/params
const RECAP = {
  articles: [
    { nom: 'Fufu de manioc (x2)', magasin: 'Marché Dantokpa', prix: 1200 },
    { nom: 'Sauce graine', magasin: 'Marché Dantokpa', prix: 800 },
    { nom: 'Boisson Sobébra (x6)', magasin: 'Super Beco SN', prix: 3600 },
  ],
  adresse: 'Fidjrossè, Cotonou',
  distance: '4.2km',
  temps_estime: '35 min',
  montant_articles: 5600,
  commission_coursier: 1500,
  frais_plateforme: 400,
};

const total = RECAP.montant_articles + RECAP.commission_coursier + RECAP.frais_plateforme;

export default function RecapitulatifScreen() {
  const router = useRouter();

  const LigneTotal = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
    <View style={styles.ligne}>
      <Text style={[styles.ligneLabel, highlight && styles.ligneLabelBold]}>{label}</Text>
      <Text style={[styles.ligneValue, highlight && styles.ligneValueBold]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header showBack title="Récapitulatif de commande" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Statut recherche */}
        <View style={styles.searchBanner}>
          <View style={styles.searchIconWrapper}>
            <Ionicons name="bicycle" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.searchTitle}>Recherche de coursier en cours...</Text>
            <Text style={styles.searchSub}>Votre demande sera visible par les coursiers disponibles</Text>
          </View>
        </View>

        {/* Itinéraire */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>
          <View style={styles.itinRow}>
            <View style={styles.itinDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Point de départ</Text>
              <Text style={styles.itinVal}>Marché Dantokpa, Cotonou</Text>
            </View>
            <Text style={styles.itinMeta}>{RECAP.distance}</Text>
          </View>
          <View style={styles.itinLine} />
          <View style={styles.itinRow}>
            <View style={[styles.itinDot, styles.itinDotEnd]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Livraison</Text>
              <Text style={styles.itinVal}>{RECAP.adresse}</Text>
            </View>
            <Text style={styles.itinMeta}>{RECAP.temps_estime}</Text>
          </View>
        </View>

        {/* Articles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails de la commande</Text>
          {RECAP.articles.map((art, i) => (
            <View key={i} style={styles.articleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNom}>{art.nom}</Text>
                <Text style={styles.articleMagasin}>{art.magasin}</Text>
              </View>
              <Text style={styles.articlePrix}>{art.prix.toLocaleString()} FCFA</Text>
            </View>
          ))}
        </View>

        {/* Coûts */}
        <View style={styles.card}>
          <LigneTotal label="Sous-total articles" value={`${RECAP.montant_articles.toLocaleString()} FCFA`} />
          <LigneTotal label="Commission coursier" value={`${RECAP.commission_coursier.toLocaleString()} FCFA`} />
          <LigneTotal label="Frais plateforme" value={`${RECAP.frais_plateforme.toLocaleString()} FCFA`} />
          <View style={styles.divider} />
          <LigneTotal label="Total à payer" value={`${total.toLocaleString()} FCFA`} highlight />
        </View>

        {/* Actions */}
        <View style={styles.btnsRow}>
          <Button title="Modifier" onPress={() => router.back()} variant="outline" style={styles.btn} />
          <Button title="Confirmer la demande →" onPress={() => router.push('/client/commande/confirmation')} style={styles.btn} />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing['2xl'] },
  searchBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.base,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
  },
  searchIconWrapper: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  searchTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  searchSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  itinRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  itinDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary,
    marginTop: 4, borderWidth: 2, borderColor: Colors.primarySoft,
  },
  itinDotEnd: { backgroundColor: Colors.error },
  itinLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: 4 },
  itinLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  itinVal: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  itinMeta: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  articleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  articleNom: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  articleMagasin: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  articlePrix: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  ligneLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  ligneValue: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  ligneLabelBold: { fontFamily: FontFamily.bold, color: Colors.textPrimary, fontSize: FontSize.md },
  ligneValueBold: { fontFamily: FontFamily.bold, color: Colors.primary, fontSize: FontSize.md },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  btnsRow: { flexDirection: 'row', gap: Spacing.md },
  btn: { flex: 1 },
});
