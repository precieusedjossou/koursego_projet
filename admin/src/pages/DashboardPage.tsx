// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { ShoppingBag, Users, Bike, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CommandeRecente {
  id_commande: number;
  adresse_livraison: string;
  montant_course: number;
  statut_commande: string;
  date_commande: string;
}

interface CoursierEnAttente {
  id: string;
  nom_complet: string;
  telephone: string | null;
  type_document: string;
  created_at: string;
}

const STATUT_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  en_attente: { label: 'En attente', style: { background: '#FEF9C3', color: '#B45309' } },
  en_cours:   { label: 'En cours',   style: { background: '#DCFCE7', color: '#16A34A' } },
  termine:    { label: 'Terminée',   style: { background: '#FFF3E0', color: '#FF8C00' } },
  annule:     { label: 'Annulée',    style: { background: '#FEE2E2', color: '#DC2626' } },
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCommandes: 0, totalUsers: 0,
    coursiersActifs: 0, coursiersEnAttente: 0, chiffreAffaires: 0,
  });
  const [commandes, setCommandes]             = useState<CommandeRecente[]>([]);
  const [coursiersAttente, setCoursiersAttente] = useState<CoursierEnAttente[]>([]);
  const [monthlyData, setMonthlyData]         = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [actionLoading, setActionLoading]     = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { count: totalCommandes },
        { count: totalUsers },
        { count: coursiersActifs },
        { count: coursiersEnAttente },
        { data: caData },
        { data: commandesData },
        { data: coursiersData },
        { data: allCommandes },
      ] = await Promise.all([
        supabase.from('commande').select('*', { count: 'exact', head: true }),
        supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('mode', 'client'),
        supabase.from('coursier').select('*', { count: 'exact', head: true }).eq('statut_validation', 'approuve'),
        supabase.from('coursier').select('*', { count: 'exact', head: true }).eq('statut_validation', 'en_attente'),
        supabase.from('commande').select('montant_course').eq('statut_commande', 'termine'),
        supabase.from('commande').select('id_commande, adresse_livraison, montant_course, statut_commande, date_commande').order('date_commande', { ascending: false }).limit(5),
        supabase.from('coursier').select('id, type_document, created_at, utilisateurs(nom_complet, telephone)').eq('statut_validation', 'en_attente').limit(3),
        supabase.from('commande').select('date_commande, montant_course, statut_commande'),
      ]);

      const totalCA = caData?.reduce((s, c) => s + Number(c.montant_course), 0) || 0;
      setStats({
        totalCommandes:     totalCommandes || 0,
        totalUsers:         totalUsers || 0,
        coursiersActifs:    coursiersActifs || 0,
        coursiersEnAttente: coursiersEnAttente || 0,
        chiffreAffaires:    totalCA,
      });
      setCommandes(commandesData || []);

      const formatted = (coursiersData || []).map((c: any) => ({
        id: c.id, nom_complet: c.utilisateurs?.nom_complet || 'Inconnu',
        telephone: c.utilisateurs?.telephone || null,
        type_document: c.type_document, created_at: c.created_at,
      }));
      setCoursiersAttente(formatted);

      // Données mensuelles 6 derniers mois
      const mois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      const now = new Date();
      const monthly = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const cmds = (allCommandes || []).filter(c => {
          const cd = new Date(c.date_commande);
          return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
        });
        const revenus = cmds.filter(c => c.statut_commande === 'termine').reduce((s, c) => s + Number(c.montant_course) * 0.15, 0);
        return { mois: mois[d.getMonth()], commandes: cmds.length, revenus: Math.round(revenus / 1000) };
      });
      setMonthlyData(monthly);
    } catch (e) {
      console.error('Erreur dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (v: CoursierEnAttente) => {
    setActionLoading(v.id);
    try {
      await supabase.from('coursier').update({ statut_validation: 'approuve', date_validation: new Date().toISOString() }).eq('id', v.id);
      await supabase.from('utilisateurs').update({ mode: 'coursier' }).eq('id', v.id);
      await supabase.from('notification').insert({ id_utilisateur: v.id, titre: '✅ Compte approuvé !', message: 'Votre compte coursier a été validé. Vous pouvez maintenant accepter des courses.', type_notification: 'validation' });
      setCoursiersAttente(prev => prev.filter(c => c.id !== v.id));
      setStats(prev => ({ ...prev, coursiersEnAttente: prev.coursiersEnAttente - 1, coursiersActifs: prev.coursiersActifs + 1 }));
    } finally { setActionLoading(null); }
  };

  const handleRejeter = async (v: CoursierEnAttente) => {
    setActionLoading(v.id);
    try {
      await supabase.from('coursier').update({ statut_validation: 'rejete', date_validation: new Date().toISOString() }).eq('id', v.id);
      await supabase.from('notification').insert({ id_utilisateur: v.id, titre: '❌ Compte non approuvé', message: "Votre demande a été rejetée. Contactez le support pour plus d'informations.", type_notification: 'validation' });
      setCoursiersAttente(prev => prev.filter(c => c.id !== v.id));
      setStats(prev => ({ ...prev, coursiersEnAttente: prev.coursiersEnAttente - 1 }));
    } finally { setActionLoading(null); }
  };

  const STATS_CARDS = [
    { label: 'Total commandes',    value: loading ? '...' : stats.totalCommandes.toLocaleString(),              icon: <ShoppingBag size={20} />, color: '#FF8C00', bg: '#FFF3E0', sub: 'Toutes les commandes' },
    { label: 'Clients',            value: loading ? '...' : stats.totalUsers.toLocaleString(),                   icon: <Users size={20} />,       color: '#3B82F6', bg: '#DBEAFE', sub: 'Comptes clients actifs' },
    { label: 'Coursiers actifs',   value: loading ? '...' : stats.coursiersActifs.toLocaleString(),             icon: <Bike size={20} />,        color: '#22C55E', bg: '#DCFCE7', sub: `${stats.coursiersEnAttente} en attente de validation` },
    { label: 'Revenus plateforme', value: loading ? '...' : `${stats.chiffreAffaires.toLocaleString()} FCFA`,   icon: <TrendingUp size={20} />,  color: '#8B5CF6', bg: '#EDE9FE', sub: 'Commission 15% courses terminées' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A' }}>Tableau de bord</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>
          Aperçu global de la plateforme KourseGO — Cotonou, Bénin 🇧🇯
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS_CARDS.map((s, i) => (
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
            <BarChart data={monthlyData}>
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
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E8E8' }} />
              <Line type="monotone" dataKey="revenus" stroke="#FF8C00" strokeWidth={2.5} dot={{ fill: '#FF8C00', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Commandes récentes + Validations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={cardTitleStyle}>Commandes récentes</h3>
            <a href="/commandes" style={{ fontSize: 13, color: '#FF8C00', fontWeight: 500, textDecoration: 'none' }}>Voir tout →</a>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>Chargement...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                  {['#', 'Adresse', 'Montant', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commandes.map(c => {
                  const badge = STATUT_BADGE[c.statut_commande] || STATUT_BADGE['en_attente'];
                  return (
                    <tr key={c.id_commande} style={{ borderBottom: '1px solid #F8F8F8' }}>
                      <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FF8C00', fontWeight: 700 }}>#{c.id_commande}</span></td>
                      <td style={tdStyle}>{c.adresse_livraison.length > 25 ? c.adresse_livraison.slice(0, 25) + '...' : c.adresse_livraison}</td>
                      <td style={tdStyle}><strong>{Number(c.montant_course).toLocaleString()} FCFA</strong></td>
                      <td style={tdStyle}>
                        <span style={{ ...badge.style, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                        {new Date(c.date_commande).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
                {commandes.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 14 }}>Aucune commande</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={cardTitleStyle}>Validations en attente</h3>
            <span style={{ background: '#FF8C00', color: 'white', width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {stats.coursiersEnAttente}
            </span>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>Chargement...</div>
          ) : coursiersAttente.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>✅ Aucune validation en attente</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {coursiersAttente.map(v => {
                const diff = Math.round((Date.now() - new Date(v.created_at).getTime()) / 3600000);
                const dateLabel = diff < 1 ? "Il y a moins d'1h" : `Il y a ${diff}h`;
                return (
                  <div key={v.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF8C00', fontWeight: 700, fontSize: 14 }}>
                        {v.nom_complet.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{v.nom_complet}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{v.telephone || '—'} · {v.type_document}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>Soumis {dateLabel}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleValider(v)} disabled={actionLoading === v.id} style={{ ...btnStyle, background: '#FF8C00', color: 'white', flex: 1, opacity: actionLoading === v.id ? 0.6 : 1 }}>
                        <CheckCircle size={14} /> Valider
                      </button>
                      <button onClick={() => handleRejeter(v)} disabled={actionLoading === v.id} style={{ ...btnStyle, background: '#FEE2E2', color: '#DC2626', flex: 1, opacity: actionLoading === v.id ? 0.6 : 1 }}>
                        Rejeter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <a href="/coursiers" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: '#FF8C00', textDecoration: 'none', fontWeight: 500 }}>
            Gérer tous les coursiers →
          </a>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties      = { background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0' };
const cardTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 12 };
const tdStyle: React.CSSProperties        = { padding: '12px 0', fontSize: 13, color: '#1A1A1A' };
const btnStyle: React.CSSProperties       = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' };