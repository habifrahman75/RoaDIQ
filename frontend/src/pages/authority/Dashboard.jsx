import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle, AlertTriangle, Wrench,
  RefreshCw, CheckSquare, ArrowRight, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

import useApi from '../../hooks/useApi';
import {
  getDashboardStats, getReports, getRecurringDamage, getAnalytics
} from '../../services/api';
import StatCard from '../../components/StatCard';
import MapView from '../../components/MapView';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import { StatCardSkeleton, Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import RecurringAlert from '../../components/RecurringAlert';
import { formatDamageType, formatDate } from '../../utils/helpers';

const HEALTH_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const HEALTH_LABELS = ['Healthy', 'Watch', 'Degrading', 'Critical'];

const REPORT_COLORS = ['#6366f1', '#22c55e', '#f97316'];
const DAMAGE_COLORS = ['#ef4444', '#f97316', '#eab308', '#6366f1', '#8b5cf6', '#06b6d4'];

const reportsTrend = [
  { month: 'Apr', reports: 28 },
  { month: 'May', reports: 34 },
  { month: 'Jun', reports: 31 },
  { month: 'Jul', reports: 42 },
  { month: 'Aug', reports: 38 },
  { month: 'Sep', reports: 47 },
];

const repairTrend = [
  { month: 'Apr', completed: 12, pending: 8 },
  { month: 'May', completed: 18, pending: 6 },
  { month: 'Jun', completed: 15, pending: 10 },
  { month: 'Jul', completed: 22, pending: 7 },
  { month: 'Aug', completed: 19, pending: 5 },
  { month: 'Sep', completed: 25, pending: 4 },
];

const damageDistribution = [
  { name: 'Pothole', value: 38 },
  { name: 'Crack', value: 27 },
  { name: 'Surface', value: 18 },
  { name: 'Pothole+Crack', value: 10 },
  { name: 'Other', value: 7 },
];

const healthDistribution = [
  { name: 'Healthy', value: 1 },
  { name: 'Watch', value: 1 },
  { name: 'Degrading', value: 1 },
  { name: 'Critical', value: 2 },
];

export default function Dashboard() {
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(getDashboardStats);
  const { data: reportsData, loading: reportsLoading } = useApi(getReports);
  const { data: recurringData, loading: recurringLoading } = useApi(getRecurringDamage);

  const reports = reportsData?.reports || reportsData || [];
  const recurring = recurringData?.alerts || recurringData || [];

  const kpiCards = [
    {
      title: 'Total Reports',
      value: stats?.total_reports ?? 247,
      icon: FileText,
      color: 'var(--color-primary)',
      subtitle: '+12 this week',
      trend: 'up',
    },
    {
      title: 'AI Verified',
      value: stats?.ai_verified ?? 189,
      icon: CheckCircle,
      color: 'var(--color-success)',
      subtitle: '76.5% verification rate',
      trend: 'up',
    },
    {
      title: 'Critical Roads',
      value: stats?.critical_roads ?? 2,
      icon: AlertTriangle,
      color: 'var(--color-danger)',
      subtitle: 'Requires immediate attention',
      trend: 'neutral',
    },
    {
      title: 'Active Repairs',
      value: stats?.active_repairs ?? 2,
      icon: Wrench,
      color: 'var(--color-warning)',
      subtitle: '1 in progress',
      trend: 'neutral',
    },
    {
      title: 'Recurring Damage',
      value: stats?.recurring_damage ?? 3,
      icon: RefreshCw,
      color: '#f97316',
      subtitle: 'High-priority sites',
      trend: 'up',
    },
    {
      title: 'Resolved This Month',
      value: stats?.resolved_this_month ?? 41,
      icon: CheckSquare,
      color: 'var(--color-success)',
      subtitle: '+8 vs last month',
      trend: 'up',
    },
  ];

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Authority Dashboard
            </h1>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(34,197,94,0.15)', color: '#22c55e',
              padding: '0.2rem 0.6rem', borderRadius: '999px',
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.05em'
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#22c55e', animation: 'pulse 2s infinite'
              }} />
              LIVE
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Real-time road condition intelligence for municipal authorities
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          <Activity size={15} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {statsLoading
          ? Array(6).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          : kpiCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))
        }
      </div>

      {/* Recurring Alerts + Health Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Recurring Damage Alerts */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} color="#f97316" />
              Recurring Damage Alerts
            </h2>
            <Link to="/authority/recurring" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recurringLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 70, marginBottom: 8, borderRadius: 8 }} />)
          ) : recurring.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No recurring alerts.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recurring.slice(0, 4).map((item, idx) => (
                <RecurringAlert key={item.road_segment_id || idx} data={item} compact />
              ))}
            </div>
          )}
        </div>

        {/* Road Health Distribution */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1rem 0' }}>
            Road Health Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={healthDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {healthDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={HEALTH_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }}
                formatter={(value, name) => [value, name]}
              />
              <Legend
                formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Reports Trend */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
            Reports Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={reportsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }}
              />
              <Line type="monotone" dataKey="reports" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Repair Completion */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
            Repair Completion
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={repairTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }}
              />
              <Bar dataKey="completed" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pending" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Legend formatter={(v) => <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Damage Distribution */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
            Damage Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={damageDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {damageDistribution.map((entry, index) => (
                  <Cell key={`dc-${index}`} fill={DAMAGE_COLORS[index % DAMAGE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Recent Reports + Map Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Recent Reports Table */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Recent Reports</h3>
            <Link to="/authority/reports" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {reportsLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 40, marginBottom: 6, borderRadius: 6 }} />)
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['ID', 'Damage', 'Severity', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.5rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(reports.length > 0 ? reports : []).slice(0, 8).map((r, idx) => (
                    <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.04))'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.5rem' }}>
                        <Link to={`/authority/reports/${r.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          #{String(r.id || '').slice(-6)}
                        </Link>
                      </td>
                      <td style={{ padding: '0.5rem', color: 'var(--color-text-primary)' }}>{formatDamageType(r.damage_type || r.ai_damage_type || 'Unknown')}</td>
                      <td style={{ padding: '0.5rem' }}><SeverityBadge severity={r.severity || r.ai_severity} /></td>
                      <td style={{ padding: '0.5rem' }}><StatusBadge status={r.status} /></td>
                      <td style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}>{formatDate(r.submitted_at || r.created_at)}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No recent reports
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Map Preview */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Live Map Preview</h3>
            <Link to="/authority/map" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full map <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <MapView reports={reports} height={320} zoom={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
