// src/pages/CommandesPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, Eye, X, MapPin, Package, ShoppingCart, User, Bike } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CommandeRow {
  id_commande: number;
  id_client: string;
  id_coursier: string | null;
  adresse_livraison: string;
  description_articles: string | null;
  magasins: string | null;
  estimation_prix: number | null;
  montant_articles: number;
  montant_course: number;
  statut_commande: string;
  date_commande: string;
  aller_retour: boolean | null;
  poids_colis: string | null;
  distance_km: number | null;
  // jointures
  client_nom: string;
  coursier_nom: string | null;
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  en_cours:   { label: 'En cours',   color: '#16A34A', bg: '#DCFCE7' },
  termine:    { label: 'Terminée',   color: '#FF8C00', bg: '#FFF3E0' },
  annule:     { label: 'Annulée',    color: '#DC2626', bg: '#FEE2E2' },
};

const COMMISSION_TAUX = 0.15;

export default function CommandesPage() {
  const [commandes, setCommandes]       = useState<CommandeRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [selected, setSelected]         = useState<CommandeRow | null>(null);
  const [page, setPage]                 = useState(1);
  const PER_PAGE = 10;

  useEffect(() => { fetchCommandes(); }, []);

  const fetchCommandes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commande')
        .select(`
          id_commande, id_client, id_coursier,
          adresse_livraison, description_articles, magasins,
          estimation_prix, montant_articles, montant_course,
          statut_commande, date_commande, aller_retour,
          poids_colis, distance_km,
          client:utilisateurs!commande_id_client_fkey(nom_complet),
          coursier:coursier!commande_id_coursier_fkey(
            utilisateurs(nom_complet)
          )
        `)
        .order('date_commande', { ascending: false });

      if (error) { console.error(error); return; }

      const formatted = (data || []).map((c: any) => ({
        ...c,
        client_nom:   c.client?.nom_complet || 'Client inconnu',
        coursier_nom: c.coursier?.utilisateurs?.nom_complet || null,
      }));

      setCommandes(formatted);
    } finally {
      setLoading(false);
    }
  };

  const filtered = commandes.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      String(c.id_commande).includes(q) ||
      c.client_nom.toLowerCase().includes(q) ||
      (c.coursier_nom || '').toLowerCase().includes(q) ||
      c.adresse_livraison.toLowerCase().includes(q);
    const matchStatut = filtreStatut === 'tous' || c.statut_commande === filtreStatut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalRevenu = commandes
    .filter(c => c.statut_commande === 'termine')
    .reduce((s, c) => s + Number(c.montant_course) * COMMISSION_TAUX, 0);

  const isAchat = (c: CommandeRow) => !!c.magasins;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Suivi des Commandes & Dispatch</h1>
        <p style={subtitleStyle}>Supervisez les demandes de courses et assignez les livreurs partenaires sur le terrain</p>
      </div>

      {/* Compteurs statuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
          <div key={key} style={miniCardStyle}>
            <div style={{ fontSize: 24, fontWeight: 800, color: cfg.color }}>
              {loading ? '...' : commandes.filter(c => c.statut_commande === key).length}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Bannière revenus */}
      <div style={{ background: '#FF8C00', borderRadius: 16, padding: '16px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>Commissions cumulées (15% — Courses terminées)</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            +{loading ? '...' : Math.round(totalRevenu).toLocaleString('fr-FR')} FCFA
          </div>
        </div>
        <span style={{ fontSize: 36 }}>💰</span>
      </div>

      {/* Recherche + filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par ID, client, coursier, adresse..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={fetchCommandes} style={refreshBtnStyle} title="Actualiser">🔄</button>
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
                  {['#', 'Client', 'Coursier', 'Type', 'Adresse livraison', 'Montant', 'Commission', 'Statut', 'Date', 'Action'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => {
                  const cfg        = STATUT_CONFIG[c.statut_commande] || STATUT_CONFIG['en_attente'];
                  const commission = Math.round(Number(c.montant_course) * COMMISSION_TAUX);
                  return (
                    <tr key={c.id_commande} style={{ borderBottom: '1px solid #F8F8F8', background: c.statut_commande === 'en_attente' ? '#FFFDF5' : 'transparent' }}>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>#{c.id_commande}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{c.client_nom}</div>
                      </td>
                      <td style={tdStyle}>
                        {c.coursier_nom ? (
                          <span style={{ color: '#1A1A1A', fontWeight: 500 }}>🏍️ {c.coursier_nom}</span>
                        ) : (
                          <span style={{ color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Non assigné</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, background: '#F3F4F6', padding: '4px 8px', borderRadius: 6, fontWeight: 500 }}>
                          {isAchat(c) ? '🛒 Achat' : '📦 Colis'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 160 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.adresse_livraison}>
                          {c.adresse_livraison}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <strong>{Number(c.montant_course).toLocaleString('fr-FR')} F</strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: commission > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 600 }}>
                          {commission > 0 ? `+${commission.toLocaleString('fr-FR')} F` : '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {new Date(c.date_commande).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={tdStyle}>
                        <button
                          style={actionIconBtnStyle}
                          onClick={() => setSelected(c)}
                          title="Voir les détails"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Aucune course ne correspond à ces critères</div>
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

      {/* Modal détail commande */}
      {selected && (
        <div style={overlayStyle} onClick={() => setSelected(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Commande <span style={{ color: '#FF8C00' }}>#{selected.id_commande}</span>
              </h2>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}><X size={18} /></button>
            </div>

            {/* Statut + type */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <span style={{
                background: STATUT_CONFIG[selected.statut_commande]?.bg,
                color: STATUT_CONFIG[selected.statut_commande]?.color,
                padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              }}>
                {STATUT_CONFIG[selected.statut_commande]?.label}
              </span>
              <span style={{ background: '#F3F4F6', color: '#374151', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                {isAchat(selected) ? '🛒 Achat en magasin' : '📦 Récupération colis'}
                {selected.aller_retour ? ' — Aller/Retour' : ''}
                {selected.poids_colis === 'lourd' ? ' — Colis lourd' : ''}
              </span>
            </div>

            {/* Infos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div style={infoRowStyle}>
                <User size={15} color="#FF8C00" />
                <span style={infoLabelStyle}>Client</span>
                <span style={infoValStyle}>{selected.client_nom}</span>
              </div>
              <div style={infoRowStyle}>
                <Bike size={15} color="#FF8C00" />
                <span style={infoLabelStyle}>Coursier</span>
                <span style={infoValStyle}>{selected.coursier_nom || 'Non assigné'}</span>
              </div>
              <div style={infoRowStyle}>
                <MapPin size={15} color="#FF8C00" />
                <span style={infoLabelStyle}>Livraison</span>
                <span style={infoValStyle}>{selected.adresse_livraison}</span>
              </div>
              {selected.distance_km && (
                <div style={infoRowStyle}>
                  <span style={{ width: 15 }}>📏</span>
                  <span style={infoLabelStyle}>Distance</span>
                  <span style={infoValStyle}>{Number(selected.distance_km).toFixed(1)} km</span>
                </div>
              )}
              <div style={infoRowStyle}>
                <span style={{ width: 15 }}>📅</span>
                <span style={infoLabelStyle}>Date</span>
                <span style={infoValStyle}>{new Date(selected.date_commande).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            {/* Articles / Description */}
            {(selected.description_articles || selected.magasins) && (
              <div style={{ background: '#F8F9FA', borderRadius: 12, padding: '14px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  {isAchat(selected) ? <ShoppingCart size={15} color="#FF8C00" /> : <Package size={15} color="#FF8C00" />}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {isAchat(selected) ? 'Articles à acheter' : 'Description du colis'}
                  </span>
                </div>
                {selected.description_articles?.split(',').map((art, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#374151', padding: '4px 0', borderBottom: '1px solid #F0F0F0' }}>
                    • {art.trim()}
                    {isAchat(selected) && selected.magasins?.split(',')[i] && (
                      <span style={{ color: '#9CA3AF', marginLeft: 8 }}>({selected.magasins.split(',')[i].trim()})</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Montants */}
            <div style={{ background: '#FFF8F0', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>💰 Récapitulatif financier</div>
              {[
                { label: 'Montant articles',    val: `${Number(selected.montant_articles).toLocaleString()} FCFA` },
                { label: 'Montant course',      val: `${Number(selected.montant_course).toLocaleString()} FCFA` },
                { label: 'Commission KourseGo (15%)', val: `+${Math.round(Number(selected.montant_course) * COMMISSION_TAUX).toLocaleString()} FCFA`, color: '#16A34A' },
                { label: 'Gain net coursier',  val: `${Math.round(Number(selected.montant_course) * 0.85).toLocaleString()} FCFA` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid #FFE0B2' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color || '#1A1A1A' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const h1Style: React.CSSProperties         = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties   = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties   = { background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties  = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties     = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties    = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const refreshBtnStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 16, background: 'white', cursor: 'pointer' };
const thStyle: React.CSSProperties        = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties        = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A', verticalAlign: 'middle' };
const actionIconBtnStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const overlayStyle: React.CSSProperties   = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties     = { background: 'white', borderRadius: 20, padding: '28px', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
const closeBtnStyle: React.CSSProperties  = { width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const infoRowStyle: React.CSSProperties   = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8F9FA', borderRadius: 10 };
const infoLabelStyle: React.CSSProperties = { fontSize: 13, color: '#6B7280', width: 80, flexShrink: 0 };
const infoValStyle: React.CSSProperties   = { fontSize: 13, fontWeight: 600, color: '#1A1A1A' };