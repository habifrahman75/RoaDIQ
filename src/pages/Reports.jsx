/**
 * src/pages/Reports.jsx
 * Damage reports list with search, filters, responsive table (desktop) and cards (mobile).
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, ArrowUpDown } from 'lucide-react';
import { getReports } from '../services/api';
import { useApi } from '../hooks/useApi';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import ReportCard from '../components/ReportCard';
import { TableRowSkeleton } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import {
  formatDamageType, formatConfidence, formatDateShort,
  formatCoords, truncateId, DAMAGE_TYPE_LABELS, SEVERITY_ORDER,
} from '../utils/helpers';

const SEVERITY_OPTS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUS_OPTS   = ['ALL', 'PENDING', 'ASSIGNED', 'UNDER_REPAIR', 'RESOLVED', 'VERIFICATION_REQUIRED'];

export default function Reports() {
  const { data: reports, loading, error, refetch } = useApi(getReports);

  const [search,   setSearch]   = useState('');
  const [severity, setSeverity] = useState('ALL');
  const [status,   setStatus]   = useState('ALL');
  const [type,     setType]     = useState('ALL');
  const [sortKey,  setSortKey]  = useState('created_at');
  const [sortDir,  setSortDir]  = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    if (!reports) return [];
    let list = [...reports];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        formatDamageType(r.damage_type).toLowerCase().includes(q) ||
        (r._id || r.id || '').toLowerCase().includes(q) ||
        (r.road_segment_name || '').toLowerCase().includes(q)
      );
    }
    if (severity !== 'ALL') list = list.filter((r) => r.severity === severity);
    if (status   !== 'ALL') list = list.filter((r) => r.status   === status);
    if (type     !== 'ALL') list = list.filter((r) => r.damage_type === type);

    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'severity') { av = SEVERITY_ORDER[av] ?? -1; bv = SEVERITY_ORDER[bv] ?? -1; }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return list;
  }, [reports, search, severity, status, type, sortKey, sortDir]);

  if (error) return <div className="page-wrapper"><ErrorState message={error} onRetry={refetch} /></div>;

  const SortHeader = ({ label, field }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        <ArrowUpDown size={12} style={{ opacity: sortKey === field ? 1 : 0.3 }} />
      </span>
    </th>
  );

  return (
    <div className="page-wrapper fade-in">
      {/* ── Filters ── */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search by type, ID, segment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITY_OPTS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Severity' : s}</option>)}
          </select>

          <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Status' : s.replace(/_/g, ' ')}</option>)}
          </select>

          <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">All Types</option>
            {Object.entries(DAMAGE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="card table-wrapper" style={{ display: 'none' }} id="desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <SortHeader label="Damage Type" field="damage_type" />
              <SortHeader label="Severity" field="severity" />
              <th>Confidence</th>
              <th>Location</th>
              <SortHeader label="Priority" field="priority_score" />
              <th>Status</th>
              <SortHeader label="Date" field="created_at" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={9} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState title="No reports found" description="Try adjusting your filters." />
                    </td>
                  </tr>
                )
                : filtered.map((r) => (
                  <tr key={r._id || r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      #{truncateId(r._id || r.id)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatDamageType(r.damage_type)}</td>
                    <td><SeverityBadge severity={r.severity} /></td>
                    <td>{formatConfidence(r.confidence)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {formatCoords(r.latitude, r.longitude)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: r.priority_score >= 80 ? '#ef4444' : r.priority_score >= 60 ? '#f59e0b' : '#10b981' }}>
                        {r.priority_score ?? '—'}
                      </span>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatDateShort(r.created_at)}
                    </td>
                    <td>
                      <Link to={`/reports/${r._id || r.id}`} className="btn btn-sm btn-secondary">
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div style={{ display: 'none', flexDirection: 'column', gap: 12 }} id="mobile-cards">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} style={{ height: 16, background: 'var(--color-bg-elevated)', borderRadius: 4, animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          ))
          : filtered.length === 0
            ? <EmptyState title="No reports found" description="Try adjusting your filters." />
            : filtered.map((r) => <ReportCard key={r._id || r.id} report={r} />)
        }
      </div>

      <style>{`
        @media (min-width: 769px) { #desktop-table { display: block !important; } }
        @media (max-width: 768px) { #mobile-cards { display: flex !important; } }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  );
}
