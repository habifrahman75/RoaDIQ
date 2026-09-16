/**
 * src/components/Sidebar.jsx
 * Role-based sidebar: different nav for authority vs contributor.
 */
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, FileText, AlertTriangle, Wrench, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight, Activity, X, Plus, Heart,
  RefreshCw, BarChart2, Bell, User, Navigation, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AUTHORITY_NAV = [
  { label: 'Overview', items: [
    { path: '/authority/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/authority/map',       label: 'Live Map',  icon: Map },
    { path: '/authority/analytics', label: 'Analytics', icon: BarChart2 },
  ]},
  { label: 'Intelligence', items: [
    { path: '/authority/roads',     label: 'Road Intelligence', icon: Navigation },
    { path: '/authority/recurring', label: 'Recurring Damage',  icon: RefreshCw },
    { path: '/authority/priority',  label: 'Priority Queue',    icon: AlertTriangle },
  ]},
  { label: 'Reports & Repairs', items: [
    { path: '/authority/reports',       label: 'Reports',      icon: FileText },
    { path: '/authority/repairs',       label: 'Repairs',      icon: Wrench },
    { path: '/authority/verification',  label: 'Verification', icon: ShieldCheck },
  ]},
  { label: 'System', items: [
    { path: '/authority/notifications', label: 'Notifications', icon: Bell },
  ]},
];

const CONTRIBUTOR_NAV = [
  { label: 'Home', items: [
    { path: '/contributor/dashboard',      label: 'Overview',      icon: LayoutDashboard },
    { path: '/contributor/report',         label: 'Report Damage', icon: Plus },
  ]},
  { label: 'My Reports', items: [
    { path: '/contributor/reports',        label: 'My Reports',    icon: FileText },
    { path: '/contributor/impact',         label: 'My Impact',     icon: Star },
  ]},
  { label: 'System', items: [
    { path: '/contributor/notifications',  label: 'Notifications', icon: Bell },
  ]},
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { logout, user, isAuthority } = useAuth();
  const location = useLocation();

  const navSections = isAuthority ? AUTHORITY_NAV : CONTRIBUTOR_NAV;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} aria-hidden="true" />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Activity size={20} color="#fff" /></div>
          {!collapsed && <span className="sidebar-logo-text">RoadIQ</span>}
          <button onClick={onMobileClose} className="btn-icon" style={{ marginLeft: 'auto', display: 'none' }} id="sidebar-mobile-close" aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && user && (
          <div style={{ padding: '6px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
              color: isAuthority ? '#06b6d4' : '#10b981',
              background: isAuthority ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)',
              padding: '2px 10px', borderRadius: 99,
              border: `1px solid ${isAuthority ? 'rgba(6,182,212,0.25)' : 'rgba(16,185,129,0.25)'}`,
            }}>
              {isAuthority ? 'AUTHORITY' : 'CONTRIBUTOR'}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path || (path !== '/authority/dashboard' && path !== '/contributor/dashboard' && location.pathname.startsWith(path));
                return (
                  <NavLink key={path} to={path} className={`nav-item ${isActive ? 'active' : ''}`} title={collapsed ? label : undefined} onClick={onMobileClose}>
                    <Icon className="nav-item-icon" />
                    <span className="nav-item-label">{label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${isAuthority ? '#3b82f6' : '#10b981'}, ${isAuthority ? '#06b6d4' : '#06b6d4'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                {user.name?.charAt(0) || 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.department || user.email}</p>
              </div>
            </div>
          )}
          <button className="nav-item" onClick={handleLogout} title={collapsed ? 'Logout' : undefined} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <LogOut className="nav-item-icon" size={18} />
            <span className="nav-item-label">Logout</span>
          </button>
          <button className="nav-item" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'none' }} id="sidebar-toggle">
            {collapsed ? <ChevronRight className="nav-item-icon" size={18} /> : <ChevronLeft className="nav-item-icon" size={18} />}
            <span className="nav-item-label">{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>

      <button onClick={onToggle} aria-label="Toggle sidebar" style={{ position: 'fixed', left: collapsed ? 'calc(var(--sidebar-collapsed) - 12px)' : 'calc(var(--sidebar-width) - 12px)', top: 'calc(var(--navbar-height) + 24px)', zIndex: 41, width: 24, height: 24, borderRadius: '50%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'left var(--transition)', color: 'var(--color-text-muted)' }} className="sidebar-toggle-btn">
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar-toggle-btn { display: none !important; }
          #sidebar-mobile-close { display: flex !important; }
        }
        @media (min-width: 1025px) {
          #sidebar-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
