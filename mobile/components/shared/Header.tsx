// components/shared/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing } from '../../constants/Typography';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({
  title,
  showBack = false,
  showLogo = false,
  rightIcon,
  onRightPress,
  rightComponent,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.container, transparent && styles.transparent, !transparent && Shadows.sm]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        {showLogo && (
          <Image
            source={require('../../assets/images/logo_orange.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>

      {title && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.right}>
        {rightComponent
          ? rightComponent
          : rightIcon && (
              <TouchableOpacity onPress={onRightPress} style={styles.rightBtn} activeOpacity={0.7}>
                <Ionicons name={rightIcon} size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    minHeight: 60,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  backBtn: {
    padding: 4,
  },
  rightBtn: {
    padding: 4,
  },
  logo: {
    width: 120,
    height: 32,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.sm,
  },
});
