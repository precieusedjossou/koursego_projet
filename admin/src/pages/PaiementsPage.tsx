// src/pages/PaiementsPage.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { StatutPaiement } from '../types';

interface PaiementRow {
  id: string; commande: string; client: string;
  montant: number; commission: number;
  moyen: string; statut: StatutPaiement; date: string;
}

const MOCK: PaiementRow[] = [
  { id: 'PAY-001', commande: 'CMD-001', client: 'Jean Dupont', montant: 17500, commission: 1000, moyen: 'MTN MoMo', statut: 'confirme', date: '2025-04-18 14:32' },
  { id: 'PAY-002', commande: 'CMD-002', client: 'Sylvie Koffi', montant: 8200, commission: 400, moyen: 'Moov Money', statut: 'confirme', date: '2025-04-17 10:15' },
  { id: 'PAY-003', commande: 'CMD-004', client: 'Marie Agossou', montant: 12000, commission: 600, moyen: 'MTN MoMo', statut: 'confirme', date: '2025-04-16 16:50' },
  { id: 'PAY-004', commande: 'CMD-006', client: 'Kodjo Mensah', montant: 6500, commission: 0, moyen: 'Espèces', statut: 'en_attente', date: '2025-04-18 09:00' },
  { id: 'PAY-005', commande: 'CMD-007', client: 'Nancy Ativi', montant: 3200, commission: 0, moyen: 'MTN MoMo', statut: 'echoue', date: '2025-04-15 08:30' },
];

const STATUT_CONFIG: Record<StatutPaiement, { label: string; color: string; bg: string }> = {
  confirme:   { label: 'Confirmé',    color: '#16A34A', bg: '#DCFCE7' },
  en_attente: { label: 'En attente',  color: '#B45309', bg: '#FEF9C3' },
  echoue:     { label: 'Échoué',      color: '#DC2626', bg: '#FEE2E2' },
  rembourse:  { label: 'Remboursé',   color: '#7C3AED', bg: '#EDE9FE' },
};

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutPaiement | 'tous'>('tous');

  const filtered = MOCK.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.id.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.commande.toLowerCase().includes(q)) &&
      (filtreStatut === 'tous' || p.statut === filtreStatut)
    );
  });

  const totalConfirme = MOCK.filter((p) => p.statut === 'confirme').reduce((s, p) => s + p.montant, 0);
  const totalCommission = MOCK.filter((p) => p.statut === 'confirme').reduce((s, p) => s + p.commission, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Paiements</h1>
        <p style={subtitleStyle}>Suivi de tous les flux financiers de la plateforme</p>
      </div>

      {/* Stats financières */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Volume total confirmé</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16A34A' }}>{totalConfirme.toLocaleString()} FCFA</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{MOCK.filter((p) => p.statut === 'confirme').length} transactions</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #FF8C00' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Revenus plateforme</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FF8C00' }}>{totalCommission.toLocaleString()} FCFA</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Commissions perçues</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Paiements échoués</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626' }}>{MOCK.filter((p) => p.statut === 'echoue').length}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>À traiter</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par ID, client ou commande..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value as any)} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tableau */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['ID Paiement', 'Commande', 'Client', 'Montant', 'Commission', 'Moyen', 'Statut', 'Date'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cfg = STATUT_CONFIG[p.statut];
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>{p.id}</span></td>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>{p.commande}</span></td>
                  <td style={tdStyle}>{p.client}</td>
                  <td style={tdStyle}><strong>{p.montant.toLocaleString()} FCFA</strong></td>
                  <td style={tdStyle}>
                    <span style={{ color: p.commission > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 600 }}>
                      {p.commission > 0 ? `+${p.commission} FCFA` : '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, background: '#F8F9FA', padding: '3px 8px', borderRadius: 6 }}>
                      {p.moyen === 'MTN MoMo' ? '📱 ' : p.moyen === 'Moov Money' ? '📱 ' : '💵 '}{p.moyen}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{cfg.label}</span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#9CA3AF' }}>{p.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucun paiement trouvé</div>}
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', cursor: 'pointer', outline: 'none' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
