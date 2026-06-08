// app/auth/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError('');
    setLoading(true);
    // TODO: Supabase auth.signInWithPassword
    setTimeout(() => {
      setLoading(false);
      router.replace('/client/home');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Logo KourseGO directement (sans fond carré) ───────────────── */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo_icon_orange.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bon retour</Text>
          <Text style={styles.subtitle}>Connectez-vous pour gérer vos courses</Text>
        </View>

        {/* ── Formulaire ───────────────────────────────────────────────── */}
        <View style={styles.form}>
          <Input
            label="E-mail ou Numéro de téléphone"
            placeholder="Entrez votre e-mail ou téléphone"
            value={identifier}
            onChangeText={setIdentifier}
            leftIcon="person-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Input
            label="Mot de passe"
            placeholder="Entrez votre mot de passe"
            value={password}
            onChangeText={setPassword}
            leftIcon="lock-closed-outline"
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity onPress={() => {}} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />
        </View>

        {/* ── Séparateur ───────────────────────────────────────────────── */}
        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.separatorText}>OU CONTINUER AVEC</Text>
          <View style={styles.line} />
        </View>

        {/* ── Connexion sociale ────────────────────────────────────────── */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          
        </View>

        {/* ── Inscription ──────────────────────────────────────────────── */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Vous n'avez pas de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>

        {/* Espace bas pour que le clavier ne coupe pas le bouton */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1 },
  content: {
    padding: Spacing['2xl'],
    paddingTop: 48,
    flexGrow: 1,
  },

  // ── Logo sans fond carré ─────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: Spacing.base,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ── Formulaire ───────────────────────────────────────────────────────
  form: { marginBottom: Spacing.lg },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.base,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  loginBtn: { marginTop: Spacing.sm },

  // ── Séparateur ───────────────────────────────────────────────────────
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  separatorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textLight,
    letterSpacing: 0.5,
  },

  // ── Social ───────────────────────────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  socialText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },

  // ── Inscription ──────────────────────────────────────────────────────
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
});
