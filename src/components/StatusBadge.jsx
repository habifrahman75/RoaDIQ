/**
 * src/components/StatusBadge.jsx
 */
import { getStatusBadgeClass, STATUS_LABELS } from '../utils/helpers';

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge" style={{ color: 'var(--color-text-muted)' }}>—</span>;
  return (
    <span className={getStatusBadgeClass(status)}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
