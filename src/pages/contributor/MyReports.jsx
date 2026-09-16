/**
 * src/pages/contributor/MyReports.jsx
 * Contributor's own submitted reports with filter tabs, card view, progress timeline,
 * and expandable AI analysis detail.
 */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, ChevronDown, ChevronUp, MapPin, Film, Image,
  RefreshCw, Cpu, Calendar, BarChart2, FileText,
} from 'lucide-react';

import { getReports } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import { Skeleton } from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import {
  formatDamageType, formatDateShort, formatConfidence,
  STATUS_LABELS,
} from '../../utils/helpers';

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'ALL',            label: 'All'             },
  { key: 'AI_VERIFIED',   label: 'AI Verified'     },
  { key: 'UNDER_REPAIR',  label: 'Under Repair'    },
  { key: 'RESOLVED',      label: 'Resolved'        },
  { key: 'NEEDS_EVIDENCE', label: 'Needs Evidence' },
];

// ── Progress timeline steps ───────────────────────────────────────────────────
const TIMELINE_STEPS = ['Submitted', 'AI Verified', 'Under Review', 'Repair', 'Resolved'];

function getStepIndex(status) {
  const map = {
    PENDING: 0, AI_PROCESSING: 0,
    AI_VERIFIED: 1, NEEDS_EVIDENCE: 1,
    UNDER_REVIEW: 2, ACCEPTED: 2,
    ASSIGNED: 3, UNDER_REPAIR: 3, REPAIR_VERIFICATION: 3,
    RESOLVED: 4,
  };
  return map[status] ?? 0;
}

function ProgressTimeline({ status }) {
  const current = getStepIndex(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 10 }}>
      {TIMELINE_STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        const futureOrNA = status === 'NEEDS_EVIDENCE' && i > 0;
        const dotColor = done
          ? '#10b981'
          : active
          ? 'var(--color-primary)'
          : 'var(--color-border)';
        const lineColor = done ? '#10b981' : 'var(--color-border)';
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < TIMELINE_STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div
                title={step}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: dotColor,
                  outline: active ? `3px solid rgba(59,130,246,0.3)` : 'none',
                  flexShrink: 0,
                  transition: 'background 300ms ease',
                }}
              />
              <span style={{ fontSize: '0.6rem', color: active ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400 }}>
                {step}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: lineColor, margin: '0 3px', marginBottom: 14, transition: 'background 300ms ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Expandable Detail Section ─────────────────────────────────────────────────
function DetailSection({ report }) {
  const ai = report.ai_analysis;
  if (!ai) return <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: 16 }}>No AI analysis available for this report.</p>;

  const rows = [
    { label: 'Confidence',     value: ai.confidence ? formatConfidence(ai.confidence) : '—' },
    { label: 'Severity',       value: ai.severity    || '—' },
    { label: 'Estimated Size', value: ai.estimated_size || '—' },
    { label: 'Risk Score',     value: ai.risk_score ? `${ai.risk_score} / 100` : '—' },
    { label: 'AI Status',      value: STATUS_LABELS[ai.status] || ai.status || '—' },
    { label: 'Location Ref',   value: ai.location_ref || '—' },
  ];

  return (
    <div style={{ padding: '14px 20px', background: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border)' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>AI Analysis Detail</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{value}</p>
          </div>
        ))}
      </div>
      {ai.rejection_reason && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: '0.78rem', color: '#f59e0b' }}>⚠ {ai.rejection_reason}</p>
        </div>
      )}
      {report.repair_status && (
        <p style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Repair status:</span>{' '}
          {STATUS_LABELS[report.repair_status] || report.repair_status}
          {report.repair_id && <span style={{ color: 'var(--color-text-muted)' }}> · {report.repair_id}</span>}
        </p>
      )}
    </div>
  );
}

