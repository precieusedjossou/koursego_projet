// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // adapte le chemin si besoin

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Remplissez tous les champs');
      return;
    }

    setLoading(true);
    try {
      // 1. Connexion Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      // 2. Vérifier que c'est bien un admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id_admin, id_utilisateur, niveau_acces')
        .eq('id_utilisateur', authData.user.id)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        setError("Accès refusé. Ce compte n'est pas administrateur.");
        return;
      }

      // 3. Session gérée automatiquement par Supabase
      localStorage.setItem('admin_niveau', adminData.niveau_acces ?? 'admin');

      navigate('/dashboard');

    } catch (err) {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F8F9FA',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        padding: '48px 40px', width: 420,
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#FF8C00', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 28 }}>K</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
            KourseGO Admin
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Tableau de bord administrateur</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@koursego.bj"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#FFA733' : '#FF8C00',
              color: 'white', border: 'none',
              borderRadius: 12, fontSize: 15,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #E8E8E8', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none',
  background: '#F8F9FA', boxSizing: 'border-box',
};