// src/pages/PaiementsPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaiementRow {
  id_paiement: number;
  id_course: number;
  montant_articles: number;
  montant_commission: number;
  montant_plateforme: number;
  montant_total: number;
  moyen_paiement: string;
  numero_mobile: string | null;
  preuve_paiement: string | null;
  statut_paiement: string;
  date_paiement: string;
  client_nom: string | null;
  coursier_nom: string | null;
  adresse_livraison: string | null;
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirme:   { label: 'Confirmé',   color: '#16A34A', bg: '#DCFCE7' },
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  echoue:     { label: 'Échoué',     color: '#DC2626', bg: '#FEE2E2' },
  rembourse:  { label: 'Remboursé',  color: '#7C3AED', bg: '#EDE9FE' },
};

const MOYEN_LABEL: Record<string, string> = {
  mtn_momo:   '📱 MTN MoMo',
  moov_money: '🟨 Moov Money',
  especes:    '💵 Espèces',
  momo:       '📱 MoMo',
};

export default function PaiementsPage() {
  const [paiements, setPaiements]         = useState<PaiementRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filtreStatut, setFiltreStatut]   = useState('tous');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchPaiements(); }, []);

  const fetchPaiements = async () => {
    setLoading(true);
    try {
      // Récupérer paiements + infos commande + client + coursier
      const { data, error } = await supabase
        .from('paiement')
        .select(`
          id_paiement, id_course, montant_articles, montant_commission,
          montant_plateforme, montant_total, moyen_paiement, numero_mobile,
          preuve_paiement, statut_paiement, date_paiement,
          commande!paiement_id_course_fkey (
            adresse_livraison,
            id_client,
            id_coursier,
            client:utilisateurs!commande_id_client_fkey (nom_complet),
            coursier:coursier!commande_id_coursier_fkey (
              utilisateurs (nom_complet)
            )
          )
        `)
        .order('date_paiement', { ascending: false });

      if (error) {
        // Fallback : requête simple sans jointure si erreur
        console.error('Erreur jointure paiement:', error);
        const { data: simple } = await supabase
          .from('paiement')
          .select('*')
          .order('date_paiement', { ascending: false });

        setPaiements((simple || []).map((p: any) => ({
          ...p,
          client_nom: null,
          coursier_nom: null,
          adresse_livraison: null,
        })));
        return;
      }

      const formatted = (data || []).map((p: any) => ({
        ...p,
        client_nom:        p.commande?.client?.nom_complet || null,
        coursier_nom:      p.commande?.coursier?.utilisateurs?.nom_complet || null,
        adresse_livraison: p.commande?.adresse_livraison || null,
      }));

      setPaiements(formatted);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id: number) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('paiement')
        .update({ statut_paiement: 'confirme' })
        .eq('id_paiement', id);
      if (error) { console.error(error); return; }
      setPaiements(prev => prev.map(p => p.id_paiement === id ? { ...p, statut_paiement: 'confirme' } : p));
    } finally { setActionLoading(null); }
  };

  const handleRejeter = async (id: number) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('paiement')
        .update({ statut_paiement: 'echoue' })
        .eq('id_paiement', id);
      if (error) { console.error(error); return; }
      setPaiements(prev => prev.map(p => p.id_paiement === id ? { ...p, statut_paiement: 'echoue' } : p));
    } finally { setActionLoading(null); }
  };

  const filtered = paiements.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      String(p.id_paiement).includes(q) ||
      String(p.id_course).includes(q) ||
      (p.client_nom || '').toLowerCase().includes(q) ||
      (p.coursier_nom || '').toLowerCase().includes(q) ||
      (p.adresse_livraison || '').toLowerCase().includes(q) ||
      (p.numero_mobile || '').includes(q);
    const matchStatut = filtreStatut === 'tous' || p.statut_paiement === filtreStatut;
    return matchSearch && matchStatut;
  });

  // KPIs
  const confirmes       = paiements.filter(p => p.statut_paiement === 'confirme');
  const totalVolume     = confirmes.reduce((s, p) => s + Number(p.montant_total), 0);
  const totalPlateforme = confirmes.reduce((s, p) => s + Number(p.montant_plateforme), 0);
  const totalCoursiers  = confirmes.reduce((s, p) => s + Number(p.montant_commission), 0);
  const pendingCount    = paiements.filter(p => p.statut_paiement === 'en_attente').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>Gestion des Flux & Paiements</h1>
          <p style={subtitleStyle}>Suivez les paiements des courses — Espèces & Mobile Money</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#92400E' }}>
            ⏳ {pendingCount} paiement(s) en attente
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #1F2937' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Volume total (Confirmés)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1F2937', marginTop: 4 }}>{loading ? '...' : totalVolume.toLocaleString('fr-FR')} F</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Revenus Plateforme (15%)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>+{loading ? '...' : totalPlateforme.toLocaleString('fr-FR')} F</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #FF8C00' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Gains Coursiers (85%)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FF8C00', marginTop: 4 }}>{loading ? '...' : totalCoursiers.toLocaleString('fr-FR')} F</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #B45309' }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>En Attente</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#B45309', marginTop: 4 }}>{loading ? '...' : pendingCount} paiement(s)</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par ID, client, coursier, adresse..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={fetchPaiements} style={refreshBtnStyle}>🔄</button>
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
                  {['#Paiement', '#Commande', 'Client', 'Coursier', 'Adresse', 'Total', 'Plateforme (15%)', 'Coursier (85%)', 'Moyen', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const cfgStatut  = STATUT_CONFIG[p.statut_paiement] || STATUT_CONFIG['en_attente'];
                  const moyenLabel = MOYEN_LABEL[p.moyen_paiement] || `💳 ${p.moyen_paiement}`;
                  return (
                    <tr key={p.id_paiement} style={{ borderBottom: '1px solid #F8F8F8', background: p.statut_paiement === 'en_attente' ? '#FFFDF5' : 'transparent' }}>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>#{p.id_paiement}</span>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>#{p.id_course}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.client_nom || '—'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.coursier_nom ? `🏍️ ${p.coursier_nom}` : '—'}</div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 140 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.adresse_livraison || ''}>
                          {p.adresse_livraison || '—'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <strong>{Number(p.montant_total).toLocaleString('fr-FR')} F</strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>+{Number(p.montant_plateforme).toLocaleString('fr-FR')} F</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#FF8C00', fontWeight: 700 }}>{Number(p.montant_commission).toLocaleString('fr-FR')} F</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, background: '#F8F9FA', padding: '4px 8px', borderRadius: 6, fontWeight: 500, border: '1px solid #E8E8E8', whiteSpace: 'nowrap' }}>
                          {moyenLabel}
                        </span>
                        {p.numero_mobile && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{p.numero_mobile}</div>}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: cfgStatut.bg, color: cfgStatut.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {cfgStatut.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {p.statut_paiement === 'en_attente' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleValider(p.id_paiement)}
                              disabled={actionLoading === p.id_paiement}
                              style={{ ...actionIconBtnStyle, color: '#16A34A', borderColor: '#DCFCE7', opacity: actionLoading === p.id_paiement ? 0.5 : 1 }}
                              title="Confirmer"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleRejeter(p.id_paiement)}
                              disabled={actionLoading === p.id_paiement}
                              style={{ ...actionIconBtnStyle, color: '#DC2626', borderColor: '#FEE2E2', opacity: actionLoading === p.id_paiement ? 0.5 : 1 }}
                              title="Rejeter"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucun paiement trouvé</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties           = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties     = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties     = { background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties    = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties        = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties       = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', cursor: 'pointer', outline: 'none' };
const refreshBtnStyle: React.CSSProperties   = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 16, background: 'white', cursor: 'pointer' };
const thStyle: React.CSSProperties           = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties           = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A', verticalAlign: 'middle' };
const actionIconBtnStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: 6, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };