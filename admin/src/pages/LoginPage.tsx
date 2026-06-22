// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  // Si déjà connecté, rediriger
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true);

    try {
      // 1. Connexion Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email ou mot de passe incorrect.');
        setLoading(false);
        return;
      }

      // 2. Vérifier que c'est bien un admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('id, niveau_acces')
        .eq('id', authData.user.id)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        setError('Accès refusé : ce compte n\'est pas administrateur.');
        setLoading(false);
        return;
      }

      // 3. Stocker session et rediriger
      localStorage.setItem('admin_token', authData.session.access_token);
      localStorage.setItem('admin_niveau', adminData.niveau_acces);
      navigate('/dashboard', { replace: true });

    } catch (e) {
      setError('Erreur réseau, vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Fond décoratif */}
      <div style={bgDecorStyle} />

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={logoBoxStyle}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 30, letterSpacing: -1 }}>K</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', marginBottom: 4, marginTop: 14 }}>
            KourseGo Admin
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
            Tableau de bord administrateur
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={labelStyle}>Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@koursego.bj"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={eyeBtnStyle}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={errorStyle}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitBtnStyle,
              background: loading ? '#FFA733' : '#FF8C00',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={spinnerStyle} /> Connexion en cours...
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#D1D5DB', marginTop: 28, marginBottom: 0 }}>
          © {new Date().getFullYear()} KourseGo — Accès réservé aux administrateurs
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #FFF8F0 0%, #F3F4F6 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

const bgDecorStyle: React.CSSProperties = {
  position: 'absolute',
  width: 600,
  height: 600,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,140,0,0.08) 0%, transparent 70%)',
  top: -200,
  right: -200,
  pointerEvents: 'none',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 24,
  padding: '44px 40px',
  width: 420,
  boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
  position: 'relative',
  zIndex: 1,
};

const logoBoxStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 18,
  background: 'linear-gradient(135deg, #FF8C00, #FF6B00)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 24px rgba(255,140,0,0.35)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #E8E8E8',
  borderRadius: 12,
  fontSize: 14,
  color: '#1A1A1A',
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  padding: 4,
  lineHeight: 1,
};

const errorStyle: React.CSSProperties = {
  background: '#FEF2F2',
  color: '#DC2626',
  fontSize: 13,
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #FECACA',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 700,
  transition: 'all 0.2s',
  boxShadow: '0 4px 14px rgba(255,140,0,0.3)',
};

const spinnerStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  border: '2px solid rgba(255,255,255,0.4)',
  borderTopColor: 'white',
  borderRadius: '50%',
  display: 'inline-block',
  animation: 'spin 0.7s linear infinite',
};