import { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle, Wrench, RefreshCw, BarChart2, FileText } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

import useApi from '../../hooks/useApi';
import { getRoadSegment, getRoadHistory, getRoadReports } from '../../services/api';
import RoadHealthGauge from '../../components/RoadHealthGauge';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import TimelineView from '../../components/TimelineView';
import RecurringAlert from '../../components/RecurringAlert';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatDamageType, formatDate, truncateId, getHealthColor, getHealthLabel } from '../../utils/helpers';

const TABS = ['Overview', 'History', 'Defect Trend', 'Reports'];

function RiskRingLarge({ score, size = 120 }) {
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-border)" strokeWidth={8} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={8} fill="none"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{Math.round(score)}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', lineHeight: 1 }}>RISK</span>
        </div>
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Risk Score</span>
    </div>
  );
}

export default function RoadDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchRoad = useCallback(() => getRoadSegment(id), [id]);
  const fetchHistory = useCallback(() => getRoadHistory(id), [id]);
  const fetchReports = useCallback(() => getRoadReports(id), [id]);

  const { data: road, loading, error, refetch } = useApi(fetchRoad);
  const { data: historyData, loading: histLoading } = useApi(fetchHistory);
  const { data: reportsData, loading: reportsLoading } = useApi(fetchReports);

  const history = historyData?.events || historyData || [];
  const reports = reportsData?.reports || reportsData || [];

  const monthlyDefects = road?.monthly_defects || [
    { month: 'Apr', defects: 4 }, { month: 'May', defects: 6 },
    { month: 'Jun', defects: 5 }, { month: 'Jul', defects: 8 },
    { month: 'Aug', defects: 7 }, { month: 'Sep', defects: 10 },
  ];

  const healthTrend = road?.health_trend || [
    { month: 'Apr', score: 72 }, { month: 'May', score: 68 },
    { month: 'Jun', score: 65 }, { month: 'Jul', score: 60 },
    { month: 'Aug', score: 55 }, { month: 'Sep', score: road?.health_score ?? 48 },
  ];

  const defectTrendData = road?.defect_trend || [
    { month: 'Apr', pothole: 2, crack: 1, surface: 1 },
    { month: 'May', pothole: 3, crack: 2, surface: 1 },
    { month: 'Jun', pothole: 2, crack: 2, surface: 1 },
    { month: 'Jul', pothole: 4, crack: 3, surface: 1 },
    { month: 'Aug', pothole: 3, crack: 3, surface: 1 },
    { month: 'Sep', pothole: 5, crack: 3, surface: 2 },
  ];

  const getStatusFromScore = (score) => {
    if (score >= 75) return 'HEALTHY';
    if (score >= 50) return 'WATCH';
    if (score >= 25) return 'DEGRADING';
    return 'CRITICAL';
  };

  const STATUS_COLORS = { HEALTHY: '#22c55e', WATCH: '#eab308', DEGRADING: '#f97316', CRITICAL: '#ef4444' };

  if (loading) return (
    <div className="page-wrapper fade-in">
      {Array(6).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 48, marginBottom: 10, borderRadius: 8 }} />)}
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!road) return <ErrorState message="Road segment not found." onRetry={refetch} />;

  const healthScore = road.health_score ?? 50;
  const riskScore = road.risk_score ?? 0;
  const status = getStatusFromScore(healthScore);
  const statusColor = STATUS_COLORS[status];

  return (
    <div className="page-wrapper fade-in">
      {/* Back */}
      <Link to="/authority/roads" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem' }}>
        <ArrowLeft size={15} /> Back to Road Intelligence
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', margin: '0 0 0.2rem 0' }}>
            {truncateId(road.id)}
          </p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
            {road.name || road.road_name}
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {road.zone && (
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, background: 'var(--color-primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                {road.zone}
              </span>
            )}
            <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, background: `${statusColor}18`, color: statusColor, fontSize: '0.75rem', fontWeight: 600 }}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Top Row: Gauge + Risk + Stats */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {/* Health Gauge */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RoadHealthGauge score={healthScore} size={160} showLabel />
        </div>

        {/* Risk Ring */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiskRingLarge score={riskScore} size={130} />
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Defects', value: road.total_defects ?? '—', icon: AlertTriangle, color: '#ef4444' },
            { label: 'Recurring', value: road.recurring_damage_count ?? 0, icon: RefreshCw, color: '#f97316' },
            { label: 'Reports', value: road.total_reports ?? reports.length, icon: FileText, color: 'var(--color-primary)' },
            { label: 'Repairs', value: road.total_repairs ?? '—', icon: Wrench, color: '#22c55e' },
            { label: 'Days Since Repair', value: road.days_since_repair != null ? `${road.days_since_repair}d` : '—', icon: BarChart2, color: 'var(--color-text-secondary)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '0.875rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <s.icon size={16} color={s.color} />
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.65rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: 600,
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Monthly Defect Bar Chart */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
              Monthly Defect Count
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyDefects}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} />
                <Bar dataKey="defects" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Health Score Trend */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
              Health Score Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={healthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recurring Alert */}
          {road.recurring_damage_count > 0 && road.recurring_data && (
            <RecurringAlert data={road.recurring_data} />
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'History' && (
        <div>
          {histLoading
            ? Array(5).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 60, marginBottom: 8, borderRadius: 8 }} />)
            : history.length > 0
              ? <TimelineView events={history} />
              : <EmptyState title="No history events" description="No recorded events for this road segment yet." />
          }
        </div>
      )}

      {/* Defect Trend Tab */}
      {activeTab === 'Defect Trend' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
            Defects by Type Over Time
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={defectTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)' }} />
              <Legend formatter={(v) => <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{v}</span>} />
              <Line type="monotone" dataKey="pothole" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="crack" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="surface" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'Reports' && (
        <div>
          {reportsLoading
            ? Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 50, marginBottom: 8, borderRadius: 8 }} />)
            : reports.length === 0
              ? <EmptyState title="No reports" description="No reports found for this road segment." />
              : (
                <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
                        {['ID', 'Damage Type', 'Severity', 'Status', 'Date', ''].map(h => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, idx) => (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                            #{truncateId(r.id)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)' }}>
                            {formatDamageType(r.damage_type || r.ai_damage_type)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}><SeverityBadge severity={r.severity || r.ai_severity} /></td>
                          <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                            {formatDate(r.submitted_at || r.created_at)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <Link to={`/authority/reports/${r.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      )}
    </div>
  );
}
