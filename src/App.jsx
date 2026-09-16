/**
 * src/App.jsx
 * Root application component — sets up routing, layout shell, and auth guard.
 */
import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar  from './components/Navbar';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import MapPage      from './pages/Map';
import Reports      from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Priority     from './pages/Priority';
import Repairs      from './pages/Repairs';
import Verification from './pages/Verification';

// ── Protected Layout ──────────────────────────────────────────────────────────
function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [refreshKey,       setRefreshKey]        = useState(0);
  const [refreshLoading,   setRefreshLoading]    = useState(false);

  const toggleSidebar    = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const openMobileMenu   = useCallback(() => setMobileOpen(true),  []);
  const closeMobileMenu  = useCallback(() => setMobileOpen(false), []);

  const handleRefresh = useCallback(async () => {
    setRefreshLoading(true);
    setRefreshKey((k) => k + 1); // triggers re-render of page
    setTimeout(() => setRefreshLoading(false), 600);
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileMenu}
      />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuOpen={openMobileMenu}
          onRefresh={handleRefresh}
          loading={refreshLoading}
        />
        {/* key prop forces child remount on refresh */}
        <div key={refreshKey}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedLayout />}>
            <Route index                 element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/map"           element={<MapPage />} />
            <Route path="/reports"       element={<Reports />} />
            <Route path="/reports/:id"   element={<ReportDetail />} />
            <Route path="/priority"      element={<Priority />} />
            <Route path="/repairs"       element={<Repairs />} />
            <Route path="/verification"  element={<Verification />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--color-bg-elevated)',
            color:      'var(--color-text-primary)',
            border:     '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize:   '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
