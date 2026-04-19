// app/coursier/course/detail.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';

export default function DetailCourseCoursier() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccepter = () => {
    Alert.alert(
      'Accepter cette course ?',
      'En acceptant, le client sera notifié et devra procéder au paiement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              router.replace('/coursier/course/en-cours');
            }, 1500);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Détails de la course" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Confirmation paiement */}
        <View style={styles.paiementBanner}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
          <Text style={styles.paiementText}>
            Confirmation du paiement : Le client devra payer <Text style={styles.paiementBold}>17 000 FCFA</Text> avant le démarrage.
          </Text>
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
            <Text style={styles.itinDist}>2.3 km</Text>
          </View>
          <View style={styles.itinLine} />
          <View style={styles.itinRow}>
            <View style={[styles.itinDot, styles.itinDotEnd]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Livraison</Text>
              <Text style={styles.itinVal}>Fidjrossè, Cotonou</Text>
            </View>
            <Text style={styles.itinDist}>18 min</Text>
          </View>
        </View>

        {/* Articles à livrer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Articles à livrer</Text>
          {[
            { nom: 'Fufu de manioc x2', magasin: 'Stand A12, Dantokpa', prix: '1 200 FCFA' },
            { nom: 'Sauce graine', magasin: 'Stand A12, Dantokpa', prix: '800 FCFA' },
            { nom: 'Sobébra x6', magasin: 'Super Beco SN', prix: '3 600 FCFA' },
          ].map((art, i) => (
            <View key={i} style={styles.articleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNom}>{art.nom}</Text>
                <Text style={styles.articleMagasin}>{art.magasin}</Text>
              </View>
              <Text style={styles.articlePrix}>{art.prix}</Text>
            </View>
          ))}
        </View>

        {/* Infos client */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations de contact</Text>
          <View style={styles.clientRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientNom}>Jean Dupont</Text>
              <Text style={styles.clientTel}>12 rue du Port, Fidjrossè · +229 97 XX XX XX</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Rémunération */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Votre rémunération</Text>
          <View style={styles.remRow}>
            <Text style={styles.remLabel}>Commission coursier</Text>
            <Text style={styles.remVal}>1 500 FCFA</Text>
          </View>
          <Text style={styles.remNote}>
            ℹ️ La plateforme se charge de vous verser votre commission dès confirmation de la livraison.
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.btnsRow}>
          <Button title="Refuser" variant="outline" onPress={() => router.back()} style={styles.btn} />
          <Button title="Accepter la course" onPress={handleAccepter} loading={loading} style={styles.btn} />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing['2xl'] },
  paiementBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.success,
  },
  paiementText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  paiementBold: { fontFamily: FontFamily.bold, color: Colors.success },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  itinRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  itinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4, borderWidth: 2, borderColor: Colors.primarySoft },
  itinDotEnd: { backgroundColor: Colors.error },
  itinLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: 4 },
  itinLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  itinVal: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  itinDist: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  articleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  articleNom: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  articleMagasin: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  articlePrix: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  clientNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  clientTel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  remRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  remLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textSecondary },
  remVal: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.success },
  remNote: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  btnsRow: { flexDirection: 'row', gap: Spacing.md },
  btn: { flex: 1 },
});
