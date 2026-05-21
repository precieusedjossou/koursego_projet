// src/pages/CoursiersPage.tsx
// Branché Supabase — vraies données + validation + suspension + historique courses
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, Star, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase'; // adapte le chemin si besoin

// ── Types ────────────────────────────────────────────────────
type StatutValidation = 'en_attente' | 'approuve' | 'rejete';

interface Livreur {
  id_utilisateur: string;
  nom_complet: string;
  email: string;
  telephone: string;
  otp_verifie: boolean;
  date_inscription: string;
  statut_compte: string;
  // champs livreurs
  statut_validation: StatutValidation;
  disponibilite: boolean;
  type_document: string | null;
  numero_document: string | null;
  photo_document: string | null;
  photo_selfie: string | null;
  date_validation: string | null;
  note_moyenne: number;
  nombre_courses: number;
  type_vehicule: string | null;
  created_at: string;
}

interface CourseLivreur {
  id_course: number;
  statut_course: string;
  montant_total: number;
  created_at: string;
  adresse_livraison: string;
}

const VALIDATION_CONFIG: Record<StatutValidation, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  approuve:   { label: 'Validé',     color: '#16A34A', bg: '#DCFCE7' },
  rejete:     { label: 'Rejeté',     color: '#DC2626', bg: '#FEE2E2' },
};

const VEHICULE_LABEL: Record<string, string> = {
  moto: '🏍️ Moto', velo: '🚲 Vélo',
  voiture: '🚗 Voiture', pied: '🚶 À pied',
};

const getInitiales = (nom: string) => {
  const p = nom.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nom.slice(0, 2).toUpperCase();
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';

const formatHeure = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return formatDate(iso);
};

