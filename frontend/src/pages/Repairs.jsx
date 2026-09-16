/**
 * src/pages/Repairs.jsx
 * Repair management page — authorities update statuses inline.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wrench, ChevronRight, Check } from 'lucide-react';
import { getReports, updateReportStatus } from '../services/api';
import { useApi } from '../hooks/useApi';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import { PageLoader, Skeleton } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { Spinner } from '../components/Loading';
import {
  formatDamageType, formatDateShort,
  STATUS_FLOW, STATUS_LABELS, getNextStatus,
} from '../utils/helpers';

// ── Status Stepper ────────────────────────────────────────────────────────────
function StatusStepper({ current, reportId, onUpdated }) {
  const [loading,     setLoading]     = useState(false);
  const [localStatus, setLocalStatus] = useState(current);

  const advance = async () => {
    const next = getNextStatus(localStatus);
    if (!next) return;
    setLoading(true);
    try {
      await updateReportStatus(reportId, next);
      setLocalStatus(next);
      onUpdated?.(reportId, next);
      toast.success(`→ ${STATUS_LABELS[next]}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const next = getNextStatus(localStatus);
  const isDone = localStatus === 'RESOLVED' || localStatus === 'VERIFICATION_REQUIRED';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <StatusBadge status={localStatus} />
      {!isDone && next && (
        <button
          className="btn btn-sm btn-primary"
          onClick={advance}
          disabled={loading}
          title={`Mark as ${STATUS_LABELS[next]}`}
        >
          {loading ? <Spinner size={12} /> : <Check size={13} />}
          {STATUS_LABELS[next]}
        </button>
      )}
      {isDone && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>✓ Complete</span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Repairs() {
  const { data: allReports, loading, error, refetch } = useApi(getReports);
  const [filter, setFilter] = useState('ACTIVE'); // ACTIVE | ALL | RESOLVED

  const reports = (allReports || []).filter((r) => {
    if (filter === 'ACTIVE')   return ['PENDING','ASSIGNED','UNDER_REPAIR'].includes(r.status);
    if (filter === 'RESOLVED') return ['RESOLVED','VERIFICATION_REQUIRED'].includes(r.status);
    return true;
  });

  const handleUpdated = () => refetch();

  if (error) return <div className="page-wrapper"><ErrorState message={error} onRetry={refetch} /></div>;

  // Kanban-style columns
  const columns = [
    { key: 'PENDING',      label: 'Pending',     color: '#64748b' },
    { key: 'ASSIGNED',     label: 'Assigned',    color: '#3b82f6' },
    { key: 'UNDER_REPAIR', label: 'Under Repair', color: '#f59e0b' },
    { key: 'RESOLVED',     label: 'Resolved',    color: '#10b981' },
  ];

  return (
    <div className="page-wrapper fade-in">
      {/* Header + filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Repair Management</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Advance repair status from Pending → Assigned → Under Repair → Resolved.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'ACTIVE',   label: 'Active'   },
            { key: 'ALL',      label: 'All'       },
            { key: 'RESOLVED', label: 'Resolved'  },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {columns.map(({ key, label, color }) => {
          const colReports = (allReports || []).filter((r) => r.status === key);
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</span>
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '99px',
                  padding: '1px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {loading ? '…' : colReports.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={90} />)
                  : colReports.length === 0
                    ? (
                      <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        No items
                      </div>
                    )
                    : colReports.map((r) => (
                      <div key={r._id || r.id} className="card" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatDamageType(r.damage_type)}</p>
                          <SeverityBadge severity={r.severity} />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                          {r.road_segment_name || r.road_segment_id || '—'} · {formatDateShort(r.created_at)}
                        </p>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', alignItems: 'center' }}>
                          <StatusStepper current={r.status} reportId={r._id || r.id} onUpdated={handleUpdated} />
                          <Link to={`/reports/${r._id || r.id}`} className="btn-icon" title="View report">
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Flat List view ── */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: 600 }}>
            {filter === 'ACTIVE' ? 'Active Repairs' : filter === 'RESOLVED' ? 'Completed Repairs' : 'All Reports'}
            <span style={{ marginLeft: 10, fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
              ({loading ? '…' : reports.length})
            </span>
          </p>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Damage</th>
                <th>Segment</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>Status &amp; Action</th>
                <th>Reported</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><Skeleton height={16} /></td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Wrench} title="No repairs in this view" /></td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id || r.id}>
                    <td style={{ fontWeight: 600 }}>{formatDamageType(r.damage_type)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {r.road_segment_name || r.road_segment_id || '—'}
                    </td>
                    <td><SeverityBadge severity={r.severity} /></td>
                    <td style={{ fontWeight: 700, color: r.priority_score >= 80 ? '#ef4444' : '#f59e0b' }}>
                      {r.priority_score ?? '—'}
                    </td>
                    <td>
                      <StatusStepper current={r.status} reportId={r._id || r.id} onUpdated={handleUpdated} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatDateShort(r.created_at)}
                    </td>
                    <td>
                      <Link to={`/reports/${r._id || r.id}`} className="btn btn-sm btn-secondary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
