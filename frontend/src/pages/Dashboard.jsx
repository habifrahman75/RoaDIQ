/**
 * src/pages/Dashboard.jsx
 * Overview dashboard with stat cards, charts, recent reports, and map preview.
 */
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, AlertTriangle, Wrench, Activity,
  Heart, TrendingUp, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';

import { getDashboardStats, getReports } from '../services/api';
import { useApi } from '../hooks/useApi';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import { StatCardSkeleton, Skeleton } from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import {
  formatDamageType, formatDateShort, formatConfidence,
  getHealthColor, getHealthLabel, truncateId,
} from '../utils/helpers';

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color || 'var(--color-text-primary)', fontWeight: 600 }}>
          {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Health Score Ring ─────────────────────────────────────────────────────────
function HealthRing({ score }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = getHealthColor(score);
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>/100</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(getDashboardStats);
  const { data: reports, loading: reportsLoading, refetch: refetchReports } = useApi(getReports);

  const refetch = useCallback(() => { refetchStats(); refetchReports(); }, [refetchStats, refetchReports]);

  const recentReports = (reports || []).slice(0, 5);
  const mapReports    = (reports || []).slice(0, 20);

  if (statsError) return (
    <div className="page-wrapper">
      <ErrorState message={statsError} onRetry={refetch} />
    </div>
  );

  return (
    <div className="page-wrapper fade-in">
      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              title="Total Reports"
              value={stats.total_reports}
              icon={FileText}
              color="var(--color-primary)"
              trend={{ value: 12, label: 'this week' }}
              subtitle="reports logged"
            />
            <StatCard
              title="Critical Damages"
              value={stats.critical_damages}
              icon={AlertTriangle}
              color="var(--color-danger)"
              trend={{ value: -3, label: 'vs yesterday' }}
              subtitle="need urgent action"
            />
            <StatCard
              title="High Priority Roads"
              value={stats.high_priority_roads}
              icon={TrendingUp}
              color="#f59e0b"
              subtitle="segments flagged"
            />
            <StatCard
              title="Pending Repair"
              value={stats.roads_requiring_repair}
              icon={Wrench}
              color="#a855f7"
              subtitle="roads in queue"
            />
            <StatCard
              title="Avg. Road Health"
              value={`${stats.average_road_health}`}
              icon={Heart}
              color={getHealthColor(stats.average_road_health)}
              subtitle={getHealthLabel(stats.average_road_health)}
            />
          </>
        ) : null}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Damage Distribution Pie */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Damage Distribution</p>
          {statsLoading
            ? <Skeleton height={180} />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats?.damage_distribution || []}
                    dataKey="count" nameKey="type"
                    cx="50%" cy="50%" outerRadius={70}
                    paddingAngle={3}
                    label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {(stats?.damage_distribution || []).map((_, i) => (
                      <Cell
                        key={i}
                        fill={['#3b82f6','#ef4444','#f59e0b','#10b981','#a855f7'][i % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{formatDamageType(v)}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Health Distribution Bar */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Health Distribution</p>
          {statsLoading
            ? <Skeleton height={180} />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats?.health_distribution || []} barSize={28}>
                  <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {(stats?.health_distribution || []).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Reports Trend */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>Reports This Week</p>
          {statsLoading
            ? <Skeleton height={180} />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats?.recent_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone" dataKey="reports"
                    stroke="var(--color-primary)" strokeWidth={2}
                    dot={{ fill: 'var(--color-primary)', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Average Health Ring */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Overall Road Health</p>
          {statsLoading ? <Skeleton height={120} /> : stats && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              <HealthRing score={stats.average_road_health} />
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: getHealthColor(stats.average_road_health) }}>
                  {getHealthLabel(stats.average_road_health)}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Average across {stats.total_reports} reported segments
                </p>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Today',     val: stats.reports_today },
                    { label: 'Resolved',  val: stats.resolved_this_week },
                    { label: 'Pending Verify', val: stats.pending_verification },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Recent Reports */}
        <div className="card" style={{ gridColumn: 'span 1', minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recent Reports</p>
            <Link to="/reports" className="btn btn-sm btn-secondary">
              View All <ArrowRight size={13} />
            </Link>
          </div>
          {reportsLoading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={48} />)}
            </div>
          ) : recentReports.length === 0 ? (
            <EmptyState title="No reports yet" description="Reports will appear here once field teams submit data." />
          ) : (
            <div>
              {recentReports.map((r) => (
                <Link
                  key={r._id}
                  to={`/reports/${r._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    textDecoration: 'none',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatDamageType(r.damage_type)}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      #{truncateId(r._id)} · {formatDateShort(r.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SeverityBadge severity={r.severity} />
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Map Preview */}
        <div className="card" style={{ gridColumn: 'span 1', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Damage Map</p>
            <Link to="/map" className="btn btn-sm btn-secondary">
              Full Map <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ flex: 1, padding: 16, minHeight: 280 }}>
            {reportsLoading
              ? <Skeleton height="100%" style={{ minHeight: 240 }} />
              : <MapView reports={mapReports} height="100%" zoom={12} />
            }
          </div>
        </div>
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
