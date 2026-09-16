/**
 * src/components/Navbar.jsx
 * Top navigation bar with breadcrumbs, notifications placeholder, and hamburger.
 */
import { useLocation } from 'react-router-dom';
import { Menu, Bell, RefreshCw } from 'lucide-react';

const ROUTE_LABELS = {
  '/dashboard':    'Dashboard',
  '/map':          'Live Map',
  '/reports':      'Reports',
  '/priority':     'Priority Queue',
  '/repairs':      'Repair Management',
  '/verification': 'Repair Verification',
};

export default function Navbar({ sidebarCollapsed, onMobileMenuOpen, onRefresh, loading }) {
  const location = useLocation();
  const matched = Object.entries(ROUTE_LABELS).find(([path]) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
  );
  const pageTitle = matched?.[1] || 'RoadIQ';

  return (
    <header
      className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      {/* Left: hamburger + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Hamburger — only visible on mobile */}
        <button
          className="btn-icon"
          onClick={onMobileMenuOpen}
          aria-label="Open menu"
          style={{ display: 'none' }}
          id="hamburger-btn"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2 }}>{pageTitle}</h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
            Road Health Intelligence Platform
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Mock indicator */}
        {import.meta.env.VITE_USE_MOCK === 'true' && (
          <span className="badge" style={{
            background: 'rgba(245,158,11,0.15)',
            color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.3)',
            fontSize: '0.65rem',
          }}>
            MOCK MODE
          </span>
        )}

        {/* Refresh */}
        <button
          className="btn-icon"
          onClick={onRefresh}
          aria-label="Refresh data"
          title="Refresh data"
          disabled={loading}
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        {/* Notifications (placeholder) */}
        <button className="btn-icon" aria-label="Notifications" style={{ position: 'relative' }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'var(--color-danger)',
            border: '1.5px solid var(--color-bg-surface)',
          }} />
        </button>

        {/* Live indicator */}
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
