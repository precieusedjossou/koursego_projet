// app/auth/otp.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontFamily, FontSize, Spacing, BorderRadius } from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Header from '../../components/shared/Header';

const OTP_LENGTH = 4;

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
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
    // TODO: vérifier OTP via Supabase ou backend
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/role-choice');
    }, 1500);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCountdown(30);
    setCanResend(false);
    setOtp(['', '', '', '']);
    // TODO: renvoyer OTP via Supabase
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header showBack />
      <View style={styles.content}>
        <Text style={styles.title}>Vérifier le numéro de téléphone</Text>
        <Text style={styles.subtitle}>
          Entrez le code à 4 chiffres envoyé au{'\n'}
          <Text style={styles.phone}>+229 XX XX XX XX</Text>
        </Text>

        {/* Cases OTP */}
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
            />
          ))}
        </View>

        {/* Renvoi */}
        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Renvoyer le code dans{' '}
              <Text style={styles.timer}>00:{countdown.toString().padStart(2, '0')}</Text>
            </Text>
          )}
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
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing['3xl'],
  },
  phone: {
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  otpInput: {
    width: 60,
    height: 64,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceGray,
  },
  otpFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
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
  resendLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  btn: { marginTop: 'auto' },
});
