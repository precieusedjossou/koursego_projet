// app/client/course/suivi.tsx — ✅ Expo Go compatible
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import MapWebView from '../../../components/shared/MapWebView';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SuiviCourseScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <MapWebView
        latitude={6.360}
        longitude={2.413}
        zoom={14}
        height={SCREEN_HEIGHT * 0.52}
        showRoute
        markers={[
          { latitude: 6.3654, longitude: 2.4183, title: 'Moussa — Coursier', color: 'orange' },
          { latitude: 6.3554, longitude: 2.4083, title: 'Votre adresse', color: 'red' },
        ]}
      />

      <View style={styles.headerFloat}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course en cours</Text>
        <TouchableOpacity onPress={() => router.push('/client/course/chat')} style={styles.iconBtn}>
          <Ionicons name="chatbubble-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.coursierRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coursierNom}>Moussa Elabidi</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="star" size={13} color={Colors.primary} />
              <Text style={styles.ratingText}>4.8 · 124 courses</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/client/course/chat')}>
              <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statutBar}>
          {['Acceptée', 'En route', 'Livrée'].map((step, i) => (
            <React.Fragment key={step}>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={[styles.statutDot, i <= 1 && styles.statutDotActive]} />
                <Text style={styles.statutStepText}>{step}</Text>
              </View>
              {i < 2 && <View style={[styles.statutLine, i === 0 && styles.statutLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.etaRow}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.etaText}>Arrivée estimée dans <Text style={{ fontFamily: FontFamily.bold, color: Colors.primary }}>12 min</Text></Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: Spacing.base }}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={{ flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary }}>
            Fidjrossè, Cotonou — Porte bleue, 1er étage
          </Text>
        </View>

        <TouchableOpacity style={styles.finBtn} onPress={() => router.push('/client/course/fin')} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
          <Text style={styles.finBtnText}>Confirmer la réception</Text>
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
  coursierRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.base },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  coursierNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },
  ratingText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  actionBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  statutBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  statutDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.border, marginBottom: 4 },
  statutDotActive: { backgroundColor: Colors.primary },
  statutLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 20 },
  statutLineActive: { backgroundColor: Colors.primary },
  statutStepText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primarySoft, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  etaText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary },
  finBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: 16, ...Shadows.md },
  finBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});
