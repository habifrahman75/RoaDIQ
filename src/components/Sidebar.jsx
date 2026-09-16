/**
 * src/components/Sidebar.jsx
 *
 * Responsive sidebar with:
 *   - Collapsible on desktop (icon-only mode)
 *   - Drawer on mobile (slides in from left)
 *   - Active route highlighting
 */
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, FileText, AlertTriangle,
  Wrench, ShieldCheck, LogOut, ChevronLeft, ChevronRight,
  Activity, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
      { path: '/map',           label: 'Live Map',     icon: Map             },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/reports',       label: 'All Reports',  icon: FileText        },
      { path: '/priority',      label: 'Priority Queue', icon: AlertTriangle },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/repairs',       label: 'Repair Queue', icon: Wrench          },
      { path: '/verification',  label: 'Verification', icon: ShieldCheck     },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={20} color="#fff" />
          </div>
          {!collapsed && (
            <span className="sidebar-logo-text">RoadIQ</span>
          )}
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="btn-icon"
            style={{ marginLeft: 'auto', display: 'none' }}
            id="sidebar-mobile-close"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path ||
                  (path !== '/dashboard' && location.pathname.startsWith(path));
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? label : undefined}
                    onClick={onMobileClose}
                  >
                    <Icon className="nav-item-icon" />
                    <span className="nav-item-label">{label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: User info + collapse toggle */}
        <div className="sidebar-footer">
          {/* User info */}
          {!collapsed && user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 8,
            }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {user.name?.charAt(0) || 'A'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.role}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            className="nav-item"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
          >
            <LogOut className="nav-item-icon" size={18} />
            <span className="nav-item-label">Logout</span>
          </button>

          {/* Desktop collapse toggle */}
          <button
            className="nav-item"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              display: 'none', /* shown via CSS on lg+ */
            }}
            id="sidebar-toggle"
          >
            {collapsed
              ? <ChevronRight className="nav-item-icon" size={18} />
              : <ChevronLeft className="nav-item-icon" size={18} />
            }
            <span className="nav-item-label">{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
        </div>
      </aside>

      {/* Desktop collapse toggle button (shown via inline style) */}
      <button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        style={{
          position: 'fixed',
          left: collapsed ? 'calc(var(--sidebar-collapsed) - 12px)' : 'calc(var(--sidebar-width) - 12px)',
          top: 'calc(var(--navbar-height) + 24px)',
          zIndex: 41,
          width: 24, height: 24,
          borderRadius: '50%',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'left var(--transition)',
          color: 'var(--color-text-muted)',
        }}
        className="sidebar-toggle-btn"
      >
        {collapsed
          ? <ChevronRight size={13} />
          : <ChevronLeft size={13} />
        }
      </button>

      {/* Hide toggle button on mobile */}
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
