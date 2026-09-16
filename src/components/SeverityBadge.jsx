/**
 * src/components/SeverityBadge.jsx
 */
import { getSeverityBadgeClass } from '../utils/helpers';

export default function SeverityBadge({ severity }) {
  if (!severity) return <span className="badge" style={{ color: 'var(--color-text-muted)' }}>—</span>;
  return (
    <span className={getSeverityBadgeClass(severity)}>
      {severity}
    </span>
  );
}
