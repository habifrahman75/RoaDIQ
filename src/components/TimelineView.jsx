/**
 * src/components/TimelineView.jsx
 * Vertical timeline for road history events.
 */
import { CheckCircle, AlertTriangle, Wrench, Eye, Plus, RefreshCw } from 'lucide-react';
import { getEventColor } from '../utils/helpers';
import { formatDateShort } from '../utils/helpers';

const ICONS = {
  DETECTED:        Eye,
  REPORTED:        Plus,
  VERIFIED:        CheckCircle,
  ASSIGNED:        Wrench,
  REPAIRED:        Wrench,
  VERIFIED_REPAIR: CheckCircle,
  RESOLVED:        CheckCircle,
  RECURRING:       RefreshCw,
};

export default function TimelineView({ events = [] }) {
  if (!events.length) return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: 16 }}>No history events.</p>;

  return (
    <div style={{ position: 'relative', padding: '4px 0' }}>
      {/* Vertical line */}
      <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'var(--color-border)' }} />

      {events.map((evt, i) => {
        const color = getEventColor(evt.type);
        const Icon = ICONS[evt.type] || Eye;
        const isLast = i === events.length - 1;
        return (
          <div key={evt.id} style={{ display: 'flex', gap: 16, marginBottom: isLast ? 0 : 24, position: 'relative', alignItems: 'flex-start' }}>
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `${color}20`, border: `2px solid ${color}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, zIndex: 1, position: 'relative',
              boxShadow: evt.type === 'RECURRING' ? `0 0 0 3px ${color}30` : 'none',
            }}>
              <Icon size={14} color={color} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>{evt.title}</p>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {formatDateShort(evt.date)}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{evt.description}</p>
              {evt.severity && (
                <span style={{
                  display: 'inline-block', marginTop: 4,
                  fontSize: '0.7rem', fontWeight: 600, color,
                  background: `${color}15`, padding: '1px 8px', borderRadius: 99,
                  border: `1px solid ${color}30`,
                }}>
                  {evt.severity}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
