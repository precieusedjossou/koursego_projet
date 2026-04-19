// store/authStore.ts
import { create } from 'zustand';
import { Utilisateur, UserRole } from '../types';

interface AuthState {
  user: Utilisateur | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  roleActif: UserRole;

  setUser: (user: Utilisateur | null) => void;
  setLoading: (loading: boolean) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  roleActif: 'client',

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      roleActif: user?.role_actif ?? 'client',
    }),

  setLoading: (isLoading) => set({ isLoading }),

  switchRole: (role) =>
    set((state) => ({
      roleActif: role,
      user: state.user ? { ...state.user, role_actif: role } : null,
    })),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      roleActif: 'client',
    }),
}));
