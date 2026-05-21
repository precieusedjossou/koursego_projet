// src/pages/PaiementsPage.tsx
// Branché Supabase — vraies données
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type StatutPaiement = 'confirme' | 'en_attente' | 'echoue' | 'rembourse';

interface PaiementRow {
  id_paiement:        number;
  id_demande:         number;
  nom_client:         string;
  montant_total:      number;
  montant_commission: number;
  montant_plateforme: number;
  moyen_paiement:     string;
  statut_paiement:    StatutPaiement;
  date_paiement:      string;
  preuve_paiement:    string | null;
}

const STATUT_CONFIG: Record<StatutPaiement, { label: string; color: string; bg: string }> = {
  confirme:   { label: 'Confirmé',   color: '#16A34A', bg: '#DCFCE7' },
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  echoue:     { label: 'Échoué',     color: '#DC2626', bg: '#FEE2E2' },
  rembourse:  { label: 'Remboursé',  color: '#7C3AED', bg: '#EDE9FE' },
};

const MOYEN_LABEL: Record<string, string> = {
  mtn_momo:   '📱 MTN MoMo',
  moov_money: '📱 Moov Money',
  especes:    '💵 Espèces',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function PaiementsPage() {
  const [paiements, setPaiements]     = useState<PaiementRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutPaiement | 'tous'>('tous');
  const [stats, setStats]             = useState({
    volumeTotal: 0, revenus: 0, nbEchoues: 0, nbConfirmes: 0,
  });

  useEffect(() => {
    loadPaiements();

    // Realtime
    const channel = supabase
      .channel('paiements-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements' }, () => {
        loadPaiements();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filtreStatut]);

  const loadPaiements = async () => {
    setLoading(true);
    try {
      // Charger les paiements
      let query = supabase
        .from('paiements')
        .select('id_paiement, id_demande, montant_total, montant_commission, montant_plateforme, moyen_paiement, statut_paiement, date_paiement, preuve_paiement, numero_mobile')
        .order('date_paiement', { ascending: false });

      if (filtreStatut !== 'tous') {
        query = query.eq('statut_paiement', filtreStatut);
      }

      const { data: paiData, error } = await query;
      if (error) { console.error(error); return; }

      // Charger les noms clients via demande_courses → id_client → utilisateurs
      const demandeIds = [...new Set((paiData ?? []).map(p => p.id_demande).filter(Boolean))];
      let clientsMap: Record<number, string> = {};

      if (demandeIds.length > 0) {
        const { data: demandes } = await supabase
          .from('demande_courses')
          .select('id_demande, id_client')
          .in('id_demande', demandeIds);

        const clientIds = [...new Set((demandes ?? []).map(d => d.id_client).filter(Boolean))];
        if (clientIds.length > 0) {
          const { data: users } = await supabase
            .from('utilisateurs')
            .select('id, nom_complet')
            .in('id', clientIds);

          const usersMap: Record<string, string> = {};
          (users ?? []).forEach(u => { usersMap[u.id] = u.nom_complet; });
          (demandes ?? []).forEach(d => { clientsMap[d.id_demande] = usersMap[d.id_client] ?? 'Client'; });
        }
      }

      const mapped: PaiementRow[] = (paiData ?? []).map(p => ({
        id_paiement:        p.id_paiement,
        id_demande:         p.id_demande,
        nom_client:         clientsMap[p.id_demande] ?? '—',
        montant_total:      Number(p.montant_total)      || 0,
        montant_commission: Number(p.montant_commission) || 0,
        montant_plateforme: Number(p.montant_plateforme) || 0,
        moyen_paiement:     p.moyen_paiement ?? '—',
        statut_paiement:    (p.statut_paiement as StatutPaiement) ?? 'en_attente',
        date_paiement:      p.date_paiement,
        preuve_paiement:    p.preuve_paiement ?? null,
      }));

      setPaiements(mapped);

      // Stats globales (toujours sur tous les paiements)
      const { data: allPai } = await supabase
        .from('paiements')
        .select('statut_paiement, montant_total, montant_plateforme');

      if (allPai) {
        const confirmes = allPai.filter(p => p.statut_paiement === 'confirme');
        setStats({
          volumeTotal:  confirmes.reduce((s, p) => s + (Number(p.montant_total) || 0), 0),
          revenus:      confirmes.reduce((s, p) => s + (Number(p.montant_plateforme) || 0), 0),
          nbConfirmes:  confirmes.length,
          nbEchoues:    allPai.filter(p => p.statut_paiement === 'echoue').length,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtre local recherche
  const filtered = paiements.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.nom_client.toLowerCase().includes(q) ||
      `PAY-${p.id_paiement}`.toLowerCase().includes(q) ||
      `CMD-${p.id_demande}`.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Paiements</h1>
        <p style={subtitleStyle}>Suivi de tous les flux financiers de la plateforme</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #16A34A' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Volume total confirmé</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16A34A' }}>
            {stats.volumeTotal.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            {stats.nbConfirmes} transaction(s)
          </div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #FF8C00' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Revenus plateforme</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FF8C00' }}>
            {stats.revenus.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Part plateforme (5%)</div>
        </div>
        <div style={{ ...miniCardStyle, borderLeft: '4px solid #DC2626' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Paiements échoués</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626' }}>{stats.nbEchoues}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>À traiter</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par client, ID paiement ou commande..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value as any)}
          style={selectStyle}
        >
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button onClick={loadPaiements} style={refreshBtnStyle} title="Actualiser">
          <RefreshCw size={16} color="#6B7280" />
        </button>
      </div>

      {/* Tableau */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['ID', 'Commande', 'Client', 'Montant', 'Plateforme', 'Moyen', 'Statut', 'Date'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{ height: 13, borderRadius: 6, background: '#F0F0F0', width: j === 0 ? 70 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                  Aucun paiement trouvé
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const cfg = STATUT_CONFIG[p.statut_paiement] ?? STATUT_CONFIG['en_attente'];
                return (
                  <tr key={p.id_paiement} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>
                        PAY-{String(p.id_paiement).padStart(3, '0')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>
                        CMD-{String(p.id_demande).padStart(4, '0')}
                      </span>
                    </td>
                    <td style={tdStyle}>{p.nom_client}</td>
                    <td style={tdStyle}>
                      <strong>{p.montant_total.toLocaleString('fr-FR')} FCFA</strong>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: p.montant_plateforme > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 600 }}>
                        {p.montant_plateforme > 0
                          ? `+${p.montant_plateforme.toLocaleString('fr-FR')} FCFA`
                          : '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, background: '#F8F9FA', padding: '3px 8px', borderRadius: 6 }}>
                        {MOYEN_LABEL[p.moyen_paiement] ?? p.moyen_paiement}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: cfg.bg, color: cfg.color,
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 500,
                      }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#9CA3AF' }}>
                      {formatDate(p.date_paiement)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && (
          <div style={{ padding: '12px 0 0', borderTop: '1px solid #F0F0F0', marginTop: 8, fontSize: 13, color: '#9CA3AF' }}>
            {filtered.length} paiement(s)
          </div>
        )}
      </div>
    </div>
  );
}

const h1Style: React.CSSProperties          = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties    = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties    = { background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties   = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties       = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box' as const };
const selectStyle: React.CSSProperties      = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', cursor: 'pointer', outline: 'none' };
const refreshBtnStyle: React.CSSProperties  = { width: 42, height: 42, borderRadius: 10, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const thStyle: React.CSSProperties          = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties          = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };