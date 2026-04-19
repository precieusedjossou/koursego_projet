// hooks/useAuth.ts
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Utilisateur, UserRole } from '../types';

export function useAuth() {
  const { user, isAuthenticated, isLoading, roleActif, setUser, setLoading, logout } =
    useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Écouter les changements de session Supabase
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Charger le profil depuis la table UTILISATEUR
        const { data, error } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id_utilisateur', session.user.id)
          .single();

        if (data && !error) {
          setUser(data as Utilisateur);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Redirection automatique selon auth + rôle
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (roleActif === 'coursier') {
        router.replace('/coursier/dashboard');
      } else {
        router.replace('/client/home');
      }
    }
  }, [isAuthenticated, isLoading, segments, roleActif]);

  return { user, isAuthenticated, isLoading, roleActif };
}

// ─── Fonctions d'authentification ───────────────────────────────────────────

export async function signIn(identifier: string, password: string) {
  const isEmail = identifier.includes('@');
  const credentials = isEmail
    ? { email: identifier, password }
    : { phone: identifier, password };

  const { data, error } = await supabase.auth.signInWithPassword(credentials as any);
  return { data, error };
}

export async function signUp(params: {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nom: params.nom,
        prenom: params.prenom,
        telephone: params.telephone,
      },
    },
  });

  if (data.user && !error) {
    // Créer le profil dans la table UTILISATEUR
    await supabase.from('utilisateurs').insert({
      id_utilisateur: data.user.id,
      nom: params.nom,
      prenom: params.prenom,
      telephone: params.telephone,
      email: params.email,
      otp_verifie: false,
      date_inscription: new Date().toISOString(),
      statut_compte: 'en_attente',
      role_actif: 'client' as UserRole,
      est_aussi_coursier: false,
    });
  }

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  useAuthStore.getState().logout();
  return { error };
}

export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  return { data, error };
}
