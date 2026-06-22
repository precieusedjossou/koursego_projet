// src/pages/CoursiersPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, X, Star, Bike, FileText, Camera, PauseCircle, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Coursier {
  id: string;
  statut_validation: string;
  disponibilite: boolean;
  type_document: string;
  numero_document: string | null;
  photo_document: string | null;
  photo_selfie: string | null;
  date_validation: string | null;
  nombre_courses: number;
  note_moyenne: number | null;
  solde: number | null;
  created_at: string;
  updated_at: string;
  nom_complet: string;
  email: string;
  telephone: string | null;
  photo_profil_url: string | null;
}

const VALIDATION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  approuve:   { label: 'Approuvé',   color: '#16A34A', bg: '#DCFCE7' },
  rejete:     { label: 'Rejeté',     color: '#DC2626', bg: '#FEE2E2' },
  suspendu:   { label: 'Suspendu',   color: '#6B7280', bg: '#F3F4F6' },
};

export default function CoursiersPage() {
  const [coursiers, setCoursiers]         = useState<Coursier[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filtreStatut, setFiltreStatut]   = useState('tous');
  const [selected, setSelected]           = useState<Coursier | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [motifRejet, setMotifRejet]       = useState('');
  const [showRejet, setShowRejet]         = useState(false);

  useEffect(() => { fetchCoursiers(); }, []);

  const fetchCoursiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coursier')
        .select(`
          id, statut_validation, disponibilite, type_document,
          numero_document, photo_document, photo_selfie,
          date_validation, nombre_courses, note_moyenne,
          solde, created_at, updated_at,
          utilisateurs (nom_complet, email, telephone, photo_profil_url)
        `)
        .order('created_at', { ascending: false });

      if (error) { console.error(error); return; }

      const formatted = (data || []).map((c: any) => ({
        ...c,
        nom_complet:      c.utilisateurs?.nom_complet || 'Inconnu',
        email:            c.utilisateurs?.email || '',
        telephone:        c.utilisateurs?.telephone || null,
        photo_profil_url: c.utilisateurs?.photo_profil_url || null,
      }));

      setCoursiers(formatted);
    } finally {
      setLoading(false);
    }
  };

  // Helper pour envoyer une notification
  const sendNotification = async (id_utilisateur: string, titre: string, message: string) => {
    await supabase.from('notification').insert({
      id_utilisateur,
      titre,
      message,
      type:              'systeme',
      type_notification: 'validation',
      is_read:           false,
    });
  };

  const handleValider = async (coursier: Coursier) => {
    setActionLoading(coursier.id);
    try {
      const { error } = await supabase
        .from('coursier')
        .update({ statut_validation: 'approuve', date_validation: new Date().toISOString() })
        .eq('id', coursier.id);

      if (error) { console.error(error); return; }

      await sendNotification(
        coursier.id,
        '✅ Compte approuvé !',
        'Félicitations ! Votre compte coursier a été validé. Vous pouvez maintenant accepter des courses.',
      );

      await supabase.from('utilisateurs').update({ mode: 'coursier' }).eq('id', coursier.id);

      setCoursiers(prev => prev.map(c => c.id === coursier.id ? { ...c, statut_validation: 'approuve', date_validation: new Date().toISOString() } : c));
      if (selected?.id === coursier.id) setSelected(prev => prev ? { ...prev, statut_validation: 'approuve' } : null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejeter = async (coursier: Coursier) => {
    if (!motifRejet.trim()) { alert('Veuillez indiquer un motif de rejet.'); return; }
    setActionLoading(coursier.id);
    try {
      const { error } = await supabase
        .from('coursier')
        .update({ statut_validation: 'rejete', date_validation: new Date().toISOString() })
        .eq('id', coursier.id);

      if (error) { console.error(error); return; }

      await sendNotification(
        coursier.id,
        '❌ Compte non approuvé',
        `Votre demande a été rejetée. Motif : ${motifRejet}`,
      );

      setCoursiers(prev => prev.map(c => c.id === coursier.id ? { ...c, statut_validation: 'rejete' } : c));
      if (selected?.id === coursier.id) setSelected(prev => prev ? { ...prev, statut_validation: 'rejete' } : null);
      setShowRejet(false);
      setMotifRejet('');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendre = async (coursier: Coursier) => {
    const estSuspendu   = coursier.statut_validation === 'suspendu';
    const nouveauStatut = estSuspendu ? 'approuve' : 'suspendu';
    setActionLoading(coursier.id);
    try {
      const { error } = await supabase
        .from('coursier')
        .update({ statut_validation: nouveauStatut })
        .eq('id', coursier.id);

      if (error) { console.error(error); return; }

      await sendNotification(
        coursier.id,
        estSuspendu ? '✅ Compte réactivé' : '⏸️ Compte suspendu',
        estSuspendu
          ? 'Votre compte coursier a été réactivé. Vous pouvez de nouveau accepter des courses.'
          : 'Votre compte coursier a été suspendu par un administrateur. Contactez le support.',
      );

      setCoursiers(prev => prev.map(c => c.id === coursier.id ? { ...c, statut_validation: nouveauStatut } : c));
      if (selected?.id === coursier.id) setSelected(prev => prev ? { ...prev, statut_validation: nouveauStatut } : null);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = coursiers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.nom_complet.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.telephone || '').includes(q);
    const matchStatut = filtreStatut === 'tous' || c.statut_validation === filtreStatut;
    return matchSearch && matchStatut;
  });

  const stats = [
    { label: 'Total',      val: coursiers.length,                                                       color: '#FF8C00' },
    { label: 'En attente', val: coursiers.filter(c => c.statut_validation === 'en_attente').length,     color: '#B45309' },
    { label: 'Approuvés',  val: coursiers.filter(c => c.statut_validation === 'approuve').length,       color: '#16A34A' },
    { label: 'Rejetés',    val: coursiers.filter(c => c.statut_validation === 'rejete').length,         color: '#DC2626' },
    { label: 'Suspendus',  val: coursiers.filter(c => c.statut_validation === 'suspendu').length,       color: '#6B7280' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Coursiers</h1>
        <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>Gérez et validez les comptes coursiers</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={miniCardStyle}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alertes en attente */}
      {coursiers.filter(c => c.statut_validation === 'en_attente').length > 0 && (
        <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 14, color: '#B45309', fontWeight: 600 }}>
            {coursiers.filter(c => c.statut_validation === 'en_attente').length} coursier(s) en attente de validation
          </span>
        </div>
      )}

      {/* Recherche + filtre */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un coursier..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={selectStyle}>
          <option value="tous">Tous</option>
          <option value="en_attente">En attente</option>
          <option value="approuve">Approuvés</option>
          <option value="rejete">Rejetés</option>
          <option value="suspendu">Suspendus</option>
        </select>
        <button onClick={fetchCoursiers} style={refreshBtnStyle}>🔄</button>
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
                  {['Coursier', 'Document', 'Courses', 'Note', 'Solde', 'Statut', 'Inscription', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const cfg = VALIDATION_CONFIG[c.statut_validation] || VALIDATION_CONFIG['en_attente'];
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={avatarStyle}>
                            {c.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nom_complet}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, color: '#374151' }}>{c.type_document}</span>
                        {c.numero_document && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.numero_document}</div>}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#FF8C00' }}>{c.nombre_courses}</td>
                      <td style={tdStyle}>
                        {c.note_moyenne ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <Star size={13} color="#F59E0B" fill="#F59E0B" /> {c.note_moyenne.toFixed(1)}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.solde ? `${Number(c.solde).toLocaleString()} F` : '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={iconBtnStyle} onClick={() => setSelected(c)} title="Voir dossier">
                            <Eye size={14} />
                          </button>
                          {c.statut_validation === 'approuve' && (
                            <button
                              style={{ ...iconBtnStyle, color: '#6B7280', borderColor: '#E5E7EB', background: '#F9FAFB' }}
                              onClick={async () => { setSelected(c); await handleSuspendre(c); }}
                              disabled={actionLoading === c.id}
                              title="Suspendre"
                            >
                              <PauseCircle size={14} />
                            </button>
                          )}
                          {c.statut_validation === 'suspendu' && (
                            <button
                              style={{ ...iconBtnStyle, color: '#16A34A', borderColor: '#DCFCE7', background: '#F0FDF4' }}
                              onClick={async () => { setSelected(c); await handleSuspendre(c); }}
                              disabled={actionLoading === c.id}
                              title="Réactiver"
                            >
                              <PlayCircle size={14} />
                            </button>
                          )}
                          {c.statut_validation === 'en_attente' && (
                            <>
                              <button
                                style={{ ...iconBtnStyle, color: '#16A34A', borderColor: '#DCFCE7', background: '#F0FDF4' }}
                                onClick={() => handleValider(c)}
                                disabled={actionLoading === c.id}
                                title="Approuver"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                style={{ ...iconBtnStyle, color: '#DC2626', borderColor: '#FEE2E2', background: '#FEF2F2' }}
                                onClick={() => { setSelected(c); setShowRejet(true); }}
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
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>Aucun coursier trouvé</div>
            )}
          </>
        )}
      </div>

      {/* Modal détail coursier */}
      {selected && (
        <div style={overlayStyle} onClick={() => { setSelected(null); setShowRejet(false); setMotifRejet(''); }}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Dossier coursier</h2>
              <button onClick={() => { setSelected(null); setShowRejet(false); }} style={closeBtnStyle}><X size={18} /></button>
            </div>

            {/* Identité */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: '#FFF8F0', borderRadius: 14, marginBottom: 16 }}>
              <div style={{ ...avatarStyle, width: 52, height: 52, fontSize: 18, borderRadius: 14 }}>
                {selected.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.nom_complet}</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>{selected.email}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{selected.telephone || '—'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  background: VALIDATION_CONFIG[selected.statut_validation]?.bg,
                  color: VALIDATION_CONFIG[selected.statut_validation]?.color,
                  padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>
                  {VALIDATION_CONFIG[selected.statut_validation]?.label}
                </span>
              </div>
            </div>

            {/* Stats coursier */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { icon: <Bike size={16} />, label: 'Courses', val: selected.nombre_courses },
                { icon: <Star size={16} color="#F59E0B" />, label: 'Note moy.', val: selected.note_moyenne ? selected.note_moyenne.toFixed(1) : '—' },
                { icon: <span style={{ fontSize: 16 }}>💰</span>, label: 'Solde', val: selected.solde ? `${Number(selected.solde).toLocaleString()} F` : '—' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ color: '#FF8C00', marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Document */}
            <div style={{ background: '#F8F9FA', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FileText size={15} color="#FF8C00" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Document d'identité</span>
              </div>
              <div style={{ fontSize: 13, color: '#374151' }}>
                <strong>Type :</strong> {selected.type_document}<br />
                <strong>Numéro :</strong> {selected.numero_document || '—'}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {selected.photo_document && (
                  <a href={selected.photo_document} target="_blank" rel="noreferrer" style={docLinkStyle}>
                    <Camera size={13} /> Photo document
                  </a>
                )}
                {selected.photo_selfie && (
                  <a href={selected.photo_selfie} target="_blank" rel="noreferrer" style={docLinkStyle}>
                    <Camera size={13} /> Selfie
                  </a>
                )}
                {!selected.photo_document && !selected.photo_selfie && (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Aucun document uploadé</span>
                )}
              </div>
            </div>

            {/* Motif rejet */}
            {showRejet && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Motif du rejet *
                </label>
                <textarea
                  value={motifRejet}
                  onChange={e => setMotifRejet(e.target.value)}
                  placeholder="Ex: Document illisible, selfie non conforme..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #FCA5A5', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#1A1A1A' }}
                />
              </div>
            )}

            {/* Actions modal */}
            {selected.statut_validation === 'approuve' && !showRejet && (
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => handleSuspendre(selected)}
                  disabled={actionLoading === selected.id}
                  style={{ width: '100%', padding: '12px', background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  ⏸️ Suspendre ce coursier
                </button>
              </div>
            )}
            {selected.statut_validation === 'suspendu' && (
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => handleSuspendre(selected)}
                  disabled={actionLoading === selected.id}
                  style={{ width: '100%', padding: '12px', background: '#DCFCE7', color: '#16A34A', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  ▶️ Réactiver ce coursier
                </button>
              </div>
            )}
            {selected.statut_validation === 'en_attente' && (
              <div style={{ display: 'flex', gap: 10 }}>
                {!showRejet ? (
                  <>
                    <button
                      onClick={() => handleValider(selected)}
                      disabled={actionLoading === selected.id}
                      style={{ flex: 1, padding: '12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✅ Approuver
                    </button>
                    <button
                      onClick={() => setShowRejet(true)}
                      style={{ flex: 1, padding: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ❌ Rejeter
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setShowRejet(false); setMotifRejet(''); }}
                      style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleRejeter(selected)}
                      disabled={actionLoading === selected.id || !motifRejet.trim()}
                      style={{ flex: 1, padding: '12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: !motifRejet.trim() ? 0.5 : 1 }}
                    >
                      Confirmer le rejet
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const miniCardStyle: React.CSSProperties    = { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties   = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties      = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties     = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const refreshBtnStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 16, background: 'white', cursor: 'pointer' };
const thStyle: React.CSSProperties         = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties         = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A' };
const avatarStyle: React.CSSProperties     = { width: 34, height: 34, borderRadius: 10, background: '#FFF3E0', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 };
const iconBtnStyle: React.CSSProperties    = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const overlayStyle: React.CSSProperties    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties      = { background: 'white', borderRadius: 20, padding: '28px', width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
const closeBtnStyle: React.CSSProperties   = { width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };
const docLinkStyle: React.CSSProperties    = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1D4ED8', background: '#DBEAFE', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 };