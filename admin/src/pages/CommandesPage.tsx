// src/pages/CommandesPage.tsx
// Branché Supabase — vraies données + modal détail + realtime + filtres
import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────
type StatutDemande = 'en_attente' | 'acceptee' | 'en_cours' | 'livree' | 'annulee';

interface CommandeRow {
  id_demande: number;
  id_affiche: string;
  nom_client: string;
  nom_livreur: string | null;
  type_commande: string;
  adresse_livraison: string;
  montant_total: number;
  commission: number;
  statut_demande: StatutDemande;
  created_at: string;
  // pour modal
  description_articles: string | null;
  mode_paiement: string | null;
  id_client: string;
  id_livreur: string | null;
}

interface ArticleDetail {
  id: number;
  nom: string;
  quantite: number;
  magasin: string | null;
  prix_unitaire: number | null;
}

interface HistoriqueItem {
  id: number;
  statut: string;
  created_at: string;
}

const STATUT_CONFIG: Record<StatutDemande, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  acceptee:   { label: 'Acceptée',   color: '#1D4ED8', bg: '#DBEAFE' },
  en_cours:   { label: 'En cours',   color: '#16A34A', bg: '#DCFCE7' },
  livree:     { label: 'Livrée',     color: '#FF8C00', bg: '#FFF3E0' },
  annulee:    { label: 'Annulée',    color: '#DC2626', bg: '#FEE2E2' },
};

const MODE_PAIEMENT: Record<string, string> = {
  especes: '💵 Espèces',
  mtn_money: '📱 MTN MoMo',
  moov_money: '📱 Moov Money',
};

const COMMISSION_RATE = 0.10; // 10%

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatHeure = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'À l\'instant';
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return formatDate(iso);
};

const PAR_PAGE = 25;

