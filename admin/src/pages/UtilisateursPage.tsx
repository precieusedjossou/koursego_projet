// src/pages/UtilisateursPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Eye, X, Mail, Phone, Calendar, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Utilisateur {
  id: string;
  nom_complet: string;
  photo_profil_url: string | null;
  statut_compte: string;
  date_inscription: string;
  email: string;
  telephone: string | null;
  npi: string | null;
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  actif:      { label: 'Actif',      color: '#16A34A', bg: '#DCFCE7' },
  suspendu:   { label: 'Suspendu',   color: '#DC2626', bg: '#FEE2E2' },
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
};

export default function UtilisateursPage() {
  const [users, setUsers]           = useState<Utilisateur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected]     = useState<Utilisateur | null>(null);
  const [page, setPage]             = useState(1);
  const PER_PAGE = 10;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Récupérer les IDs admins pour les exclure
      const { data: adminsData } = await supabase
        .from('admin')
        .select('id');

      const adminIds = (adminsData || []).map(a => a.id);

      // Requête clients en excluant les admins
      let query = supabase
        .from('utilisateurs')
        .select('id, nom_complet, photo_profil_url, statut_compte, date_inscription, email, telephone, npi')
        .eq('mode', 'client');

      if (adminIds.length > 0) {
        query = query.not('id', 'in', `(${adminIds.join(',')})`) as any;
      }

      const { data: usersData, error } = await query
        .order('date_inscription', { ascending: false });

      if (error) { console.error(error); return; }
      setUsers(usersData || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatut = async (user: Utilisateur) => {
    const newStatut = user.statut_compte === 'actif' ? 'suspendu' : 'actif';
    setActionLoading(user.id);
    try {
      const { error } = await supabase
        .from('utilisateurs')
        .update({ statut_compte: newStatut })
        .eq('id', user.id);

      if (error) { console.error(error); return; }
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, statut_compte: newStatut } : u));
      if (selected?.id === user.id) setSelected({ ...selected, statut_compte: newStatut });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      u.nom_complet.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.telephone || '').includes(q) ||
      (u.npi || '').includes(q);
    const matchStatut = filtreStatut === 'tous' || u.statut_compte === filtreStatut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = [
    { label: 'Total',      val: users.length,                                    color: '#FF8C00' },
    { label: 'Actifs',     val: users.filter(u => u.statut_compte === 'actif').length,      color: '#16A34A' },
    { label: 'En attente', val: users.filter(u => u.statut_compte === 'en_attente').length, color: '#B45309' },
    { label: 'Suspendus',  val: users.filter(u => u.statut_compte === 'suspendu').length,   color: '#DC2626' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Utilisateurs</h1>
        <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>Gérez tous les comptes de la plateforme</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={miniCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recherche + filtre */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom, email, téléphone, NPI..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_attente">En attente</option>
          <option value="suspendu">Suspendu</option>
        </select>
        <button onClick={fetchUsers} style={refreshBtnStyle} title="Actualiser">🔄</button>
      </div>

      {/* Tableau */}
      <div style={tableCardStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>Chargement...</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                  {['Utilisateur', 'NPI', 'Contact', 'Statut', 'Inscription', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => {
                  const cfg = STATUT_CONFIG[u.statut_compte] || STATUT_CONFIG['en_attente'];
                  const npiValide = !u.npi || u.npi.length === 10;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={avatarStyle}>
                            {u.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.nom_complet}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, color: npiValide ? '#1F2937' : '#DC2626', fontWeight: 600 }}>
                          {u.npi || '—'}
                        </span>
                        {!npiValide && <div style={{ fontSize: 10, color: '#DC2626' }}>⚠️ 10 chiffres requis</div>}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13 }}>{u.email}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u.telephone || '—'}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                        {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={iconBtnStyle} onClick={() => setSelected(u)} title="Voir profil">
                            <Eye size={14} />
                          </button>
                          <button
                            style={{ ...iconBtnStyle, color: u.statut_compte === 'actif' ? '#DC2626' : '#16A34A', opacity: actionLoading === u.id ? 0.5 : 1 }}
                            onClick={() => toggleStatut(u)}
                            disabled={actionLoading === u.id}
                            title={u.statut_compte === 'actif' ? 'Suspendre' : 'Activer'}
                          >
                            {u.statut_compte === 'actif' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>Aucun utilisateur trouvé</div>
            )}

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #F0F0F0', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{filtered.length} résultat(s)</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8',
                    background: p === page ? '#FF8C00' : 'white',
                    color: p === page ? 'white' : '#6B7280',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}>{p}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal détail utilisateur */}
      {selected && (
        <div style={overlayStyle} onClick={() => setSelected(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Profil utilisateur</h2>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}><X size={18} /></button>
            </div>

            {/* Avatar + nom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: '#FFF8F0', borderRadius: 14 }}>
              <div style={{ ...avatarStyle, width: 56, height: 56, fontSize: 20, borderRadius: 16 }}>
                {selected.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.nom_complet}</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>👤 Client</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  background: STATUT_CONFIG[selected.statut_compte]?.bg,
                  color: STATUT_CONFIG[selected.statut_compte]?.color,
                  padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>
                  {STATUT_CONFIG[selected.statut_compte]?.label}
                </span>
              </div>
            </div>

            {/* Infos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: <Mail size={15} />, label: 'Email',       val: selected.email },
                { icon: <Phone size={15} />, label: 'Téléphone',  val: selected.telephone || '—' },
                { icon: <Hash size={15} />, label: 'NPI',         val: selected.npi || '—' },
                { icon: <Calendar size={15} />, label: 'Inscrit le', val: new Date(selected.date_inscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8F9FA', borderRadius: 10 }}>
                  <span style={{ color: '#FF8C00' }}>{row.icon}</span>
                  <span style={{ fontSize: 13, color: '#6B7280', width: 80 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Action */}
            <button
              onClick={() => toggleStatut(selected)}
              disabled={actionLoading === selected.id}
              style={{
                marginTop: 20, width: '100%', padding: '12px',
                background: selected.statut_compte === 'actif' ? '#FEE2E2' : '#DCFCE7',
                color: selected.statut_compte === 'actif' ? '#DC2626' : '#16A34A',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {selected.statut_compte === 'actif' ? '🔒 Suspendre ce compte' : '✅ Activer ce compte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const miniCardStyle: React.CSSProperties  = { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties    = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties   = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const refreshBtnStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 16, background: 'white', cursor: 'pointer' };
const thStyle: React.CSSProperties       = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties       = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
const avatarStyle: React.CSSProperties   = { width: 34, height: 34, borderRadius: 10, background: '#FFF3E0', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 };
const iconBtnStyle: React.CSSProperties  = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const overlayStyle: React.CSSProperties  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties    = { background: 'white', borderRadius: 20, padding: '28px', width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
const closeBtnStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };