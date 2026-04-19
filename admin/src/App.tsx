// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UtilisateursPage from './pages/UtilisateursPage';
import CoursiersPage from './pages/CoursiersPage';
import CommandesPage from './pages/CommandesPage';
import PaiementsPage from './pages/PaiementsPage';
import ParametresPage from './pages/ParametresPage';

// Guard simple — en prod utiliser Supabase session
const isAuthenticated = (): boolean => {
  return localStorage.getItem('admin_token') !== null;
};

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="utilisateurs" element={<UtilisateursPage />} />
          <Route path="coursiers" element={<CoursiersPage />} />
          <Route path="commandes" element={<CommandesPage />} />
          <Route path="paiements" element={<PaiementsPage />} />
          <Route path="parametres" element={<ParametresPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
