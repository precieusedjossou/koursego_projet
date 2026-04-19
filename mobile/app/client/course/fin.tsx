// app/client/course/fin.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Button from '../../../components/ui/Button';

export default function FinCourseScreen() {
  const router = useRouter();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Félicitations */}
        <View style={styles.heroCard}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          <Text style={styles.heroTitle}>Félicitations !</Text>
          <Text style={styles.heroSub}>
            Votre course a été effectuée avec succès. Merci d'utiliser KourseGO 🎉
          </Text>
          <View style={styles.ratingHighlight}>
            <Ionicons name="star" size={16} color={Colors.primary} />
            <Text style={styles.ratingHighlightText}>
              +150 pts · Course complétée
            </Text>
          </View>
        </View>

        {/* Récap commande */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif de la course</Text>
          {[
            { label: 'Riz local (x2)', prix: '2 600 FCFA' },
            { label: 'Pâte', prix: '2 600 FCFA' },
          ].map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemNom}>{item.label}</Text>
              <Text style={styles.itemPrix}>{item.prix}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text style={styles.totalVal}>17 500 FCFA</Text>
          </View>
        </View>

        {/* Notation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notez votre coursier</Text>
          <View style={styles.coursierMini}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.coursierNom}>Moussa Elabidi</Text>
          </View>

          <Text style={styles.noteLabel}>Votre expérience</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setNote(star)}>
                <Ionicons
                  name={star <= note ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= note ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.noteLabel}>Commentaire (optionnel)</Text>
          <View style={styles.commentInput}>
            <Text style={styles.commentPlaceholder}>
              {commentaire || 'Ex: Très rapide et professionnel...'}
            </Text>
          </View>

          <Button
            title="Envoyer mon avis"
            onPress={() => router.replace('/client/commandes')}
            style={{ marginTop: Spacing.md }}
          />
        </View>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace('/client/home')}
        >
          <Text style={styles.skipText}>Passer cette étape</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing['2xl'], paddingTop: 60 },
  heroCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.md,
  },
  heroTitle: {
    fontFamily: FontFamily.bold, fontSize: FontSize['2xl'],
    color: Colors.textPrimary, marginVertical: Spacing.sm,
  },
  heroSub: {
    fontFamily: FontFamily.regular, fontSize: FontSize.base,
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.md,
  },
  ratingHighlight: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primarySoft, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: BorderRadius.full,
  },
  ratingHighlightText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  itemNom: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  itemPrix: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  totalLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  totalVal: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  coursierMini: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  coursierNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  noteLabel: {
    fontFamily: FontFamily.medium, fontSize: FontSize.sm,
    color: Colors.textSecondary, marginBottom: Spacing.sm,
  },
  starsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  commentInput: {
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.md,
    padding: Spacing.base, minHeight: 80,
  },
  commentPlaceholder: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textMuted },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textSecondary },
});
