/**
 * src/components/ReportCard.jsx
 * Mobile-friendly card layout for a single damage report.
 * Used on the Reports page when the viewport is small.
 */
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { formatDamageType, formatConfidence, formatDateShort, formatCoords, truncateId } from '../utils/helpers';

export default function ReportCard({ report }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
            #{truncateId(report._id || report.id)}
          </p>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatDamageType(report.damage_type)}</p>
        </div>
        <SeverityBadge severity={report.severity} />
      </div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Confidence</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatConfidence(report.confidence)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Priority</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ef4444' }}>{report.priority_score ?? '—'}</p>
        </div>
      </div>

      {/* Location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
        <MapPin size={13} />
        {formatCoords(report.latitude, report.longitude)}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={report.status} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDateShort(report.created_at)}</span>
        </div>
        <Link to={`/reports/${report._id || report.id}`} className="btn btn-sm btn-secondary">
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
