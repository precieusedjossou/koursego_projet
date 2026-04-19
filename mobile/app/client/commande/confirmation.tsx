// app/client/commande/confirmation.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Button from '../../../components/ui/Button';

const COURSIER = {
  nom: 'Moussa Elabidi',
  note: 4.8,
  nb_courses: 124,
  temps: '45 min',
  telephone: '+229 97 00 00 00',
};

export default function ConfirmationCoursierScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header showBack title="Coursier trouvé !" />
      <View style={styles.content}>

        {/* Icône succès */}
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
            <Text style={styles.coursierNom}>{COURSIER.nom}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.primary} />
              <Text style={styles.ratingText}>{COURSIER.note} · {COURSIER.nb_courses} courses</Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.tempsText}>{COURSIER.temps}</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactText}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactBtn, styles.whatsappBtn]}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={[styles.contactText, { color: '#25D366' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Résumé paiement */}
        <View style={styles.paiementCard}>
          <Text style={styles.paiementTitle}>Récapitulatif du paiement</Text>
          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabel}>Total articles</Text>
            <Text style={styles.paiementValue}>15 000 FCFA</Text>
          </View>
          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabel}>Commission coursier</Text>
            <Text style={styles.paiementValue}>1 500 FCFA</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paiementRow}>
            <Text style={styles.paiementLabelBold}>Total à payer</Text>
            <Text style={styles.paiementValueBold}>17 500 FCFA</Text>
          </View>
        </View>

        <Button
          title="Procéder au paiement →"
          onPress={() => router.push('/client/commande/paiement')}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing['2xl'], alignItems: 'center' },
  successIcon: { marginTop: Spacing.lg, marginBottom: Spacing.md },
  title: {
    fontFamily: FontFamily.bold, fontSize: FontSize['2xl'],
    color: Colors.textPrimary, marginBottom: 6,
  },
  sub: {
    fontFamily: FontFamily.regular, fontSize: FontSize.base,
    color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl,
  },
  coursierCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, width: '100%', marginBottom: Spacing.md, ...Shadows.sm,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  coursierInfo: { flex: 1 },
  coursierNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  metaRight: { alignItems: 'center', gap: 2 },
  tempsText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  contactRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginBottom: Spacing.md },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  whatsappBtn: { borderColor: '#25D366' },
  contactText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs, color: Colors.primary },
  paiementCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, width: '100%', marginBottom: Spacing.xl, ...Shadows.sm,
  },
  paiementTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  paiementRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  paiementLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  paiementValue: { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  paiementLabelBold: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.textPrimary },
  paiementValueBold: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  btn: { width: '100%' },
});
