// app/coursier/course/en-cours.tsx — ✅ Expo Go compatible
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import MapWebView from '../../../components/shared/MapWebView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CourseEnCours() {
  const router = useRouter();
  const [etape, setEtape] = useState<'aller_magasin' | 'en_livraison'>('aller_magasin');

  const handleEtapeSuivante = () => {
    if (etape === 'aller_magasin') {
      setEtape('en_livraison');
    } else {
      Alert.alert(
        'Terminer la course ?',
        'Confirmez que vous avez bien livré les articles au client.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: () => router.replace('/coursier/gains'),
          },
        ]
      );
    }
  };

  const destination = etape === 'aller_magasin'
    ? { latitude: 6.3654, longitude: 2.4183, title: 'Marché Dantokpa', color: 'orange' as const }
    : { latitude: 6.3554, longitude: 2.4083, title: 'Adresse livraison', color: 'red' as const };

  return (
    <View style={styles.container}>
      <MapWebView
        latitude={6.360}
        longitude={2.413}
        zoom={14}
        height={SCREEN_HEIGHT * 0.50}
        markers={[
          { latitude: 6.3700, longitude: 2.4200, title: 'Vous', color: 'blue' },
          destination,
        ]}
        showRoute
      />

      {/* Header flottant */}
      <View style={styles.headerFloat}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course #PRF-1425</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        {/* Étapes */}
        <View style={styles.etapesRow}>
          {[
            { label: 'Magasin', icon: 'storefront' as const },
            { label: 'Livraison', icon: 'home' as const },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.etapeDot, (i === 0 || etape === 'en_livraison') && styles.etapeDotActive]}>
                  <Ionicons name={step.icon} size={12} color={Colors.white} />
                </View>
                <Text style={styles.etapeLabel}>{step.label}</Text>
              </View>
              {i === 0 && (
                <View style={[styles.etapeLine, etape === 'en_livraison' && styles.etapeLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Destination */}
        <View style={styles.destCard}>
          <View style={[styles.destIcon, { backgroundColor: etape === 'en_livraison' ? Colors.successLight : Colors.primarySoft }]}>
            <Ionicons
              name={etape === 'en_livraison' ? 'home-outline' : 'storefront-outline'}
              size={22}
              color={etape === 'en_livraison' ? Colors.success : Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destLabel}>{etape === 'en_livraison' ? 'Adresse de livraison' : 'Magasin à visiter'}</Text>
            <Text style={styles.destVal}>
              {etape === 'en_livraison' ? 'Fidjrossè, Cotonou — Porte bleue' : 'Marché Dantokpa, Stand A12'}
            </Text>
          </View>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="navigate" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Client */}
        <View style={styles.clientRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientNom}>Jean Dupont</Text>
            <Text style={styles.clientInfo}>Client · +229 97 XX XX XX</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.etapeBtn} onPress={handleEtapeSuivante} activeOpacity={0.85}>
          <Ionicons
            name={etape === 'en_livraison' ? 'checkmark-circle-outline' : 'arrow-forward-circle-outline'}
            size={20}
            color={Colors.white}
          />
          <Text style={styles.etapeBtnText}>
            {etape === 'en_livraison' ? 'Confirmer la livraison ✓' : "J'arrive au magasin →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  headerFloat: {
    position: 'absolute', top: 52, left: Spacing.base, right: Spacing.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadows.md,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  bottomSheet: {
    flex: 1, backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, marginTop: -20, ...Shadows.lg,
  },
  etapesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  etapeDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  etapeDotActive: { backgroundColor: Colors.primary },
  etapeLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 8, marginBottom: 20 },
  etapeLineActive: { backgroundColor: Colors.primary },
  etapeLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  destCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceGray, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  destIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  destLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight },
  destVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clientNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  clientInfo: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  etapeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: 16,
  },
  etapeBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});
