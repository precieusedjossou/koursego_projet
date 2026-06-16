// components/ui/LocationSearch.tsx
//
// Champ de recherche d'adresse avec autocomplétion Nominatim (OpenStreetMap)
// L'utilisateur tape → suggestions en temps réel → il choisit → coords GPS retournées
//
// Usage :
//   <LocationSearch
//     label="Adresse de livraison"
//     placeholder="Tapez une adresse..."
//     value={adresse}
//     onSelect={(adresse, coords) => { ... }}
//   />

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';

export interface Coords {
  lat: number;
  lon: number;
}

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  label?: string;
  placeholder?: string;
  value: string;
  onSelect: (adresse: string, coords: Coords) => void;
  leftIcon?: string;
}

// Debounce : attend que l'utilisateur arrête de taper avant de chercher
function useDebounce(fn: (...args: any[]) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function LocationSearch({
  label,
  placeholder = 'Tapez une adresse...',
  value,
  onSelect,
  leftIcon = 'location-outline',
}: LocationSearchProps) {
  const [query, setQuery]               = useState(value);
  const [suggestions, setSuggestions]   = useState<Suggestion[]>([]);
  const [loading, setLoading]           = useState(false);
  const [showList, setShowList]         = useState(false);
  const [confirmed, setConfirmed]       = useState(!!value);

  // Recherche Nominatim — contextualisée Bénin pour des résultats proches
  const searchNominatim = async (text: string) => {
    if (text.length < 3) { setSuggestions([]); setShowList(false); return; }
    setLoading(true);
    try {
      const q   = encodeURIComponent(text);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=6&countrycodes=bj&addressdetails=1`,
        { headers: { 'User-Agent': 'KourseGo/1.0' } }
      );
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setShowList(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(searchNominatim, 400);

  const handleChangeText = (text: string) => {
    setQuery(text);
    setConfirmed(false);
    debouncedSearch(text);
  };

  const handleSelect = (item: Suggestion) => {
    const adresse = item.display_name;
    const coords: Coords = { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
    setQuery(adresse);
    setSuggestions([]);
    setShowList(false);
    setConfirmed(true);
    Keyboard.dismiss();
    onSelect(adresse, coords);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowList(false);
    setConfirmed(false);
  };

  // Raccourcit l'adresse pour l'affichage dans la liste
  const shortName = (display: string) => {
    const parts = display.split(',');
    return parts.slice(0, 3).join(',');
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Champ de saisie */}
      <View style={[styles.inputRow, confirmed && styles.inputRowConfirmed]}>
        <Ionicons
          name={confirmed ? 'checkmark-circle' : leftIcon as any}
          size={20}
          color={confirmed ? Colors.primary : Colors.textLight}
          style={styles.leftIcon}
        />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          onFocus={() => { if (suggestions.length > 0) setShowList(true); }}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} style={styles.rightIcon} />}
        {!loading && query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.rightIcon}>
            <Ionicons name="close-circle" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste de suggestions */}
      {showList && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.suggestionItem, index === suggestions.length - 1 && styles.lastItem]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {shortName(item.display_name)}
                  </Text>
                  <Text style={styles.suggestionSub} numberOfLines={1}>
                    {item.display_name.split(',').slice(3, 5).join(',')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Indication si coordonnées confirmées */}
      {confirmed && (
        <Text style={styles.confirmedText}>✅ Position GPS confirmée — distance calculable</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:            { marginBottom: Spacing.md },
  label:              { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  inputRow:           { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, backgroundColor: Colors.white, paddingHorizontal: Spacing.md, minHeight: 50 },
  inputRowConfirmed:  { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  leftIcon:           { marginRight: 8 },
  rightIcon:          { marginLeft: 8 },
  input:              { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 12 },
  dropdown:           { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, backgroundColor: Colors.white, marginTop: 4, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  suggestionItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  lastItem:           { borderBottomWidth: 0 },
  suggestionMain:     { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textPrimary },
  suggestionSub:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  confirmedText:      { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.primary, marginTop: 4 },
});