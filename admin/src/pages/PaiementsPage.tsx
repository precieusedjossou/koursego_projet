// src/pages/PaiementsPage.tsx
import React, { useState } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, Percent, CheckCircle, XCircle } from 'lucide-react';
import type { StatutPaiement } from '../types';

// Typage étendu pour catégoriser les flux financiers à la Gozem
type TypeFlux = 'course' | 'rechargement' | 'retrait';

interface PaiementRow {
  id: string;
  commande?: string; // Optionnel car un rechargement/retrait n'a pas de numéro de commande
  tier: string;      // Nom du Client ou du Coursier concerné
  type: TypeFlux;
  montant: number;
  commission: number;
  moyen: 'MTN MoMo' | 'Moov Money' | 'Espèces';
  statut: StatutPaiement;
  date: string;
}

const MOCK_PAIEMENTS: PaiementRow[] = [
  { id: 'PAY-001', commande: 'CMD-001', tier: 'Jean Dupont (Client)', type: 'course', montant: 17500, commission: 1000, moyen: 'MTN MoMo', statut: 'confirme', date: '2026-06-15 14:32' },
  { id: 'PAY-002', commande: 'CMD-002', tier: 'Sylvie Koffi (Client)', type: 'course', montant: 8200, commission: 400, moyen: 'Moov Money', statut: 'confirme', date: '2026-06-15 10:15' },
  { id: 'PAY-003', tier: 'Moussa Elabidi (Coursier)', type: 'rechargement', montant: 5000, commission: 0, moyen: 'MTN MoMo', statut: 'confirme', date: '2026-06-14 16:50' }, 
  { id: 'PAY-004', commande: 'CMD-006', tier: 'Kodjo Mensah (Client)', type: 'course', montant: 6500, commission: 650, moyen: 'Espèces', statut: 'confirme', date: '2026-06-14 09:00' },
  { id: 'PAY-005', tier: 'Nancy Ativi (Coursier)', type: 'retrait', montant: 4000, commission: 0, moyen: 'Moov Money', statut: 'en_attente', date: '2026-06-16 08:30' }, 
  { id: 'PAY-006', tier: 'Léa Hounsou (Coursier)', type: 'rechargement', montant: 3000, commission: 0, moyen: 'Espèces', statut: 'en_attente', date: '2026-06-16 11:15' }, 
];

const STATUT_CONFIG: Record<StatutPaiement, { label: string; color: string; bg: string }> = {
  confirme:   { label: 'Confirmé',    color: '#16A34A', bg: '#DCFCE7' },
  en_attente: { label: 'En attente',  color: '#B45309', bg: '#FEF9C3' },
  echoue:     { label: 'Échoué',      color: '#DC2626', bg: '#FEE2E2' },
  rembourse:  { label: 'Remboursé',   color: '#7C3AED', bg: '#EDE9FE' },
};

// Correction appliquée ici : alignement du typage avec l'utilisation de fontColor
const FLUX_CONFIG: Record<TypeFlux, { label: string; fontColor: string; icon: React.ReactNode }> = {
  course:       { label: 'Course', fontColor: '#1F2937', icon: <Percent size={12} /> },
  rechargement: { label: 'Rechargement (+)', fontColor: '#16A34A', icon: <ArrowDownLeft size={12} /> },
  retrait:      { label: 'Retrait (—)', fontColor: '#DC2626', icon: <ArrowUpRight size={12} /> },
};

