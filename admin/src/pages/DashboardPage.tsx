// src/pages/DashboardPage.tsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { ShoppingBag, Users, Bike, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const STATS = [
  { label: 'Total commandes', value: '2 500 000', icon: <ShoppingBag size={20} />, color: '#FF8C00', bg: '#FFF3E0', sub: '+12% ce mois' },
  { label: 'Utilisateurs', value: '124', icon: <Users size={20} />, color: '#3B82F6', bg: '#DBEAFE', sub: '+8 cette semaine' },
  { label: 'Coursiers actifs', value: '18', icon: <Bike size={20} />, color: '#22C55E', bg: '#DCFCE7', sub: '3 en attente de validation' },
  { label: 'Revenus plateforme', value: '1 250 FCFA', icon: <TrendingUp size={20} />, color: '#8B5CF6', bg: '#EDE9FE', sub: 'Ce mois' },
];

const MONTHLY_DATA = [
  { mois: 'Jan', commandes: 45, revenus: 180 },
  { mois: 'Fév', commandes: 62, revenus: 248 },
  { mois: 'Mar', commandes: 78, revenus: 312 },
  { mois: 'Avr', commandes: 55, revenus: 220 },
  { mois: 'Mai', commandes: 90, revenus: 360 },
  { mois: 'Jun', commandes: 110, revenus: 440 },
];

const COMMANDES_RECENTES = [
  { id: 'CMD-001', client: 'Jean Dupont', coursier: 'Moussa E.', montant: '17 500', statut: 'en_cours', date: "Aujourd'hui 14h30" },
  { id: 'CMD-002', client: 'Sylvie Koffi', coursier: 'Roméo D.', montant: '8 200', statut: 'terminee', date: 'Hier 10h12' },
  { id: 'CMD-003', client: 'Kodjo M.', coursier: 'N/A', montant: '5 000', statut: 'en_attente', date: 'Hier 09h00' },
];

const VALIDATIONS_EN_ATTENTE = [
  { nom: 'Nancy Ativi', telephone: '+229 96 XX XX XX', document: 'CIP', date: 'Il y a 2h' },
  { nom: 'Jean Flavil', telephone: '+229 97 XX XX XX', document: 'Carte identité', date: 'Il y a 5h' },
];

const STATUT_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  en_attente: { label: 'En attente', style: { background: '#FEF9C3', color: '#B45309' } },
  en_cours:   { label: 'En cours',   style: { background: '#DCFCE7', color: '#16A34A' } },
  terminee:   { label: 'Terminée',   style: { background: '#FFF3E0', color: '#FF8C00' } },
  annulee:    { label: 'Annulée',    style: { background: '#FEE2E2', color: '#DC2626' } },
};

export default function DashboardPage() {
  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A' }}>Tableau de bord</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
          Aperçu global de la plateforme KourseGO — Cotonou, Bénin 🇧🇯
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1A1A1A', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 500 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Commandes par mois</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E8E8' }} />
              <Bar dataKey="commandes" fill="#FF8C00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Revenus plateforme (K FCFA)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E8E8' }} />
              <Line type="monotone" dataKey="revenus" stroke="#FF8C00" strokeWidth={2.5} dot={{ fill: '#FF8C00', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dernières commandes + validations en attente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Commandes récentes */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={cardTitleStyle}>Commandes récentes</h3>
            <a href="/commandes" style={{ fontSize: 13, color: '#FF8C00', fontWeight: 500, textDecoration: 'none' }}>Voir tout →</a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                {['ID', 'Client', 'Coursier', 'Montant', 'Statut', 'Date'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMMANDES_RECENTES.map((c) => {
                const badge = STATUT_BADGE[c.statut];
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00' }}>{c.id}</span></td>
                    <td style={tdStyle}>{c.client}</td>
                    <td style={tdStyle}>{c.coursier}</td>
                    <td style={tdStyle}><strong>{c.montant} FCFA</strong></td>
                    <td style={tdStyle}>
                      <span style={{ ...badge.style, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>{c.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Validations en attente */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={cardTitleStyle}>Validations en attente</h3>
            <span style={{
              background: '#FF8C00', color: 'white',
              width: 22, height: 22, borderRadius: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {VALIDATIONS_EN_ATTENTE.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {VALIDATIONS_EN_ATTENTE.map((v, i) => (
              <div key={i} style={{
                padding: 14, borderRadius: 12,
                border: '1px solid #F0F0F0', background: '#FAFAFA',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: '#FFF3E0', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#FF8C00', fontWeight: 700, fontSize: 14,
                  }}>
                    {v.nom.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{v.nom}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{v.telephone} · {v.document}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>Soumis {v.date}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...btnStyle, background: '#FF8C00', color: 'white', flex: 1 }}>
                    <CheckCircle size={14} /> Valider
                  </button>
                  <button style={{ ...btnStyle, background: '#FEE2E2', color: '#DC2626', flex: 1 }}>
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
          <a href="/coursiers" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: '#FF8C00', textDecoration: 'none', fontWeight: 500 }}>
            Gérer tous les coursiers →
          </a>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 16,
  padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  border: '1px solid #F0F0F0',
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 0,
};
const tdStyle: React.CSSProperties = {
  padding: '12px 0', fontSize: 13, color: '#1A1A1A',
};
const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '7px 12px', border: 'none', borderRadius: 8,
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
};