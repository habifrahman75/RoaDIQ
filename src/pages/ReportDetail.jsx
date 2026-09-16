/**
 * src/pages/ReportDetail.jsx
 * Single report detail view with status management and map.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Calendar, Tag, Activity, ChevronDown } from 'lucide-react';
import { getReport, updateReportStatus } from '../services/api';
import { useApi } from '../hooks/useApi';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import { PageLoader, Skeleton } from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { Spinner } from '../components/Loading';
import {
  formatDamageType, formatConfidence, formatDate, formatCoords,
  getHealthColor, getPriorityColor, STATUS_FLOW, STATUS_LABELS,
  getNextStatus,
} from '../utils/helpers';

// ── Priority Ring ─────────────────────────────────────────────────────────────
function PriorityRing({ score }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = getPriorityColor(score);
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-bg-elevated)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>Priority</span>
      </div>
    </div>
  );
}

// ── Status Progress Bar ───────────────────────────────────────────────────────
function StatusProgress({ current }) {
  const idx = STATUS_FLOW.indexOf(current);
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {STATUS_FLOW.map((s, i) => (
        <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: '100%', height: 4,
            background: i <= idx ? 'var(--color-primary)' : 'var(--color-border)',
            borderRadius: i === 0 ? '99px 0 0 99px' : i === STATUS_FLOW.length - 1 ? '0 99px 99px 0' : 0,
            transition: 'background 400ms ease',
          }} />
          <span style={{
            fontSize: '0.65rem',
            fontWeight: i === idx ? 700 : 400,
            color: i <= idx ? 'var(--color-primary)' : 'var(--color-text-muted)',
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            {STATUS_LABELS[s]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: report, loading, error, refetch } = useApi(() => getReport(id), [id]);

  const [updating,    setUpdating]    = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus,   setNewStatus]   = useState('');

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await updateReportStatus(id, newStatus);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
      refetch();
      setStatusModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="page-wrapper"><PageLoader /></div>;
  if (error)   return <div className="page-wrapper"><ErrorState message={error} onRetry={refetch} /></div>;
  if (!report) return null;

  const nextStatus = getNextStatus(report.status);

  return (
    <div className="page-wrapper fade-in">
      {/* Back */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* ── Header ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <PriorityRing score={report.priority_score || 0} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Report #{(report._id || report.id || '').slice(-8).toUpperCase()}
              </p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
                {formatDamageType(report.damage_type)}
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <SeverityBadge severity={report.severity} />
                <StatusBadge   status={report.status} />
                <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {formatConfidence(report.confidence)} confidence
                </span>
              </div>
            </div>
          </div>

          {/* Update Status button */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => { setNewStatus(nextStatus || report.status); setStatusModal(true); }}
            >
              Update Status <ChevronDown size={14} />
            </button>
            {report.status === 'RESOLVED' && (
              <Link to="/verification" className="btn btn-secondary">
                Submit Verification
              </Link>
            )}
          </div>
        </div>

        {/* Status progress */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>Repair Progress</p>
          <StatusProgress current={report.status} />
        </div>
      </div>

      {/* ── Details + Map ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Details Card */}
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontWeight: 700, marginBottom: 20, fontSize: '0.95rem' }}>Report Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: Tag,      label: 'Damage Type',   value: formatDamageType(report.damage_type) },
              { icon: Activity, label: 'Confidence',    value: formatConfidence(report.confidence)  },
              { icon: MapPin,   label: 'GPS Location',  value: formatCoords(report.latitude, report.longitude) },
              { icon: Tag,      label: 'Road Segment',  value: report.road_segment_name || report.road_segment_id || '—' },
              { icon: Calendar, label: 'Reported At',   value: formatDate(report.created_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="var(--color-text-muted)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{value}</p>
                </div>
              </div>
            ))}

            {report.notes && (
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Field Notes</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, background: 'var(--color-bg-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  {report.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Location</p>
          {report.latitude != null && report.longitude != null
            ? <MapView reports={[report]} height="300px" zoom={15} center={[report.latitude, report.longitude]} />
            : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No GPS data</div>
          }
        </div>
      </div>

      {/* Image section */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <p style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Damage Image</p>
        {report.image_url
          ? <img src={report.image_url} alt="Damage" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
          : (
            <div style={{ height: 160, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No image attached
            </div>
          )
        }
      </div>

      {/* ── Status Update Modal ── */}
      {statusModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Update Status">
          <div className="modal" style={{ padding: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Update Repair Status</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
              Select the new status for this report.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[...STATUS_FLOW, 'VERIFICATION_REQUIRED'].map((s) => (
                <label key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${newStatus === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: newStatus === s ? 'var(--color-primary-glow)' : 'var(--color-bg-elevated)',
                  cursor: 'pointer', transition: 'background var(--transition), border-color var(--transition)',
                }}>
                  <input type="radio" name="status" value={s} checked={newStatus === s} onChange={() => setNewStatus(s)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{STATUS_LABELS[s] || s}</span>
                  {s === report.status && <span className="badge badge-assigned" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Current</span>}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStatusModal(false)} disabled={updating}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStatusUpdate} disabled={updating || newStatus === report.status}>
                {updating ? <><Spinner size={14} /> Saving…</> : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .report-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