export default function PaiementsPage() {
  const [transactions, setTransactions] = useState<PaiementRow[]>(MOCK_PAIEMENTS);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutPaiement | 'tous'>('tous');
  const [filtreFlux, setFiltreFlux] = useState<TypeFlux | 'tous'>('tous');

  // Filtrage multi-critères
  const filtered = transactions.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.id.toLowerCase().includes(q) || p.tier.toLowerCase().includes(q) || (p.commande && p.commande.toLowerCase().includes(q));
    const matchStatut = filtreStatut === 'tous' || p.statut === filtreStatut;
    const matchFlux = filtreFlux === 'tous' || p.type === filtreFlux;

    return matchSearch && matchStatut && matchFlux;
  });

  const validerTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, statut: 'confirme' } : t));
  };

  const rejeterTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, statut: 'echoue' } : t));
  };

  // Calculs financiers dynamiques
  const totalVolumeAffaires = transactions.filter((p) => p.statut === 'confirme' && p.type === 'course').reduce((s, p) => s + p.montant, 0);
  const totalCommissionGozem = transactions.filter((p) => p.statut === 'confirme').reduce((s, p) => s + p.commission, 0);
  const totalRetraitsValides = transactions.filter((p) => p.statut === 'confirme' && p.type === 'retrait').reduce((s, p) => s + p.montant, 0);
  const pendingCount = transactions.filter((p) => p.statut === 'en_attente').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>Gestion des Flux & Paiements</h1>
          <p style={subtitleStyle}>Suivez les courses, validez les rechargements et les demandes de retraits (MoMo / Espèces)</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            ⏳ {pendingCount} opération(s) en attente d'approbation
          </div>
        )}
      </div>

      {/* Grid de KPIs financiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #1F2937' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Volume d'affaires (Courses)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1F2937', marginTop: 4 }}>{totalVolumeAffaires.toLocaleString('fr-FR')} F</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Revenus Plateforme (Commissions)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>+{totalCommissionGozem.toLocaleString('fr-FR')} F</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Gains Sortis (Retraits Coursiers)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626', marginTop: 4 }}>{totalRetraitsValides.toLocaleString('fr-FR')} F</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #B45309' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Flux en Attente</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#B45309', marginTop: 4 }}>{pendingCount} opération(s)</div>
        </div>
      </div>

      {/* Zone de filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par ID transaction, bénéficiaire, commande..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        
        <select value={filtreFlux} onChange={(e) => setFiltreFlux(e.target.value as any)} style={selectStyle}>
          <option value="tous">Tous les types de flux</option>
          <option value="course">🛒 Uniquement les Courses</option>
          <option value="rechargement">📥 Rechargements Portefeuille</option>
          <option value="retrait">📤 Demandes de Retrait</option>
        </select>

        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value as any)} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tableau principal */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['ID / Date', 'Type de Flux', 'Bénéficiaire / Tiers', 'Commande', 'Montant Brut', 'Commission', 'Moyen', 'Statut', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cfgStatut = STATUT_CONFIG[p.statut];
              const cfgFlux = FLUX_CONFIG[p.type];

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #F8F8F8', background: p.statut === 'en_attente' ? '#FFFDF5' : 'transparent' }}>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>{p.id}</span>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{p.date}</div>
                  </td>
                  
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: cfgFlux.fontColor }}>
                      {cfgFlux.icon} {cfgFlux.label}
                    </span>
                  </td>
                  
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{p.tier}</div>
                  </td>
                  
                  <td style={tdStyle}>
                    {p.commande ? (
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>{p.commande}</span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: 12 }}>— (Hors course)</span>
                    )}
                  </td>
                  
                  <td style={tdStyle}>
                    <strong style={{ color: p.type === 'retrait' ? '#DC2626' : '#1A1A1A' }}>
                      {p.montant.toLocaleString('fr-FR')} F
                    </strong>
                  </td>
                  
                  <td style={tdStyle}>
                    <span style={{ color: p.commission > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 600 }}>
                      {p.commission > 0 ? `+${p.commission.toLocaleString('fr-FR')} F` : '—'}
                    </span>
                  </td>
                  
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, background: '#F8F9FA', padding: '4px 8px', borderRadius: 6, fontWeight: 500, border: '1px solid #E8E8E8' }}>
                      {p.moyen === 'MTN MoMo' ? '📱 ' : p.moyen === 'Moov Money' ? '🟨 ' : '💵 '}{p.moyen}
                    </span>
                  </td>
                  
                  <td style={tdStyle}>
                    <span style={{ background: cfgStatut.bg, color: cfgStatut.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {cfgStatut.label}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {p.statut === 'en_attente' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          onClick={() => validerTransaction(p.id)} 
                          style={{ ...actionIconBtnStyle, color: '#16A34A', borderColor: '#DCFCE7' }}
                          title="Confirmer la transaction"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button 
                          onClick={() => rejeterTransaction(p.id)} 
                          style={{ ...actionIconBtnStyle, color: '#DC2626', borderColor: '#FEE2E2' }}
                          title="Rejeter / Annuler"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: 12 }}>Aucune action</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucun flux de paiement trouvé</div>}
      </div>
    </div>
  );
}

// Styles
const h1Style: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', cursor: 'pointer', outline: 'none' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A', verticalAlign: 'middle' };
const actionIconBtnStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };