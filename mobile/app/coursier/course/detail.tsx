// app/coursier/course/detail.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

// ── Types ────────────────────────────────────────────────────
interface DetailCourse {
  id_demande: number;
  id_client: string;
  nom_client: string;
  telephone_client: string;
  adresse_livraison: string;
  description_articles: string;
  magasins: string;
  montant_articles: number;
  commission_coursier: number;
  part_plateforme: number;
  estimation_prix: number;
  date_demande: string;
}

interface Article {
  id_article: number;
  nom: string;
  quantite: number;
  magasin: string | null;
  prix_estime: number | null;
}

export default function DetailCourseCoursier() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ id_demande: string }>();

  const [detail, setDetail]   = useState<DetailCourse | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [userId, setUserId]   = useState<string | null>(null);

  // ── Chargement ───────────────────────────────────────────
  useEffect(() => {
    if (params.id_demande) {
      loadDetail(Number(params.id_demande));
    }
  }, [params.id_demande]);

  const loadDetail = async (idDemande: number) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      // Charger la demande
      const { data: demande, error } = await supabase
        .from('demande_courses')
        .select(`
          id_demande,
          id_client,
          description_articles,
          magasins,
          adresse_livraison,
          montant_articles,
          commission_coursier,
          part_plateforme,
          estimation_prix,
          date_demande,
          statut_demande
        `)
        .eq('id_demande', idDemande)
        .single();

      if (error || !demande) {
        Alert.alert('Erreur', 'Course introuvable.');
        router.back();
        return;
      }

      // Vérifier que la demande est encore disponible
      if (demande.statut_demande !== 'en_attente') {
        Alert.alert('Course non disponible', 'Cette course a déjà été acceptée par un autre coursier.');
        router.back();
        return;
      }

      // Charger infos client
      const { data: clientData } = await supabase
        .from('utilisateurs')
        .select('nom_complet, telephone')
        .eq('id', demande.id_client)
        .single();

      setDetail({
        id_demande:           demande.id_demande,
        id_client:            demande.id_client,
        nom_client:           clientData?.nom_complet ?? 'Client',
        telephone_client:     clientData?.telephone ?? '',
        adresse_livraison:    demande.adresse_livraison ?? '—',
        description_articles: demande.description_articles ?? '—',
        magasins:             demande.magasins ?? '—',
        montant_articles:     Number(demande.montant_articles) || 0,
        commission_coursier:  Number(demande.commission_coursier) || 0,
        part_plateforme:      Number(demande.part_plateforme) || 0,
        estimation_prix:      Number(demande.estimation_prix) || 0,
        date_demande:         demande.date_demande,
      });

      // Charger les articles
      const { data: articlesData } = await supabase
        .from('articles')
        .select('id_article, nom, quantite, magasin, prix_estime')
        .eq('id_demande', idDemande);

      setArticles(articlesData ?? []);

    } finally {
      setLoading(false);
    }
  };

  // ── Accepter la course ───────────────────────────────────
  const handleAccepter = () => {
    if (!detail || !userId) return;

    Alert.alert(
      'Accepter cette course ?',
      `Le client sera notifié immédiatement.\nVotre gain : ${detail.commission_coursier.toLocaleString('fr-FR')} FCFA`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: '✅ Accepter',
          onPress: async () => {
            setAccepting(true);
            try {
              // 1. Créer la course
              const { data: course, error: courseError } = await supabase
                .from('courses')
                .insert({
                  id_demande:    detail.id_demande,
                  id_livreur:    userId,
                  statut_course: 'acceptee',
                  date_debut:    new Date().toISOString(),
                })
                .select()
                .single();

              if (courseError) throw courseError;

              // 2. Mettre à jour le statut de la demande
              const { error: updateError } = await supabase
                .from('demande_courses')
                .update({ statut_demande: 'acceptee' })
                .eq('id_demande', detail.id_demande);

              if (updateError) throw updateError;

              // 3. Notifier le client
              await supabase.from('notifications').insert({
                id_utilisateur: detail.id_client,
                id_demande:     detail.id_demande,
                id_course:      course?.id_course ?? null,
                titre:          'Coursier trouvé ! 🎉',
                message:        'Un coursier a accepté votre demande et se dirige vers vous.',
                type:           'course_acceptee',
                is_read:        false,
              });

              Alert.alert(
                '🎉 Course acceptée !',
                'Bonne route ! Rendez-vous sur la page de suivi.',
                [{ text: 'Voir la course', onPress: () => router.replace('/coursier/course/en-cours') }]
              );

            } catch (err) {
              console.error('Erreur acceptation:', err);
              Alert.alert('Erreur', "Impossible d'accepter cette course. Elle a peut-être déjà été prise.");
              router.back();
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  // ── Refuser ──────────────────────────────────────────────
  const handleRefuser = () => {
    Alert.alert(
      'Refuser cette course ?',
      'Elle restera disponible pour les autres coursiers.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // ── Appeler le client ────────────────────────────────────
  const appelClient = () => {
    if (!detail?.telephone_client) return;
    const tel = detail.telephone_client.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`);
  };

  // ── Formatage ────────────────────────────────────────────
  const totalClient = detail
    ? detail.montant_articles + detail.commission_coursier + detail.part_plateforme
    : 0;

  // ── RENDER ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <Header showBack title="Détails de la course" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!detail) return null;

  return (
    <View style={styles.container}>
      <Header showBack title="Détails de la course" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Banner paiement */}
        <View style={styles.paiementBanner}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
          <Text style={styles.paiementText}>
            Total client :{' '}
            <Text style={styles.paiementBold}>
              {totalClient.toLocaleString('fr-FR')} FCFA
            </Text>
            {' '}· articles + frais livraison
          </Text>
        </View>

        {/* Itinéraire */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>
          <View style={styles.itinRow}>
            <View style={styles.itinDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Point de départ</Text>
              <Text style={styles.itinVal}>{detail.magasins}</Text>
            </View>
          </View>
          <View style={styles.itinLine} />
          <View style={styles.itinRow}>
            <View style={[styles.itinDot, styles.itinDotEnd]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Livraison</Text>
              <Text style={styles.itinVal}>{detail.adresse_livraison}</Text>
            </View>
          </View>
        </View>

        {/* Articles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {articles.length > 0 ? 'Articles à livrer' : 'Description'}
          </Text>

          {articles.length > 0 ? (
            articles.map((art, i) => (
              <View
                key={art.id_article}
                style={[styles.articleRow, i < articles.length - 1 && styles.articleRowBorder]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.articleNom}>{art.nom} × {art.quantite}</Text>
                  {art.magasin && (
                    <Text style={styles.articleMagasin}>{art.magasin}</Text>
                  )}
                </View>
                {art.prix_estime && (
                  <Text style={styles.articlePrix}>
                    {(art.prix_estime * art.quantite).toLocaleString('fr-FR')} FCFA
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.descText}>{detail.description_articles}</Text>
          )}
        </View>

        {/* Infos client */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact client</Text>
          <View style={styles.clientRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientNom}>{detail.nom_client}</Text>
              <Text style={styles.clientTel}>
                {detail.adresse_livraison}
                {detail.telephone_client ? `  ·  ${detail.telephone_client}` : ''}
              </Text>
            </View>
            {detail.telephone_client ? (
              <TouchableOpacity style={styles.callBtn} onPress={appelClient}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Rémunération */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Votre rémunération</Text>
          <View style={styles.remRow}>
            <Text style={styles.remLabel}>Commission coursier</Text>
            <Text style={styles.remVal}>
              {detail.commission_coursier.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
          {detail.montant_articles > 0 && (
            <View style={styles.remRow}>
              <Text style={styles.remLabel}>Valeur articles</Text>
              <Text style={[styles.remLabel, { color: Colors.textPrimary }]}>
                {detail.montant_articles.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          )}
          <Text style={styles.remNote}>
            ℹ️ Votre commission vous sera versée dès confirmation de la livraison.
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.btnsRow}>
          <Button
            title="Refuser"
            variant="outline"
            onPress={handleRefuser}
            style={styles.btn}
          />
          <Button
            title="Accepter la course"
            onPress={handleAccepter}
            loading={accepting}
            style={styles.btn}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:      { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  content:          { padding: Spacing['2xl'] },
  paiementBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: Colors.success,
  },
  paiementText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  paiementBold: { fontFamily: FontFamily.bold, color: Colors.success },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm,
  },
  cardTitle:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  itinRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  itinDot:    { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4, borderWidth: 2, borderColor: Colors.primarySoft },
  itinDotEnd: { backgroundColor: Colors.error },
  itinLine:   { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: 4 },
  itinLabel:  { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  itinVal:    { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  articleRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  articleRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  articleNom:     { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  articleMagasin: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  articlePrix:    { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  descText:       { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clientNom:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  clientTel:  { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  callBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  remRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  remLabel:   { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textSecondary },
  remVal:     { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.success },
  remNote:    { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: Spacing.sm },
  btnsRow:    { flexDirection: 'row', gap: Spacing.md },
  btn:        { flex: 1 },
});