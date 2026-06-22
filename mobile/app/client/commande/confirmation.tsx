// app/client/commande/confirmation.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

interface Article {
  id: string; nom: string; quantite: string; magasin: string; prix: string;
}

export default function ConfirmationCoursierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const commandeId = (params.commandeId as string) || '';

  // Infos coursier — d'abord depuis les params (passés par recherche-coursier),
  // sinon refetch depuis Supabase si elles manquent (lien direct, refresh, etc.)
  const [coursierNom, setCoursierNom]         = useState((params.coursierNom as string) || '');
  const [coursierTel, setCoursierTel]         = useState((params.coursierTel as string) || '');
  const [coursierPhoto, setCoursierPhoto]     = useState((params.coursierPhoto as string) || '');
  const [coursierNote, setCoursierNote]       = useState((params.coursierNote as string) || '5.0');
  const [coursierCourses, setCoursierCourses] = useState((params.coursierCourses as string) || '0');
  const [loadingCoursier, setLoadingCoursier] = useState(false);

  // Infos commande
  const typeCourse      = (params.typeCourse as string)       || 'achat';
  const nomCourse       = (params.nomCourse as string)        || '';
  const total           = parseFloat((params.total as string)           || '0');
  const montantArticles = parseFloat((params.montantArticles as string) || '0');
  const commission      = parseFloat((params.commission as string)      || '0');
  const articles: Article[] = params.articles ? JSON.parse(params.articles as string) : [];

  // ── Filet de sécurité : si les infos coursier n'arrivent pas via params,
  // on les récupère nous-mêmes depuis Supabase à partir de commandeId ──
  useEffect(() => {
    if (coursierNom && coursierTel) return; // déjà reçues via params, rien à faire
    if (!commandeId) return;

    const fetchCoursierInfo = async () => {
      setLoadingCoursier(true);
      try {
        const { data: cmd } = await supabase
          .from('commande')
          .select('id_coursier')
          .eq('id_commande', commandeId)
          .single();

        if (!cmd?.id_coursier) return;

        const { data: usr } = await supabase
          .from('utilisateurs')
          .select('nom_complet, telephone, photo_profil_url')
          .eq('id', cmd.id_coursier)
          .single();

        const { data: crs } = await supabase
          .from('coursier')
          .select('nombre_courses')
          .eq('id', cmd.id_coursier)
          .single();

        const { data: avisData } = await supabase
          .from('avis')
          .select('note')
          .eq('id_coursier', cmd.id_coursier);

        const noteMoyenne = avisData && avisData.length > 0
          ? (avisData.reduce((s: number, a: any) => s + a.note, 0) / avisData.length).toFixed(1)
          : '5.0';

        if (usr) {
          setCoursierNom(usr.nom_complet || 'Coursier');
          setCoursierTel(usr.telephone || '');
          setCoursierPhoto(usr.photo_profil_url || '');
        }
        setCoursierNote(noteMoyenne);
        setCoursierCourses(crs?.nombre_courses?.toString() || '0');
      } catch (err) {
        console.error('[Confirmation] Erreur fetch coursier:', err);
      } finally {
        setLoadingCoursier(false);
      }
    };

    fetchCoursierInfo();
  }, [commandeId]);

  const handleAppel = () => {
    if (coursierTel) Linking.openURL(`tel:${coursierTel}`);
  };

  const handleWhatsApp = () => {
    if (coursierTel) {
      const tel = coursierTel.replace(/\s/g, '').replace('+', '');
      Linking.openURL(`https://wa.me/${tel}`);
    }
  };

  const handleMessage = () => {
    router.push({
      pathname: '/client/course/chat',
      params: { id_commande: commandeId, coursierNom, coursierTel, from: 'client', origin: 'confirmation' },
    });
  };

  if (loadingCoursier && !coursierNom) {
    return (
      <View style={styles.container}>
        <Header showBack title="Coursier trouvé !" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showBack title="Coursier trouvé !" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Icône succès */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>
        <Text style={styles.title}>Coursier Trouvé !</Text>
        <Text style={styles.sub}>Votre coursier est prêt à effectuer votre course</Text>

        {/* Carte coursier */}
        <View style={styles.coursierCard}>
          <View style={styles.avatar}>
            {coursierPhoto ? (
              <Image source={{ uri: coursierPhoto }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={32} color={Colors.primary} />
            )}
          </View>
          <View style={styles.coursierInfo}>
            <Text style={styles.coursierNom}>{coursierNom || 'Coursier'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.primary} />
              <Text style={styles.ratingText}>
                {coursierNote} · {coursierCourses} course{parseInt(coursierCourses) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          {coursierTel ? <Text style={styles.telText}>{coursierTel}</Text> : null}
        </View>

        {/* Boutons contact */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleMessage} activeOpacity={0.8}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={handleAppel} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.whatsappBtn]} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={[styles.contactText, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Récapitulatif paiement */}
        <View style={styles.paiementCard}>
          <Text style={styles.paiementTitle}>Récapitulatif du paiement</Text>

          {typeCourse === 'achat' ? (
            articles.map((art, i) => {
              const prixUnit  = parseFloat(art.prix || '0') || 0;
              const qte       = parseInt(art.quantite || '1', 10) || 1;
              const sousTotal = prixUnit * qte;
              return sousTotal > 0 ? (
                <View key={i} style={styles.paiementRow}>
                  <Text style={styles.paiementLabel}>{art.nom} ×{qte}</Text>
                  <Text style={styles.paiementValue}>{sousTotal.toLocaleString()} FCFA</Text>
                </View>
              ) : null;
            })
          ) : (
            <View style={styles.paiementRow}>
              <Text style={styles.paiementLabel}>{nomCourse || 'Récupération colis'}</Text>
              <Text style={styles.paiementValue}>—</Text>
            </View>
          )}

          {montantArticles > 0 && (
            <View style={styles.paiementRow}>
              <Text style={styles.paiementLabel}>Sous-total articles</Text>
              <Text style={styles.paiementValue}>{montantArticles.toLocaleString()} FCFA</Text>
            </View>
          )}

          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabel}>Commission coursier</Text>
            <Text style={styles.paiementValue}>{commission.toLocaleString()} FCFA</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabelBold}>Total à payer</Text>
            <Text style={styles.paiementValueBold}>{total.toLocaleString()} FCFA</Text>
          </View>
        </View>

        <Button
          title="Procéder au paiement →"
          onPress={() => router.push({
            pathname: '/client/commande/paiement',
            params: {
              commandeId,
              total:           total.toFixed(0),
              montantArticles: montantArticles.toFixed(0),
              commission:      commission.toFixed(0),
            },
          })}
          style={styles.btn}
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.background },
  content:           { padding: Spacing['2xl'], alignItems: 'center' },
  successIcon:       { marginTop: Spacing.lg, marginBottom: Spacing.md },
  title:             { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, marginBottom: 6 },
  sub:               { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  coursierCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, width: '100%', marginBottom: Spacing.md, ...Shadows.sm },
  avatar:            { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:         { width: 56, height: 56, borderRadius: 28 },
  coursierInfo:      { flex: 1 },
  coursierNom:       { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  ratingRow:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText:        { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  telText:           { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.textSecondary },
  contactRow:        { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginBottom: Spacing.md },
  contactBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  whatsappBtn:       { borderColor: '#25D366' },
  contactText:       { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
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