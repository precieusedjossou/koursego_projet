// src/pages/UtilisateursPage.tsx
import React, { useState } from 'react';
import { Search, UserCheck, UserX, Eye, MoreVertical } from 'lucide-react';
import type { Utilisateur, StatutCompte } from '../types';

const MOCK_USERS: Utilisateur[] = [
  { id_utilisateur: 'u1', nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@gmail.com', telephone: '+229 97 63 24 78', otp_verifie: true, date_inscription: '2025-01-12', statut_compte: 'actif', role_actif: 'client', est_aussi_coursier: true },
  { id_utilisateur: 'u2', nom: 'Koffi', prenom: 'Sylvie', email: 'sylvie.koffi@yahoo.fr', telephone: '+229 96 44 12 00', otp_verifie: true, date_inscription: '2025-02-03', statut_compte: 'actif', role_actif: 'client', est_aussi_coursier: false },
  { id_utilisateur: 'u3', nom: 'Mensah', prenom: 'Kodjo', email: 'kodjo.mensah@gmail.com', telephone: '+229 97 11 55 88', otp_verifie: false, date_inscription: '2025-03-18', statut_compte: 'en_attente', role_actif: 'client', est_aussi_coursier: false },
  { id_utilisateur: 'u4', nom: 'Elabidi', prenom: 'Moussa', email: 'moussa.e@koursego.bj', telephone: '+229 97 00 00 01', otp_verifie: true, date_inscription: '2024-12-01', statut_compte: 'actif', role_actif: 'coursier', est_aussi_coursier: true },
  { id_utilisateur: 'u5', nom: 'Agossou', prenom: 'Marie', email: 'marie.a@gmail.com', telephone: '+229 96 22 33 44', otp_verifie: true, date_inscription: '2025-04-01', statut_compte: 'suspendu', role_actif: 'client', est_aussi_coursier: false },
];

const STATUT_CONFIG: Record<StatutCompte, { label: string; color: string; bg: string }> = {
  actif:      { label: 'Actif',        color: '#16A34A', bg: '#DCFCE7' },
  suspendu:   { label: 'Suspendu',     color: '#DC2626', bg: '#FEE2E2' },
  en_attente: { label: 'En attente',   color: '#B45309', bg: '#FEF9C3' },
};

export default function UtilisateursPage() {
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutCompte | 'tous'>('tous');
  const [users, setUsers] = useState<Utilisateur[]>(MOCK_USERS);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.telephone.includes(q);
    const matchStatut = filtreStatut === 'tous' || u.statut_compte === filtreStatut;
    return matchSearch && matchStatut;
  });

  const toggleStatut = (id: string, statut: StatutCompte) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id_utilisateur === id
          ? { ...u, statut_compte: statut === 'actif' ? 'suspendu' : 'actif' }
          : u
      )
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Utilisateurs</h1>
        <p style={subtitleStyle}>Gérez tous les comptes clients et coursiers de la plateforme</p>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total', val: users.length, color: '#FF8C00' },
          { label: 'Actifs', val: users.filter((u) => u.statut_compte === 'actif').length, color: '#16A34A' },
          { label: 'En attente', val: users.filter((u) => u.statut_compte === 'en_attente').length, color: '#B45309' },
          { label: 'Suspendus', val: users.filter((u) => u.statut_compte === 'suspendu').length, color: '#DC2626' },
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
          onChange={(e) => setFiltreStatut(e.target.value as StatutCompte | 'tous')}
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
            {filtered.map((u) => {
              const cfg = STATUT_CONFIG[u.statut_compte];
              return (
                <tr key={u.id_utilisateur} style={{ borderBottom: '1px solid #F8F8F8' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={avatarStyle}>{u.prenom.charAt(0)}{u.nom.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.prenom} {u.nom}</div>
                        {u.est_aussi_coursier && (
                          <span style={{ fontSize: 10, color: '#FF8C00', fontWeight: 500 }}>🛵 aussi coursier</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 13 }}>{u.email}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u.telephone}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: u.role_actif === 'coursier' ? '#7C3AED' : '#1D4ED8',
                      background: u.role_actif === 'coursier' ? '#EDE9FE' : '#DBEAFE',
                      padding: '3px 10px', borderRadius: 20,
                    }}>
                      {u.role_actif === 'coursier' ? '🛵 Coursier' : '👤 Client'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {u.otp_verifie
                      ? <UserCheck size={16} color="#16A34A" />
                      : <UserX size={16} color="#DC2626" />
                    }
                  </td>
                  <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                    {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={iconBtnStyle} title="Voir le profil">
                        <Eye size={15} />
                      </button>
                      <button
                        style={{ ...iconBtnStyle, color: u.statut_compte === 'actif' ? '#DC2626' : '#16A34A' }}
                        title={u.statut_compte === 'actif' ? 'Suspendre' : 'Activer'}
                        onClick={() => toggleStatut(u.id_utilisateur, u.statut_compte)}
                      >
                        {u.statut_compte === 'actif' ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
            Aucun utilisateur trouvé
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0', borderTop: '1px solid #F0F0F0', marginTop: 8 }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{filtered.length} résultat(s)</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map((p) => (
              <button key={p} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8',
                background: p === 1 ? '#FF8C00' : 'white',
                color: p === 1 ? 'white' : '#6B7280',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
