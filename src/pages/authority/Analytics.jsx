import { useState } from 'react';
import { Calendar, TrendingUp, BarChart2, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend
} from 'recharts';

import useApi from '../../hooks/useApi';
import { getAnalytics } from '../../services/api';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';

const TIME_RANGES = [30, 60, 90];

const fallbackMonthlyData = [
  { month: 'Apr', reports: 28, verified: 22, resolved: 18 },
  { month: 'May', reports: 34, verified: 28, resolved: 24 },
  { month: 'Jun', reports: 31, verified: 25, resolved: 21 },
  { month: 'Jul', reports: 42, verified: 35, resolved: 30 },
  { month: 'Aug', reports: 38, verified: 30, resolved: 28 },
  { month: 'Sep', reports: 47, verified: 39, resolved: 35 },
];

const fallbackDamageTypes = [
  { month: 'Apr', pothole: 12, crack: 9, surface: 7 },
  { month: 'May', pothole: 15, crack: 11, surface: 8 },
  { month: 'Jun', pothole: 13, crack: 10, surface: 8 },
  { month: 'Jul', pothole: 18, crack: 14, surface: 10 },
  { month: 'Aug', pothole: 16, crack: 12, surface: 10 },
  { month: 'Sep', pothole: 20, crack: 16, surface: 11 },
];

const fallbackHealthTrend = [
  { month: 'Apr', score: 68 },
  { month: 'May', score: 65 },
  { month: 'Jun', score: 63 },
  { month: 'Jul', score: 60 },
  { month: 'Aug', score: 57 },
  { month: 'Sep', score: 54 },
];

const fallbackRepairSuccess = [
  { month: 'Apr', success: 14, partial: 4, failed: 2 },
  { month: 'May', success: 18, partial: 5, failed: 1 },
  { month: 'Jun', success: 15, partial: 4, failed: 2 },
  { month: 'Jul', success: 22, partial: 5, failed: 1 },
  { month: 'Aug', success: 19, partial: 5, failed: 1 },
  { month: 'Sep', success: 25, partial: 6, failed: 1 },
];

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }
};

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
      <h3 style={{
        fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)',
        marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
      }}>
        {Icon && <Icon size={15} color="var(--color-primary)" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState(30);

  const { data: analyticsData, loading, error, refetch } = useApi(getAnalytics);

  const monthly = analyticsData?.monthly_reports || fallbackMonthlyData;
  const damageTypes = analyticsData?.damage_types_trend || fallbackDamageTypes;
  const healthTrend = analyticsData?.health_trend || fallbackHealthTrend;
  const repairSuccess = analyticsData?.repair_success || fallbackRepairSuccess;

  const summaryStats = analyticsData?.summary || {
    total_reports: 220,
    verified_reports: 178,
    resolution_rate: 86.4,
    avg_repair_days: 4.2,
    recurring_sites: 3,
    critical_zones: 2,
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
            Road Analytics & Intelligence
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Comprehensive analytics across all road segments and repair operations
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.4rem', borderRadius: 10, border: '1px solid var(--color-border)' }}>
          <Calendar size={14} color="var(--color-text-secondary)" style={{ marginLeft: '0.3rem' }} />
          {TIME_RANGES.map(d => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              style={{
                padding: '0.35rem 0.875rem', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                background: timeRange === d ? 'var(--color-primary)' : 'transparent',
                color: timeRange === d ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 280, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {/* Chart 1: Monthly Reports vs Verified vs Resolved */}
          <ChartCard title="Monthly Reports vs Verified vs Resolved" icon={BarChart2}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{v}</span>} />
                <Bar dataKey="reports" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="verified" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resolved" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2: Damage Types Over Time (stacked) */}
          <ChartCard title="Damage Types Over Time" icon={BarChart2}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={damageTypes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{v}</span>} />
                <Bar dataKey="pothole" stackId="a" fill="#ef4444" />
                <Bar dataKey="crack" stackId="a" fill="#f97316" />
                <Bar dataKey="surface" stackId="a" fill="#eab308" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 3: City Road Health Trend */}
          <ChartCard title="City Road Health Trend" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={healthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${v}/100`, 'Avg Health Score']} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 4: Repair Success Rate */}
          <ChartCard title="Repair Success Rate" icon={CheckCircle}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repairSuccess}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Legend formatter={(v) => <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{v}</span>} />
                <Bar dataKey="success" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="partial" fill="#eab308" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1.25rem' }}>
          Summary Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Reports', value: summaryStats.total_reports, suffix: '', color: 'var(--color-primary)' },
            { label: 'Verified Reports', value: summaryStats.verified_reports, suffix: '', color: '#22c55e' },
            { label: 'Resolution Rate', value: summaryStats.resolution_rate, suffix: '%', color: '#06b6d4' },
            { label: 'Avg Repair Days', value: summaryStats.avg_repair_days, suffix: 'd', color: '#eab308' },
            { label: 'Recurring Sites', value: summaryStats.recurring_sites, suffix: '', color: '#f97316' },
            { label: 'Critical Zones', value: summaryStats.critical_zones, suffix: '', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ padding: '1rem', background: 'var(--color-background)', borderRadius: 10, border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, margin: '0 0 0.25rem 0', lineHeight: 1 }}>
                {s.value}{s.suffix}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
