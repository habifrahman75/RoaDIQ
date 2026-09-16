/**
 * src/pages/Login.jsx
 * Authority login page for RoadIQ.
 * In mock mode: email = admin@roadiq.gov  / password = admin123
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loading';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [email,    setEmail]    = useState('admin@roadiq.gov');
  const [password, setPassword] = useState('admin123');
  const [showPw,   setShowPw]   = useState(false);
  const [fieldErr, setFieldErr] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim())    errs.email    = 'Email is required';
    if (!password.trim()) errs.password = 'Password is required';
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await login({ email, password });
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="login-bg">
      <div className="login-card fade-in">
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Activity size={28} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="text-gradient">
              RoadIQ
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Authority Dashboard — Secure Access
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Global error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ef4444',
              fontSize: '0.85rem',
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="form-input"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErr((p) => ({ ...p, email: undefined })); }}
              placeholder="authority@example.gov"
              style={fieldErr.email ? { borderColor: '#ef4444' } : {}}
            />
            {fieldErr.email && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{fieldErr.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErr((p) => ({ ...p, password: undefined })); }}
                placeholder="••••••••"
                style={{ paddingRight: 42, ...(fieldErr.password ? { borderColor: '#ef4444' } : {}) }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label="Toggle password visibility"
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', padding: 0,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErr.password && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{fieldErr.password}</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><Spinner size={16} /> Signing in…</> : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Mock hint */}
        {import.meta.env.VITE_USE_MOCK === 'true' && (
          <div style={{
            marginTop: 20,
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}>
            <strong style={{ color: '#f59e0b' }}>Mock Mode Active</strong>
            <br />
            Email: admin@roadiq.gov &nbsp;|&nbsp; Password: admin123
          </div>
        )}

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          RoadIQ v1.0 — Public Works Intelligence Platform
        </p>
      </div>
    </div>
  );
}
