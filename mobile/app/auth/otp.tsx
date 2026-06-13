// app/auth/otp.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import emailjs from '@emailjs/browser';
import "@emailjs/browser";
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Header from '../../components/shared/Header';
import { supabase } from '../../lib/supabase';

const OTP_LENGTH          = 4;
const RESEND_DELAY        = 30;
const EMAILJS_SERVICE_ID  = 'service_nrvn2ko';
const EMAILJS_TEMPLATE_ID = 'template_pksoqyn';
const EMAILJS_PUBLIC_KEY  = 'aQ5Zh4kgS0TfpCNPy';

export default function OTPScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();

  const [otp, setOtp]             = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Compte à rebours renvoi
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    setError('');
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;

    setLoading(true);
    setError('');

    try {
      // ── Étape 1 : Vérifier le code OTP dans Supabase ─────────
      const { data, error: fetchError } = await supabase
        .from('otp_codes')
        .select('code, expires_at')
        .eq('email', email)
        .eq('code', code)
        .single();

      if (fetchError || !data) {
        setError('Code incorrect. Vérifiez et réessayez.');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        return;
      }

      // ── Étape 2 : Vérifier l'expiration ──────────────────────
      const isExpired = new Date(data.expires_at) < new Date();
      if (isExpired) {
        setError('Ce code a expiré. Demandez un nouveau code.');
        await supabase.from('otp_codes').delete().eq('email', email);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        return;
      }

      // ── Étape 3 : Supprimer le code utilisé ──────────────────
      await supabase.from('otp_codes').delete().eq('email', email);

      // ── Étape 4 : Vérifier si une session est déjà active ────
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Pas de session → l'utilisateur vient de s'inscrire
        // On confirme son email manuellement via l'Admin API n'est pas
        // accessible côté client, donc on utilise signInWithPassword
        // Le mot de passe est passé en paramètre depuis register.tsx
        if (password) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email as string,
            password: password as string,
          });

          if (signInError) {
            // Si connexion échoue, rediriger vers login
            Alert.alert(
              'Vérification réussie !',
              'Votre email est confirmé. Connectez-vous pour continuer.',
              [{ text: 'Se connecter', onPress: () => router.replace('/auth/login') }]
            );
            return;
          }
        } else {
          // Pas de mot de passe disponible → rediriger vers login
          Alert.alert(
            'Vérification réussie !',
            'Votre email est confirmé. Connectez-vous pour continuer.',
            [{ text: 'Se connecter', onPress: () => router.replace('/auth/login') }]
          );
          return;
        }
      }

      // ── Étape 5 : Récupérer l'utilisateur et mettre à jour ───
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('utilisateurs')
          .update({ otp_verifie: true })
          .eq('id', user.id);
      }

      // ── Étape 6 : Rediriger vers le choix de rôle ────────────
      router.replace('/auth/role-choice');

    } catch (err) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    try {
      const newCode = Math.floor(1000 + Math.random() * 9000).toString();

      await supabase.from('otp_codes').delete().eq('email', email);
      await supabase.from('otp_codes').insert([{
        email,
        code:       newCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }]);

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { to_email: email, code: newCode, nom: '' },
        EMAILJS_PUBLIC_KEY,
      );

      setCountdown(RESEND_DELAY);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();

    } catch (err) {
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Réessayez.');
    }
  };

  const isComplete = otp.every((d) => d !== '');

  const maskedEmail = email
    ? (email as string).replace(/(.{2})(.*)(@.*)/, '$1**$3')
    : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header showBack />
      <View style={styles.content}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Entrez le code à 4 chiffres envoyé à{'\n'}
          <Text style={styles.emailText}>{maskedEmail}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { inputs.current[idx] = r; }}
              style={[
                styles.otpInput,
                digit ? styles.otpFilled : null,
                error ? styles.otpError : null,
              ]}
              value={digit}
              onChangeText={(v) => handleChange(v, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Renvoyer dans{' '}
              <Text style={styles.timer}>00:{countdown.toString().padStart(2, '0')}</Text>
            </Text>
          )}
        </View>

        <Button
          title="Vérifier et continuer →"
          onPress={handleVerify}
          loading={loading}
          disabled={!isComplete || loading}
          style={styles.btn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content:     { flex: 1, padding: Spacing['2xl'], paddingTop: Spacing.lg },
  title:       { fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, marginBottom: Spacing.md },
  subtitle:    { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing['3xl'] },
  emailText:   { fontFamily: FontFamily.semiBold, color: Colors.textPrimary },
  otpRow:      { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  otpInput:    { width: 60, height: 64, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.border, fontFamily: FontFamily.bold, fontSize: FontSize['2xl'], color: Colors.textPrimary, backgroundColor: Colors.surfaceGray },
  otpFilled:   { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  otpError:    { borderColor: Colors.error },
  errorText:   { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.error, textAlign: 'center', marginBottom: Spacing.md },
  resendRow:   { alignItems: 'center', marginBottom: Spacing['2xl'], marginTop: Spacing.sm },
  resendTimer: { fontFamily: FontFamily.regular, fontSize: FontSize.base, color: Colors.textSecondary },
  timer:       { fontFamily: FontFamily.semiBold, color: Colors.primary },
  resendLink:  { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.primary },
  btn:         { marginTop: 'auto' },
});