// src/pages/CoursiersPage.tsx
import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Eye, Star } from 'lucide-react';
import type { Livreur, StatutValidation } from '../types';

const MOCK_LIVREURS: Livreur[] = [
  {
    id_livreur: 'l1', id_utilisateur: 'u4',
    utilisateur: { id_utilisateur: 'u4', nom: 'Elabidi', prenom: 'Moussa', email: 'moussa.e@koursego.bj', telephone: '+229 97 00 00 01', otp_verifie: true, date_inscription: '2024-12-01', statut_compte: 'actif', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'valide', disponibilite: true,
    type_document: 'CIP', numero_document: 'CIP-00123',
    date_validation: '2024-12-10', note_moyenne: 4.8, nombre_courses: 248,
  },
  {
    id_livreur: 'l2', id_utilisateur: 'u6',
    utilisateur: { id_utilisateur: 'u6', nom: 'Ativi', prenom: 'Nancy', email: 'nancy.a@gmail.com', telephone: '+229 96 55 44 33', otp_verifie: true, date_inscription: '2025-04-15', statut_compte: 'en_attente', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'en_attente', disponibilite: false,
    type_document: 'CIP', numero_document: 'CIP-00456',
  },
  {
    id_livreur: 'l3', id_utilisateur: 'u7',
    utilisateur: { id_utilisateur: 'u7', nom: 'Flavil', prenom: 'Jean', email: 'jean.f@gmail.com', telephone: '+229 97 11 22 33', otp_verifie: true, date_inscription: '2025-04-16', statut_compte: 'en_attente', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'en_attente', disponibilite: false,
    type_document: 'carte_identite', numero_document: 'CNI-00789',
  },
  {
    id_livreur: 'l4', id_utilisateur: 'u8',
    utilisateur: { id_utilisateur: 'u8', nom: 'Diallo', prenom: 'Roméo', email: 'romeo.d@gmail.com', telephone: '+229 96 99 88 77', otp_verifie: true, date_inscription: '2025-01-20', statut_compte: 'actif', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'valide', disponibilite: false,
    type_document: 'CIP', numero_document: 'CIP-00321',
    date_validation: '2025-01-28', note_moyenne: 4.5, nombre_courses: 132,
  },
  {
    id_livreur: 'l5', id_utilisateur: 'u9',
    utilisateur: { id_utilisateur: 'u9', nom: 'Hounsou', prenom: 'Léa', email: 'lea.h@gmail.com', telephone: '+229 97 44 55 66', otp_verifie: true, date_inscription: '2025-03-01', statut_compte: 'suspendu', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'rejete', disponibilite: false,
    type_document: 'carte_identite', numero_document: 'CNI-00654',
  },
];

const VALIDATION_CONFIG: Record<StatutValidation, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  valide:     { label: 'Validé',     color: '#16A34A', bg: '#DCFCE7' },
  rejete:     { label: 'Rejeté',     color: '#DC2626', bg: '#FEE2E2' },
};

export default function CoursiersPage() {
  const [search, setSearch] = useState('');
  const [filtreValidation, setFiltreValidation] = useState<StatutValidation | 'tous'>('tous');
  const [livreurs, setLivreurs] = useState<Livreur[]>(MOCK_LIVREURS);
  const [selected, setSelected] = useState<Livreur | null>(null);

  const filtered = livreurs.filter((l) => {
    const u = l.utilisateur;
    if (!u) return false;
    const q = search.toLowerCase();
    const matchSearch = u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q) || u.telephone.includes(q);
    const matchVal = filtreValidation === 'tous' || l.statut_validation === filtreValidation;
    return matchSearch && matchVal;
  });

  const valider = (id: string) => {
    setLivreurs((prev) => prev.map((l) => l.id_livreur === id ? { ...l, statut_validation: 'valide', date_validation: new Date().toISOString() } : l));
    setSelected(null);
  };

  const rejeter = (id: string) => {
    setLivreurs((prev) => prev.map((l) => l.id_livreur === id ? { ...l, statut_validation: 'rejete' } : l));
    setSelected(null);
  };

  const pending = livreurs.filter((l) => l.statut_validation === 'en_attente').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>Coursiers</h1>
          <p style={subtitleStyle}>Validez les demandes et gérez les profils coursiers</p>
        </div>
        {pending > 0 && (
          <div style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E' }}>{pending} validation(s) en attente</div>
              <div style={{ fontSize: 12, color: '#B45309' }}>Nécessitent une action</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total coursiers', val: livreurs.length, color: '#FF8C00' },
          { label: 'Validés', val: livreurs.filter((l) => l.statut_validation === 'valide').length, color: '#16A34A' },
          { label: 'En attente', val: pending, color: '#B45309' },
          { label: 'Rejetés', val: livreurs.filter((l) => l.statut_validation === 'rejete').length, color: '#DC2626' },
        ].map((s, i) => (
          <div key={i} style={miniCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un coursier..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={filtreValidation} onChange={(e) => setFiltreValidation(e.target.value as any)} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="valide">Validés</option>
          <option value="rejete">Rejetés</option>
        </select>
      </div>

      {/* Tableau */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['Coursier', 'Contact', 'Document', 'Note', 'Courses', 'Statut', 'Disponible', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const u = l.utilisateur!;
              const cfg = VALIDATION_CONFIG[l.statut_validation];
              return (
                <tr key={l.id_livreur} style={{ borderBottom: '1px solid #F8F8F8', background: l.statut_validation === 'en_attente' ? '#FFFDF5' : 'transparent' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={avatarStyle}>{u.prenom.charAt(0)}{u.nom.charAt(0)}</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.prenom} {u.nom}</div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 12 }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{u.telephone}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{l.type_document === 'CIP' ? 'Carte CIP' : 'Carte Identité'}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{l.numero_document}</div>
                  </td>
                  <td style={tdStyle}>
                    {l.note_moyenne ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} fill="#FF8C00" color="#FF8C00" />
                        <span style={{ fontWeight: 600 }}>{l.note_moyenne}</span>
                      </div>
                    ) : <span style={{ color: '#9CA3AF' }}>—</span>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{l.nombre_courses ?? 0}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: l.disponibilite ? '#16A34A' : '#9CA3AF' }}>
                      {l.disponibilite ? '🟢 Oui' : '⚫ Non'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={iconBtnStyle} onClick={() => setSelected(l)} title="Voir le dossier"><Eye size={14} /></button>
                      {l.statut_validation === 'en_attente' && (
                        <>
                          <button style={{ ...iconBtnStyle, color: '#16A34A', borderColor: '#DCFCE7' }} onClick={() => valider(l.id_livreur)} title="Valider"><CheckCircle size={14} /></button>
                          <button style={{ ...iconBtnStyle, color: '#DC2626', borderColor: '#FEE2E2' }} onClick={() => rejeter(l.id_livreur)} title="Rejeter"><XCircle size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal dossier coursier */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Dossier — {selected.utilisateur?.prenom} {selected.utilisateur?.nom}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Email', val: selected.utilisateur?.email },
                { label: 'Téléphone', val: selected.utilisateur?.telephone },
                { label: 'Type document', val: selected.type_document },
                { label: 'N° document', val: selected.numero_document },
                { label: 'OTP vérifié', val: selected.utilisateur?.otp_verifie ? '✅ Oui' : '❌ Non' },
                { label: 'Statut', val: VALIDATION_CONFIG[selected.statut_validation].label },
              ].map((item, i) => (
                <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.val}</div>
                </div>
              ))}
            </div>
            {/* Documents placeholder */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {['Photo document (recto)', 'Selfie vérification'].map((label) => (
                <div key={label} style={{ background: '#F8F9FA', borderRadius: 10, height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, border: '2px dashed #E8E8E8' }}>
                  <span style={{ fontSize: 24 }}>🪪</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</span>
                </div>
              ))}
            </div>
            {selected.statut_validation === 'en_attente' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => valider(selected.id_livreur)}
                  style={{ flex: 1, padding: '12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                >
                  ✅ Valider le coursier
                </button>
                <button
                  onClick={() => rejeter(selected.id_livreur)}
                  style={{ flex: 1, padding: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                >
                  ❌ Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const h1Style: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
const avatarStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: '#FFF3E0', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 };
const iconBtnStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
