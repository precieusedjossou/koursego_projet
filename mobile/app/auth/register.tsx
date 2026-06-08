// app/auth/register.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import emailjs from '@emailjs/browser';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

const EMAILJS_SERVICE_ID  = 'service_nrvn2ko';
const EMAILJS_TEMPLATE_ID = 'template_pksoqyn';
const EMAILJS_PUBLIC_KEY  = 'aQ5Zh4kgS0TfpCNPy';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom_complet: '', email: '', telephone: '',
    password: '', confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    if (!form.nom_complet || !form.email || !form.telephone || !form.password) {
      setError('Veuillez remplir tous les champs'); return;
    }
    if (form.password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas'); return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Adresse email invalide'); return;
    }

    setError('');
    setLoading(true);

    try {
      const emailLower = form.email.trim().toLowerCase();

      // Étape 1 : Créer le compte Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailLower,
        password: form.password,
        options: {
          data: {
            nom_complet: form.nom_complet.trim(),
            telephone:   form.telephone.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Cet email est déjà utilisé. Connectez-vous.');
        } else {
          setError('Inscription échouée : ' + signUpError.message);
        }
        return;
      }
      if (!data.user) { setError('Inscription échouée. Réessayez.'); return; }

      // Étape 2 : Générer le code OTP à 4 chiffres
      const code = Math.floor(1000 + Math.random() * 9000).toString();

      // Étape 3 : Supprimer les anciens codes pour éviter les conflits
      await supabase.from('otp_codes').delete().eq('email', emailLower);

      // Étape 4 : Stocker le code avec expiration 10 minutes
      const { error: insertError } = await supabase.from('otp_codes').insert([{
        email:      emailLower,
        code:       code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }]);

      if (insertError) {
        setError('Erreur technique. Réessayez.'); return;
      }

      // Étape 5 : Envoyer l'email via EmailJS
      // ⚠️ Ton template doit contenir {{code}}, {{to_email}} et {{nom}}
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { to_email: emailLower, code, nom: form.nom_complet.trim() },
        EMAILJS_PUBLIC_KEY,
      );

      // Étape 6 : Aller vers l'écran OTP
      router.push({ pathname: '/auth/otp', params: { email: emailLower } });

    } catch (err: any) {
      console.error('Erreur register:', JSON.stringify(err, null, 2));
      if (err?.status === 400) {
        Alert.alert('Erreur EmailJS', 'Vérifie que ton template contient {{code}} et {{to_email}}.');
      } else {
        setError(err.message || 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header showBack title="" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez-nous et commencez l'aventure</Text>
        <View style={styles.form}>
          <Input label="Nom complet" placeholder="John Doe" value={form.nom_complet} onChangeText={(v) => update('nom_complet', v)} leftIcon="person-outline" autoCapitalize="words" />
          <Input label="E-mail" placeholder="nom@exemple.com" value={form.email} onChangeText={(v) => update('email', v)} leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Numéro de téléphone" placeholder="+229 XX XX XX XX" value={form.telephone} onChangeText={(v) => update('telephone', v)} leftIcon="call-outline" keyboardType="phone-pad" />
          <Input label="Mot de passe" placeholder="••••••••" value={form.password} onChangeText={(v) => update('password', v)} leftIcon="lock-closed-outline" isPassword />
          <Input label="Confirmer le mot de passe" placeholder="••••••••" value={form.confirm_password} onChangeText={(v) => update('confirm_password', v)} leftIcon="lock-closed-outline" isPassword />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button title="S'inscrire" onPress={handleRegister} loading={loading} style={{ marginTop: Spacing.sm }} />
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
  content:   { padding: Spacing['2xl'], paddingTop: Spacing.base },
  title:     { fontFamily: FontFamily.bold, fontSize: FontSize['3xl'], color: Colors.textPrimary, marginBottom: 6 },
  subtitle:  { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing['2xl'] },
  form:      { marginBottom: Spacing.lg },
  errorText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.error, marginBottom: Spacing.sm, textAlign: 'center' },
  loginRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  loginText: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  loginLink: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.primary },
});