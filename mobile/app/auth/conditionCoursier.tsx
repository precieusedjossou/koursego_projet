// app/auth/conditions-coursier.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Header from '../../components/shared/Header';

const SECTIONS = [
  {
    icon: 'cart-outline' as const,
    title: '1. Votre activité sur KourseGo',
    content: [
      'Votre spécialité principale est la course d\'achat personnalisé (le client commande des articles dans différents marchés).',
      'Vous effectuez aussi des récupérations et livraisons de colis classiques.',
      'La plateforme définit un tarif distinct selon le type de commande : Achats Légers ou Achats Lourds.',
    ],
  },
  {
    icon: 'wallet-outline' as const,
    title: '2. Modes de paiement des courses',
    content: [
      'Paiement Prépayé : Le client règle sa commande en ligne via Mobile Money (MoMo) avant votre départ.',
      'Paiement après Livraison : Le client vous paye directement à la fin, soit en Espèces, soit par MoMo directement sur votre compte personnel.',
    ],
  },
  {
    icon: 'cash-outline' as const,
    title: '3. Commission et gestion du compte',
    content: [
      'KourseGo prélève une commission fixe de 15% sur le montant de chaque course effectuée.',
      'Si votre compte KourseGo est approvisionné, la commission est prélevée instantanément.',
      'Si votre solde est insuffisant, votre compte passe en négatif et vous devez faire un dépôt pour continuer à recevoir des courses.',
      'Vous pouvez retirer vos gains accumulés sur la plateforme dès que votre solde atteint un minimum de 1 000 FCFA.',
    ],
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: '4. Vos engagements de service',
    content: [
      'Vous agissez en tant que prestataire indépendant et gérez librement vos horaires de travail.',
      'Vous devez honorer les achats avec intégrité. Tout comportement frauduleux ou non respectueux entraînera la suspension immédiate du compte.',
    ],
  },
];

export default function ConditionsCoursierScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtEnd) setHasScrolledToEnd(true);
  };

  const handleAccept = () => {
    if (!accepted) return;
    router.push('/auth/kyc-coursier');
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Conditions Coursier" />

      {/* Bandeau info */}
      <View style={styles.banner}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.bannerText}>
          Défilez vers le bas pour débloquer l'acceptation
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="bicycle" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Charte du Coursier KourseGo</Text>
          <Text style={styles.headerSub}>
            Règles cruciales sur vos gains, les types d'achats et les commissions. 
            Veuillez lire attentivement pour valider votre inscription.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name={section.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.content.map((para, pIdx) => (
              <View key={pIdx} style={styles.paraRow}>
                <View style={styles.bullet} />
                <Text style={styles.paraText}>{para}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Message de fin */}
        {hasScrolledToEnd && (
          <View style={styles.endNote}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
            <Text style={styles.endNoteText}>
              Lecture terminée. Vous pouvez maintenant cocher la case ci-dessous.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer acceptation */}
      <View style={styles.footer}>
        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => hasScrolledToEnd && setAccepted((v) => !v)}
          disabled={!hasScrolledToEnd}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox, 
            accepted && styles.checkboxChecked,
            !hasScrolledToEnd && styles.checkboxDisabled
          ]}>
            {accepted && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={[styles.checkLabel, !hasScrolledToEnd && styles.checkLabelDisabled]}>
            J'accepte les conditions d'utilisation et la commission de 15%
          </Text>
        </TouchableOpacity>

        {!hasScrolledToEnd && (
          <Text style={styles.scrollHint}>
            ↓ Faites défiler tout le texte pour pouvoir cocher
          </Text>
        )}

        <Button
          title="Continuer l'inscription"
          onPress={handleAccept}
          disabled={!accepted}
          style={{
            ...styles.btn,
            ...(!accepted ? styles.btnDisabled : {}),
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.white },
  banner:             { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primarySoft, paddingHorizontal: Spacing['2xl'], paddingVertical: 10 },
  bannerText:         { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.primary },
  content:            { padding: Spacing['2xl'], paddingBottom: 20 },
  header:             { alignItems: 'center', marginBottom: Spacing['2xl'], paddingBottom: Spacing['2xl'], borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerIcon:         { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, ...Shadows.sm },
  headerTitle:        { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  headerSub:          { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  section:            { marginBottom: Spacing['2xl'] },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  sectionIcon:        { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:       { flex: 1, fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  paraRow:            { flexDirection: 'row', gap: 10, marginBottom: Spacing.sm, paddingLeft: 4 },
  bullet:             { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 8, flexShrink: 0 },
  paraText:           { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 21 },
  endNote:            { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FAF0', padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.md, marginBottom: Spacing.md },
  endNoteText:        { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.success, flex: 1 },
  footer:             { padding: Spacing['2xl'], paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white, ...Shadows.lg },
  checkRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxDisabled:   { backgroundColor: '#F5F5F5', borderColor: Colors.border },
  checkLabel:         { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  checkLabelDisabled: { color: Colors.textLight },
  scrollHint:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.sm },
  btn:                { marginTop: Spacing.sm },
  btnDisabled:        { opacity: 0.5 },
});