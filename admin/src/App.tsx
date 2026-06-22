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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed]     = useState(false);

  useEffect(() => {
    // Vérifier session Supabase réelle
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setAuthed(false);
        setChecking(false);
        return;
      }
      // Vérifier que c'est un admin
      const { data: adminData } = await supabase
        .from('admin')
        .select('id')
        .eq('id', data.session.user.id)
        .single();

      setAuthed(!!adminData);
      setChecking(false);
    });

    // Écouter les changements de session (déconnexion, expiration)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthed(false);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_niveau');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F8F9FA', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>K</span>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'sans-serif' }}>
          Chargement...
        </p>
      </div>
    );
  }

  return authed ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login en premier — page par défaut si non connecté */}
        <Route path="/login" element={<LoginPage />} />

        {/* Zone protégée admin */}
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

        {/* Toute autre route → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}