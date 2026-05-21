// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UtilisateursPage from './pages/UtilisateursPage';
import CoursiersPage from './pages/CoursiersPage';
import CommandesPage from './pages/CommandesPage';
import PaiementsPage from './pages/PaiementsPage';
import ParametresPage from './pages/ParametresPage';

// ── Guard basé sur la vraie session Supabase ─────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin]   = useState(false);

  useEffect(() => {
    checkSession();

    // Écouter les changements de session (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAdmin(false);
        setChecking(false);
      } else {
        verifyAdmin(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    await verifyAdmin(session.user.id);
  };

  const verifyAdmin = async (userId: string) => {
    // Vérifier dans la table admins avec la bonne colonne
    const { data, error } = await supabase
      .from('admins')
      .select('id_admin, niveau_acces')
      .eq('id_utilisateur', userId)
      .single();

    setIsAdmin(!error && !!data);
    setChecking(false);
  };

  // Écran de chargement pendant la vérification
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F8F9FA', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: '#FF8C00', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 24 }}>K</span>
        </div>
        <div style={{ fontSize: 14, color: '#9CA3AF' }}>Vérification de la session...</div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page login — publique */}
        <Route path="/login" element={<LoginPage />} />

        {/* Pages protégées — admin seulement */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<DashboardPage />} />
          <Route path="utilisateurs" element={<UtilisateursPage />} />
          <Route path="coursiers"    element={<CoursiersPage />} />
          <Route path="commandes"    element={<CommandesPage />} />
          <Route path="paiements"    element={<PaiementsPage />} />
          <Route path="parametres"   element={<ParametresPage />} />
        </Route>

        {/* Redirection fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}