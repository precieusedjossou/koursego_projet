// src/pages/ParametresPage.tsx
import React, { useState } from 'react';
import { Save } from 'lucide-react';

export default function ParametresPage() {
  const [config, setConfig] = useState({
    commission_coursier_pct: 8,
    commission_plateforme_pct: 5,
    frais_livraison_base: 500,
    rayon_max_km: 20,
    delai_validation_h: 48,
    notif_sms: true,
    notif_email: true,
    maintenance: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Supabase update config table
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Field = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F0F0F0' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A' }}>Paramètres</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Configuration générale de la plateforme KourseGO</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: saved ? '#16A34A' : '#FF8C00',
            color: 'white', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.3s',
          }}
        >
          <Save size={16} />
          {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Commissions */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>💰 Commissions & Frais</h3>
          <Field label="Commission coursier (%)" desc="Pourcentage prélevé sur le montant des articles">
            <input
              type="number" min={0} max={50}
              value={config.commission_coursier_pct}
              onChange={(e) => setConfig({ ...config, commission_coursier_pct: +e.target.value })}
              style={numInputStyle}
            />
          </Field>
          <Field label="Commission plateforme (%)" desc="Revenus de la plateforme sur chaque commande">
            <input
              type="number" min={0} max={30}
              value={config.commission_plateforme_pct}
              onChange={(e) => setConfig({ ...config, commission_plateforme_pct: +e.target.value })}
              style={numInputStyle}
            />
          </Field>
          <Field label="Frais de livraison de base (FCFA)" desc="Frais minimum appliqués à chaque course">
            <input
              type="number" min={0} step={100}
              value={config.frais_livraison_base}
              onChange={(e) => setConfig({ ...config, frais_livraison_base: +e.target.value })}
              style={numInputStyle}
            />
          </Field>
        </div>

        {/* Opérations */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>⚙️ Opérations</h3>
          <Field label="Rayon max de livraison (km)" desc="Distance maximale acceptée pour une course">
            <input
              type="number" min={1} max={100}
              value={config.rayon_max_km}
              onChange={(e) => setConfig({ ...config, rayon_max_km: +e.target.value })}
              style={numInputStyle}
            />
          </Field>
          <Field label="Délai validation KYC (heures)" desc="Temps accordé pour valider un dossier coursier">
            <input
              type="number" min={1} max={168}
              value={config.delai_validation_h}
              onChange={(e) => setConfig({ ...config, delai_validation_h: +e.target.value })}
              style={numInputStyle}
            />
          </Field>
        </div>

        {/* Notifications */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>🔔 Notifications</h3>
          <Field label="Notifications SMS" desc="Envoi de SMS aux utilisateurs (OTP, alertes)">
            <Toggle value={config.notif_sms} onChange={(v) => setConfig({ ...config, notif_sms: v })} />
          </Field>
          <Field label="Notifications Email" desc="Envoi d'emails transactionnels">
            <Toggle value={config.notif_email} onChange={(v) => setConfig({ ...config, notif_email: v })} />
          </Field>
        </div>

        {/* Maintenance */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>🚧 Maintenance</h3>
          <Field label="Mode maintenance" desc="Désactive l'accès public à l'application">
            <Toggle
              value={config.maintenance}
              onChange={(v) => setConfig({ ...config, maintenance: v })}
              dangerColor
            />
          </Field>
          {config.maintenance && (
            <div style={{ background: '#FEE2E2', borderRadius: 10, padding: 14, marginTop: 12 }}>
              <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>⚠️ L'application est actuellement en maintenance.</p>
              <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Les utilisateurs ne peuvent pas se connecter.</p>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>Informations système</h4>
            {[
              { label: 'Version', val: 'v1.0.0' },
              { label: 'Environnement', val: 'Production' },
              { label: 'Base de données', val: 'Supabase (PostgreSQL)' },
              { label: 'Région', val: 'West Africa · Bénin 🇧🇯' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: i < 3 ? '1px solid #F0F0F0' : 'none' }}>
                <span style={{ color: '#6B7280' }}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, dangerColor = false }: { value: boolean; onChange: (v: boolean) => void; dangerColor?: boolean }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 26, borderRadius: 13,
        background: value ? (dangerColor ? '#DC2626' : '#FF8C00') : '#E5E7EB',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: value ? 25 : 3,
        width: 20, height: 20, borderRadius: 10,
        background: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #F0F0F0' };
const cardTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 };
const numInputStyle: React.CSSProperties = { width: 90, padding: '8px 12px', border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#1A1A1A', textAlign: 'center', outline: 'none' };
