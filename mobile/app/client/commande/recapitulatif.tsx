// app/client/commande/recapitulatif.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

interface Article {
  id: string;
  nom: string;
  quantite: string;
  magasin: string;
  prix: string;
  coordsMagasin?: { lat: number; lon: number } | null;
}

export default function RecapitulatifScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const typeCourse       = (params.typeCourse as string) || 'achat';
  const adresseLivraison = (params.adresseLivraison as string) || '';
  const adresseDepart    = (params.adresseDepart as string) || '';
  const nomCourse        = (params.nomCourse as string) || '';
  const descriptionColis = (params.descriptionColis as string) || '';
  const poidsColis       = (params.poidsColis as string) || '';
  const allerRetour      = params.allerRetour === 'true';
  const instructions     = (params.instructions as string) || '';
  const articles: Article[] = params.articles ? JSON.parse(params.articles as string) : [];

  // Résultats de calcul passés depuis nouvelle.tsx
  const distanceKm         = parseFloat((params.distanceKm as string) || '0');
  const montantArticles    = parseFloat((params.montantArticles as string) || '0');
  const commissionCoursier = parseFloat((params.commission as string) || '0');
  const total              = parseFloat((params.total as string) || '0');
  const magasinDepart      = articles[0]?.magasin || adresseDepart || '';
  const tempsEstime        = distanceKm > 0 ? `${Math.round(distanceKm * 3)} min` : '--';
  const legs: { de: string; vers: string; distance: string }[] =
    params.legs ? JSON.parse(params.legs as string) : [];

  const [submitting, setSubmitting] = useState(false);

  // ── Confirmation → insertion Supabase ────────────────────────
  const handleConfirmer = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }

      const { data, error } = await supabase.from('commande').insert({
        id_client:            user.id,
        adresse_livraison:    adresseLivraison,
        description_articles: typeCourse === 'achat'
          ? articles.map((a) => `${a.quantite}x ${a.nom} (${a.magasin})`).join(', ')
          : descriptionColis,
        magasins:             typeCourse === 'achat'
          ? [...new Set(articles.map((a) => a.magasin))].join(', ')
          : adresseDepart,
        estimation_prix:      total,
        montant_articles:     montantArticles,
        montant_course:       commissionCoursier,
        statut_commande:      'en_attente',
        aller_retour:         allerRetour,
        poids_colis:          poidsColis || null,
        distance_km:          distanceKm,
      }).select('id_commande').single();

      if (error) throw error;

      // Naviguer vers recherche coursier avec l'id de la commande
      router.push({
        pathname: '/client/commande/recherche_coursier',
        params: {
          commandeId:       data.id_commande,
          adresseLivraison,
          articles:         JSON.stringify(articles),
          nomCourse,
          descriptionColis,
          typeCourse,
          poidsColis,
          allerRetour:      allerRetour.toString(),
          total:            total.toFixed(0),
          montantArticles:  montantArticles.toFixed(0),
          commission:       commissionCoursier.toFixed(0),
        },
      });
    } catch (e) {
      console.error('Erreur insertion commande:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Bouton Modifier ──────────────────────────────────────────
  const handleModifier = () => {
    router.push({
      pathname: '/client/commande/nouvelle',
      params: {
        typeCourse, adresseLivraison, instructions,
        articles: JSON.stringify(articles),
        nomCourse, adresseDepart, descriptionColis,
        poidsColis, allerRetour: allerRetour.toString(),
        coordsLivraison: (params.coordsLivraison as string) || '',
        coordsDepart:    (params.coordsDepart as string) || '',
      },
    });
  };

  const LigneTotal = ({ label, value, highlight = false }:
    { label: string; value: string; highlight?: boolean }) => (
    <View style={styles.ligne}>
      <Text style={[styles.ligneLabel, highlight && styles.ligneLabelBold]}>{label}</Text>
      <Text style={[styles.ligneValue, highlight && styles.ligneValueBold]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header showBack title="Récapitulatif de commande" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avertissement si distance = 0 */}
        {distanceKm === 0 && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={18} color="#b45309" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Distance non calculée</Text>
              <Text style={styles.warningText}>
                Utilisez l'autocomplétion ou la carte pour des adresses précises.
              </Text>
              <TouchableOpacity onPress={handleModifier} style={styles.warningBtn}>
                <Text style={styles.warningBtnText}>✏️ Corriger les adresses</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Itinéraire */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>

          {typeCourse === 'achat' && legs.length > 0 ? (
            <>
              {legs.map((leg, i) => (
                <View key={i}>
                  <View style={styles.itinRow}>
                    <View style={[styles.itinDot, { backgroundColor: Colors.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itinLabel}>{i === 0 ? 'Magasin départ' : `Magasin ${i + 1}`}</Text>
                      <Text style={styles.itinVal} numberOfLines={2}>{leg.de}</Text>
                    </View>
                    <Text style={styles.itinMeta}>{leg.distance} km</Text>
                  </View>
                  <View style={styles.itinLine} />
                </View>
              ))}
              <View style={styles.itinRow}>
                <View style={[styles.itinDot, styles.itinDotEnd]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itinLabel}>Livraison{allerRetour ? ' (Aller & Retour)' : ''}</Text>
                  <Text style={styles.itinVal} numberOfLines={2}>{adresseLivraison}</Text>
                </View>
                <Text style={styles.itinMeta}>{tempsEstime}</Text>
              </View>
              <View style={styles.distanceTotale}>
                <Text style={styles.distanceTotaleLabel}>Distance totale</Text>
                <Text style={styles.distanceTotaleVal}>{distanceKm.toFixed(1)} km</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.itinRow}>
                <View style={styles.itinDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itinLabel}>Point de départ</Text>
                  <Text style={styles.itinVal} numberOfLines={2}>{magasinDepart || 'Position coursier'}</Text>
                </View>
                <Text style={styles.itinMeta}>{distanceKm.toFixed(1)} km</Text>
              </View>
              <View style={styles.itinLine} />
              <View style={styles.itinRow}>
                <View style={[styles.itinDot, styles.itinDotEnd]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itinLabel}>Livraison{allerRetour ? ' (Aller & Retour)' : ''}</Text>
                  <Text style={styles.itinVal} numberOfLines={2}>{adresseLivraison}</Text>
                </View>
                <Text style={styles.itinMeta}>{tempsEstime}</Text>
              </View>
            </>
          )}
        </View>

        {/* Détails commande */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails de la commande</Text>
          {typeCourse === 'achat' ? (
            articles.map((art, i) => {
              const prixUnit  = parseFloat(art.prix || '0') || 0;
              const qte       = parseInt(art.quantite || '1', 10) || 1;
              const sousTotal = prixUnit * qte;
              return (
                <View key={i} style={styles.articleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleNom}>{qte}× {art.nom}</Text>
                    <Text style={styles.articleMagasin} numberOfLines={1}>{art.magasin}</Text>
                  </View>
                  {sousTotal > 0 && (
                    <Text style={styles.articlePrix}>{sousTotal.toLocaleString()} FCFA</Text>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.articleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleNom}>{nomCourse || 'Récupération de colis'}</Text>
                {descriptionColis ? <Text style={styles.articleMagasin}>{descriptionColis}</Text> : null}
                <Text style={styles.articleMagasin}>
                  Colis {poidsColis === 'lourd' ? 'lourd' : 'léger'}
                  {allerRetour ? '  •  Aller & Retour' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Estimation du coût — sans détail de calcul */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimation du coût</Text>
          {montantArticles > 0 && (
            <LigneTotal
              label="Sous-total articles"
              value={`${montantArticles.toLocaleString()} FCFA`}
            />
          )}
          <LigneTotal
            label="Commission coursier"
            value={`${commissionCoursier.toLocaleString()} FCFA`}
          />
          <View style={styles.divider} />
          <LigneTotal
            label="Total à payer"
            value={`${total.toLocaleString()} FCFA`}
            highlight
          />
        </View>

        {/* Boutons */}
        <View style={styles.btnsRow}>
          <Button title="Modifier" onPress={handleModifier} variant="outline" style={styles.btn} />
          <Button title="Confirmer →" onPress={handleConfirmer} loading={submitting} style={styles.btn} />
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: Colors.background },
  content:             { padding: Spacing['2xl'] },
  card:                { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  cardTitle:           { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  itinRow:             { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: 4 },
  itinDot:             { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, marginTop: 4, borderWidth: 2, borderColor: Colors.primarySoft },
  itinDotEnd:          { backgroundColor: Colors.error },
  itinLine:            { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginBottom: 4 },
  itinLabel:           { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  itinVal:             { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  itinMeta:            { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  distanceTotale:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  distanceTotaleLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  distanceTotaleVal:   { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.primary },
  articleRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  articleNom:          { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  articleMagasin:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  articlePrix:         { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.textPrimary },
  ligne:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  ligneLabel:          { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  ligneValue:          { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  ligneLabelBold:      { fontFamily: FontFamily.bold, color: Colors.textPrimary, fontSize: FontSize.md },
  ligneValueBold:      { fontFamily: FontFamily.bold, color: Colors.primary, fontSize: FontSize.md },
  divider:             { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  btnsRow:             { flexDirection: 'row', gap: Spacing.md },
  btn:                 { flex: 1 },
  warningBanner:       { flexDirection: 'row', gap: Spacing.sm, backgroundColor: '#fef3c7', borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  warningTitle:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: '#92400e', marginBottom: 4 },
  warningText:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: '#78350f', lineHeight: 18 },
  warningBtn:          { marginTop: Spacing.sm, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#f59e0b', borderRadius: BorderRadius.md },
  warningBtnText:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.white },
});