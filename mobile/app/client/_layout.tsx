// app/client/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize } from '../../constants/Typography';
import { Platform } from 'react-native';

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: FontSize.xs,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="commandes"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertes"
        options={{
          title: 'Alertes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Écrans cachés de la tab bar */}
      <Tabs.Screen name="commande/nouvelle" options={{ href: null }} />
      <Tabs.Screen name="commande/recapitulatif" options={{ href: null }} />
      <Tabs.Screen name="commande/confirmation" options={{ href: null }} />
      <Tabs.Screen name="commande/paiement" options={{ href: null }} />
      <Tabs.Screen name="course/suivi" options={{ href: null }} />
      <Tabs.Screen name="course/chat" options={{ href: null }} />
      <Tabs.Screen name="course/fin" options={{ href: null }} />
      <Tabs.Screen name="course/notation" options={{ href: null }} />
    </Tabs>
  );
}
