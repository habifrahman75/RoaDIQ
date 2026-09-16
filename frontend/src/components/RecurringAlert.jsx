/**
 * src/components/RecurringAlert.jsx
 * Prominent recurring damage alert card.
 */
import { RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDamageType } from '../utils/helpers';

export default function RecurringAlert({ data, compact = false }) {
  if (!data) return null;
  const { road_segment_id, road_segment_name, damage_type, repairs_in_90d, latest_recurrence_days, risk } = data;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #ef4444' }}>
        <RefreshCw size={16} color="#ef4444" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            Recurring: {road_segment_name}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {repairs_in_90d} repairs in 90d · Recurred {latest_recurrence_days}d after repair
          </p>
        </div>
        <Link to={`/authority/roads/${road_segment_id}`} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <RefreshCw size={18} color="#ef4444" />
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
            ⚠ Recurring Damage Detected
          </p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recurring Failure Alert</p>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Road Segment', value: road_segment_id },
          { label: 'Segment Name', value: road_segment_name },
          { label: 'Damage Type', value: formatDamageType(damage_type) },
          { label: 'Repairs in 90 Days', value: `${repairs_in_90d} attempts` },
          { label: 'Latest Recurrence', value: `${latest_recurrence_days} days after repair` },
          { label: 'Risk Level', value: <span style={{ color: '#ef4444', fontWeight: 700 }}>{risk}</span> },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '8px 12px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 3 }}>{label}</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {data.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 14 }}>{data.description}</p>
      )}

      <Link to={`/authority/roads/${road_segment_id}`} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        View Road Memory <ArrowRight size={13} />
      </Link>
    </div>
  );
}
