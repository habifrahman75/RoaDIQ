/**
 * src/pages/Map.jsx
 * Full-page interactive Leaflet map with filter controls and report sidebar.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, X, MapPin } from 'lucide-react';
import { getReports } from '../services/api';
import { useApi } from '../hooks/useApi';
import MapView from '../components/MapView';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import { PageLoader } from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { formatDamageType, formatConfidence, formatDateShort, DAMAGE_TYPE_LABELS } from '../utils/helpers';

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUS_OPTIONS   = ['ALL', 'PENDING', 'ASSIGNED', 'UNDER_REPAIR', 'RESOLVED', 'VERIFICATION_REQUIRED'];

export default function MapPage() {
  const navigate = useNavigate();
  const { data: reports, loading, error, refetch } = useApi(getReports);

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter,   setStatusFilter]   = useState('ALL');
  const [typeFilter,     setTypeFilter]      = useState('ALL');
  const [selected,       setSelected]        = useState(null);

  const filtered = (reports || []).filter((r) => {
    if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
    if (statusFilter   !== 'ALL' && r.status   !== statusFilter)   return false;
    if (typeFilter     !== 'ALL' && r.damage_type !== typeFilter)   return false;
    return true;
  });

  const handleMarkerClick = useCallback((report) => setSelected(report), []);

  if (loading) return <div className="page-wrapper"><PageLoader /></div>;
  if (error)   return <div className="page-wrapper"><ErrorState message={error} onRetry={refetch} /></div>;

  return (
    <div className="page-wrapper fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - var(--navbar-height) - 48px)' }}>
      {/* ── Filters ── */}
      <div className="card" style={{ padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem', flexShrink: 0 }}>
            <Filter size={15} />
            <span>Filter:</span>
          </div>

          {/* Severity */}
          <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>)}
          </select>

          {/* Status */}
          <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
          </select>

          {/* Damage type */}
          <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            {Object.entries(DAMAGE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* Count */}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {filtered.length} marker{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Map + Sidebar ── */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <MapView
            reports={filtered}
            height="100%"
            zoom={12}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Selected report sidebar */}
        {selected && (
          <div className="card" style={{ width: 300, flexShrink: 0, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatDamageType(selected.damage_type)}</p>
              <button className="btn-icon" onClick={() => setSelected(null)} aria-label="Close">
                <X size={14} />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <SeverityBadge severity={selected.severity} />
              <StatusBadge   status={selected.status} />
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Confidence',      value: formatConfidence(selected.confidence) },
                { label: 'Priority Score',  value: selected.priority_score ?? '—' },
                { label: 'Road Segment',    value: selected.road_segment_name || '—' },
                { label: 'Reported',        value: formatDateShort(selected.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{value}</p>
                </div>
              ))}

              {/* Coords */}
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>GPS Coordinates</p>
                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                  <MapPin size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {selected.latitude?.toFixed(6)}, {selected.longitude?.toFixed(6)}
                </p>
              </div>

              {selected.notes && (
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Notes</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{selected.notes}</p>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: 'auto' }}
              onClick={() => navigate(`/reports/${selected._id || selected.id}`)}
            >
              View Full Report
            </button>
          </div>
        )}
      </div>

      {/* Responsive sidebar goes below map on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .map-with-sidebar { flex-direction: column !important; }
          .map-with-sidebar > div:last-child { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
