// components/shared/MapWebView.tsx
// ✅ 100% compatible Expo Go — utilise WebView + Leaflet (OpenStreetMap)
// ⚠️ react-native-maps n'est PAS supporté dans Expo Go sans Dev Client
//
// Compatible avec l'usage existant (props identiques : latitude, longitude, zoom,
// markers, height, showRoute) + ajoute la possibilité de déplacer un marker en
// live et animé via une ref, utile pour simuler le déplacement d'un coursier :
//
//   const mapRef = useRef<MapWebViewHandle>(null);
//   <MapWebView ref={mapRef} markers={[{ id: 'coursier', ... }, ...]} showRoute />
//   mapRef.current?.moveMarkerTo('coursier', lat, lng, 4000); // anime sur 4s

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/Colors';

interface Marker {
  /** Optionnel : identifiant utilisé pour déplacer ce marker plus tard via moveMarkerTo */
  id?: string;
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

export interface MapWebViewHandle {
  /** Déplace un marker (par son id) vers une nouvelle position, animé sur durationMs */
  moveMarkerTo: (id: string, lat: number, lng: number, durationMs?: number) => void;
  /** Recentre la carte sur un point */
  centerOn: (lat: number, lng: number, zoom?: number) => void;
}

const COLOR_HEX: Record<string, string> = {
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
  orange: '#FF8C00',
};

const MapWebView = forwardRef<MapWebViewHandle, MapWebViewProps>(
  (
    {
      latitude,
      longitude,
      zoom = 14,
      markers = [],
      height = 300,
      showRoute = false,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);
    const [mapReady, setMapReady] = useState(false);

    // Markers avec id garanti (utilisé côté JS pour les retrouver et les déplacer)
    const markersWithId = markers.map((m, i) => ({ ...m, id: m.id ?? `m${i}` }));

    const markersJSON = JSON.stringify(
      markersWithId.map((m) => ({
        id: m.id,
        lat: m.latitude,
        lng: m.longitude,
        title: m.title ?? '',
        color: COLOR_HEX[m.color ?? 'orange'],
      }))
    );

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
    var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var markersData = ${markersJSON};
    var markerObjs = {};
    var routeLine = null;

    function addMarker(d) {
      var marker = L.circleMarker([d.lat, d.lng], {
        radius: 10,
        fillColor: d.color,
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);
      if (d.title) marker.bindPopup(d.title);
      markerObjs[d.id] = marker;
    }

    markersData.forEach(addMarker);

    function drawRoute() {
      if (routeLine) { map.removeLayer(routeLine); }
      if (markersData.length < 2) return;
      var latlngs = markersData.map(function(d) {
        var pos = markerObjs[d.id].getLatLng();
        return [pos.lat, pos.lng];
      });
      routeLine = L.polyline(latlngs, {
        color: '#FF8C00', weight: 4, opacity: 0.8, dashArray: '8,4'
      }).addTo(map);
    }

    ${showRoute ? 'drawRoute();' : ''}

    // ── Déplacement animé d'un marker (appelé depuis React Native) ──────────
    function moveMarkerTo(id, newLat, newLng, durationMs) {
      var marker = markerObjs[id];
      if (!marker) return;

      var start = marker.getLatLng();
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var t = Math.min(elapsed / durationMs, 1);
        var eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; // ease-in-out

        var lat = start.lat + (newLat - start.lat) * eased;
        var lng = start.lng + (newLng - start.lng) * eased;
        marker.setLatLng([lat, lng]);

        ${showRoute ? 'drawRoute();' : ''}

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          marker.setLatLng([newLat, newLng]);
          ${showRoute ? 'drawRoute();' : ''}
        }
      }
      requestAnimationFrame(step);
    }

    function centerOn(lat, lng, zoomLevel) {
      map.setView([lat, lng], zoomLevel || map.getZoom());
    }

    window.moveMarkerTo = moveMarkerTo;
    window.centerOn = centerOn;

    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'ready' })
    );
  </script>
</body>
</html>`;

    useImperativeHandle(ref, () => ({
      moveMarkerTo: (id, lat, lng, durationMs = 3000) => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            if (window.moveMarkerTo) {
              window.moveMarkerTo(${JSON.stringify(id)}, ${lat}, ${lng}, ${durationMs});
            }
          })();
          true;
        `);
      },
      centerOn: (lat, lng, zoomLevel) => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            if (window.centerOn) {
              window.centerOn(${lat}, ${lng}, ${zoomLevel ?? ''});
            }
          })();
          true;
        `);
      },
    }));

    const handleMessage = (event: any) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'ready') setMapReady(true);
      } catch {
        // ignore
      }
    };

    return (
      <View style={[styles.container, { height }]}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled
          startInLoadingState
          onMessage={handleMessage}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        />
      </View>
    );
  }
);

MapWebView.displayName = 'MapWebView';
export default MapWebView;

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