/**
 * src/pages/Login.jsx
 * RoadIQ role-selector login — demo mode, no credentials required.
 */
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Loading';

const LIFECYCLE_STEPS = ['Report', 'Verify', 'Understand', 'Prioritize', 'Repair', 'Verify'];

export default function Login() {
  const navigate = useNavigate();
  const { loginWithRole, loading } = useAuth();

  const handleRole = async (role) => {
    const user = await loginWithRole(role);
    if (user) {
      navigate(role === 'authority' ? '/authority/dashboard' : '/contributor/dashboard', { replace: true });
    }
  };

  return (
    <div className="login-bg" style={{ padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <Activity size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px' }} className="text-gradient">RoadIQ</h1>
          </div>

          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10, letterSpacing: '-0.3px' }}>
            From Road Damage Detection to Road Risk Intelligence
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: 560, margin: '0 auto 28px' }}>
            An AI-powered civic infrastructure platform that verifies road damage reports,
            tracks road deterioration, prioritizes maintenance, and verifies repairs — end to end.
          </p>

          {/* Lifecycle flow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {LIFECYCLE_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '4px 12px', borderRadius: 99, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  {step}
                </span>
                {i < LIFECYCLE_STEPS.length - 1 && (
                  <ArrowRight size={12} color="var(--color-text-muted)" />
                )}
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            AI-Powered · Road Memory · Recurring Damage Detection · Repair Verification
          </p>
        </div>

        {/* ── Role Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 720, margin: '0 auto' }}>

          {/* Contributor */}
          <div className="login-card" style={{ padding: 32, cursor: loading ? 'not-allowed' : 'pointer' }}
            onClick={() => !loading && handleRole('contributor')}>
            <div style={{ display: 'flex', align: 'center', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={24} color="#10b981" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Citizen / Contributor</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Report road damage from your phone</p>
              </div>
            </div>

            <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Submit photo & video evidence', 'Track AI verification result', 'Monitor repair progress', 'View your contribution impact'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>

            <button disabled={loading} className="btn btn-lg" style={{ width: '100%', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.95rem', fontWeight: 700 }}>
              {loading ? <><Spinner size={16} /> Signing in…</> : 'Continue as Contributor'}
            </button>
          </div>

          {/* Authority */}
          <div className="login-card" style={{ padding: 32, cursor: loading ? 'not-allowed' : 'pointer', border: '1px solid rgba(59,130,246,0.2)' }}
            onClick={() => !loading && handleRole('authority')}>
            <div style={{ display: 'flex', align: 'center', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Authority / Officer</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Government road intelligence dashboard</p>
              </div>
            </div>

            <ul style={{ listStyle: 'none', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['City-wide road health monitoring', 'AI-verified reports & priority queue', 'Road memory & recurring damage', 'Repair assignment & verification'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  <CheckCircle size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>

            <button disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', fontSize: '0.95rem', fontWeight: 700 }}>
              {loading ? <><Spinner size={16} /> Signing in…</> : 'Continue as Authority'}
            </button>
          </div>
        </div>

        {/* Demo note */}
        <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 10px', borderRadius: 99, fontWeight: 600, fontSize: '0.7rem' }}>DEMO MODE</span>
          &nbsp; No authentication required · All data is simulated · RoadIQ v2.0
        </p>
      </div>
    </div>
  );
}
