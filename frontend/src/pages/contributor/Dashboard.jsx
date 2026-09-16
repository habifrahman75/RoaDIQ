/**
 * src/pages/contributor/Dashboard.jsx
 * Contributor overview dashboard — stats, quick actions, recent reports, notifications, impact.
 */
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle, Wrench, Star, Plus, ArrowRight,
  Bell, MapPin, TrendingUp, Shield, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getReports, getNotifications, getContributorStats } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import { StatCardSkeleton, Skeleton } from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import {
  formatDamageType, formatDateShort, formatDate,
  STATUS_LABELS,
} from '../../utils/helpers';

// ── Notification type icon/color map ─────────────────────────────────────────
const NOTIF_CONFIG = {
  AI_VERIFIED:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  REPORT_ACCEPTED: { color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  REPAIR_COMPLETE: { color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  NEEDS_EVIDENCE:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
};

// ── Mini Stat Card ────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
    </div>
  );
}

// ── Progress Timeline Dots ────────────────────────────────────────────────────
const PROGRESS_STEPS = ['Submitted', 'AI Verified', 'Under Review', 'Repair', 'Resolved'];

function getStepIndex(status) {
  const map = {
    PENDING: 0, AI_PROCESSING: 0,
    AI_VERIFIED: 1, NEEDS_EVIDENCE: 1,
    UNDER_REVIEW: 2, ACCEPTED: 2,
    ASSIGNED: 3, UNDER_REPAIR: 3, REPAIR_VERIFICATION: 3,
    RESOLVED: 4,
  };
  return map[status] ?? 0;
}

function ProgressDots({ status }) {
  const current = getStepIndex(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 6 }}>
      {PROGRESS_STEPS.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const color   = done ? '#10b981' : active ? 'var(--color-primary)' : 'var(--color-border)';
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div title={step} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: color,
              border: active ? `2px solid var(--color-primary)` : 'none',
              flexShrink: 0,
              transition: 'background 300ms ease',
            }} />
            {i < PROGRESS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#10b981' : 'var(--color-border)', transition: 'background 300ms ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ContributorDashboard() {
  const { user } = useAuth();

  const fetchStats    = useCallback(() => getContributorStats(user?.id), [user?.id]);
  const fetchReports  = useCallback(() => getReports({ submitted_by: user?.id }), [user?.id]);
  const fetchNotifs   = useCallback(() => getNotifications('contributor'), []);

  const { data: stats,   loading: statsLoading   } = useApi(fetchStats,   [user?.id]);
  const { data: reports, loading: reportsLoading } = useApi(fetchReports,  [user?.id]);
  const { data: notifs,  loading: notifsLoading  } = useApi(fetchNotifs,   []);

  const recentReports  = (reports || []).slice(0, 4);
  const unreadNotifs   = (notifs  || []).filter(n => !n.read).slice(0, 2);
  const resolvedCount  = stats?.resolved ?? user?.resolved ?? 6;

  return (
    <div className="page-wrapper fade-in">

      {/* ── Welcome Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
              Welcome back, <span className="text-gradient">{user?.name ?? 'Contributor'}</span> 👋
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Help make roads safer — every report you submit drives real change in your community.
            </p>
          </div>
          <Link
            to="/contributor/report"
            className="btn btn-primary btn-lg"
            style={{ gap: 8, flexShrink: 0 }}
          >
            <Plus size={18} />
            Report Road Damage
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Reports Submitted" value={stats?.reports_submitted ?? user?.reportsSubmitted ?? 12} icon={FileText}    color="var(--color-primary)" subtitle="total reports filed" />
            <StatCard title="AI Verified"        value={stats?.ai_verified      ?? user?.aiVerified      ??  9} icon={CheckCircle} color="#06b6d4"               subtitle="confirmed by AI" />
            <StatCard title="Resolved"           value={stats?.resolved         ?? user?.resolved         ??  6} icon={Wrench}      color="var(--color-success)" subtitle="repairs completed" />
            <StatCard title="Points Earned"      value={`${stats?.points ?? user?.points ?? 240} pts`}           icon={Star}        color="#f59e0b"               subtitle="civic contribution" />
          </>
        )}
      </div>

      {/* ── Impact Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={20} color="#10b981" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981', marginBottom: 2 }}>Community Impact</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Your <strong style={{ color: 'var(--color-text-primary)' }}>{resolvedCount} resolved reports</strong> may have improved road safety for{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>thousands of daily commuters</strong> in your zone.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
          <TrendingUp size={14} />
          ~{resolvedCount * 630} road users benefited
        </div>
      </div>

      {/* ── Bottom Two-Column Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent Reports */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="var(--color-primary)" />
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recent Reports</p>
            </div>
            <Link to="/contributor/reports" className="btn btn-sm btn-secondary">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {reportsLoading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : recentReports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              description="Submit your first road damage report to get started."
              action={<Link to="/contributor/report" className="btn btn-primary btn-sm"><Plus size={14} /> New Report</Link>}
            />
          ) : (
            <div>
              {recentReports.map((r, idx) => (
                <div
                  key={r._id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: idx < recentReports.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{r._id}</span>
                        {r.is_recurring && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', color: '#ef4444', fontWeight: 600 }}>
                            <RefreshCw size={10} /> Recurring
                          </span>
                        )}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatDamageType(r.damage_type)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <MapPin size={10} style={{ marginRight: 3 }} />
                        {r.road_segment_name} · {formatDateShort(r.created_at)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <StatusBadge status={r.status} />
                      <SeverityBadge severity={r.severity} />
                    </div>
                  </div>
                  <ProgressDots status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Preview */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} color="var(--color-primary)" />
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notifications</p>
              {unreadNotifs.length > 0 && (
                <span style={{ background: 'var(--color-danger)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>
                  {unreadNotifs.length}
                </span>
              )}
            </div>
            <Link to="/contributor/notifications" className="btn btn-sm btn-secondary">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {notifsLoading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={64} />)}
            </div>
          ) : unreadNotifs.length === 0 ? (
            <EmptyState title="All caught up!" description="No unread notifications at this time." />
          ) : (
            <div>
              {unreadNotifs.map((n, idx) => {
                const cfg = NOTIF_CONFIG[n.type] || { color: 'var(--color-text-muted)', bg: 'var(--color-bg-elevated)' };
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: idx < unreadNotifs.length - 1 ? '1px solid var(--color-border)' : 'none',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Bell size={15} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</p>
                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Quick Actions</p>
            <Link to="/contributor/report" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={15} /> Report New Damage
            </Link>
            <Link to="/contributor/reports" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <FileText size={15} /> My Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive stack */}
      <style>{`
        @media (max-width: 768px) {
          .page-wrapper > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
