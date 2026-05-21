// app/client/commande/confirmation.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

interface CoursierInfo {
  id: string;
  nom_complet: string;
  telephone: string;
  note_moyenne: number | null;
  nombre_courses: number;
}

interface PrixInfo {
  montant_articles: number;
  commission_coursier: number;
  part_plateforme: number;
  estimation_prix: number;
}

export default function ConfirmationCoursierScreen() {
  const router = useRouter();
  const { id_demande } = useLocalSearchParams<{ id_demande: string }>();

  const [coursier, setCoursier] = useState<CoursierInfo | null>(null);
  const [prix, setPrix]         = useState<PrixInfo | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { if (id_demande) loadData(); }, [id_demande]);

  const loadData = async () => {
    try {
      // Course acceptée
      const { data: course } = await supabase
        .from('courses')
        .select('id_course, id_livreur')
        .eq('id_demande', id_demande)
        .in('statut_course', ['acceptee', 'en_cours'])
        .single();

      if (course) {
        const { data: user } = await supabase
          .from('utilisateurs')
          .select('id, nom_complet, telephone')
          .eq('id', course.id_livreur)
          .single();

        const { data: stats } = await supabase
          .from('livreurs')
          .select('note_moyenne, nombre_courses')
          .eq('id_utilisateur', course.id_livreur)
          .single();

        if (user) {
          setCoursier({
            id:             user.id,
            nom_complet:    user.nom_complet  ?? 'Coursier',
            telephone:      user.telephone    ?? '',
            // ✅ Fix : note_moyenne peut être null ou 0
            note_moyenne:   stats?.note_moyenne   ?? null,
            nombre_courses: stats?.nombre_courses ?? 0,
          });
        }
      }

      // Prix
      const { data: demande } = await supabase
        .from('demande_courses')
        .select('montant_articles, commission_coursier, part_plateforme, estimation_prix')
        .eq('id_demande', id_demande)
        .single();

      if (demande) setPrix(demande as PrixInfo);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAppeler = () => {
    const tel = coursier?.telephone;
    if (!tel) { Alert.alert('Indisponible', 'Numéro non disponible.'); return; }
    Linking.openURL(`tel:${tel}`).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir le téléphone."));
  };

  const handleWhatsApp = () => {
    const tel = coursier?.telephone?.replace(/[\s+\-()]/g, '');
    if (!tel) { Alert.alert('Indisponible', 'Numéro non disponible.'); return; }
    const msg = encodeURIComponent(`Bonjour ${coursier?.nom_complet ?? ''}, je suis votre client KourseGO (commande #${id_demande}).`);
    Linking.openURL(`whatsapp://send?phone=${tel}&text=${msg}`).catch(() =>
      Alert.alert('WhatsApp non installé', 'Veuillez installer WhatsApp.')
    );
  };

  const handleChat = () => {
    (router as any).push({ pathname: '/client/course/chat', params: { id_demande } });
  };

  const handleMaps = () => {
    Linking.openURL('https://maps.google.com').catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir Google Maps.")
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const montantArticles = prix?.montant_articles    ?? 0;
  const commission      = prix?.commission_coursier ?? 0;
  const frais           = prix?.part_plateforme     ?? 0;
  const total           = prix?.estimation_prix     ?? (montantArticles + commission + frais);

  // ✅ Fix note_moyenne : afficher correctement même si null ou 0
  const noteAffichee = coursier?.note_moyenne != null && coursier.note_moyenne > 0
    ? coursier.note_moyenne.toFixed(1)
    : 'Nouveau';

  return (
    <View style={styles.container}>
      <Header showBack title="Coursier trouvé !" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>
        <Text style={styles.title}>Coursier Trouvé !</Text>
        <Text style={styles.sub}>Votre coursier est prêt à effectuer votre course</Text>

        {/* Carte coursier */}
        <View style={styles.coursierCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.primary} />
          </View>
          <View style={styles.coursierInfo}>
            <Text style={styles.coursierNom}>{coursier?.nom_complet ?? 'Coursier assigné'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.primary} />
              <Text style={styles.ratingText}>
                {noteAffichee} · {coursier?.nombre_courses ?? 0} courses
              </Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.tempsText}>~45 min</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleChat} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={handleAppeler} activeOpacity={0.7}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.whatsappBtn]} onPress={handleWhatsApp} activeOpacity={0.7}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={[styles.contactText, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Maps */}
        <TouchableOpacity style={styles.mapsBtn} onPress={handleMaps} activeOpacity={0.8}>
          <Ionicons name="map-outline" size={18} color={Colors.primary} />
          <Text style={styles.mapsBtnText}>Voir sur Google Maps</Text>
          <Ionicons name="open-outline" size={14} color={Colors.primary} />
        </TouchableOpacity>

        {/* Récapitulatif paiement */}
        <View style={styles.paiementCard}>
          <Text style={styles.paiementTitle}>Récapitulatif du paiement</Text>
          {montantArticles > 0 && (
            <View style={styles.paiementRow}>
              <Text style={styles.paiementLabel}>Total articles</Text>
              <Text style={styles.paiementValue}>{montantArticles.toLocaleString('fr-FR')} FCFA</Text>
            </View>
          )}
          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabel}>Commission coursier</Text>
            <Text style={styles.paiementValue}>{commission.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          {frais > 0 && (
            <View style={styles.paiementRow}>
              <Text style={styles.paiementLabel}>Frais de service</Text>
              <Text style={styles.paiementValue}>{frais.toLocaleString('fr-FR')} FCFA</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabelBold}>Total à payer</Text>
            <Text style={styles.paiementValueBold}>{total.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </View>

        <Button
          title="Procéder au paiement →"
          onPress={() => (router as any).push({
            pathname: '/client/commande/paiement',
            params: { id_demande, total: total.toString() },
          })}
          style={styles.btn}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content:           { padding: Spacing['2xl'], alignItems: 'center' },
  successIcon:       { marginTop: Spacing.lg, marginBottom: Spacing.md },
  title:             { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, marginBottom: 6 },
  sub:               { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  coursierCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, width: '100%', marginBottom: Spacing.md, ...Shadows.sm },
  avatar:            { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  coursierInfo:      { flex: 1 },
  coursierNom:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  ratingRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  metaRight:         { alignItems: 'center', gap: 2 },
  tempsText:         { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  contactRow:        { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginBottom: Spacing.sm },
  contactBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  whatsappBtn:       { borderColor: '#25D366' },
  contactText:       { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  mapsBtn:           { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', paddingVertical: 10, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primarySoft, marginBottom: Spacing.md },
  mapsBtnText:       { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary, flex: 1, textAlign: 'center' },
  paiementCard:      { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, width: '100%', marginBottom: Spacing.xl, ...Shadows.sm },
  paiementTitle:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  paiementRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  paiementLabel:     { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  paiementValue:     { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  paiementLabelBold: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  paiementValueBold: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  divider:           { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  btn:               { width: '100%' },
});