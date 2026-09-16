/**
 * src/components/Navbar.jsx
 * Top navigation bar — role-aware, with page title and notification link.
 */
import { useLocation, Link } from 'react-router-dom';
import { Menu, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROUTE_LABELS = {
  '/authority/dashboard':    'Dashboard',
  '/authority/map':          'Live Map',
  '/authority/reports':      'Reports',
  '/authority/priority':     'Priority Queue',
  '/authority/repairs':      'Repair Management',
  '/authority/verification': 'Repair Verification',
  '/authority/roads':        'Road Intelligence',
  '/authority/recurring':    'Recurring Damage',
  '/authority/analytics':    'Analytics',
  '/authority/notifications':'Notifications',
  '/contributor/dashboard':  'Overview',
  '/contributor/report':     'Report Damage',
  '/contributor/reports':    'My Reports',
  '/contributor/impact':     'My Impact',
  '/contributor/notifications': 'Notifications',
};

export default function Navbar({ sidebarCollapsed, onMobileMenuOpen, onRefresh, loading }) {
  const location = useLocation();
  const { user, isAuthority } = useAuth();

  const matched = Object.entries(ROUTE_LABELS).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  );
  const pageTitle = matched?.[1] || 'RoadIQ';
  const notifPath = isAuthority ? '/authority/notifications' : '/contributor/notifications';

  return (
    <header className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left: hamburger + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn-icon" onClick={onMobileMenuOpen} aria-label="Open menu" style={{ display: 'none' }} id="hamburger-btn">
          <Menu size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2 }}>{pageTitle}</h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
            {isAuthority ? 'Road Intelligence Platform' : 'Citizen Road Reporter'}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {import.meta.env.VITE_USE_MOCK === 'true' && (
          <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.65rem' }}>
            DEMO
          </span>
        )}
        <button className="btn-icon" onClick={onRefresh} aria-label="Refresh data" disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        <Link to={notifPath} className="btn-icon" aria-label="Notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          <Bell size={16} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--color-danger)', border: '1.5px solid var(--color-bg-surface)' }} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span className="dot-live pulse-dot" />
          <span style={{ display: 'none' }} id="live-label">Live</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          #hamburger-btn { display: flex !important; }
          #live-label { display: inline !important; }
        }
      `}</style>
    </header>
  );
}
