import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OAuthNativeCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/role-choice');
  }, []);

  return null;
}