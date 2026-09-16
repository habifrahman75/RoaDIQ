/**
 * src/components/StatusBadge.jsx
 */
import { getStatusBadgeClass, STATUS_LABELS } from '../utils/helpers';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ');
  return <span className={getStatusBadgeClass(status)}>{label}</span>;
}
