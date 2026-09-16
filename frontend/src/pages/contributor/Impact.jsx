/**
 * src/pages/contributor/Impact.jsx
 * Contributor impact page — shows stats, points, badge level, and resolved reports contribution.
 */
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, FileText, CheckCircle, Wrench, TrendingUp, Award,
  MapPin, Calendar, Shield, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

import { getContributorStats, getReports } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { StatCardSkeleton, Skeleton } from '../../components/Loading';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import { formatDamageType, formatDateShort } from '../../utils/helpers';

// ── Badge level config ────────────────────────────────────────────────────────
function getBadgeLevel(points) {
  if (points >= 500) return { level: 'Gold', color: '#f59e0b', next: null, nextAt: null };
  if (points >= 250) return { level: 'Silver', color: '#94a3b8', next: 'Gold', nextAt: 500 };
  if (points >= 100) return { level: 'Bronze', color: '#b45309', next: 'Silver', nextAt: 250 };
  return { level: 'Newcomer', color: 'var(--color-text-muted)', next: 'Bronze', nextAt: 100 };
}

// ── Monthly contribution data (deterministic) ─────────────────────────────────
const MONTHLY_CONTRIBUTION = [
  { month: 'Apr', reports: 1, resolved: 1 },
  { month: 'May', reports: 2, resolved: 1 },
  { month: 'Jun', reports: 2, resolved: 2 },
  { month: 'Jul', reports: 2, resolved: 1 },
  { month: 'Aug', reports: 3, resolved: 1 },
  { month: 'Sep', reports: 2, resolved: 0 },
];

const RADAR_DATA = [
  { subject: 'Reports',   A: 90 },
  { subject: 'Verified',  A: 75 },
  { subject: 'Resolved',  A: 50 },
  { subject: 'Speed',     A: 80 },
  { subject: 'Quality',   A: 85 },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
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

// ── Main Impact Page ──────────────────────────────────────────────────────────
export default function ContributorImpact() {
  const { user } = useAuth();

  const fetchStats   = useCallback(() => getContributorStats(user?.id), [user?.id]);
  const fetchReports = useCallback(() => getReports({ submitted_by: user?.id }), [user?.id]);

  const { data: stats,   loading: statsLoading   } = useApi(fetchStats,   [user?.id]);
  const { data: reports, loading: reportsLoading } = useApi(fetchReports, [user?.id]);

  const points        = stats?.points         ?? user?.points         ?? 240;
  const submitted     = stats?.reports_submitted ?? user?.reportsSubmitted ?? 12;
  const aiVerified    = stats?.ai_verified    ?? user?.aiVerified    ?? 9;
  const resolved      = stats?.resolved       ?? user?.resolved       ?? 6;
  const badge         = getBadgeLevel(points);
  const progressPct   = badge.nextAt ? Math.min(100, Math.round((points / badge.nextAt) * 100)) : 100;
  const resolvedReports = (reports || []).filter(r => r.status === 'RESOLVED').slice(0, 3);

  return (
    <div className="page-wrapper fade-in">

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
          My <span className="text-gradient">Impact</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Track your contribution to road safety in your community.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Reports Submitted" value={submitted}          icon={FileText}    color="var(--color-primary)"  subtitle="total reports filed" />
            <StatCard title="AI Verified"        value={aiVerified}         icon={CheckCircle} color="#06b6d4"               subtitle="confirmed by AI" />
            <StatCard title="Resolved"           value={resolved}           icon={Wrench}      color="var(--color-success)"  subtitle="repairs completed" />
            <StatCard title="Points Earned"      value={`${points} pts`}    icon={Star}        color="#f59e0b"               subtitle="civic contribution" />
          </>
        )}
      </div>

      {/* ── Badge + Progress ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `${badge.color}18`,
            border: `3px solid ${badge.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Award size={36} color={badge.color} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: badge.color }}>{badge.level} Contributor</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{points} pts</span>
            </div>
            {badge.next ? (
              <>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                  {badge.nextAt - points} more points to reach <strong style={{ color: badge.color }}>{badge.next}</strong>
                </p>
                <div style={{ height: 8, background: 'var(--color-bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: badge.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{progressPct}% to {badge.next}</p>
              </>
            ) : (
              <p style={{ fontSize: '0.8rem', color: badge.color, fontWeight: 600 }}>🏆 Maximum level achieved!</p>
            )}
          </div>

          {/* Points breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span>Report submitted</span><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>+10 pts each</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span>AI verified</span><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>+15 pts each</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span>Report resolved</span><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>+25 pts each</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Monthly Chart */}
        <div className="card" style={{ padding: '20px 20px 8px' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 16 }}>Monthly Contribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_CONTRIBUTION} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--color-text-primary)' }}
              />
              <Bar dataKey="reports"  name="Reported"  fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved"  fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
            {[{ color: 'var(--color-primary)', label: 'Reported' }, { color: 'var(--color-success)', label: 'Resolved' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card" style={{ padding: '20px 12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 8 }}>Contributor Score</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <Radar name="Score" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Community Impact Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={20} color="#10b981" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981', marginBottom: 2 }}>Community Impact Estimate</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Your <strong style={{ color: 'var(--color-text-primary)' }}>{resolved} resolved reports</strong> have potentially improved road safety for{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>~{(resolved * 630).toLocaleString()} daily commuters</strong> in your zone.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
          <TrendingUp size={14} />
          {(resolved * 12).toLocaleString()} road km safer
        </div>
      </div>

      {/* ── Resolved Reports ── */}
      {resolvedReports.length > 0 && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} color="var(--color-success)" />
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Your Resolved Reports</p>
            </div>
            <Link to="/contributor/reports" className="btn btn-sm btn-secondary">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          {reportsLoading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={52} />)}
            </div>
          ) : (
            resolvedReports.map((r, idx) => (
              <div key={r._id} style={{ padding: '14px 20px', borderBottom: idx < resolvedReports.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{r._id}</span>
                    <SeverityBadge severity={r.severity} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatDamageType(r.damage_type)}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} /> {r.road_segment_name} · {formatDateShort(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .page-wrapper > div:has(.recharts-responsive-container) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