// ── Composant ────────────────────────────────────────────────
export default function CommandesPage() {
  const [commandes, setCommandes]         = useState<CommandeRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filtreStatut, setFiltreStatut]   = useState<StatutDemande | 'tous'>('tous');
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const [selected, setSelected]           = useState<CommandeRow | null>(null);
  const [articles, setArticles]           = useState<ArticleDetail[]>([]);
  const [historique, setHistorique]       = useState<HistoriqueItem[]>([]);
  const [loadingModal, setLoadingModal]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats globales
  const [stats, setStats] = useState<Record<StatutDemande | 'total' | 'revenus', number>>({
    total: 0, revenus: 0,
    en_attente: 0, acceptee: 0, en_cours: 0, livree: 0, annulee: 0,
  });

  useEffect(() => {
    loadCommandes();
    loadStats();
  }, [filtreStatut, page]);

  useEffect(() => {
    setPage(1);
    loadCommandes();
  }, [search]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('commandes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demande_courses' }, () => {
        loadCommandes();
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadCommandes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Chargement commandes ─────────────────────────────────
  const loadCommandes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('demande_courses')
        .select(`
          id_demande,
          statut_demande,
          description_articles,
          adresse_livraison,
          montant_articles,
          commission_coursier,
          part_plateforme,
          date_demande,
          id_client,
          utilisateurs ( nom_complet ),
          courses!left ( id_livreur )
        `, { count: 'exact' })
        .order('date_demande', { ascending: false })
        .range((page - 1) * PAR_PAGE, page * PAR_PAGE - 1);

      if (filtreStatut !== 'tous') {
        query = query.eq('statut_demande', filtreStatut);
      }

      if (search.trim()) {
        // recherche sur nom client via filtre local (Supabase ne supporte pas ilike sur jointures)
        query = query.ilike('adresse_livraison', `%${search}%`);
      }

      const { data, count, error } = await query;
      if (error) { console.error(error); return; }

      const mapped: CommandeRow[] = (data ?? []).map((c: any) => {
        const montant = (Number(c.montant_articles)||0) + (Number(c.commission_coursier)||0) + (Number(c.part_plateforme)||0);
        const commission = Math.round(montant * COMMISSION_RATE);
        const livreurNom = c.courses?.[0]?.id_livreur ? `Coursier #${c.courses[0].id_livreur.slice(0,8)}` : null;
        const id_livreur = c.courses?.[0]?.id_livreur ?? null;

        return {
          id_demande:          c.id_demande,
          id_affiche:          `CMD-${String(c.id_demande).padStart(4, '0')}`,
          nom_client:          (Array.isArray(c.utilisateurs) ? c.utilisateurs[0]?.nom_complet : c.utilisateurs?.nom_complet) ?? 'Inconnu',
          nom_livreur:         livreurNom,
          type_commande:       'achat',
          adresse_livraison:   c.adresse_livraison ?? '—',
          montant_total:       montant,
          commission,
          statut_demande:      c.statut_demande as StatutDemande,
          created_at:          c.date_demande ?? c.created_at ?? new Date().toISOString(),
          description_articles: c.description_articles,
          mode_paiement:       null,
          id_client:           c.id_client,
          id_livreur,
        };
      });

      // Filtre local pour la recherche (nom client)
      const finalMapped = search.trim()
        ? mapped.filter((c) =>
            c.nom_client.toLowerCase().includes(search.toLowerCase()) ||
            c.id_affiche.toLowerCase().includes(search.toLowerCase()) ||
            c.adresse_livraison.toLowerCase().includes(search.toLowerCase())
          )
        : mapped;

      setCommandes(finalMapped);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  };

  // ── Stats globales ───────────────────────────────────────
  const loadStats = async () => {
    const { data } = await supabase
      .from('demande_courses')
      .select('statut_demande, montant_articles, commission_coursier, part_plateforme');

    if (!data) return;

    const s: Record<string, number> = {
      total: data.length, revenus: 0,
      en_attente: 0, acceptee: 0, en_cours: 0, livree: 0, annulee: 0,
    };
    data.forEach((c: any) => {
      s[c.statut_demande as string] = (s[c.statut_demande as string] || 0) + 1;
      if (c.statut_demande === 'livree') {
        s.revenus += Math.round((((Number(c.montant_articles)||0) + (Number(c.commission_coursier)||0) + (Number(c.part_plateforme)||0)) || 0) * COMMISSION_RATE);
      }
    });
    setStats(s as any);
  };

  // ── Ouvrir modal ─────────────────────────────────────────
  const ouvrirModal = async (cmd: CommandeRow) => {
    setSelected(cmd);
    setArticles([]);
    setHistorique([]);
    setLoadingModal(true);

    // Articles liés à la commande
    const { data: arts } = await supabase
      .from('articles')
      .select('id, nom, quantite, magasin, prix_unitaire')
      .eq('id_demande', cmd.id_demande);

    // Historique statuts (table historiques)
    const { data: hist } = await supabase
      .from('historiques')
      .select('id, statut, created_at')
      .eq('id_demande', cmd.id_demande)
      .order('created_at', { ascending: true });

    setArticles(arts ?? []);
    setHistorique(hist ?? []);
    setLoadingModal(false);
  };

  // ── Action : changer statut manuellement ────────────────
  const changerStatut = async (id_demande: number, nouveau: StatutDemande) => {
    setActionLoading(true);
    await supabase
      .from('demande_courses')
      .update({ statut_demande: nouveau })
      .eq('id_demande', id_demande);

    // Mettre à jour localement
    setCommandes((prev) =>
      prev.map((c) => c.id_demande === id_demande ? { ...c, statut_demande: nouveau } : c)
    );
    if (selected?.id_demande === id_demande) {
      setSelected((s) => s ? { ...s, statut_demande: nouveau } : s);
    }
    loadStats();
    setActionLoading(false);
  };

  // ── Action : annuler une commande ────────────────────────
  const annulerCommande = async (id_demande: number) => {
    if (!window.confirm('Confirmer l\'annulation de cette commande ?')) return;
    await changerStatut(id_demande, 'annulee');
  };

  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE));

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={h1Style}>Commandes</h1>
        <p style={subtitleStyle}>Suivi en temps réel de toutes les courses de la plateforme</p>
      </div>

      {/* Stats par statut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {(Object.entries(STATUT_CONFIG) as [StatutDemande, typeof STATUT_CONFIG[StatutDemande]][]).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => { setFiltreStatut(filtreStatut === key ? 'tous' : key); setPage(1); }}
            style={{
              ...miniCardStyle,
              cursor: 'pointer',
              borderColor: filtreStatut === key ? cfg.color : '#F0F0F0',
              borderWidth: filtreStatut === key ? 2 : 1,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: cfg.color }}>{stats[key] ?? 0}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Bandeau revenus */}
      <div style={{ background: '#FF8C00', borderRadius: 16, padding: '16px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            Revenus plateforme (commandes livrées · {COMMISSION_RATE * 100}%)
          </div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {(stats.revenus ?? 0).toLocaleString('fr-FR')} FCFA
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Total commandes</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{stats.total ?? 0}</div>
        </div>
        <span style={{ fontSize: 40 }}>💰</span>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID, client ou adresse..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => { setFiltreStatut(e.target.value as any); setPage(1); }}
          style={selectStyle}
        >
          <option value="tous">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button onClick={() => { loadCommandes(); loadStats(); }} style={refreshBtn} title="Actualiser">
          <RefreshCw size={16} color="#6B7280" />
        </button>
      </div>

      {/* Tableau */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['ID', 'Client', 'Livreur', 'Type', 'Adresse', 'Montant', 'Commission', 'Statut', 'Date', ''].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                  {[...Array(10)].map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{ height: 13, borderRadius: 6, background: '#F0F0F0', width: j === 0 ? 80 : j === 9 ? 30 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : commandes.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              commandes.map((c) => {
                const cfg = STATUT_CONFIG[c.statut_demande];
                return (
                  <tr key={c.id_demande} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 600 }}>
                        {c.id_affiche}
                      </span>
                    </td>
                    <td style={tdStyle}>{c.nom_client}</td>
                    <td style={tdStyle}>
                      <span style={{ color: c.nom_livreur ? '#1A1A1A' : '#9CA3AF' }}>
                        {c.nom_livreur ?? 'N/A'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12 }}>
                        {c.type_commande === 'achat' ? '🛒 Achat' : '📦 Colis'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 140 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{c.adresse_livraison}</span>
                    </td>
                    <td style={tdStyle}>
                      <strong>{c.montant_total.toLocaleString('fr-FR')} FCFA</strong>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: c.commission > 0 ? '#16A34A' : '#9CA3AF', fontWeight: 600 }}>
                        {c.commission > 0 ? `+${c.commission.toLocaleString('fr-FR')} FCFA` : '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                      {formatDate(c.created_at)}
                    </td>
                    <td style={tdStyle}>
                      <button style={iconBtnStyle} onClick={() => ouvrirModal(c)} title="Voir le détail">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && total > PAR_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0', borderTop: '1px solid #F0F0F0', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
              {total} commande(s) · page {page}/{totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...pageBtn, opacity: page === 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{ ...pageBtn, background: p === page ? '#FF8C00' : 'white', color: p === page ? 'white' : '#6B7280' }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...pageBtn, opacity: page === totalPages ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DÉTAIL COMMANDE ─────────────────────────────── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: 'white', borderRadius: 20, padding: 32, width: 600, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selected.id_affiche}</h2>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{formatDate(selected.created_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{
                  background: STATUT_CONFIG[selected.statut_demande].bg,
                  color: STATUT_CONFIG[selected.statut_demande].color,
                  padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>
                  {STATUT_CONFIG[selected.statut_demande].label}
                </span>
                <button onClick={() => setSelected(null)} style={{ ...iconBtnStyle }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Infos principales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Client',        val: selected.nom_client },
                { label: 'Livreur',       val: selected.nom_livreur ?? 'Non assigné' },
                { label: 'Type',          val: selected.type_commande === 'achat' ? '🛒 Achat en magasin' : '📦 Récupération colis' },
                { label: 'Adresse livraison', val: selected.adresse_livraison },
                { label: 'Mode paiement', val: MODE_PAIEMENT[selected.mode_paiement ?? ''] ?? selected.mode_paiement ?? '—' },
                { label: 'Montant total', val: `${selected.montant_total.toLocaleString('fr-FR')} FCFA` },
                { label: 'Commission (10%)', val: `${selected.commission.toLocaleString('fr-FR')} FCFA` },
                { label: 'Description',   val: selected.description_articles ?? '—' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 14px', gridColumn: i === 7 ? '1 / -1' : undefined }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Articles */}
            {loadingModal ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>Chargement des détails...</div>
            ) : articles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Articles commandés</div>
                <div style={{ border: '1px solid #F0F0F0', borderRadius: 12, overflow: 'hidden' }}>
                  {articles.map((a, i) => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px',
                        borderBottom: i < articles.length - 1 ? '1px solid #F8F8F8' : 'none',
                        background: i % 2 === 0 ? 'white' : '#FAFAFA',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nom}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                          Qté: {a.quantite} {a.magasin ? `· ${a.magasin}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FF8C00' }}>
                        {a.prix_unitaire
                          ? `${(a.prix_unitaire * a.quantite).toLocaleString('fr-FR')} FCFA`
                          : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historique statuts */}
            {historique.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Historique de la commande</div>
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  {/* Ligne verticale */}
                  <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: '#F0F0F0' }} />
                  {historique.map((h, i) => {
                    const cfg = STATUT_CONFIG[h.statut as StatutDemande] ?? { color: '#9CA3AF', bg: '#F0F0F0', label: h.statut };
                    return (
                      <div key={h.id} style={{ display: 'flex', gap: 12, marginBottom: i < historique.length - 1 ? 16 : 0, position: 'relative' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 7, background: cfg.color, flexShrink: 0, marginTop: 2, zIndex: 1 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{formatHeure(h.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Actions admin ────────────────────────────────── */}
            <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Actions administrateur</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

                {/* Forcer En attente */}
                {selected.statut_demande !== 'en_attente' && selected.statut_demande !== 'livree' && selected.statut_demande !== 'annulee' && (
                  <button
                    onClick={() => changerStatut(selected.id_demande, 'en_attente')}
                    disabled={actionLoading}
                    style={{ ...actionBtn, background: '#FEF9C3', color: '#B45309' }}
                  >
                    ⏳ Mettre en attente
                  </button>
                )}

                {/* Forcer En cours */}
                {selected.statut_demande === 'acceptee' && (
                  <button
                    onClick={() => changerStatut(selected.id_demande, 'en_cours')}
                    disabled={actionLoading}
                    style={{ ...actionBtn, background: '#DCFCE7', color: '#16A34A' }}
                  >
                    🚀 Démarrer la course
                  </button>
                )}

                {/* Forcer Livrée */}
                {(selected.statut_demande === 'en_cours' || selected.statut_demande === 'acceptee') && (
                  <button
                    onClick={() => changerStatut(selected.id_demande, 'livree')}
                    disabled={actionLoading}
                    style={{ ...actionBtn, background: '#FFF3E0', color: '#FF8C00' }}
                  >
                    ✅ Marquer comme livrée
                  </button>
                )}

                {/* Annuler */}
                {selected.statut_demande !== 'livree' && selected.statut_demande !== 'annulee' && (
                  <button
                    onClick={() => annulerCommande(selected.id_demande)}
                    disabled={actionLoading}
                    style={{ ...actionBtn, background: '#FEE2E2', color: '#DC2626' }}
                  >
                    ❌ Annuler la commande
                  </button>
                )}

                {/* Statut terminal */}
                {(selected.statut_demande === 'livree' || selected.statut_demande === 'annulee') && (
                  <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 0' }}>
                    {selected.statut_demande === 'livree'
                      ? '✅ Commande terminée — aucune action disponible'
                      : '❌ Commande annulée — aucune action disponible'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────
const h1Style: React.CSSProperties       = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties  = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties  = { background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0', transition: 'border-color 0.15s' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties    = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties   = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties       = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties       = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
const iconBtnStyle: React.CSSProperties  = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const refreshBtn: React.CSSProperties    = { width: 42, height: 42, borderRadius: 10, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const pageBtn: React.CSSProperties       = { width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const actionBtn: React.CSSProperties     = { padding: '9px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' };