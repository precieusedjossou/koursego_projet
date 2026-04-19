// app/auth/kyc-coursier.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Header from '../../components/shared/Header';

type DocType = 'carte_identite' | 'passeport' | 'CIP' | null;

export default function KYCCoursierScreen() {
  const router = useRouter();
  const [docType, setDocType] = useState<DocType>(null);
  const [rectoUploaded, setRectoUploaded] = useState(false);
  const [versoUploaded, setVersoUploaded] = useState(false);
  const [selfieOk, setSelfieOk] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⚠️ Modification par rapport à la maquette :
  // On a simplifié à 3 types de documents (Carte Nationale, Passeport, CIP)
  // La vérification faciale est gardée mais le selfie "live" est simulé
  // (en prod : utiliser expo-camera avec détection de visage)

  const docOptions: { key: DocType; label: string; desc: string }[] = [
    { key: 'carte_identite', label: "Carte Nationale d'Identité", desc: 'Recto avec photo' },
    { key: 'passeport', label: 'Passeport', desc: 'Page bio avec photo' },
    { key: 'CIP', label: 'Carte CIP', desc: "Carte d'identification personnelle" },
  ];

  const handleSubmit = () => {
    if (!docType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de document');
      return;
    }
    if (!rectoUploaded) {
      Alert.alert('Erreur', 'Veuillez uploader le recto de votre document');
      return;
    }
    if (!selfieOk) {
      Alert.alert('Erreur', 'Veuillez prendre votre selfie');
      return;
    }
    setLoading(true);
    // TODO: Upload documents vers Supabase Storage + insertion en base
    setTimeout(() => {
      setLoading(false);
      router.replace('/auth/kyc-success');
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <Header showBack title="Inscription Coursier" />

      {/* Étapes */}
      <View style={styles.stepsRow}>
        <Text style={styles.stepLabel}>Vérification d'Identité</Text>
        <Text style={styles.stepIndicator}>Étape 3 sur 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Soumettez vos documents</Text>
        <Text style={styles.sectionDesc}>
          Pour valider votre compte, nous avons besoin de vérifier votre identité. Assurez-vous que
          vos documents sont lisibles.
        </Text>

        {/* 1. Type de document */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>① Type de document</Text>
          {docOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.docOption, docType === opt.key && styles.docOptionSelected]}
              onPress={() => setDocType(opt.key)}
              activeOpacity={0.7}
            >
              <View style={styles.docOptionLeft}>
                <Text style={[styles.docLabel, docType === opt.key && styles.docLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.docDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, docType === opt.key && styles.radioSelected]}>
                {docType === opt.key && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. Photo du document */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>② Photo du document</Text>

          {/* Recto */}
          <TouchableOpacity
            style={[styles.uploadBox, rectoUploaded && styles.uploadBoxDone]}
            onPress={() => setRectoUploaded(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rectoUploaded ? 'checkmark-circle' : 'camera-outline'}
              size={32}
              color={rectoUploaded ? Colors.success : Colors.textLight}
            />
            <Text style={styles.uploadLabel}>
              {rectoUploaded ? 'Recto uploadé ✓' : 'Prendre le Recto'}
            </Text>
            <Text style={styles.uploadSub}>Face avec votre document</Text>
          </TouchableOpacity>

          {/* Verso */}
          <TouchableOpacity
            style={[styles.uploadBox, versoUploaded && styles.uploadBoxDone]}
            onPress={() => setVersoUploaded(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={versoUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
              size={32}
              color={versoUploaded ? Colors.success : Colors.textLight}
            />
            <Text style={styles.uploadLabel}>
              {versoUploaded ? 'Verso uploadé ✓' : 'Télécharger le Verso'}
            </Text>
            <Text style={styles.uploadSub}>Recto JPG, PNG ou PDF</Text>
          </TouchableOpacity>

          {/* Conseil */}
          <View style={styles.tip}>
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
            <Text style={styles.tipText}>
              Placez votre document sur une surface plane avec un bon éclairage. Évitez les reflets
              et assurez-vous que les 4 coins sont visibles.
            </Text>
          </View>
        </View>

        {/* 3. Vérification faciale */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>③ Vérification faciale</Text>
          <TouchableOpacity
            style={[styles.selfieBox, selfieOk && styles.uploadBoxDone]}
            onPress={() => setSelfieOk(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selfieCircle}>
              <Ionicons
                name={selfieOk ? 'checkmark-circle' : 'camera'}
                size={36}
                color={selfieOk ? Colors.success : Colors.primary}
              />
            </View>
            <Text style={styles.uploadLabel}>
              {selfieOk ? 'Selfie pris ✓' : 'Prenez un selfie en direct'}
            </Text>
            <Text style={styles.uploadSub}>
              Nous comparerons cette photo avec celle de votre document d'identité
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Précédent"
          onPress={() => router.back()}
          variant="outline"
          style={styles.footerBtn}
        />
        <Button
          title="Continuer"
          onPress={handleSubmit}
          loading={loading}
          style={styles.footerBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primarySoft,
  },
  stepLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  stepIndicator: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  content: {
    padding: Spacing['2xl'],
    paddingBottom: 100,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
  },
  block: {
    marginBottom: Spacing['2xl'],
  },
  blockTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  docOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  docOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  docOptionLeft: { flex: 1 },
  docLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  docLabelSelected: { color: Colors.primary },
  docDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surfaceGray,
    marginBottom: Spacing.md,
    gap: 6,
  },
  uploadBoxDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    borderStyle: 'solid',
  },
  uploadLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  uploadSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textAlign: 'center',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tipText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  selfieBox: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 8,
    backgroundColor: Colors.surfaceGray,
  },
  selfieCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing['2xl'],
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  footerBtn: { flex: 1 },
});
