// src/pages/CommandesPage.tsx
import React, { useState } from 'react';
import { Search, Eye, UserPlus, CheckCircle2 } from 'lucide-react';
import type { StatutDemande } from '../types';

interface CommandeRow {
  id: string; 
  client: string; 
  coursier: string; 
  type: string;
  adresse: string; 
  montant: number; 
  commission: number;
  statut: StatutDemande; 
  date: string;
}

const MOCK_COMMANDES: CommandeRow[] = [
  { id: 'CMD-001', client: 'Jean Dupont', coursier: 'Moussa Elabidi', type: 'achat', adresse: 'Fidjrossè, Cotonou', montant: 17500, commission: 1000, statut: 'en_cours', date: '2026-06-15 14:30' },
  { id: 'CMD-002', client: 'Sylvie Koffi', coursier: 'Roméo Degbe', type: 'recuperation_colis', adresse: 'Akpakpa, Cotonou', montant: 8200, commission: 400, statut: 'terminee', date: '2026-06-15 10:12' },
  { id: 'CMD-003', client: 'Kodjo Mensah', coursier: 'N/A', type: 'achat', adresse: 'Gbèdjromèdé, Cotonou', montant: 5000, commission: 0, statut: 'en_attente', date: '2026-06-16 09:00' },
  { id: 'CMD-004', client: 'Marie Agossou', coursier: 'Yaovi Mensah', type: 'achat', adresse: 'Cadjèhoun, Cotonou', montant: 12000, commission: 600, statut: 'terminee', date: '2026-06-14 16:45' },
  { id: 'CMD-005', client: 'Jean Dupont', coursier: 'N/A', type: 'recuperation_colis', adresse: 'Fidjrossè, Cotonou', montant: 3000, commission: 0, statut: 'annulee', date: '2026-06-13 11:20' },
];

const STATUT_CONFIG: Record<StatutDemande, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  acceptee:   { label: 'Acceptée',   color: '#1D4ED8', bg: '#DBEAFE' },
  en_cours:   { label: 'En cours',   color: '#16A34A', bg: '#DCFCE7' },
  terminee:   { label: 'Terminée',   color: '#FF8C00', bg: '#FFF3E0' },
  annulee:    { label: 'Annulée',    color: '#DC2626', bg: '#FEE2E2' },
};

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<CommandeRow[]>(MOCK_COMMANDES);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutDemande | 'tous'>('tous');

  // Filtrage des commandes
  const filtered = commandes.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.id.toLowerCase().includes(q) || c.client.toLowerCase().includes(q) || c.coursier.toLowerCase().includes(q);
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  // Action de dispatch rapide : Assigner un coursier disponible à la volée
  const assignerCoursierAutomatique = (id: string) => {
    setCommandes(prev => prev.map(c => 
      c.id === id ? { ...c, coursier: 'Nancy Ativi', statut: 'acceptee' } : c
    ));
  };

  const totalRevenu = commandes.filter((c) => c.statut === 'terminee').reduce((s, c) => s + c.commission, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Suivi des Commandes & Dispatch</h1>
        <p style={subtitleStyle}>Supervisez les demandes de courses et assignez les livreurs partenaires sur le terrain</p>
      </div>

      {/* Compteurs de Statuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {(Object.entries(STATUT_CONFIG) as [StatutDemande, typeof STATUT_CONFIG[StatutDemande]][]).map(([key, cfg]) => (
          <div key={key} style={miniCardStyle}>
            <div style={{ fontSize: 24, fontWeight: 800, color: cfg.color }}>
              {commandes.filter((c) => c.statut === key).length}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Bannière de Revenu Plateforme */}
      <div style={{ background: '#FF8C00', borderRadius: 16, padding: '16px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>Commissions cumulées (Courses terminées)</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, marginTop: 4 }}>+{totalRevenu.toLocaleString('fr-FR')} F</div>
        </div>
        <span style={{ fontSize: 36 }}>💰</span>
      </div>

      {/* Zone de Recherche et Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par ID, client, coursier..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value as any)} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tableau des Commandes */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['ID', 'Client', 'Coursier Assigné', 'Type', 'Destination / Adresse', 'Montant Course', 'Commission', 'Statut', 'Date', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const cfg = STATUT_CONFIG[c.statut];
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #F8F8F8', background: c.statut === 'en_attente' ? '#FFFDF5' : 'transparent' }}>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>{c.id}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{c.client}</div>
                  </td>
                  <td style={tdStyle}>
                    {c.coursier === 'N/A' ? (
                      <span style={{ color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Non assigné</span>
                    ) : (
                      <span style={{ color: '#1A1A1A', fontWeight: 500 }}>🏍️ {c.coursier}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, background: '#F3F4F6', padding: '4px 8px', borderRadius: 6, fontWeight: 500 }}>
                      {c.type === 'achat' ? '🛒 Achat' : '📦 Colis'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 160 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.adresse}>
                      {c.adresse}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <strong>{c.montant.toLocaleString('fr-FR')} F</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: c.commission > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 600 }}>
                      {c.commission > 0 ? `+${c.commission.toLocaleString('fr-FR')} F` : '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{c.date}</td>
                  
                  {/* Actions contextuelles adaptées au Dispatch */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.statut === 'en_attente' && (
                        <button 
                          onClick={() => assignerCoursierAutomatique(c.id)}
                          style={{ ...actionIconBtnStyle, color: '#1D4ED8', borderColor: '#DBEAFE' }} 
                          title="Assigner un coursier proche"
                        >
                          <UserPlus size={14} />
                        </button>
                      )}
                      <button style={actionIconBtnStyle} title="Voir les détails complets de la course">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucune course ne correspond à ces critères</div>}
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A', verticalAlign: 'middle' };
const actionIconBtnStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };