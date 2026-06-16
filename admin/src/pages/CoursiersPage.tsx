// src/pages/CoursiersPage.tsx
import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Eye, Star, Wallet, ArrowUpRight, ShieldAlert, MessageSquare, Send, Users } from 'lucide-react';
import type { Livreur, StatutValidation } from '../types';

// Extension locale du type Livreur pour inclure la logique financière type "Gozem"
type LivreurFinancier = Livreur & {
  solde_portefeuille: number; // Positif (MoMo/Avance) ou Négatif (Dette accumulée sur le Cash)
  total_commissions_plateforme: number; // Gain cumulé généré pour la plateforme
};

const SEUIL_BLOCAGE = -5000; // Seuil critique au Bénin (5000 F FCFA de dette max)

const MOCK_LIVREURS: LivreurFinancier[] = [
  {
    id_livreur: 'l1', id_utilisateur: 'u4',
    utilisateur: { id_utilisateur: 'u4', nom: 'Elabidi', prenom: 'Moussa', email: 'moussa.e@koursego.bj', telephone: '+229 97 00 00 01', otp_verifie: true, date_inscription: '2024-12-01', statut_compte: 'actif', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'valide', disponibilite: true,
    type_document: 'CIP', numero_document: '1059483726',
    date_validation: '2024-12-10', note_moyenne: 4.8, nombre_courses: 248,
    solde_portefeuille: 3500, total_commissions_plateforme: 45000
  },
  {
    id_livreur: 'l2', id_utilisateur: 'u6',
    utilisateur: { id_utilisateur: 'u6', nom: 'Ativi', prenom: 'Nancy', email: 'nancy.a@gmail.com', telephone: '+229 96 55 44 33', otp_verifie: true, date_inscription: '2025-04-15', statut_compte: 'en_attente', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'en_attente', disponibilite: false,
    type_document: 'CIP', numero_document: '2039485761',
    solde_portefeuille: 0, total_commissions_plateforme: 0
  },
  {
    id_livreur: 'l3', id_utilisateur: 'u7',
    utilisateur: { id_utilisateur: 'u7', nom: 'Flavil', prenom: 'Jean', email: 'jean.f@gmail.com', telephone: '+229 97 11 22 33', otp_verifie: true, date_inscription: '2025-04-16', statut_compte: 'en_attente', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'en_attente', disponibilite: false,
    type_document: 'carte_identite', numero_document: '1029384756',
    solde_portefeuille: 0, total_commissions_plateforme: 0
  },
  {
    id_livreur: 'l4', id_utilisateur: 'u8',
    utilisateur: { id_utilisateur: 'u8', nom: 'Diallo', prenom: 'Roméo', email: 'romeo.d@gmail.com', telephone: '+229 96 99 88 77', otp_verifie: true, date_inscription: '2025-01-20', statut_compte: 'actif', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'valide', disponibilite: false,
    type_document: 'CIP', numero_document: '2068574930',
    date_validation: '2025-01-28', note_moyenne: 4.5, nombre_courses: 132,
    solde_portefeuille: -1200, total_commissions_plateforme: 18400
  },
  {
    id_livreur: 'l5', id_utilisateur: 'u9',
    utilisateur: { id_utilisateur: 'u9', nom: 'Hounsou', prenom: 'Léa', email: 'lea.h@gmail.com', telephone: '+229 97 44 55 66', otp_verifie: true, date_inscription: '2025-03-01', statut_compte: 'actif', role_actif: 'coursier', est_aussi_coursier: true },
    statut_validation: 'valide', disponibilite: false,
    type_document: 'carte_identite', numero_document: '1049583721',
    date_validation: '2025-03-05', note_moyenne: 3.9, nombre_courses: 95,
    solde_portefeuille: -5600, total_commissions_plateforme: 12000
  },
];

const VALIDATION_CONFIG: Record<StatutValidation, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#B45309', bg: '#FEF9C3' },
  valide:     { label: 'Validé',     color: '#16A34A', bg: '#DCFCE7' },
  rejete:     { label: 'Rejeté',     color: '#DC2626', bg: '#FEE2E2' },
};

export default function CoursiersPage() {
  const [search, setSearch] = useState('');
  const [filtreValidation, setFiltreValidation] = useState<StatutValidation | 'tous' | 'bloque_dette'>('tous');
  const [livreurs, setLivreurs] = useState<LivreurFinancier[]>(MOCK_LIVREURS);
  
  // États de sélection et d'ouverture des modals
  const [selected, setSelected] = useState<LivreurFinancier | null>(null);
  const [messageTarget, setMessageTarget] = useState<LivreurFinancier | 'all_filtered' | null>(null);
  
  // Formulaires
  const [montantRecharge, setMontantRecharge] = useState('');
  const [texteMessage, setTexteMessage] = useState('');
  const [canalEnvoi, setCanalEnvoi] = useState<'push' | 'sms'>('push');

  // Filtrage combiné (Recherche + Filtres de statuts / blocages financiers)
  const filtered = livreurs.filter((l) => {
    const u = l.utilisateur;
    if (!u) return false;
    const q = search.toLowerCase();
    const matchSearch = u.nom.toLowerCase().includes(q) || u.prenom.toLowerCase().includes(q) || u.telephone.includes(q) || l.numero_document.includes(q);
    
    let matchVal = false;
    if (filtreValidation === 'tous') matchVal = true;
    else if (filtreValidation === 'bloque_dette') matchVal = l.solde_portefeuille <= SEUIL_BLOCAGE;
    else matchVal = l.statut_validation === filtreValidation;

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

  const effectuerRechargement = (id: string) => {
    const montant = parseFloat(montantRecharge);
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez entrer un montant valide supérieur à 0 F.');
      return;
    }

    setLivreurs((prev) =>
      prev.map((l) => {
        if (l.id_livreur === id) {
          const nouveauLivreur = { ...l, solde_portefeuille: l.solde_portefeuille + montant };
          if (selected && selected.id_livreur === id) {
            setSelected(nouveauLivreur);
          }
          return nouveauLivreur;
        }
        return l;
      })
    );
    setMontantRecharge('');
    alert(`Le portefeuille a été rechargé de +${montant} FCFA avec succès !`);
  };

  // Logique d'envoi du message (Individuel ou Groupé)
  const envoyerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texteMessage.trim()) {
      alert('Veuillez saisir le contenu de votre message.');
      return;
    }

    if (messageTarget === 'all_filtered') {
      // Notification de masse sur la base des profils actuellement visibles à l'écran
      const destinataires = filtered.map(l => `${l.utilisateur?.prenom} (${l.utilisateur?.telephone})`);
      alert(`📢 Message groupé envoyé par ${canalEnvoi.toUpperCase()} à ${filtered.length} coursiers filtrés.\n\nContenu :\n"${texteMessage}"`);
    } else if (messageTarget) {
      // Envoi unique ciblé
      alert(`✉️ Message envoyé par ${canalEnvoi.toUpperCase()} à ${messageTarget.utilisateur?.prenom} ${messageTarget.utilisateur?.nom} (${messageTarget.utilisateur?.telephone}).\n\nContenu :\n"${texteMessage}"`);
    }

    // Reset formulaire messagerie
    setTexteMessage('');
    setMessageTarget(null);
  };

  // Pré-remplir un message type de rappel pour les dettes
  const appliquerTemplateDette = (prenom: string, solde: number) => {
    setTexteMessage(`Bonjour ${prenom}, votre portefeuille KourseGo présente un solde négatif de ${Math.abs(solde)} F. Veuillez recharger votre compte sous 24h pour éviter le blocage de vos courses. Merci.`);
  };

  const pending = livreurs.filter((l) => l.statut_validation === 'en_attente').length;
  const totalDettesCoursiers = livreurs.reduce((acc, l) => l.solde_portefeuille < 0 ? acc + Math.abs(l.solde_portefeuille) : acc, 0);
  const totalCommissionsGagnees = livreurs.reduce((acc, l) => acc + l.total_commissions_plateforme, 0);
  const nombreBloques = livreurs.filter((l) => l.solde_portefeuille <= SEUIL_BLOCAGE).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={h1Style}>Coursiers & Portefeuilles</h1>
          <p style={subtitleStyle}>Suivez la validation des documents, l'état des commissions et communiquez avec vos équipes.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Bouton d'envoi de notification de masse sur le filtre sélectionné */}
          <button 
            onClick={() => setMessageTarget('all_filtered')}
            style={{ ...actionBtnGlobalStyle, background: '#1F2937', color: 'white' }}
            disabled={filtered.length === 0}
          >
            <Users size={16} /> Notification groupée ({filtered.length})
          </button>
          
          {pending > 0 && (
            <div style={{ background: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E' }}>{pending} en attente</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cartes statistiques financières et opérationnelles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Coursiers', val: `${livreurs.length}`, color: '#1F2937' },
          { label: 'Commissions Engrangées', val: `${totalCommissionsGagnees.toLocaleString('fr-FR')} F`, color: '#16A34A' },
          { label: 'Dettes Cash à Recouvrer', val: `${totalDettesCoursiers.toLocaleString('fr-FR')} F`, color: '#DC2626' },
          { label: 'Bloqués (Seuil -5 000F)', val: `${nombreBloques}`, color: nombreBloques > 0 ? '#DC2626' : '#6B7280' },
        ].map((s, i) => (
          <div key={i} style={miniCardStyle}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barre de recherche et filtres complexes */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, téléphone ou N° NPI/CIP..." style={{ ...inputStyle, paddingLeft: 38 }} />
        </div>
        <select value={filtreValidation} onChange={(e) => setFiltreValidation(e.target.value as any)} style={selectStyle}>
          <option value="tous">Tous les profils</option>
          <option value="en_attente">En attente de validation</option>
          <option value="valide">Validés (Actifs)</option>
          <option value="rejete">Rejetés</option>
          <option value="bloque_dette">⛔ Bloqués pour dettes (&gt;5000F)</option>
        </select>
      </div>

      {/* Tableau principal des livreurs */}
      <div style={tableCardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['Coursier', 'Contact', 'Identité (NPI)', 'Note', 'Solde Portefeuille', 'Statut Gêné', 'Dispo', 'Actions'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const u = l.utilisateur!;
              const cfg = VALIDATION_CONFIG[l.statut_validation];
              const estBloquePourDette = l.solde_portefeuille <= SEUIL_BLOCAGE;

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
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{l.type_document}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{l.numero_document}</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Wallet size={14} color={l.solde_portefeuille >= 0 ? '#16A34A' : '#DC2626'} />
                      <span style={{ fontWeight: 700, color: l.solde_portefeuille >= 0 ? '#16A34A' : '#DC2626' }}>
                        {l.solde_portefeuille.toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {estBloquePourDette ? (
                      <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShieldAlert size={12} /> Bloqué (Dette)
                      </span>
                    ) : (
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                        {cfg.label}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: l.disponibilite && !estBloquePourDette ? '#16A34A' : '#9CA3AF' }}>
                      {l.disponibilite && !estBloquePourDette ? '🟢 En ligne' : '⚫ Off'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={iconBtnStyle} onClick={() => setSelected(l)} title="Portefeuille & profil"><Eye size={14} /></button>
                      
                      {/* Bouton pour envoyer un message direct au coursier */}
                      <button style={{ ...iconBtnStyle, color: '#2563EB', borderColor: '#DBEAFE' }} onClick={() => setMessageTarget(l)} title="Contacter le coursier"><MessageSquare size={14} /></button>
                      
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

      {/* MODAL 1 : Envoi de message (Individuel ou Groupé) */}
      {messageTarget && (
        <div style={modalBackdropStyle} onClick={() => setMessageTarget(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={20} color="#2563EB" /> 
              {messageTarget === 'all_filtered' ? 'Notification de masse' : 'Contacter le coursier'}
            </h2>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 18 }}>
              {messageTarget === 'all_filtered' 
                ? `Votre message sera transmis aux ${filtered.length} coursiers correspondant aux filtres actifs.` 
                : `Destinataire : ${messageTarget.utilisateur?.prenom} ${messageTarget.utilisateur?.nom} (${messageTarget.utilisateur?.telephone})`
              }
            </p>

            <form onSubmit={envoyerMessage}>
              {/* Choix du canal d'expédition */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Canal de communication</label>
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="canal" checked={canalEnvoi === 'push'} onChange={() => setCanalEnvoi('push')} /> Notification App (KourseGo)
                  </label>
                  <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="canal" checked={canalEnvoi === 'sms'} onChange={() => setCanalEnvoi('sms')} /> SMS Direct (Réseau MTN/Moov)
                  </label>
                </div>
              </div>

              {/* Raccourcis / Modèles de messages rapides pour l'admin */}
              {messageTarget !== 'all_filtered' && messageTarget.solde_portefeuille < 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Modèle rapide : </span>
                  <button 
                    type="button" 
                    onClick={() => appliquerTemplateDette(messageTarget.utilisateur!.prenom, messageTarget.solde_portefeuille)}
                    style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 11, padding: '2px 8px', borderRadius: 6, cursor: 'pointer', marginLeft: 4 }}
                  >
                    ⚠️ Alerte rappel de dette
                  </button>
                </div>
              )}

              {/* Zone d'écriture */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Contenu du message</label>
                <textarea 
                  rows={4} 
                  value={texteMessage}
                  onChange={(e) => setTexteMessage(e.target.value)}
                  placeholder="Écrivez votre message ici..." 
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', marginTop: 4, height: 100 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setMessageTarget(null)} style={{ ...btnBaseStyle, background: '#F3F4F6', color: '#374151', flex: 1 }}>
                  Annuler
                </button>
                <button type="submit" style={{ ...btnBaseStyle, background: '#2563EB', color: 'white', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Send size={14} /> Envoyer maintenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : Portefeuille & Validation (Détail existant) */}
      {selected && (
        <div style={modalBackdropStyle} onClick={() => setSelected(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Profil & Suivi Financier</h2>
              <button 
                onClick={() => { setSelected(null); setMessageTarget(selected); }}
                style={{ background: '#EFF6FF', border: 'none', color: '#2563EB', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <MessageSquare size={12} /> Écrire
              </button>
            </div>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>{selected.utilisateur?.prenom} {selected.utilisateur?.nom}</p>
            
            <div style={{ background: selected.solde_portefeuille >= 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${selected.solde_portefeuille >= 0 ? '#BBF7D0' : '#FCA5A5'}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: selected.solde_portefeuille >= 0 ? '#166534' : '#991B1B', fontWeight: 600 }}>SOLDE DU COMPTE</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: selected.solde_portefeuille >= 0 ? '#15803D' : '#DC2626', marginTop: 4 }}>
                    {selected.solde_portefeuille.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                {selected.solde_portefeuille <= SEUIL_BLOCAGE && (
                  <div style={{ background: '#DC2626', color: 'white', fontSize: 11, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                    🚨 ACCÈS AUX COURSES BLOQUÉ
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', marginTop: 14, paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Encaisser un paiement / Recharger le portefeuille</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Montant reçu (ex: 2000)" value={montantRecharge} onChange={(e) => setMontantRecharge(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} />
                  <button onClick={() => effectuerRechargement(selected.id_livreur)} style={{ background: '#1F2937', color: 'white', border: 'none', borderRadius: 10, padding: '0 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowUpRight size={14} /> Recharger
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Téléphone Bénin', val: selected.utilisateur?.telephone },
                { label: `Document (${selected.type_document})`, val: selected.numero_document },
                { label: 'Total Commissions Gozem', val: `${selected.total_commissions_plateforme.toLocaleString('fr-FR')} F` },
                { label: 'Nombre total de courses', val: `${selected.nombre_courses ?? 0} livraisons` },
                { label: 'OTP Code Vérifié', val: selected.utilisateur?.otp_verifie ? '✅ Oui' : '❌ Non' },
                { label: 'Statut du Dossier', val: VALIDATION_CONFIG[selected.statut_validation].label },
              ].map((item, i) => (
                <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{item.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {['Pièce d\'identité (Recto)', 'Selfie de contrôle'].map((label) => (
                <div key={label} style={{ background: '#F8F9FA', borderRadius: 10, height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, border: '2px dashed #E8E8E8' }}>
                  <span style={{ fontSize: 20 }}>🪪</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</span>
                </div>
              ))}
            </div>

            {selected.statut_validation === 'en_attente' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => valider(selected.id_livreur)} style={{ ...btnBaseStyle, background: '#16A34A', color: 'white', flex: 1 }}>
                  ✅ Valider et Activer
                </button>
                <button onClick={() => rejeter(selected.id_livreur)} style={{ ...btnBaseStyle, background: '#FEE2E2', color: '#DC2626', flex: 1 }}>
                  ❌ Rejeter dossier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Constantes de Styles CSS en JS
const h1Style: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#1A1A1A' };
const subtitleStyle: React.CSSProperties = { color: '#6B7280', fontSize: 14, marginTop: 4 };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#4B5563' };
const miniCardStyle: React.CSSProperties = { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const tableCardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: 'white', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: 10, fontSize: 13, background: 'white', color: '#1A1A1A', outline: 'none', cursor: 'pointer' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle: React.CSSProperties = { padding: '13px 8px', fontSize: 13, color: '#1A1A1A', verticalAlign: 'middle' };
const avatarStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: '#FFF3E0', color: '#FF8C00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 };
const iconBtnStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #E8E8E8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' };

const actionBtnGlobalStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnBaseStyle: React.CSSProperties = { padding: '12px', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 };

const modalBackdropStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
const modalContentStyle: React.CSSProperties = { background: 'white', borderRadius: 20, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' };