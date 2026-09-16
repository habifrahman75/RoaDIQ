/**
 * src/components/SeverityBadge.jsx
 */
import { getSeverityBadgeClass, getSeverityColor } from '../utils/helpers';

export default function SeverityBadge({ severity }) {
  if (!severity) return null;
  const label = severity.charAt(0) + severity.slice(1).toLowerCase();
  return <span className={getSeverityBadgeClass(severity)}>{label}</span>;
}
