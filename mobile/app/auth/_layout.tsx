// app/auth/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="role-choice" />
      <Stack.Screen name="kyc-coursier" />
      <Stack.Screen name="kyc-success" />
    </Stack>
  );
}
