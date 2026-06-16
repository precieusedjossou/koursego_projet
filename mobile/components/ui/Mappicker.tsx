// components/ui/MapPicker.tsx
//
// Composant carte interactive (Leaflet + OpenStreetMap via WebView)
// L'utilisateur tape sur la carte pour poser un pin.
// Les coordonnées GPS + l'adresse (Nominatim) remontent via onSelect.
//
// Usage :
//   <MapPicker
//     visible={showMap}
//     onClose={() => setShowMap(false)}
//     onSelect={(coords, adresse) => { ... }}
//     initialCoords={{ lat: 6.3654, lon: 2.4183 }} // optionnel
//   />

import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export interface Coords {
  lat: number;
  lon: number;
}

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  /** Appelé quand l'utilisateur confirme sa position */
  onSelect: (coords: Coords, adresse: string) => void;
  /** Coordonnées initiales du pin (défaut : centre Cotonou) */
  initialCoords?: Coords;
  title?: string;
}

// Centre par défaut : Cotonou, Bénin
const COTONOU: Coords = { lat: 6.3654, lon: 2.4183 };

// ── HTML Leaflet injecté dans la WebView ──────────────────────────────────────
// La carte affiche un pin draggable. Quand l'utilisateur tape ou déplace le pin,
// les coordonnées sont postées via window.ReactNativeWebView.postMessage().
const buildLeafletHTML = (init: Coords) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .confirm-btn {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #F97316;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      white-space: nowrap;
    }
    .confirm-btn:active { opacity: 0.85; }
    .crosshair {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 999;
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    }
    .info-bar {
      position: fixed;
      top: 12px;
      left: 12px;
      right: 12px;
      background: rgba(255,255,255,0.95);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13px;
      color: #374151;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="info-bar">📍 Tapez sur la carte pour placer le point</div>
  <div id="map"></div>
  <button class="confirm-btn" onclick="confirmer()">✅ Confirmer cette position</button>

  <script>
    var currentLat = ${init.lat};
    var currentLon = ${init.lon};

    var map = L.map('map', { zoomControl: true }).setView([currentLat, currentLon], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Icône pin personnalisée
    var pinIcon = L.divIcon({
      html: '<div style="font-size:36px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">📍</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      className: '',
    });

    var marker = L.marker([currentLat, currentLon], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    // Tap sur la carte → déplace le pin
    map.on('click', function(e) {
      currentLat = e.latlng.lat;
      currentLon = e.latlng.lng;
      marker.setLatLng([currentLat, currentLon]);
      envoyer();
    });

    // Drag du pin → met à jour les coordonnées
    marker.on('dragend', function() {
      var pos = marker.getLatLng();
      currentLat = pos.lat;
      currentLon = pos.lng;
      envoyer();
    });

    function envoyer() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'coords',
        lat: currentLat,
        lon: currentLon,
      }));
    }

    function confirmer() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'confirm',
        lat: currentLat,
        lon: currentLon,
      }));
    }

    // Envoie les coords initiales au chargement
    setTimeout(envoyer, 500);
  </script>
</body>
</html>
`;

// ── Géocodage inversé Nominatim ───────────────────────────────────────────────
const reverseGeocode = async (coords: Coords): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}`,
      { headers: { 'User-Agent': 'KourseGo/1.0' } }
    );
    const d = await res.json();
    if (d && d.display_name) return d.display_name;
    return `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
  } catch {
    return `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
  }
};

// ── Composant principal ───────────────────────────────────────────────────────
export default function MapPicker({
  visible,
  onClose,
  onSelect,
  initialCoords,
  title = 'Choisir une position',
}: MapPickerProps) {
  const webViewRef                       = useRef<WebView>(null);
  const [pendingCoords, setPendingCoords] = useState<Coords | null>(null);
  const [loadingGPS, setLoadingGPS]      = useState(false);
  const [mapReady, setMapReady]          = useState(false);

  const init = initialCoords || COTONOU;

  // ── Réception des messages de la WebView ──────────────────────
  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === 'coords') {
        setPendingCoords({ lat: msg.lat, lon: msg.lon });
      }

      if (msg.type === 'confirm') {
        const coords: Coords = { lat: msg.lat, lon: msg.lon };
        const adresse = await reverseGeocode(coords);
        onSelect(coords, adresse);
        onClose();
      }
    } catch {
      // message non-JSON ignoré
    }
  };

  // ── Bouton "Ma position GPS" ──────────────────────────────────
  const handleGPS = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      // Déplace le pin dans la WebView via JS injecté
      webViewRef.current?.injectJavaScript(`
        (function() {
          currentLat = ${latitude};
          currentLon = ${longitude};
          marker.setLatLng([${latitude}, ${longitude}]);
          map.setView([${latitude}, ${longitude}], 16);
          envoyer();
        })();
        true;
      `);
    } catch {
      // silencieux
    } finally {
      setLoadingGPS(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>

        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          {/* Bouton GPS */}
          <TouchableOpacity onPress={handleGPS} style={styles.gpsBtn} disabled={loadingGPS}>
            {loadingGPS
              ? <ActivityIndicator size="small" color="#F97316" />
              : <Ionicons name="locate" size={22} color="#F97316" />
            }
          </TouchableOpacity>
        </View>

        {/* Indicateur de chargement carte */}
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Chargement de la carte...</Text>
          </View>
        )}

        {/* Carte Leaflet */}
        <WebView
          ref={webViewRef}
          source={{ html: buildLeafletHTML(init) }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoad={() => setMapReady(true)}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
        />

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  closeBtn:       { padding: 4 },
  headerTitle:    { fontWeight: '700', fontSize: 16, color: '#111827', flex: 1, textAlign: 'center' },
  gpsBtn:         { padding: 4 },
  webview:        { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: 12 },
  loadingText:    { fontSize: 14, color: '#6b7280', fontWeight: '500' },
});