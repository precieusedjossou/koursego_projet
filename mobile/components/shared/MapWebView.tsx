// components/shared/MapWebView.tsx
// ✅ 100% compatible Expo Go — utilise WebView + Leaflet (OpenStreetMap)
// ⚠️ react-native-maps n'est PAS supporté dans Expo Go sans Dev Client

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/Colors';

interface Marker {
  latitude: number;
  longitude: number;
  title?: string;
  color?: 'orange' | 'red' | 'green' | 'blue';
}

interface MapWebViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Marker[];
  height?: number;
  showRoute?: boolean;
}

export default function MapWebView({
  latitude,
  longitude,
  zoom = 14,
  markers = [],
  height = 300,
  showRoute = false,
}: MapWebViewProps) {
  // Génère le HTML Leaflet avec OpenStreetMap (gratuit, pas besoin de clé API)
  const markersJS = markers
    .map((m) => {
      const color = m.color === 'red' ? '#EF4444'
        : m.color === 'green' ? '#22C55E'
        : m.color === 'blue' ? '#3B82F6'
        : '#FF8C00';
      return `
        L.circleMarker([${m.latitude}, ${m.longitude}], {
          radius: 10,
          fillColor: '${color}',
          color: 'white',
          weight: 3,
          opacity: 1,
          fillOpacity: 1
        }).addTo(map).bindPopup('${m.title ?? ''}');
      `;
    })
    .join('\n');

  const routeJS = showRoute && markers.length >= 2
    ? `L.polyline([${markers.map((m) => `[${m.latitude},${m.longitude}]`).join(',')}], {
        color: '#FF8C00', weight: 4, opacity: 0.8, dashArray: '8,4'
      }).addTo(map);`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    ${markersJS}
    ${routeJS}
  </script>
</body>
</html>`;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
});
