// src/components/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bike, ShoppingBag,
  CreditCard, Settings, LogOut, Menu, X, Bell,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',   label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
  { path: '/utilisateurs', label: 'Utilisateurs',  icon: <Users size={18} /> },
  { path: '/coursiers',   label: 'Coursiers',     icon: <Bike size={18} /> },
  { path: '/commandes',   label: 'Commandes',     icon: <ShoppingBag size={18} /> },
  { path: '/paiements',   label: 'Paiements',     icon: <CreditCard size={18} /> },
  { path: '/parametres',  label: 'Paramètres',    icon: <Settings size={18} /> },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8F9FA' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 64,
        background: '#1A1A1A',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#FF8C00', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>K</span>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 16, lineHeight: 1 }}>KourseGO</div>
              <div style={{ color: '#FF8C00', fontSize: 11, marginTop: 2 }}>Administration</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 4,
                textDecoration: 'none',
                color: isActive ? '#FF8C00' : 'rgba(255,255,255,0.65)',
                background: isActive ? 'rgba(255,140,0,0.15)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px',
              borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: 14,
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Déconnecter</span>}
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E8E8E8',
          padding: '0 24px',
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', position: 'relative', padding: 4 }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: 8, height: 8, borderRadius: 4,
                background: '#FF8C00', border: '2px solid white',
              }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 17,
                background: '#FFF3E0', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FF8C00' }}>A</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
