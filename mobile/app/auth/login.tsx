// app/auth/login.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image,
  TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOAuth, useUser } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, Shadows } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { user: clerkUser }               = useUser();
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]                 = useState('');

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const redirectByProfil = async (userId: string) => {
    const { data: profil } = await supabase
      .from('utilisateurs')
      .select('mode_actuel, statut_compte')
      .eq('id', userId)
      .single();

    if (profil?.statut_compte === 'suspendu') {
      setError('Compte suspendu. Contactez le support.');
      await supabase.auth.signOut();
      return;
    }

    if (!profil || !profil.mode_actuel || profil.mode_actuel === 'client') {
      router.replace('/client/home');
      return;
    }

    if (profil.mode_actuel === 'coursier') {
      const { data: livreur } = await supabase
        .from('livreurs')
        .select('statut_validation')
        .eq('id_utilisateur', userId)
        .single();

      if (!livreur) {
        router.replace('/auth/kyc-coursier');
      } else if (livreur.statut_validation === 'en_attente') {
        router.replace('/auth/kyc-success');
      } else if (livreur.statut_validation === 'approuve') {
        router.replace('/coursier/dashboard');
      } else {
        router.replace('/client/home');
      }
    }
  };

  // ── Connexion Google via Clerk ───────────────────────────────
  const handleGoogleSignIn = async () => {
    if (clerkUser) {
      Alert.alert(
        'Déjà connecté',
        `Vous êtes déjà connecté avec ${clerkUser.primaryEmailAddress?.emailAddress}`,
        [
          { text: 'Continuer', onPress: () => router.replace('/auth/role-choice') },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
      return;
    }

    setGoogleLoading(true);
    try {
      // ✅ redirectUrl dynamique
      const redirectUrl = Linking.createURL('/oauth-native-callback');
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/auth/role-choice');
      }
    } catch (err: any) {
      if (err?.message?.includes('already')) {
        Alert.alert(
          'Déjà connecté',
          "Vous avez déjà un compte Google lié. Continuez vers l'application.",
          [{ text: 'Continuer', onPress: () => router.replace('/auth/role-choice') }]
        );
      } else {
        Alert.alert('Connexion échouée', 'Réessayez ou utilisez votre email.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Connexion email + mot de passe ───────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs'); return;
    }
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect.');
        } else if (signInError.message.includes('Email not confirmed')) {
          router.push({ pathname: '/auth/otp', params: { email: email.trim().toLowerCase() } });
        } else if (signInError.message.includes('Too many requests')) {
          setError('Trop de tentatives. Attendez quelques minutes.');
        } else {
          setError('Connexion échouée. Réessayez.');
        }
        return;
      }

      if (!data.user) { setError('Connexion échouée. Réessayez.'); return; }

      await redirectByProfil(data.user.id);

    } catch (err) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.logoSection}>
          <View style={styles.iconWrapper}>
            <Image source={require('../../assets/images/logo_icon_orange.png')}
              style={styles.icon} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Bon retour</Text>
          <Text style={styles.subtitle}>Connectez-vous pour gérer vos courses</Text>
        </View>

        <View style={styles.form}>
          <Input label="Adresse e-mail" placeholder="nom@exemple.com"
            value={email} onChangeText={(v) => { setEmail(v); setError(''); }}
            leftIcon="mail-outline" keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} />
          <Input label="Mot de passe" placeholder="Entrez votre mot de passe"
            value={password} onChangeText={(v) => { setPassword(v); setError(''); }}
            leftIcon="lock-closed-outline" isPassword />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button title="Se connecter" onPress={handleLogin}
            loading={loading} style={styles.loginBtn} />
        </View>

        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.separatorText}>OU CONTINUER AVEC</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.socialBtn, googleLoading && styles.socialBtnDisabled]}
          onPress={handleGoogleSignIn} activeOpacity={0.7} disabled={googleLoading}>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.socialText}>
            {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Vous n'avez pas de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:              { flex: 1, backgroundColor: Colors.white },
  content:           { padding: Spacing['2xl'], paddingTop: 60, flexGrow: 1 },
  logoSection:       { alignItems: 'center', marginBottom: Spacing['2xl'] },
  iconWrapper:       { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base, ...Shadows.sm },
  icon:              { width: 50, height: 50 },
  title:             { fontFamily: FontFamily.bold, fontSize: FontSize['3xl'], color: Colors.textPrimary, marginBottom: 6 },
  subtitle:          { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  form:              { marginBottom: Spacing.lg },
  errorText:         { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.error, marginBottom: Spacing.sm, textAlign: 'center' },
  loginBtn:          { marginTop: Spacing.sm },
  separator:         { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg, gap: Spacing.sm },
  line:              { flex: 1, height: 1, backgroundColor: Colors.border },
  separatorText:     { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textLight, letterSpacing: 0.5 },
  socialBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingVertical: 12, backgroundColor: Colors.white, ...Shadows.sm, marginBottom: Spacing.xl },
  socialBtnDisabled: { opacity: 0.6 },
  socialText:        { fontFamily: FontFamily.medium, fontSize: FontSize.base, color: Colors.textPrimary },
  registerRow:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText:      { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  registerLink:      { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.primary },
});