// app/coursier/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize } from '../../constants/Typography';
import { Platform } from 'react-native';

export default function CoursierLayout() {
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
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="annonces"
        options={{
          title: 'Annonces',
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gains"
        options={{
          title: 'Gains',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="course/detail" options={{ href: null }} />
      <Tabs.Screen name="course/en-cours" options={{ href: null }} />
    </Tabs>
  );
}
