/**
 * src/pages/Priority.jsx
 * Repair priority queue ranked by priority score with health indicators.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { getPriorityQueue } from '../services/api';
import { useApi } from '../hooks/useApi';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import { PageLoader } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { getHealthColor, getHealthLabel, getPriorityColor } from '../utils/helpers';

// ── Priority Score Badge ──────────────────────────────────────────────────────
function PriorityScore({ score }) {
  const color = getPriorityColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Circle */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: `${color}18`,
        border: `2px solid ${color}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{score}</span>
      </div>
      {/* Bar */}
      <div style={{ flex: 1, minWidth: 60 }}>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${score}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ── Health Indicator ──────────────────────────────────────────────────────────
function HealthIndicator({ score }) {
  const color = getHealthColor(score);
  const label = getHealthLabel(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Health</span>
        <span style={{ fontWeight: 700, color }}>{score}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.65rem', color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export default function Priority() {
  const { data: queue, loading, error, refetch } = useApi(getPriorityQueue);

  if (loading) return <div className="page-wrapper"><PageLoader /></div>;
  if (error)   return <div className="page-wrapper"><ErrorState message={error} onRetry={refetch} /></div>;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Priority Repair Queue</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Road segments ranked by calculated priority score. Higher score = more urgent repair needed.
          <br />
          <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
            Prototype formula: Severity Score × Frequency × Traffic/Safety Context, normalised 0–100.
          </span>
        </p>
      </div>

      {/* Queue */}
      {!queue || queue.length === 0
        ? <EmptyState icon={TrendingUp} title="No priority items" description="Priority queue is empty — all roads are in good health." />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(queue || []).map((item, idx) => (
              <div
                key={item.id}
                className="card"
                style={{ padding: '20px 24px' }}
              >
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Rank */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: idx < 3 ? 'rgba(239,68,68,0.15)' : 'var(--color-bg-elevated)',
                    border: idx < 3 ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 800,
                    color: idx < 3 ? '#ef4444' : 'var(--color-text-muted)',
                    flexShrink: 0,
                  }}>
                    #{idx + 1}
                  </div>

                  {/* Segment info */}
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.road_segment_name}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <SeverityBadge severity={item.severity} />
                      <StatusBadge   status={item.status} />
                    </div>
                  </div>

                  {/* Priority Score */}
                  <div style={{ flex: '1 1 140px', minWidth: 140 }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>Priority Score</p>
                    <PriorityScore score={item.priority_score} />
                  </div>

                  {/* Health */}
                  <div style={{ flex: '1 1 100px', minWidth: 100 }}>
                    <HealthIndicator score={item.road_health} />
                  </div>

                  {/* Frequency */}
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Reports</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.frequency}</p>
                  </div>

                  {/* Cost */}
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Est. Cost</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-accent)' }}>{item.estimated_cost}</p>
                  </div>

                  {/* Action */}
                  <Link to={`/repairs`} className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
                    Assign <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Legend */}
      <div className="card" style={{ padding: 16, marginTop: 24 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 12 }}>Priority Score Guide</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { range: '80–100', label: 'Critical – Urgent',      color: '#dc2626' },
            { range: '60–79',  label: 'High – Act Soon',         color: '#ef4444' },
            { range: '40–59',  label: 'Moderate – Schedule',     color: '#f59e0b' },
            { range: '0–39',   label: 'Low – Monitor',           color: '#10b981' },
          ].map(({ range, label, color }) => (
            <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{range}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          ⚠️ Priority scores are prototype estimates — not official government metrics.
        </p>
      </div>
    </div>
  );
}
