/**
 * src/context/AuthContext.jsx
 * Role-aware auth context: supports 'authority' and 'contributor' roles.
 *
 * Role Normalization:
 *   Legacy / backend roles are mapped to canonical UI roles:
 *     AUTHORITY_ADMIN, AUTHORITY, authority_admin, admin  → 'authority'
 *     CONTRIBUTOR, contributor_user, citizen              → 'contributor'
 *     anything else                                       → null  (→ /login)
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { loginAsRole, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

// ── Role normalization ────────────────────────────────────────────────────────
/**
 * Maps any known legacy or new role string to a canonical role.
 * Returns 'authority' | 'contributor' | null.
 * null means unknown — routing will redirect to /login.
 */
export function normalizeRole(rawRole) {
  if (!rawRole) return null;
  const r = String(rawRole).toLowerCase().trim();
  const AUTHORITY_ROLES = [
    'authority',
    'authority_admin',
    'authorityAdmin',
    'authority_admin'.toLowerCase(),
    'admin',
    'authority_officer',
    'officer',
    'government',
    'pwd',
  ];
  const CONTRIBUTOR_ROLES = [
    'contributor',
    'contributor_user',
    'contributoruser',
    'citizen',
    'user',
    'reporter',
    'public',
  ];
  if (AUTHORITY_ROLES.includes(r))   return 'authority';
  if (CONTRIBUTOR_ROLES.includes(r)) return 'contributor';
  return null;
}

/**
 * Normalizes a user object's role field.
 * Mutates a copy — never the original.
 */
function normalizeUser(raw) {
  if (!raw) return null;
  const normalized = normalizeRole(raw.role);
  // If already canonical and matches, return as-is (avoid unnecessary copy)
  if (raw.role === normalized) return raw;
  return { ...raw, role: normalized };
}

// ── Read + normalize from localStorage ────────────────────────────────────────
function readStoredUser() {
  try {
    const raw = localStorage.getItem('roadiq_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user   = normalizeUser(parsed);
    // Persist normalized role back so stale legacy values don't survive a refresh
    if (user && user.role !== parsed.role) {
      localStorage.setItem('roadiq_user', JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /** loginWithRole('authority' | 'contributor') — canonical role, no normalization needed */
  const loginWithRole = useCallback(async (role) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user: userData } = await loginAsRole(role);
      // Normalize just in case the API returns a legacy role
      const normalizedUser = normalizeUser(userData);
      localStorage.setItem('roadiq_token', token);
      localStorage.setItem('roadiq_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      return normalizedUser;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Legacy credential-based login — kept for backward compat */
  const login = useCallback(async (_credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user: userData } = await loginAsRole('authority');
      const normalizedUser = normalizeUser(userData);
      localStorage.setItem('roadiq_token', token);
      localStorage.setItem('roadiq_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const isAuthority   = user?.role === 'authority';
  const isContributor = user?.role === 'contributor';

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, loginWithRole, logout,
      isAuthenticated: !!user && user.role !== null,
      isAuthority,
      isContributor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
