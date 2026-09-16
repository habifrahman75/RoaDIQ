/**
 * src/context/AuthContext.jsx
 * Role-aware auth context: supports 'authority' and 'contributor' roles.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { loginAsRole, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = localStorage.getItem('roadiq_user');
  const [user, setUser]       = useState(stored ? JSON.parse(stored) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const loginWithRole = useCallback(async (role) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user: userData } = await loginAsRole(role);
      localStorage.setItem('roadiq_token', token);
      localStorage.setItem('roadiq_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Legacy login kept for backward compat
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { loginAsRole: _ignored, login: apiLogin } = await import('../services/api');
      // fallback: use loginAsRole with 'authority'
      const { token, user: userData } = await loginAsRole('authority');
      localStorage.setItem('roadiq_token', token);
      localStorage.setItem('roadiq_user', JSON.stringify(userData));
      setUser(userData);
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

  const isAuthority    = user?.role === 'authority';
  const isContributor  = user?.role === 'contributor';

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, loginWithRole, logout,
      isAuthenticated: !!user,
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