// ── Single Report Card ────────────────────────────────────────────────────────
function ReportCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const isVideo = report.evidence_type === 'video';
  const hasRisk = report.ai_analysis?.risk_score != null;

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', transition: 'border-color 200ms ease' }}
    >
      {/* Main content */}
      <div style={{ padding: '16px 20px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                {report._id}
              </span>
              {/* Evidence type badge */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: isVideo ? '#a78bfa' : '#60a5fa', background: isVideo ? 'rgba(167,139,250,0.1)' : 'rgba(96,165,250,0.1)', padding: '2px 8px', borderRadius: 99, border: `1px solid ${isVideo ? 'rgba(167,139,250,0.3)' : 'rgba(96,165,250,0.3)'}` }}>
                {isVideo ? <Film size={11} /> : <Image size={11} />}
                {isVideo ? 'Video' : 'Photo'}
              </span>
              {/* Recurring badge */}
              {report.is_recurring && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(239,68,68,0.25)' }}>
                  <RefreshCw size={10} /> Recurring {report.recurrence_count > 1 ? `×${report.recurrence_count}` : ''}
                </span>
              )}
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)', marginTop: 2 }}>
              {formatDamageType(report.damage_type)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <MapPin size={11} />
              <span>{report.road_segment_name || '—'}</span>
              <span style={{ color: 'var(--color-border)' }}>·</span>
              <Calendar size={11} />
              <span>{formatDateShort(report.created_at)}</span>
            </div>
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <StatusBadge status={report.status} />
            <SeverityBadge severity={report.severity} />
            {hasRisk && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                <BarChart2 size={11} />
                Risk: <span style={{ fontWeight: 700, color: report.ai_analysis.risk_score >= 80 ? '#ef4444' : report.ai_analysis.risk_score >= 60 ? '#f97316' : '#f59e0b' }}>{report.ai_analysis.risk_score}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Timeline */}
        <ProgressTimeline status={report.status} />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-muted)', fontSize: '0.78rem', padding: 0 }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide details' : 'View AI analysis details'}
        </button>
      </div>

      {/* Expandable AI Details */}
      {expanded && <DetailSection report={report} />}
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function ReportCardSkeleton() {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={18} width="40%" />
      <Skeleton height={22} width="65%" />
      <Skeleton height={14} width="50%" />
      <Skeleton height={10} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MyReports() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchReports = useCallback(
    () => getReports({ submitted_by: user?.id }),
    [user?.id]
  );
  const { data: reports, loading } = useApi(fetchReports, [user?.id]);

  const filtered = (reports || []).filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.status === activeFilter;
  });

  const countFor = (key) => {
    if (!reports) return 0;
    if (key === 'ALL') return reports.length;
    return reports.filter((r) => r.status === key).length;
  };

  return (
    <div className="page-wrapper fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>My Reports</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {loading ? 'Loading…' : `${reports?.length ?? 0} report${reports?.length !== 1 ? 's' : ''} submitted`}
          </p>
        </div>
        <Link to="/contributor/report" className="btn btn-primary">
          <Plus size={15} /> Report Damage
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map((f) => {
          const count   = countFor(f.key);
          const active  = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: active ? 'rgba(59,130,246,0.15)' : 'var(--color-bg-elevated)',
                color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.label}
              {count > 0 && (
                <span style={{
                  background: active ? 'var(--color-primary)' : 'var(--color-bg-card)',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                  borderRadius: 99,
                  padding: '0 6px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: `1px solid ${active ? 'transparent' : 'var(--color-border)'}`,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Report Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <ReportCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports found"
          description={activeFilter === 'ALL' ? 'You have not submitted any reports yet.' : `No reports with status "${FILTERS.find(f => f.key === activeFilter)?.label}".`}
          action={
            activeFilter === 'ALL'
              ? <Link to="/contributor/report" className="btn btn-primary"><Plus size={14} /> Submit First Report</Link>
              : <button onClick={() => setActiveFilter('ALL')} className="btn btn-secondary">View All Reports</button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((r) => <ReportCard key={r._id} report={r} />)}
        </div>
      )}
    </div>
  );
}
