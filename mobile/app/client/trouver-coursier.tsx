// app/client/trouver-coursier.tsx
// ⚠️ Page non encore designée dans la maquette — placeholder à compléter
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing } from '../../constants/Typography';
import Header from '../../components/shared/Header';
import Button from '../../components/ui/Button';
import { useRouter } from 'expo-router';

export default function TrouverCoursierScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Header showBack title="Trouver un coursier" />
      <View style={styles.content}>
        <Ionicons name="bicycle-outline" size={80} color={Colors.primaryLight} />
        <Text style={styles.title}>Bientôt disponible</Text>
        <Text style={styles.desc}>
          La fonctionnalité "Trouver un coursier disponible" est en cours de développement.
          Utilisez "Lancer une course" pour l'instant.
        </Text>
        <Button title="Lancer une course" onPress={() => router.push('/client/commande/nouvelle')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing['2xl'], gap: Spacing.base,
  },
  title: {
    fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary,
  },
  desc: {
    fontFamily: FontFamily.regular, fontSize: FontSize.base,
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 22,
    marginBottom: Spacing.base,
  },
});
