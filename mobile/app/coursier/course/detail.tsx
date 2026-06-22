// app/coursier/course/detail.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

const COMMISSION_TAUX = 0.15;

export default function DetailCourseCoursier() {
  const router  = useRouter();
  const params  = useLocalSearchParams();
  const id      = params.id as string;

  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [commande, setCommande]   = useState<any>(null);

  useEffect(() => { if (id) fetchCommande(); }, [id]);

  const fetchCommande = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('commande')
      .select('id_commande, description_articles, magasins, adresse_livraison, estimation_prix, montant_course, poids_colis, aller_retour, distance_km, date_commande, id_client')
      .eq('id_commande', id)
      .single();

    if (error) console.error('Erreur fetch commande:', error);
    if (data)  setCommande(data);
    setFetching(false);
  };

  const handleAccepter = () => {
    Alert.alert(
      'Accepter cette course ?',
      'En acceptant, vous vous engagez à effectuer cette livraison.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // ── Appel RPC (fonction SECURITY DEFINER) au lieu d'un update direct ──
              // Évite les blocages RLS imprévisibles : la logique d'acceptation
              // (vérification coursier approuvé + commande dispo + update) est
              // entièrement gérée côté base de données de façon contrôlée et sûre.
              const { error: rpcError } = await supabase.rpc('accepter_commande', {
                p_id_commande: Number(id),
                p_id_coursier: user.id,
              });

              if (rpcError) {
                console.error('Erreur RPC accepter_commande:', rpcError);
                Alert.alert('Erreur', rpcError.message || "Impossible d'accepter la course.");
                return;
              }

              // Notification au client
              await supabase.from('notification').insert({
                id_utilisateur:   commande.id_client,
                titre:            'Coursier trouvé ! 🛵',
                message:          'Un coursier a accepté votre course et est en route.',
                type_notification: 'coursier',
              });

              router.replace(`/coursier/course/en-cours?id_commande=${id}`);
            } catch (e) {
              Alert.alert('Erreur réseau', 'Vérifiez votre connexion.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (fetching) {
    return (
      <View style={styles.container}>
        <Header showBack title="Détails de la course" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!commande) {
    return (
      <View style={styles.container}>
        <Header showBack title="Détails de la course" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={{ fontFamily: FontFamily.regular, color: Colors.textMuted }}>Course introuvable</Text>
        </View>
      </View>
    );
  }

  const isAchat      = !!commande.magasins;
  const commission   = Math.round((commande.montant_course || 0) * COMMISSION_TAUX);
  const gainNet      = (commande.montant_course || 0) - commission;
  const articles     = commande.description_articles?.split(',') || [];
  const magasins     = commande.magasins?.split(',') || [];

  return (
    <View style={styles.container}>
      <Header showBack title="Détails de la course" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Banner type */}
        <View style={[styles.typeBanner, isAchat ? styles.typeBannerAchat : styles.typeBannerColis]}>
          <Ionicons name={isAchat ? 'cart-outline' : 'cube-outline'} size={20} color={isAchat ? Colors.primary : Colors.info} />
          <Text style={[styles.typeBannerText, { color: isAchat ? Colors.primary : Colors.info }]}>
            {isAchat ? 'Achat en magasin' : 'Récupération de colis'}
            {commande.aller_retour ? ' — Aller & Retour' : ''}
            {commande.poids_colis === 'lourd' ? ' — Colis lourd' : ''}
          </Text>
        </View>

        {/* Itinéraire */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>
          <View style={styles.itinRow}>
            <View style={styles.itinDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Point de départ</Text>
              <Text style={styles.itinVal}>
                {isAchat ? (commande.magasins?.split(',')[0] || 'Magasin') : 'Position actuelle'}
              </Text>
            </View>
            {commande.distance_km && (
              <Text style={styles.itinDist}>{commande.distance_km?.toFixed(1)} km</Text>
            )}
          </View>
          <View style={styles.itinLine} />
          <View style={styles.itinRow}>
            <View style={[styles.itinDot, styles.itinDotEnd]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itinLabel}>Livraison</Text>
              <Text style={styles.itinVal}>{commande.adresse_livraison}</Text>
            </View>
          </View>
        </View>

        {/* Articles / Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isAchat ? 'Articles à acheter' : 'Description du colis'}</Text>
          {articles.map((art: string, i: number) => (
            <View key={i} style={styles.articleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNom}>{art.trim()}</Text>
                {isAchat && magasins[i] && (
                  <Text style={styles.articleMagasin}>{magasins[i].trim()}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Rémunération */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Votre rémunération</Text>
          <View style={styles.remRow}>
            <Text style={styles.remLabel}>Montant total course</Text>
            <Text style={styles.remValSub}>{commande.montant_course?.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.remRow}>
            <Text style={styles.remLabel}>Commission KourseGo (15%)</Text>
            <Text style={[styles.remValSub, { color: Colors.error }]}>-{commission.toLocaleString()} FCFA</Text>
          </View>
          <View style={[styles.remRow, styles.remRowTotal]}>
            <Text style={styles.remLabelTotal}>Votre gain net</Text>
            <Text style={styles.remVal}>{gainNet.toLocaleString()} FCFA</Text>
          </View>
          <Text style={styles.remNote}>
            ℹ️ La commission est prélevée automatiquement sur votre portefeuille après livraison.
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
  container:      { flex: 1, backgroundColor: Colors.background },
  content:        { padding: Spacing['2xl'] },
  typeBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderLeftWidth: 3 },
  typeBannerAchat:{ backgroundColor: Colors.primarySoft, borderLeftColor: Colors.primary },
  typeBannerColis:{ backgroundColor: Colors.infoLight, borderLeftColor: Colors.info },
  typeBannerText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm },
  card:           { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  cardTitle:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  itinRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  itinDot:        { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4, borderWidth: 2, borderColor: Colors.primarySoft },
  itinDotEnd:     { backgroundColor: Colors.error },
  itinLine:       { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: 4 },
  itinLabel:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  itinVal:        { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  itinDist:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.primary },
  articleRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  articleNom:     { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  articleMagasin: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  remRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  remRowTotal:    { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  remLabel:       { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textSecondary },
  remLabelTotal:  { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.textPrimary },
  remValSub:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  remVal:         { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.success },
  remNote:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: Spacing.sm },
  btnsRow:        { flexDirection: 'row', gap: Spacing.md },
  btn:            { flex: 1 },
});