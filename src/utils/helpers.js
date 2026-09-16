/**
 * src/utils/helpers.js
 * Shared utility functions used across the RoadIQ frontend.
 */

// ── Severity ──────────────────────────────────────────────────────────────────

export const SEVERITY_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export const getSeverityColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'LOW':      return '#10b981';
    case 'MEDIUM':   return '#f59e0b';
    case 'HIGH':     return '#ef4444';
    case 'CRITICAL': return '#dc2626';
    default:         return '#64748b';
  }
};

export const getSeverityBadgeClass = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'LOW':      return 'badge badge-low';
    case 'MEDIUM':   return 'badge badge-medium';
    case 'HIGH':     return 'badge badge-high';
    case 'CRITICAL': return 'badge badge-critical';
    default:         return 'badge';
  }
};

// ── Status ────────────────────────────────────────────────────────────────────

export const STATUS_LABELS = {
  PENDING:               'Pending',
  ASSIGNED:              'Assigned',
  UNDER_REPAIR:          'Under Repair',
  RESOLVED:              'Resolved',
  VERIFICATION_REQUIRED: 'Verify Required',
};

export const STATUS_FLOW = [
  'PENDING',
  'ASSIGNED',
  'UNDER_REPAIR',
  'RESOLVED',
];

export const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':               return 'badge badge-pending';
    case 'ASSIGNED':              return 'badge badge-assigned';
    case 'UNDER_REPAIR':          return 'badge badge-repair';
    case 'RESOLVED':              return 'badge badge-resolved';
    case 'VERIFICATION_REQUIRED': return 'badge badge-verify';
    default:                      return 'badge';
  }
};

export const getNextStatus = (current) => {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
};

// ── Road Health ───────────────────────────────────────────────────────────────

export const getHealthLabel = (score) => {
  if (score >= 80) return 'GOOD';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
};

export const getHealthColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#dc2626';
};

export const getHealthClass = (score) => {
  if (score >= 80) return 'health-good';
  if (score >= 60) return 'health-moderate';
  if (score >= 40) return 'health-poor';
  return 'health-critical';
};

// ── Priority Score ────────────────────────────────────────────────────────────

export const getPriorityColor = (score) => {
  if (score >= 80) return '#dc2626';
  if (score >= 60) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
};

// ── Damage Type ───────────────────────────────────────────────────────────────

export const DAMAGE_TYPE_LABELS = {
  pothole:            'Pothole',
  longitudinal_crack: 'Longitudinal Crack',
  transverse_crack:   'Transverse Crack',
  alligator_crack:    'Alligator Crack',
  damaged_road:       'Damaged Road',
};

export const formatDamageType = (type) =>
  DAMAGE_TYPE_LABELS[type] || type?.replace(/_/g, ' ') || 'Unknown';

// ── Formatting ────────────────────────────────────────────────────────────────

export const formatConfidence = (value) =>
  `${Math.round((value || 0) * 100)}%`;

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

export const formatDateShort = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
};

export const formatCoords = (lat, lng) => {
  if (lat == null || lng == null) return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};

export const truncateId = (id) => id?.slice(-8).toUpperCase() || '—';

// ── Marker color (Leaflet) ────────────────────────────────────────────────────

export const getMarkerColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'LOW':      return '#10b981';
    case 'MEDIUM':   return '#f59e0b';
    case 'HIGH':     return '#ef4444';
    case 'CRITICAL': return '#dc2626';
    default:         return '#64748b';
  }
};
