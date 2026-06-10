// app/coursier/annonces.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Header from '../../components/shared/Header';

const ANNONCES = [
  {
    id: '1',
    client: 'Roméo Diallo',
    type: 'achat',
    description: 'Fufu de manioc x2, sauce graine, Sobébra x6',
    magasin: 'Marché Dantokpa',
    adresse: 'Fidjrossè, Cotonou',
    distance: '2.3 km',
    temps: '18 min',
    montant: '1 500 FCFA',
    total: '17 000 FCFA',
    datePublie: 'Il y a 3 min',
    poids: null,
  },
  {
    id: '2',
    client: 'Sylvie Koffi',
    type: 'recuperation_colis',
    description: 'Colis Amazon, boîte bleue, ~2kg — récupérer au bureau de poste',
    magasin: 'Bureau de poste Cadjèhoun',
    adresse: 'Akpakpa, Cotonou',
    distance: '4.1 km',
    temps: '25 min',
    montant: '2 000 FCFA',
    total: '2 000 FCFA',
    datePublie: 'Il y a 8 min',
    poids: 'leger',
  },
  {
    id: '3',
    client: 'Kodjo Mensah',
    type: 'achat',
    description: 'Médicaments (ordonnance jointe), Pharmacie Bonne Santé',
    magasin: 'Pharmacie Bonne Santé',
    adresse: 'Gbèdjromèdé, Cotonou',
    distance: '5.8 km',
    temps: '35 min',
    montant: '1 800 FCFA',
    total: '8 500 FCFA',
    datePublie: 'Il y a 14 min',
    poids: null,
  },
  {
    id: '4',
    client: 'Aïcha Touré',
    type: 'recuperation_colis',
    description: 'Groupe électrogène à récupérer chez le fournisseur',
    magasin: 'Zone industrielle, Porto-Novo',
    adresse: 'Godomey, Cotonou',
    distance: '6.2 km',
    temps: '30 min',
    montant: '3 500 FCFA',
    total: '3 500 FCFA',
    datePublie: 'Il y a 2 min',
    poids: 'lourd',
  },
];

export default function AnnoncesScreen() {
  const router = useRouter();
  const [filtre, setFiltre] = useState<'toutes' | 'achat' | 'recuperation_colis'>('toutes');

  const filtrees = ANNONCES.filter((a) => filtre === 'toutes' || a.type === filtre);

  return (
    <View style={styles.container}>
      <Header showLogo />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Annonces disponibles</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtrees.length}</Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtresRow}>
        {[
          { key: 'toutes', label: 'Toutes' },
          { key: 'achat', label: '🛒 Achats' },
          { key: 'recuperation_colis', label: '📦 Colis' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnActive]}
            onPress={() => setFiltre(f.key as any)}
          >
            <Text style={[styles.filtreTxt, filtre === f.key && styles.filtreTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtrees}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header card */}
            <View style={styles.cardHeader}>
              <View style={styles.clientInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.clientNom}>{item.client}</Text>
              </View>
              <View style={styles.badgesRow}>
                {/* Badge poids — uniquement pour les colis */}
                {item.type === 'recuperation_colis' && item.poids && (
                  <View style={[
                    styles.poidsBadge,
                    item.poids === 'lourd' ? styles.poidsBadgeLourd : styles.poidsBadgeLeger,
                  ]}>
                    <Ionicons
                      name={item.poids === 'lourd' ? 'barbell-outline' : 'leaf-outline'}
                      size={11}
                      color={item.poids === 'lourd' ? Colors.error : Colors.success}
                    />
                    <Text style={[
                      styles.poidsText,
                      item.poids === 'lourd' ? styles.poidsTextLourd : styles.poidsTextLeger,
                    ]}>
                      {item.poids === 'lourd' ? 'Lourd' : 'Léger'}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.typeBadge,
                  item.type === 'achat' ? styles.typeBadgeAchat : styles.typeBadgeColis,
                ]}>
                  <Text style={[
                    styles.typeText,
                    item.type === 'achat' ? styles.typeTextAchat : styles.typeTextColis,
                  ]}>
                    {item.type === 'achat' ? '🛒 Achat' : '📦 Colis'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

            {/* Infos trajet */}
            <View style={styles.trajetRow}>
              <View style={styles.trajetItem}>
                <Ionicons name="storefront-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.trajetText}>{item.magasin}</Text>
              </View>
              <View style={styles.trajetItem}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.trajetText}>{item.adresse}</Text>
              </View>
            </View>

            {/* Métas */}
            <View style={styles.metasRow}>
              <View style={styles.meta}>
                <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
                <Text style={styles.metaVal}>{item.distance}</Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={14} color={Colors.primary} />
                <Text style={styles.metaVal}>{item.temps}</Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name="cash-outline" size={14} color={Colors.success} />
                <Text style={[styles.metaVal, { color: Colors.success }]}>{item.montant}</Text>
              </View>
            </View>

            <Text style={styles.publie}>Publié {item.datePublie}</Text>

            {/* Bouton */}
            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/coursier/course/detail')}
            >
              <Text style={styles.acceptBtnText}>Voir les détails & accepter</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.primary, width: 24, height: 24,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.white },
  filtresRow: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filtreBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceGray,
  },
  filtreBtnActive: { backgroundColor: Colors.primary },
  filtreTxt: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  filtreTxtActive: { color: Colors.white },
  list: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  clientNom: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.textPrimary },

  // Badges groupés
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Badge poids
  poidsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  poidsBadgeLeger: { backgroundColor: Colors.successLight },
  poidsBadgeLourd: { backgroundColor: '#FDECEA' },
  poidsText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  poidsTextLeger: { color: Colors.success },
  poidsTextLourd: { color: Colors.error },

  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  typeBadgeAchat: { backgroundColor: Colors.primarySoft },
  typeBadgeColis: { backgroundColor: Colors.infoLight },
  typeText: { fontFamily: FontFamily.medium, fontSize: FontSize.xs },
  typeTextAchat: { color: Colors.primary },
  typeTextColis: { color: Colors.info },

  desc: {
    fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textSecondary,
    lineHeight: 18, marginBottom: Spacing.sm,
  },
  trajetRow: { gap: 4, marginBottom: Spacing.sm },
  trajetItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trajetText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  metasRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaVal: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  publie: {
    fontFamily: FontFamily.regular, fontSize: FontSize.xs,
    color: Colors.textMuted, marginBottom: Spacing.md,
  },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 14,
  },
  acceptBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.white },
});