// ── Composant principal ──────────────────────────────────────
export default function CoursiersPage() {
  const [livreurs, setLivreurs]           = useState<Livreur[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filtreValidation, setFiltreValidation] = useState<StatutValidation | 'tous'>('tous');
  const [selected, setSelected]           = useState<Livreur | null>(null);
  const [coursesLivreur, setCoursesLivreur] = useState<CourseLivreur[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Stats globales
  const [stats, setStats] = useState({ total: 0, approuve: 0, en_attente: 0, rejete: 0 });

  useEffect(() => {
    loadLivreurs();

    // Realtime : écouter les nouvelles inscriptions livreurs
    const channel = supabase
      .channel('livreurs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'livreurs' }, () => {
        loadLivreurs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filtreValidation]);

  // ── Chargement livreurs ──────────────────────────────────
  const loadLivreurs = async () => {
    setLoading(true);
    try {
      // Requête 1 : livreurs sans jointure
      let queryL = supabase
        .from('livreurs')
        .select('id_utilisateur, statut_validation, disponibilite, type_document, numero_document, photo_document, photo_selfie, date_validation, note_moyenne, nombre_courses, created_at')
        .order('created_at', { ascending: false });

      if (filtreValidation !== 'tous') {
        queryL = queryL.eq('statut_validation', filtreValidation);
      }

      const { data: livrData, error } = await queryL;
      if (error) { console.error('Erreur livreurs:', error); return; }

      // Requête 2 : infos utilisateurs
      const ids = (livrData ?? []).map((l: any) => l.id_utilisateur).filter(Boolean);
      let usersMap: Record<string, any> = {};
      if (ids.length > 0) {
        const { data: usersData } = await supabase
          .from('utilisateurs')
          .select('id, nom_complet, email, telephone, otp_verifie, date_inscription, statut_compte')
          .in('id', ids);
        (usersData ?? []).forEach((u: any) => { usersMap[u.id] = u; });
      }

      const mapped: Livreur[] = (livrData ?? []).map((l: any) => {
        const u = usersMap[l.id_utilisateur] ?? {};
        return {
          id_utilisateur:   l.id_utilisateur,
          nom_complet:      u.nom_complet ?? 'Inconnu',
          email:            u.email ?? '',
          telephone:        u.telephone ?? '',
          otp_verifie:      u.otp_verifie ?? false,
          date_inscription: u.date_inscription ?? l.created_at,
          statut_compte:    u.statut_compte ?? 'en_attente',
          statut_validation: l.statut_validation as StatutValidation,
          disponibilite:    l.disponibilite ?? false,
          type_document:    l.type_document ?? null,
          numero_document:  l.numero_document ?? null,
          photo_document:   l.photo_document ?? null,
          photo_selfie:     l.photo_selfie ?? null,
          date_validation:  l.date_validation ?? null,
          note_moyenne:     Number(l.note_moyenne) || 0,
          nombre_courses:   l.nombre_courses ?? 0,
          type_vehicule:    null,
          created_at:       l.created_at,
        };
      });

      setLivreurs(mapped);
      setStats({
        total:      mapped.length,
        approuve:   mapped.filter((l) => l.statut_validation === 'approuve').length,
        en_attente: mapped.filter((l) => l.statut_validation === 'en_attente').length,
        rejete:     mapped.filter((l) => l.statut_validation === 'rejete').length,
      });

    } finally {
      setLoading(false);
    }
  };

  // ── Courses d'un livreur (pour le modal) ─────────────────
  const loadCoursesLivreur = async (id_utilisateur: string) => {
    setLoadingCourses(true);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id_course, statut_course, id_demande, created_at')
      .eq('id_livreur', id_utilisateur)
      .order('created_at', { ascending: false })
      .limit(10);

    if (coursesData && coursesData.length > 0) {
      const demandeIds = coursesData.map((c: any) => c.id_demande).filter(Boolean);
      let demandesMap: Record<number, any> = {};
      if (demandeIds.length > 0) {
        const { data: demandesData } = await supabase
          .from('demande_courses')
          .select('id_demande, montant_articles, commission_coursier, part_plateforme, adresse_livraison')
          .in('id_demande', demandeIds);
        (demandesData ?? []).forEach((d: any) => { demandesMap[d.id_demande] = d; });
      }
      const mapped: CourseLivreur[] = coursesData.map((c: any) => {
        const d = demandesMap[c.id_demande] ?? {};
        return {
          id_course: c.id_course,
          statut_course: c.statut_course,
          montant_total: (Number(d.montant_articles)||0) + (Number(d.commission_coursier)||0) + (Number(d.part_plateforme)||0),
          created_at: c.created_at,
          adresse_livraison: d.adresse_livraison ?? '—',
        };
      });
      setCoursesLivreur(mapped);
    } else {
      setCoursesLivreur([]);
    }
    setLoadingCourses(false);
  };

  const ouvrirModal = (l: Livreur) => {
    setSelected(l);
    setCoursesLivreur([]);
    loadCoursesLivreur(l.id_utilisateur);
  };

  // ── Actions ──────────────────────────────────────────────
  const valider = async (id_utilisateur: string) => {
    setActionLoading(id_utilisateur + '-valider');
    await supabase.from('livreurs').update({
      statut_validation: 'approuve',
      date_validation: new Date().toISOString(),
    }).eq('id_utilisateur', id_utilisateur);

    await supabase.from('utilisateurs').update({
      statut_compte: 'actif',
      mode_actuel: 'livreur',
    }).eq('id', id_utilisateur);

    setActionLoading(null);
    setSelected(null);
    loadLivreurs();
  };

  const rejeter = async (id_utilisateur: string) => {
    setActionLoading(id_utilisateur + '-rejeter');
    await supabase.from('livreurs').update({
      statut_validation: 'rejete',
    }).eq('id_utilisateur', id_utilisateur);

    await supabase.from('utilisateurs').update({
      statut_compte: 'suspendu',
    }).eq('id', id_utilisateur);

    setActionLoading(null);
    setSelected(null);
    loadLivreurs();
  };

  const toggleDisponibilite = async (id_utilisateur: string, actuelle: boolean) => {
    setActionLoading(id_utilisateur + '-dispo');
    await supabase.from('livreurs').update({
      disponibilite: !actuelle,
    }).eq('id_utilisateur', id_utilisateur);

    setLivreurs((prev) =>
      prev.map((l) => l.id_utilisateur === id_utilisateur
        ? { ...l, disponibilite: !actuelle }
        : l
      )
    );
    if (selected?.id_utilisateur === id_utilisateur) {
      setSelected((s) => s ? { ...s, disponibilite: !actuelle } : s);
    }
    setActionLoading(null);
  };

  const toggleSuspension = async (id_utilisateur: string, statutActuel: string) => {
    const nouveau = statutActuel === 'actif' ? 'suspendu' : 'actif';
    await supabase.from('utilisateurs').update({ statut_compte: nouveau }).eq('id', id_utilisateur);
    setLivreurs((prev) =>
      prev.map((l) => l.id_utilisateur === id_utilisateur ? { ...l, statut_compte: nouveau } : l)
    );
    if (selected?.id_utilisateur === id_utilisateur) {
      setSelected((s) => s ? { ...s, statut_compte: nouveau } : s);
    }
  };

  // ── Filtrage local (recherche) ───────────────────────────
  const filtered = livreurs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.nom_complet.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.telephone.includes(q)
    );
  });

  const pending = stats.en_attente;

  // ── STATUT COURSE badge ──────────────────────────────────
  const STATUT_COURSE: Record<string, { label: string; color: string }> = {
    en_attente: { label: 'En attente', color: '#B45309' },
    acceptee:   { label: 'Acceptée',   color: '#1D4ED8' },
    en_cours:   { label: 'En cours',   color: '#16A34A' },
    livree:     { label: 'Livrée',     color: '#FF8C00' },
    annulee:    { label: 'Annulée',    color: '#DC2626' },
  };

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>Coursiers</h1>
          <p style={subtitleStyle}>Validez les demandes et gérez les profils coursiers</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {pending > 0 && (
            <div style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E' }}>{pending} validation(s) en attente</div>
                <div style={{ fontSize: 12, color: '#B45309' }}>Nécessitent une action</div>
              </div>
            </div>
          )}
          <button onClick={loadLivreurs} style={refreshBtn} title="Actualiser">
            <RefreshCw size={16} color="#6B7280" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total coursiers', val: stats.total,      color: '#FF8C00' },
          { label: 'Validés',         val: stats.approuve,   color: '#16A34A' },
          { label: 'En attente',      val: stats.en_attente, color: '#B45309' },
          { label: 'Rejetés',         val: stats.rejete,     color: '#DC2626' },
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
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un coursier..."
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <select
          value={filtreValidation}
          onChange={(e) => { setFiltreValidation(e.target.value as any); }}
          style={selectStyle}
        >
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="approuve">Validés</option>
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
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} style={tdStyle}>
                      <div style={{ height: 13, borderRadius: 6, background: '#F0F0F0', width: j === 0 ? 140 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
                  Aucun coursier trouvé
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const cfg = VALIDATION_CONFIG[l.statut_validation];
                return (
                  <tr
                    key={l.id_utilisateur}
                    style={{
                      borderBottom: '1px solid #F8F8F8',
                      background: l.statut_validation === 'en_attente' ? '#FFFDF5' : 'transparent',
                    }}
                  >
                    {/* Nom */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={avatarStyle}>{getInitiales(l.nom_complet)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{l.nom_complet}</div>
                          {l.type_vehicule && (
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                              {VEHICULE_LABEL[l.type_vehicule] ?? l.type_vehicule}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12 }}>{l.email}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{l.telephone || '—'}</div>
                    </td>
                    {/* Document */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        {l.type_document === 'CIP' ? 'Carte CIP'
                          : l.type_document === 'carte_identite' ? 'CNI'
                          : l.type_document ?? '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{l.numero_document ?? '—'}</div>
                    </td>
                    {/* Note */}
                    <td style={tdStyle}>
                      {l.note_moyenne > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={13} fill="#FF8C00" color="#FF8C00" />
                          <span style={{ fontWeight: 600 }}>{l.note_moyenne.toFixed(1)}</span>
                        </div>
                      ) : <span style={{ color: '#9CA3AF' }}>—</span>}
                    </td>
                    {/* Nb courses */}
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{l.nombre_courses}</span>
                    </td>
                    {/* Statut validation */}
                    <td style={tdStyle}>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {cfg.label}
                      </span>
                    </td>
                    {/* Disponibilité */}
                    <td style={tdStyle}>
                      <button
                        onClick={() => toggleDisponibilite(l.id_utilisateur, l.disponibilite)}
                        disabled={actionLoading === l.id_utilisateur + '-dispo'}
                        style={{
                          fontSize: 12, fontWeight: 500,
                          color: l.disponibilite ? '#16A34A' : '#9CA3AF',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        }}
                      >
                        {l.disponibilite ? '🟢 Oui' : '⚫ Non'}
                      </button>
                    </td>
                    {/* Actions */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={iconBtnStyle} onClick={() => ouvrirModal(l)} title="Voir le dossier">
                          <Eye size={14} />
                        </button>
                        {l.statut_validation === 'en_attente' && (
                          <>
                            <button
                              style={{ ...iconBtnStyle, color: '#16A34A', borderColor: '#DCFCE7' }}
                              onClick={() => valider(l.id_utilisateur)}
                              disabled={actionLoading === l.id_utilisateur + '-valider'}
                              title="Valider"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              style={{ ...iconBtnStyle, color: '#DC2626', borderColor: '#FEE2E2' }}
                              onClick={() => rejeter(l.id_utilisateur)}
                              disabled={actionLoading === l.id_utilisateur + '-rejeter'}
                              title="Rejeter"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL DOSSIER COURSIER ───────────────────────────── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: 'white', borderRadius: 20, padding: 32, width: 560, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ ...avatarStyle, width: 48, height: 48, fontSize: 16, borderRadius: 14 }}>
                  {getInitiales(selected.nom_complet)}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selected.nom_complet}</h2>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                    Inscrit le {formatDate(selected.date_inscription)}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ ...iconBtnStyle, fontSize: 18 }}>✕</button>
            </div>

            {/* Infos principales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Email',           val: selected.email },
                { label: 'Téléphone',       val: selected.telephone || '—' },
                { label: 'Type document',   val: selected.type_document ?? '—' },
                { label: 'N° document',     val: selected.numero_document ?? '—' },
                { label: 'Véhicule',        val: selected.type_vehicule ? (VEHICULE_LABEL[selected.type_vehicule] ?? selected.type_vehicule) : '—' },
                { label: 'OTP vérifié',     val: selected.otp_verifie ? '✅ Oui' : '❌ Non' },
                { label: 'Note moyenne',    val: selected.note_moyenne > 0 ? `⭐ ${selected.note_moyenne.toFixed(1)}/5` : '—' },
                { label: 'Courses totales', val: `${selected.nombre_courses} courses` },
                { label: 'Statut validation', val: VALIDATION_CONFIG[selected.statut_validation].label },
                { label: 'Date validation', val: formatDate(selected.date_validation) },
              ].map((item, i) => (
                <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Documents */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>Documents soumis</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Photo document', url: selected.photo_document },
                  { label: 'Selfie vérification', url: selected.photo_selfie },
                ].map((doc) => (
                  <div
                    key={doc.label}
                    style={{ borderRadius: 10, overflow: 'hidden', border: '2px dashed #E8E8E8', height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F8F9FA' }}
                  >
                    {doc.url ? (
                      <img
                        src={doc.url}
                        alt={doc.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(doc.url!, '_blank')}
                      />
                    ) : (
                      <>
                        <span style={{ fontSize: 28 }}>🪪</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{doc.label}</span>
                        <span style={{ fontSize: 10, color: '#D1D5DB' }}>Non fourni</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Historique des 10 dernières courses */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>
                Dernières courses
              </div>
              {loadingCourses ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>Chargement...</div>
              ) : coursesLivreur.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>Aucune course effectuée</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coursesLivreur.map((c) => {
                    const sc = STATUT_COURSE[c.statut_course] ?? { label: c.statut_course, color: '#9CA3AF' };
                    return (
                      <div
                        key={c.id_course}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F8F9FA', borderRadius: 10 }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            #{c.id_course} — {c.adresse_livraison}
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                            {formatHeure(c.created_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>
                            {c.montant_total > 0 ? `${c.montant_total.toLocaleString('fr-FR')} FCFA` : '—'}
                          </span>
                          <span style={{ fontSize: 11, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Valider / Rejeter si en attente */}
              {selected.statut_validation === 'en_attente' && (
                <>
                  <button
                    onClick={() => valider(selected.id_utilisateur)}
                    disabled={actionLoading === selected.id_utilisateur + '-valider'}
                    style={{ flex: 1, padding: '12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, minWidth: 140 }}
                  >
                    {actionLoading === selected.id_utilisateur + '-valider' ? '...' : '✅ Valider'}
                  </button>
                  <button
                    onClick={() => rejeter(selected.id_utilisateur)}
                    disabled={actionLoading === selected.id_utilisateur + '-rejeter'}
                    style={{ flex: 1, padding: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, minWidth: 140 }}
                  >
                    {actionLoading === selected.id_utilisateur + '-rejeter' ? '...' : '❌ Rejeter'}
                  </button>
                </>
              )}

              {/* Suspendre / Réactiver */}
              {selected.statut_validation === 'approuve' && (
                <button
                  onClick={() => toggleSuspension(selected.id_utilisateur, selected.statut_compte)}
                  style={{
                    flex: 1, padding: '12px', border: 'none', borderRadius: 10,
                    fontWeight: 700, cursor: 'pointer', fontSize: 14,
                    background: selected.statut_compte === 'actif' ? '#FEE2E2' : '#DCFCE7',
                    color: selected.statut_compte === 'actif' ? '#DC2626' : '#16A34A',
                    minWidth: 160,
                  }}
                >
                  {selected.statut_compte === 'actif' ? '🚫 Suspendre le compte' : '✅ Réactiver le compte'}
                </button>
              )}

              {/* Toggle disponibilité */}
              {selected.statut_validation === 'approuve' && (
                <button
                  onClick={() => toggleDisponibilite(selected.id_utilisateur, selected.disponibilite)}
                  disabled={actionLoading === selected.id_utilisateur + '-dispo'}
                  style={{
                    flex: 1, padding: '12px', border: '1.5px solid #E8E8E8', borderRadius: 10,
                    fontWeight: 600, cursor: 'pointer', fontSize: 13, background: 'white',
                    color: '#374151', minWidth: 160,
                  }}
                >
                  {selected.disponibilite ? '⚫ Marquer indisponible' : '🟢 Marquer disponible'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────
const h1Style: React.CSSProperties      = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties   = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties  = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties      = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties      = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
const avatarStyle: React.CSSProperties  = { width: 34, height: 34, borderRadius: 10, background: '#FFF3E0', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 };
const iconBtnStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const refreshBtn: React.CSSProperties   = { width: 36, height: 36, borderRadius: 10, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };