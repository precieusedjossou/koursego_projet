// src/pages/UtilisateursPage.tsx
// Branché Supabase — vraies données
import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase'; // adapte le chemin si besoin

// ── Types ────────────────────────────────────────────────────
type StatutCompte = 'actif' | 'suspendu' | 'en_attente';

interface Utilisateur {
  id: string;
  nom_complet: string;
  email: string;
  telephone: string;
  otp_verifie: boolean;
  date_inscription: string;
  statut_compte: StatutCompte;
  mode_actuel: 'client' | 'livreur';
  est_aussi_livreur: boolean;
}

const STATUT_CONFIG: Record<StatutCompte, { label: string; color: string; bg: string }> = {
  actif:      { label: 'Actif',      color: '#16A34A', bg: '#DCFCE7' },
  suspendu:   { label: 'Suspendu',   color: '#DC2626', bg: '#FEE2E2' },
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
};

// ── Helpers ──────────────────────────────────────────────────
const getInitiales = (nom: string) => {
  const parts = nom.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nom.slice(0, 2).toUpperCase();
};

// ── Composant ────────────────────────────────────────────────
export default function UtilisateursPage() {
  const [users, setUsers]           = useState<Utilisateur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutCompte | 'tous'>('tous');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const PAR_PAGE = 20;

  // ── Chargement ──────────────────────────────────────────
  useEffect(() => {
    loadUsers();
  }, [page, filtreStatut]);

  // Reset page quand on cherche
  useEffect(() => {
    setPage(1);
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('utilisateurs')
        .select(`
          id,
          nom_complet,
          email,
          telephone,
          otp_verifie,
          date_inscription,
          statut_compte,
          mode_actuel
        `, { count: 'exact' })
        .eq('mode_actuel', 'client')
        .order('date_inscription', { ascending: false })
        .range((page - 1) * PAR_PAGE, page * PAR_PAGE - 1);

      // Filtre statut
      if (filtreStatut !== 'tous') {
        query = query.eq('statut_compte', filtreStatut);
      }

      // Recherche
      if (search.trim()) {
        query = query.or(
          `nom_complet.ilike.%${search}%,email.ilike.%${search}%,telephone.ilike.%${search}%`
        );
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Erreur chargement utilisateurs:', error);
        return;
      }

      const mapped: Utilisateur[] = (data ?? []).map((u: any) => ({
        id: u.id,
        nom_complet: u.nom_complet || u.email || 'Inconnu',
        email: u.email ?? '',
        telephone: u.telephone ?? '',
        otp_verifie: u.otp_verifie ?? false,
        date_inscription: u.date_inscription ?? u.created_at ?? '',
        statut_compte: (u.statut_compte as StatutCompte) ?? 'en_attente',
        mode_actuel: u.mode_actuel ?? 'client',
        // mode_actuel livreur = aussi coursier
        est_aussi_livreur: u.mode_actuel === 'livreur',
      }));

      setUsers(mapped);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ─────────────────────────────────────────────
  const toggleStatut = async (id: string, statutActuel: StatutCompte) => {
    const nouveauStatut: StatutCompte = statutActuel === 'actif' ? 'suspendu' : 'actif';

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => u.id === id ? { ...u, statut_compte: nouveauStatut } : u)
    );

    const { error } = await supabase
      .from('utilisateurs')
      .update({ statut_compte: nouveauStatut })
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour statut:', error);
      // Rollback si erreur
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, statut_compte: statutActuel } : u)
      );
    }
  };

  // ── Stats calculées depuis les données chargées ──────────
  // (on fait une requête séparée pour avoir les vrais totaux)
  const [statsGlobales, setStatsGlobales] = useState({
    total: 0, actifs: 0, enAttente: 0, suspendus: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const { data } = await supabase
        .from('utilisateurs')
        .select('statut_compte')
        .eq('mode_actuel', 'client');

      if (data) {
        setStatsGlobales({
          total:      data.length,
          actifs:     data.filter((u: any) => u.statut_compte === 'actif').length,
          enAttente:  data.filter((u: any) => u.statut_compte === 'en_attente').length,
          suspendus:  data.filter((u: any) => u.statut_compte === 'suspendu').length,
        });
      }
    };
    loadStats();
  }, [users]); // recalcule à chaque action

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE));

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Utilisateurs</h1>
        <p style={subtitleStyle}>Gérez tous les comptes clients et coursiers de la plateforme</p>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total',       val: statsGlobales.total,      color: '#FF8C00' },
          { label: 'Actifs',      val: statsGlobales.actifs,     color: '#16A34A' },
          { label: 'En attente',  val: statsGlobales.enAttente,  color: '#B45309' },
          { label: 'Suspendus',   val: statsGlobales.suspendus,  color: '#DC2626' },
        ].map((s, i) => (
          <div key={i} style={miniCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barre de recherche + filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => { setFiltreStatut(e.target.value as StatutCompte | 'tous'); setPage(1); }}
          style={selectStyle}
        >
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_attente">En attente</option>
          <option value="suspendu">Suspendu</option>
        </select>
      </div>

      {/* Tableau */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['Utilisateur', 'Contact', 'Rôle', 'Statut', 'OTP', 'Inscription', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loader
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{
                        height: 14, borderRadius: 6,
                        background: 'linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        width: j === 0 ? 140 : j === 6 ? 60 : 100,
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const cfg = STATUT_CONFIG[u.statut_compte] ?? STATUT_CONFIG['en_attente'];
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    {/* Nom */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={avatarStyle}>{getInitiales(u.nom_complet)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.nom_complet}</div>
                          {u.est_aussi_livreur && (
                            <span style={{ fontSize: 10, color: '#FF8C00', fontWeight: 500 }}>🛵 aussi coursier</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13 }}>{u.email}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u.telephone || '—'}</div>
                    </td>
                    {/* Rôle */}
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 12, fontWeight: 500,
                        color: u.mode_actuel === 'livreur' ? '#7C3AED' : '#1D4ED8',
                        background: u.mode_actuel === 'livreur' ? '#EDE9FE' : '#DBEAFE',
                        padding: '3px 10px', borderRadius: 20,
                      }}>
                        {u.mode_actuel === 'livreur' ? '🛵 Coursier' : '👤 Client'}
                      </span>
                    </td>
                    {/* Statut */}
                    <td style={tdStyle}>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {cfg.label}
                      </span>
                    </td>
                    {/* OTP */}
                    <td style={tdStyle}>
                      {u.otp_verifie
                        ? <UserCheck size={16} color="#16A34A" />
                        : <UserX size={16} color="#DC2626" />
                      }
                    </td>
                    {/* Date */}
                    <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                      {u.date_inscription
                        ? new Date(u.date_inscription).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={iconBtnStyle} title="Voir le profil">
                          <Eye size={15} />
                        </button>
                        <button
                          style={{
                            ...iconBtnStyle,
                            color: u.statut_compte === 'actif' ? '#DC2626' : '#16A34A',
                          }}
                          title={u.statut_compte === 'actif' ? 'Suspendre' : 'Activer'}
                          onClick={() => toggleStatut(u.id, u.statut_compte)}
                        >
                          {u.statut_compte === 'actif' ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0', borderTop: '1px solid #F0F0F0', marginTop: 8 }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>
            {total} utilisateur(s) · page {page}/{totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ ...pageBtn, opacity: page === 1 ? 0.4 : 1 }}
            >
              ‹
            </button>
            {/* Afficher max 5 pages autour de la page courante */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    ...pageBtn,
                    background: p === page ? '#FF8C00' : 'white',
                    color: p === page ? 'white' : '#6B7280',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ ...pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Animation shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// ── Styles (identiques à l'original) ────────────────────────
const h1Style: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px 20px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
const avatarStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: '#FFF3E0', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 };
const iconBtnStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const pageBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' };