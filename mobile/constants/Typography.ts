// constants/Typography.ts
// Si Poppins n'est pas chargé → fallback automatique vers polices système

import { Platform } from 'react-native';

// Polices système par plateforme
const systemFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// On essaie Poppins, sinon système
export const FontFamily = {
  light:    'Poppins-Light',
  regular:  'Poppins-Regular',
  medium:   'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold:     'Poppins-Bold',
};

// Utilisé quand Poppins n'est pas disponible (fallback automatique React Native)
export const SystemFont = {
  light:    systemFont,
  regular:  systemFont,
  medium:   systemFont,
  semiBold: systemFont,
  bold:     systemFont,
};

export const FontSize = {
  xs:    10,
  sm:    12,
  base:  14,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 48,
};

export const BorderRadius = {
  sm:    6,
  md:    10,
  lg:    14,
  xl:    20,
  '2xl': 28,
  full:  9999,
};
