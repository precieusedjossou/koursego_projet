// app/auth/register.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Header from '../../components/shared/Header';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom_complet: '',
    email: '',
    telephone: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    if (!form.nom_complet || !form.email || !form.telephone || !form.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setError('');
    setLoading(true);
    // TODO: Supabase auth.signUp + insertion dans table UTILISATEUR
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/otp');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header showBack title="" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez-nous et commencez l'aventure</Text>

        <View style={styles.form}>
          <Input
            label="Nom complet"
            placeholder="John Doe"
            value={form.nom_complet}
            onChangeText={(v) => update('nom_complet', v)}
            leftIcon="person-outline"
            autoCapitalize="words"
          />
          <Input
            label="E-mail"
            placeholder="nom@exemple.com"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Numéro de téléphone"
            placeholder="+229 XX XX XX XX"
            value={form.telephone}
            onChangeText={(v) => update('telephone', v)}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />
          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            leftIcon="lock-closed-outline"
            isPassword
          />
          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={form.confirm_password}
            onChangeText={(v) => update('confirm_password', v)}
            leftIcon="lock-closed-outline"
            isPassword
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="S'inscrire"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing['2xl'], paddingTop: Spacing.base },
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
    marginBottom: Spacing['2xl'],
  },
  form: { marginBottom: Spacing.lg },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  loginText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
});
