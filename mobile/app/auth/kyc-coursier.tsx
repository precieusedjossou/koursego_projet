// app/auth/kyc-coursier.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

// ✅ Valeurs en minuscule = correspond à la contrainte SQL
type DocType = 'carte_identite' | 'passeport' | 'cip' | null;

export default function KYCCoursierScreen() {
  const router = useRouter();
  const [docType, setDocType]     = useState<DocType>(null);
  const [rectoUri, setRectoUri]   = useState<string | null>(null);
  const [versoUri, setVersoUri]   = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const docOptions: { key: DocType; label: string; desc: string }[] = [
    { key: 'carte_identite', label: "Carte Nationale d'Identité", desc: 'Recto avec photo' },
    { key: 'passeport',      label: 'Passeport',                  desc: 'Page bio avec photo' },
    { key: 'cip',            label: 'Carte CIP',                  desc: "Carte d'identification personnelle" },
  ];

  const pickImage = async (type: 'recto' | 'verso') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie dans les paramètres.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === 'recto') setRectoUri(result.assets[0].uri);
      else setVersoUri(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la caméra dans les paramètres.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled && result.assets[0]) setSelfieUri(result.assets[0].uri);
  };

  const uploadImage = async (uri: string, path: string): Promise<string | null> => {
    try {
      const response    = await fetch(uri);
      const blob        = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error }   = await supabase.storage
        .from('documents-kyc')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) { console.error('Erreur upload:', error); return null; }
      const { data } = supabase.storage.from('documents-kyc').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error('Erreur upload image:', err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!docType)   { Alert.alert('Erreur', 'Veuillez sélectionner un type de document'); return; }
    if (!rectoUri)  { Alert.alert('Erreur', 'Veuillez uploader le recto de votre document'); return; }
    if (!selfieUri) { Alert.alert('Erreur', 'Veuillez prendre votre selfie'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erreur', 'Session expirée. Reconnectez-vous.');
        router.replace('/auth/login');
        return;
      }

      const rectoUrl = await uploadImage(rectoUri, `${user.id}/recto.jpg`);
      if (!rectoUrl) { Alert.alert('Erreur', 'Échec upload recto. Réessayez.'); return; }

      if (versoUri) await uploadImage(versoUri, `${user.id}/verso.jpg`);

      const selfieUrl = await uploadImage(selfieUri, `${user.id}/selfie.jpg`);
      if (!selfieUrl) { Alert.alert('Erreur', 'Échec upload selfie. Réessayez.'); return; }

      // ✅ type_document en minuscule = correspond à la contrainte SQL
      const { error: livreurError } = await supabase.from('coursier').upsert({
        id: user.id,
        statut_validation: 'en_attente',
        disponibilite:     false,
        type_document:     docType,
        photo_document:    rectoUrl,
        photo_selfie:      selfieUrl,
      });

      if (livreurError) {
        console.error('Erreur insertion livreur:', livreurError);
        Alert.alert('Erreur', 'Une erreur est survenue. Réessayez.');
        return;
      }

      await supabase.from('utilisateurs')
        .update({ mode: 'coursier' })
        .eq('id', user.id);

      router.replace('/auth/kyc-success');

    } catch (err) {
      console.error('Erreur KYC:', err);
      Alert.alert('Erreur', 'Une erreur réseau est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <Header showBack title="Inscription Coursier" />
      <View style={styles.stepsRow}>
        <Text style={styles.stepLabel}>Vérification d'Identité</Text>
        <Text style={styles.stepIndicator}>Étape 3 sur 4</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Soumettez vos documents</Text>
        <Text style={styles.sectionDesc}>
          Pour valider votre compte, nous avons besoin de vérifier votre identité.
          Assurez-vous que vos documents sont lisibles.
        </Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>① Type de document</Text>
          {docOptions.map((opt) => (
            <TouchableOpacity key={opt.key}
              style={[styles.docOption, docType === opt.key && styles.docOptionSelected]}
              onPress={() => setDocType(opt.key)} activeOpacity={0.7}>
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

        <View style={styles.block}>
          <Text style={styles.blockTitle}>② Photo du document</Text>
          <TouchableOpacity style={[styles.uploadBox, rectoUri && styles.uploadBoxDone]}
            onPress={() => pickImage('recto')} activeOpacity={0.7}>
            {rectoUri
              ? <Image source={{ uri: rectoUri }} style={styles.previewImage} />
              : <Ionicons name="camera-outline" size={32} color={Colors.textLight} />}
            <Text style={styles.uploadLabel}>
              {rectoUri ? 'Recto sélectionné ✓' : 'Choisir le Recto depuis la galerie'}
            </Text>
            <Text style={styles.uploadSub}>Face avec votre photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.uploadBox, versoUri && styles.uploadBoxDone]}
            onPress={() => pickImage('verso')} activeOpacity={0.7}>
            {versoUri
              ? <Image source={{ uri: versoUri }} style={styles.previewImage} />
              : <Ionicons name="cloud-upload-outline" size={32} color={Colors.textLight} />}
            <Text style={styles.uploadLabel}>
              {versoUri ? 'Verso sélectionné ✓' : 'Choisir le Verso (optionnel)'}
            </Text>
            <Text style={styles.uploadSub}>JPG ou PNG</Text>
          </TouchableOpacity>

          <View style={styles.tip}>
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
            <Text style={styles.tipText}>
              Placez votre document sur une surface plane avec un bon éclairage.
            </Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>③ Vérification faciale</Text>
          <TouchableOpacity style={[styles.selfieBox, selfieUri && styles.uploadBoxDone]}
            onPress={takeSelfie} activeOpacity={0.7}>
            {selfieUri
              ? <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
              : <View style={styles.selfieCircle}>
                  <Ionicons name="camera" size={36} color={Colors.primary} />
                </View>}
            <Text style={styles.uploadLabel}>
              {selfieUri ? 'Selfie pris ✓' : 'Prendre un selfie'}
            </Text>
            <Text style={styles.uploadSub}>Caméra frontale — regardez bien l'objectif</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Précédent" onPress={() => router.back()}
          variant="outline" style={styles.footerBtn} />
        <Button title="Continuer" onPress={handleSubmit}
          loading={loading} style={styles.footerBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepsRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.sm, backgroundColor: Colors.primarySoft },
  stepLabel:         { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  stepIndicator:     { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  content:           { padding: Spacing['2xl'], paddingBottom: 100 },
  sectionTitle:      { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sectionDesc:       { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing['2xl'] },
  block:             { marginBottom: Spacing['2xl'] },
  blockTitle:        { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  docOption:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.sm, backgroundColor: Colors.white },
  docOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  docOptionLeft:     { flex: 1 },
  docLabel:          { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  docLabelSelected:  { color: Colors.primary },
  docDesc:           { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  radio:             { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected:     { borderColor: Colors.primary },
  radioInner:        { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  uploadBox:         { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.surfaceGray, marginBottom: Spacing.md, gap: 6 },
  uploadBoxDone:     { borderColor: Colors.success, backgroundColor: Colors.successLight, borderStyle: 'solid' },
  uploadLabel:       { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  uploadSub:         { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center' },
  previewImage:      { width: 120, height: 80, borderRadius: 8, marginBottom: 4 },
  selfiePreview:     { width: 80, height: 80, borderRadius: 40, marginBottom: 4 },
  tip:               { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: BorderRadius.md },
  tipText:           { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  selfieBox:         { alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', gap: 8, backgroundColor: Colors.surfaceGray },
  selfieCircle:      { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: 8 },
  footer:            { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: Spacing.md, padding: Spacing['2xl'], backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.lg },
  footerBtn:         { flex: 1 },
});