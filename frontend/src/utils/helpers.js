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

// ── AI / Report Status ────────────────────────────────────────────────────────

export const STATUS_LABELS = {
  PENDING:               'Pending',
  AI_PROCESSING:         'AI Processing',
  AI_VERIFIED:           'AI Verified',
  NEEDS_EVIDENCE:        'Needs Evidence',
  DUPLICATE:             'Duplicate',
  UNDER_REVIEW:          'Under Review',
  ACCEPTED:              'Accepted',
  REJECTED:              'Rejected',
  ASSIGNED:              'Assigned',
  UNDER_REPAIR:          'Under Repair',
  REPAIR_VERIFICATION:   'Repair Verify',
  RESOLVED:              'Resolved',
  VERIFICATION_REQUIRED: 'Verify Required',
  IN_PROGRESS:           'In Progress',
  VERIFIED:              'Verified',
};

export const STATUS_FLOW = [
  'PENDING', 'AI_VERIFIED', 'UNDER_REVIEW', 'ASSIGNED', 'UNDER_REPAIR', 'REPAIR_VERIFICATION', 'RESOLVED',
];

export const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING':               return 'badge badge-pending';
    case 'AI_PROCESSING':         return 'badge badge-ai-processing';
    case 'AI_VERIFIED':           return 'badge badge-ai-verified';
    case 'NEEDS_EVIDENCE':        return 'badge badge-needs-evidence';
    case 'DUPLICATE':             return 'badge badge-pending';
    case 'UNDER_REVIEW':          return 'badge badge-under-review';
    case 'ACCEPTED':              return 'badge badge-assigned';
    case 'REJECTED':              return 'badge badge-danger';
    case 'ASSIGNED':              return 'badge badge-assigned';
    case 'UNDER_REPAIR':          return 'badge badge-repair';
    case 'IN_PROGRESS':           return 'badge badge-repair';
    case 'REPAIR_VERIFICATION':   return 'badge badge-verify';
    case 'VERIFICATION_REQUIRED': return 'badge badge-verify';
    case 'VERIFIED':              return 'badge badge-resolved';
    case 'RESOLVED':              return 'badge badge-resolved';
    default:                      return 'badge badge-pending';
  }
};

export const getNextStatus = (current) => {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
};

// ── Road Health ────────────────────────────────────────────────────────────────

export const getHealthLabel = (score) => {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Watch';
  if (score >= 40) return 'Degrading';
  return 'Critical';
};

export const getHealthColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

export const getHealthClass = (score) => {
  if (score >= 80) return 'health-good';
  if (score >= 60) return 'health-moderate';
  if (score >= 40) return 'health-poor';
  return 'health-critical';
};

export const getHealthStatusLabel = (status) => {
  switch (status?.toUpperCase()) {
    case 'HEALTHY':   return 'Healthy';
    case 'WATCH':     return 'Watch';
    case 'DEGRADING': return 'Degrading';
    case 'CRITICAL':  return 'Critical';
    default:          return status || 'Unknown';
  }
};

export const getHealthStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'HEALTHY':   return '#10b981';
    case 'WATCH':     return '#f59e0b';
    case 'DEGRADING': return '#f97316';
    case 'CRITICAL':  return '#ef4444';
    default:          return '#64748b';
  }
};

// ── Risk Score ────────────────────────────────────────────────────────────────

export const getRiskColor = (score) => {
  if (score >= 80) return '#ef4444';
  if (score >= 60) return '#f97316';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
};

export const getRiskLabel = (score) => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
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

export const formatConfidence = (value) => `${Math.round((value || 0) * 100)}%`;

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};

export const formatDateShort = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
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

// ── Event type icons ──────────────────────────────────────────────────────────
export const getEventColor = (type) => {
  switch (type) {
    case 'DETECTED':        return '#64748b';
    case 'REPORTED':        return '#3b82f6';
    case 'VERIFIED':        return '#06b6d4';
    case 'ASSIGNED':        return '#8b5cf6';
    case 'REPAIRED':        return '#10b981';
    case 'VERIFIED_REPAIR': return '#10b981';
    case 'RESOLVED':        return '#10b981';
    case 'RECURRING':       return '#ef4444';
    default:                return '#64748b';
  }
};
