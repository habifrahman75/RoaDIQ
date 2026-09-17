/**
 * src/App.jsx
 * Role-based routing: /authority/* and /contributor/*
 */
import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar  from './components/Navbar';

import Login              from './pages/Login';

// Authority pages
import AuthDashboard      from './pages/authority/Dashboard';
import AuthMap            from './pages/authority/Map';
import AuthReports        from './pages/authority/Reports';
import AuthReportDetail   from './pages/authority/ReportDetail';
import AuthPriority       from './pages/authority/Priority';
import AuthRepairs        from './pages/authority/Repairs';
import AuthVerification   from './pages/authority/Verification';
import AuthRoadIntelligence from './pages/authority/RoadIntelligence';
import AuthRoadDetail     from './pages/authority/RoadDetail';
import AuthRecurring      from './pages/authority/RecurringDamage';
import AuthAnalytics      from './pages/authority/Analytics';
import AuthNotifications  from './pages/authority/Notifications';

// Contributor pages
import ContribDashboard   from './pages/contributor/Dashboard';
import ContribReport      from './pages/contributor/ReportForm';
import ContribReports     from './pages/contributor/MyReports';
import ContribImpact      from './pages/contributor/Impact';
import ContribNotifications from './pages/contributor/Notifications';

// ── Role → Dashboard helper ───────────────────────────────────────────────────
/** Returns the home route for a canonical role, or /login for unknown. */
function roleDashboard(role) {
  if (role === 'authority')   return '/authority/dashboard';
  if (role === 'contributor') return '/contributor/dashboard';
  return '/login';
}

// ── Protected Layout ──────────────────────────────────────────────────────────
function ProtectedLayout({ requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [refreshKey,       setRefreshKey]        = useState(0);
  const [refreshLoading,   setRefreshLoading]    = useState(false);

  const toggleSidebar   = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const openMobileMenu  = useCallback(() => setMobileOpen(true),  []);
  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  const handleRefresh = useCallback(async () => {
    setRefreshLoading(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshLoading(false), 600);
  }, []);

  // Not logged in → /login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Unknown / null role → /login (prevents blank screen)
  const userRole = user?.role;
  if (!userRole || (userRole !== 'authority' && userRole !== 'contributor')) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → redirect to their own dashboard
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={roleDashboard(userRole)} replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} mobileOpen={mobileOpen} onMobileClose={closeMobileMenu} />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar sidebarCollapsed={sidebarCollapsed} onMobileMenuOpen={openMobileMenu} onRefresh={handleRefresh} loading={refreshLoading} />
        <div key={refreshKey}><Outlet /></div>
      </main>
    </div>
  );
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  // No session → /login
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Unknown role → /login (never blank screen)
  const dest = roleDashboard(user?.role);
  return <Navigate to={dest} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Root redirect */}
          <Route index element={<RootRedirect />} />

          {/* Authority routes */}
          <Route element={<ProtectedLayout requiredRole="authority" />}>
            <Route path="/authority" element={<Navigate to="/authority/dashboard" replace />} />
            <Route path="/authority/dashboard"    element={<AuthDashboard />} />
            <Route path="/authority/map"          element={<AuthMap />} />
            <Route path="/authority/reports"      element={<AuthReports />} />
            <Route path="/authority/reports/:id"  element={<AuthReportDetail />} />
            <Route path="/authority/priority"     element={<AuthPriority />} />
            <Route path="/authority/repairs"      element={<AuthRepairs />} />
            <Route path="/authority/verification" element={<AuthVerification />} />
            <Route path="/authority/roads"        element={<AuthRoadIntelligence />} />
            <Route path="/authority/roads/:id"    element={<AuthRoadDetail />} />
            <Route path="/authority/recurring"    element={<AuthRecurring />} />
            <Route path="/authority/analytics"    element={<AuthAnalytics />} />
            <Route path="/authority/notifications" element={<AuthNotifications />} />
          </Route>

          {/* Contributor routes */}
          <Route element={<ProtectedLayout requiredRole="contributor" />}>
            <Route path="/contributor" element={<Navigate to="/contributor/dashboard" replace />} />
            <Route path="/contributor/dashboard"     element={<ContribDashboard />} />
            <Route path="/contributor/report"        element={<ContribReport />} />
            <Route path="/contributor/reports"       element={<ContribReports />} />
            <Route path="/contributor/reports/:id"   element={<ContribReports />} />
            <Route path="/contributor/impact"        element={<ContribImpact />} />
            <Route path="/contributor/notifications" element={<ContribNotifications />} />
          </Route>

          {/* Legacy redirects for old routes */}
          <Route path="/dashboard"    element={<Navigate to="/authority/dashboard" replace />} />
          <Route path="/map"          element={<Navigate to="/authority/map" replace />} />
          <Route path="/reports"      element={<Navigate to="/authority/reports" replace />} />
          <Route path="/reports/:id"  element={<Navigate to="/authority/reports" replace />} />
          <Route path="/priority"     element={<Navigate to="/authority/priority" replace />} />
          <Route path="/repairs"      element={<Navigate to="/authority/repairs" replace />} />
          <Route path="/verification" element={<Navigate to="/authority/verification" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>

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
