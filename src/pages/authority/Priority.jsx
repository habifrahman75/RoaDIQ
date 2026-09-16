import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertTriangle, TrendingUp, DollarSign, ChevronRight, Wrench, Eye, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

import useApi from '../../hooks/useApi';
import { getPriorityQueue } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { getRiskColor, truncateId } from '../../utils/helpers';

function RiskRing({ score, size = 64 }) {
  const radius = (size - 10) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-border)" strokeWidth={6} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size < 60 ? '0.75rem' : '0.9rem', fontWeight: 800, color, lineHeight: 1 }}>{Math.round(score)}</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--color-text-secondary)', lineHeight: 1 }}>RISK</span>
      </div>
    </div>
  );
}

function HealthBar({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Health Score</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{Math.round(score)}/100</span>
      </div>
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 999 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export default function Priority() {
  const [inProgressIds, setInProgressIds] = useState(new Set());
  const { data: queueData, loading, error, refetch } = useApi(getPriorityQueue);

  const queue = queueData?.priority_queue || queueData || [];

  const handleAssign = (item) => {
    toast.success(`Repair assigned to field team for ${item.road_segment_name || 'road segment'}`);
  };

  const handleMarkInProgress = (item) => {
    setInProgressIds(prev => new Set([...prev, item.road_segment_id]));
    toast.success(`${item.road_segment_name || 'Segment'} marked as In Progress`);
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
            Repair Priority Queue
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            AI-ranked road segments requiring immediate attention ·{' '}
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
          <Activity size={14} />
          {loading ? '—' : `${queue.length} segments`}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 200, borderRadius: 12 }} />)}
        </div>
      ) : queue.length === 0 ? (
        <EmptyState title="No priority items" description="All road segments are within acceptable health parameters." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {queue.map((item, idx) => {
            const isInProgress = inProgressIds.has(item.road_segment_id);
            const riskScore = item.risk_score ?? item.composite_risk_score ?? 0;
            const healthScore = item.health_score ?? 50;
            return (
              <div
                key={item.road_segment_id || idx}
                style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${riskScore >= 75 ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
                  padding: '1.25rem', transition: 'box-shadow 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  {/* Rank */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : 'var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>#{item.rank || idx + 1}</span>
                  </div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        {item.road_segment_name || `Road Segment ${truncateId(item.road_segment_id)}`}
                      </h3>
                      {item.zone && (
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, background: 'var(--color-primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>
                          {item.zone}
                        </span>
                      )}
                      <SeverityBadge severity={item.max_severity || item.severity} />
                      {isInProgress && (
                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.7rem', fontWeight: 600 }}>
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Health Bar */}
                    <div style={{ marginBottom: '0.875rem', maxWidth: 300 }}>
                      <HealthBar score={healthScore} />
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '1rem', marginBottom: '0.875rem' }}>
                      {[
                        { label: 'Total Reports', value: item.total_reports ?? '—' },
                        { label: 'Critical Defects', value: item.critical_defects ?? item.critical_count ?? '—' },
                        { label: 'Recurring', value: item.recurring_count ?? '—' },
                        { label: 'Days Deteriorating', value: item.days_deteriorating ?? '—' },
                      ].map(s => (
                        <div key={s.label}>
                          <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
                          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Estimated Cost */}
                    {item.estimated_cost && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        <DollarSign size={14} color="var(--color-text-secondary)" />
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          Estimated cost: <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>₹{item.estimated_cost.toLocaleString()}</span>
                        </span>
                      </div>
                    )}

                    {/* Reasons */}
                    {item.reasons && item.reasons.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {item.reasons.map((reason, ri) => (
                          <span key={ri} style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: 'var(--color-background)', border: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Risk Ring + Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
                    <RiskRing score={riskScore} size={72} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <Link
                        to={`/authority/roads/${item.road_segment_id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.45rem 0.875rem', background: 'var(--color-border)',
                          color: 'var(--color-text-primary)', borderRadius: 7,
                          textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap'
                        }}
                      >
                        <Eye size={13} /> View
                      </Link>
                      <button
                        onClick={() => handleAssign(item)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.45rem 0.875rem', background: 'var(--color-primary)',
                          color: '#fff', border: 'none', borderRadius: 7,
                          cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap'
                        }}
                      >
                        <Wrench size={13} /> Assign Repair
                      </button>
                      {!isInProgress && (
                        <button
                          onClick={() => handleMarkInProgress(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.45rem 0.875rem', background: 'rgba(34,197,94,0.1)',
                            color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7,
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap'
                          }}
                        >
                          <TrendingUp size={13} /> Mark In Progress
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
