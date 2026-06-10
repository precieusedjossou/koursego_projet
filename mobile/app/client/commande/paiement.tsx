// app/client/commande/paiement.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../../constants/Typography';
import Header from '../../../components/shared/Header';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

type Moyen = 'momo' | 'moov' | 'especes';

export default function PaiementScreen() {
  const router = useRouter();
  const [moyen, setMoyen] = useState<Moyen>('momo');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const moyens = [
    { key: 'momo' as Moyen, label: 'MTN MoMo', icon: 'phone-portrait-outline', color: '#FFCC00' },
    { key: 'moov' as Moyen, label: 'Moov Money', icon: 'phone-portrait-outline', color: '#00A0E3' },
    { key: 'especes' as Moyen, label: 'Espèces au coursier', icon: 'cash-outline', color: Colors.success },
  ];

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/client/course/suivi');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Header showBack title="Paiement" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Récap montant */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant total</Text>
          <Text style={styles.amount}>16 500 FCFA</Text>
          <View style={styles.amountDetails}>
            <Text style={styles.amountSub}>Articles : 15 000 · Coursier : 1 500 </Text>
          </View>
        </View>

        {/* Moyen de paiement */}
        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        {moyens.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.moyenCard, moyen === m.key && styles.moyenCardActive]}
            onPress={() => setMoyen(m.key)}
            activeOpacity={0.8}
          >
            <View style={[styles.moyenIcon, { backgroundColor: m.color + '22' }]}>
              <Ionicons name={m.icon as any} size={24} color={m.color} />
            </View>
            <Text style={[styles.moyenLabel, moyen === m.key && styles.moyenLabelActive]}>
              {m.label}
            </Text>
            <View style={[styles.radio, moyen === m.key && styles.radioActive]}>
              {moyen === m.key && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Numéro si MoMo/Moov */}
        {(moyen === 'momo' || moyen === 'moov') && (
          <Input
            label="Numéro de téléphone"
            placeholder="+229 XX XX XX XX"
            value={telephone}
            onChangeText={setTelephone}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />
        )}

        {/* Note */}
        {moyen === 'especes' && (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>
              Vous remettrez l'argent directement au coursier à la fin de la course.
            </Text>
          </View>
        )}

        <Button
          title={moyen === 'especes' ? 'Confirmer & démarrer →' : 'Payer maintenant →'}
          onPress={handlePay}
          loading={loading}
          style={{ marginTop: Spacing.xl }}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing['2xl'] },
  amountCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl, ...Shadows.md,
  },
  amountLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: 'rgba(255,255,255,0.8)' },
  amount: { fontFamily: FontFamily.bold, fontSize: FontSize['4xl'], color: Colors.white, marginVertical: 4 },
  amountDetails: {},
  amountSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  sectionTitle: {
    fontFamily: FontFamily.semiBold, fontSize: FontSize.base,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  moyenCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm,
  },
  moyenCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  moyenIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  moyenLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  moyenLabelActive: { color: Colors.primary },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  noteBox: {
    flexDirection: 'row', gap: 8, backgroundColor: Colors.warningLight,
    padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  noteText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
});
