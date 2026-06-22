// app/client/course/fin.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

interface CommandeData {
  id_commande: number;
  description_articles: string;
  magasins: string;
  montant_articles: number;
  montant_course: number;
  id_coursier: string | null;
}

export default function FinCourseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id_commande = (params.id_commande as string) || '';

  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commande, setCommande] = useState<CommandeData | null>(null);
  const [coursierNom, setCoursierNom] = useState('Coursier');
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    if (!id_commande) { setLoading(false); return; }
    chargerDonnees();
  }, [id_commande]);

  const chargerDonnees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setClientId(user.id);

      const { data: cmd } = await supabase
        .from('commande')
        .select('id_commande, description_articles, magasins, montant_articles, montant_course, id_coursier')
        .eq('id_commande', id_commande)
        .single();

      if (cmd) {
        setCommande(cmd);

        if (cmd.id_coursier) {
          // RPC déjà existante pour contourner RLS sur utilisateurs
          const { data: usr } = await supabase
            .rpc('get_utilisateur_info', { p_id: cmd.id_coursier })
            .single();

          if (usr) setCoursierNom((usr as any).nom_complet || 'Coursier');
        }
      }
    } catch (err) {
      console.error('[Fin] Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnvoyerAvis = async () => {
    if (!commande?.id_coursier || !clientId) {
      router.replace('/client/commandes');
      return;
    }
    if (note === 0) {
      Alert.alert('Note manquante', 'Merci de sélectionner au moins une étoile.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('enregistrer_avis', {
        p_id_commande: Number(id_commande),
        p_id_coursier: commande.id_coursier,
        p_id_client: clientId,
        p_note: note,
        p_commentaire: commentaire || null,
      });

      if (error) {
        console.error('[Fin] Erreur enregistrer_avis:', error);
        Alert.alert('Erreur', "Impossible d'enregistrer votre avis, mais merci quand même !");
      }
    } catch (e) {
      console.error('[Fin] Exception avis:', e);
    } finally {
      setSubmitting(false);
      router.replace('/client/commandes');
    }
  };

  const articles = commande?.description_articles?.split(',') || [];
  const totalPaye = (commande?.montant_articles || 0) + (commande?.montant_course || 0);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
          {articles.length > 0 ? articles.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemNom}>{item.trim()}</Text>
            </View>
          )) : (
            <Text style={styles.itemNom}>{commande?.magasins || 'Course effectuée'}</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text style={styles.totalVal}>{totalPaye.toLocaleString()} FCFA</Text>
          </View>
        </View>

        {/* Notation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notez votre coursier</Text>
          <View style={styles.coursierMini}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.coursierNom}>{coursierNom}</Text>
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
          <TextInput
            style={styles.commentInput}
            placeholder="Ex: Très rapide et professionnel..."
            placeholderTextColor={Colors.textMuted}
            value={commentaire}
            onChangeText={setCommentaire}
            multiline
          />

          <Button
            title={submitting ? 'Envoi...' : 'Envoyer mon avis'}
            onPress={handleEnvoyerAvis}
            disabled={submitting}
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