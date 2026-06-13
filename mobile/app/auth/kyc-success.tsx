// app/auth/kyc-success.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';

export default function KYCSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.primary} />
        </View>

        <Image
          source={require('../../assets/images/logo_orange.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Documents soumis avec succès !</Text>
        <Text style={styles.desc}>
          Vos documents sont en cours de vérification par notre équipe. Vous recevrez une
          notification dès que votre compte coursier sera validé.
        </Text>

        <View style={styles.statusBadge}>
          <Ionicons name="time-outline" size={16} color={Colors.warning} />
          <Text style={styles.statusText}>
            Statut : <Text style={styles.statusValue}>En attente de validation</Text>
          </Text>
        </View>
        <Text style={styles.statusSub}>Délai moyen : 24–48h</Text>

        <View style={styles.idPreview}>
          <Ionicons name="card-outline" size={48} color={Colors.textLight} />
          <Text style={styles.idPreviewText}>Document soumis</Text>
        </View>
      </View>

      {/* Bouton → retour au choix de rôle */}
      <Button
        title="Retourner à l'accueil"
        onPress={() => router.replace('/auth/role-choice')}
        style={styles.btn}
      />

      <Text style={styles.hint}>
        En attendant la validation, vous pouvez utiliser l'app en tant que client.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background, padding: Spacing['2xl'], justifyContent: 'center' },
  card:         { backgroundColor: Colors.white, borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.xl, ...Shadows.md },
  iconWrapper:  { marginBottom: Spacing.base },
  logo:         { width: 120, height: 36, marginBottom: Spacing.base },
  title:        { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  desc:         { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.warningLight, paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.full, marginBottom: 4 },
  statusText:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  statusValue:  { fontFamily: FontFamily.semiBold, color: Colors.warning },
  statusSub:    { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginBottom: Spacing.lg },
  idPreview:    { width: '100%', height: 100, backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', gap: 6 },
  idPreviewText:{ fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textLight },
  btn:          { marginTop: Spacing.sm },
  hint:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.md, lineHeight: 18 },
});