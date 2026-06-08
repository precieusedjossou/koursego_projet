// app/auth/otp.tsx
// Vérification OTP envoyé par EMAIL (via Supabase auth.signInWithOtp)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Header from '../../components/shared/Header';

const OTP_LENGTH = 4; // Supabase envoie un code à 6 chiffres par email

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60s pour email
  const [canResend, setCanResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

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
    // Avancer automatiquement à la case suivante
    if (val && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    setLoading(true);

    // TODO: vérifier OTP via Supabase
    // const { error } = await supabase.auth.verifyOtp({
    //   email: userEmail, // récupérer depuis le store
    //   token: code,
    //   type: 'email',
    // });
    // if (error) { setError(error.message); return; }

    setTimeout(() => {
      setLoading(false);
      router.push('/auth/role-choice');
    }, 1500);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCountdown(60);
    setCanResend(false);
    setOtp(['', '', '', '']);
    setResendSuccess(true);
    inputs.current[0]?.focus();

    // TODO: renvoyer l'email via Supabase
    // await supabase.auth.signInWithOtp({ email: userEmail });

    setTimeout(() => setResendSuccess(false), 4000);
  };

  const isComplete = otp.every((d) => d !== '');

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={20}
    >
      <Header showBack />
      <View style={styles.content}>

        {/* Icône email */}
        <View style={styles.iconWrapper}>
          <Ionicons name="mail-outline" size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Vérifiez votre boîte mail</Text>
        <Text style={styles.subtitle}>
          Un code à 6 chiffres a été envoyé à votre adresse e-mail.{'\n'}
          Pensez à vérifier vos spams si vous ne le voyez pas.
        </Text>

        {/* Notification renvoi réussi */}
        {resendSuccess && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
            <Text style={styles.successText}>
              Un nouvel e-mail vient d'être envoyé !
            </Text>
          </View>
        )}

        {/* Cases OTP à 6 chiffres */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => (inputs.current[idx] = r)}
              style={[styles.otpInput, digit ? styles.otpFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              autoFocus={idx === 0}
            />
          ))}
        </View>

        {/* Timer et renvoi */}
        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
              <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
              <Text style={styles.resendLink}>Renvoyer l'e-mail</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Renvoyer dans{' '}
              <Text style={styles.timer}>{formatTime(countdown)}</Text>
            </Text>
          )}
        </View>

        {/* Conseil */}
        <View style={styles.tipBox}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.textLight} />
          <Text style={styles.tipText}>
            Le code expire après 10 minutes. Vérifiez aussi votre dossier spam.
          </Text>
        </View>

        <Button
          title="Vérifier et continuer →"
          onPress={handleVerify}
          loading={loading}
          disabled={!isComplete}
          style={styles.btn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },

  // Icône email
  iconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
    alignSelf: 'flex-start',
  },

  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // Bannière succès renvoi
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  successText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.success,
  },

  // Cases OTP
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpInput: {
    width: 64,
    height: 68,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceGray,
  },
  otpFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },

  // Renvoi
  resendRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resendTimer: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  timer: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
  },
  resendLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },

  // Conseil
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surfaceGray,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  tipText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textLight,
    lineHeight: 18,
  },

  btn: { marginTop: 'auto' },
});
