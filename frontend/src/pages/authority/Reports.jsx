import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, Eye, ChevronDown } from 'lucide-react';

import useApi from '../../hooks/useApi';
import { getReports, getRoadSegments } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatDamageType, formatDate, formatConfidence, truncateId } from '../../utils/helpers';

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['ALL', 'PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

function AIStatusBadge({ confidence, verified }) {
  if (verified) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
        background: 'rgba(34,197,94,0.15)', color: '#22c55e'
      }}>
        ✓ AI Verified {confidence ? `${formatConfidence(confidence)}` : ''}
      </span>
    );
  }
  if (confidence) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
        background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary)'
      }}>
        AI {formatConfidence(confidence)}
      </span>
    );
  }
  return (
    <span style={{
      padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
      background: 'var(--color-border)', color: 'var(--color-text-secondary)'
    }}>
      Pending
    </span>
  );
}

export default function Reports() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const { data: reportsData, loading, error, refetch } = useApi(getReports);
  const { data: roadsData } = useApi(getRoadSegments);

  const reports = reportsData?.reports || reportsData || [];
  const roads = roadsData?.segments || roadsData || [];

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      String(r.id).toLowerCase().includes(search.toLowerCase()) ||
      (r.damage_type || r.ai_damage_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.road_segment_name || '').toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === 'ALL' || (r.severity || r.ai_severity) === severityFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchDate = !dateFilter || (r.submitted_at || r.created_at || '').startsWith(dateFilter);
    return matchSearch && matchSeverity && matchStatus && matchDate;
  });

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
            Reports
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {loading ? '—' : `${reports.length} total reports`} · Manage damage reports across the city
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)', padding: '1rem', marginBottom: '1.25rem',
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search ID, damage type, road…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'var(--color-background)',
              color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Severity */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {SEVERITIES.map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)} style={{
              padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: severityFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
              color: severityFilter === s ? '#fff' : 'var(--color-text-secondary)',
            }}>{s}</button>
          ))}
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'var(--color-background)', color: 'var(--color-text-primary)',
            fontSize: '0.85rem', cursor: 'pointer', outline: 'none'
          }}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>

        {/* Date */}
        <input
          type="month"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'var(--color-background)', color: 'var(--color-text-primary)',
            fontSize: '0.85rem', outline: 'none'
          }}
        />

        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginLeft: 'auto' }}>
          {filtered.length} results
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 44, marginBottom: 6, borderRadius: 6 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No reports found" description="Try adjusting your filters or search query." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
                  {['Report ID', 'Damage Type', 'Road Segment', 'Severity', 'Status', 'AI Status', 'Risk Score', 'Submitted By', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 0.875rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 0.875rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Link to={`/authority/reports/${r.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600 }}>
                          #{truncateId(r.id)}
                        </Link>
                        {r.is_recurring && (
                          <RefreshCw size={12} color="#f97316" title="Recurring damage" />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-primary)' }}>
                      {formatDamageType(r.damage_type || r.ai_damage_type || 'Unknown')}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      {r.road_segment_name || truncateId(r.road_segment_id) || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <SeverityBadge severity={r.severity || r.ai_severity} />
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <AIStatusBadge confidence={r.ai_confidence} verified={r.ai_verified} />
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      {r.risk_score != null ? (
                        <span style={{
                          fontWeight: 700, fontSize: '0.85rem',
                          color: r.risk_score >= 75 ? '#ef4444' : r.risk_score >= 50 ? '#f97316' : r.risk_score >= 25 ? '#eab308' : '#22c55e'
                        }}>
                          {Math.round(r.risk_score)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      {r.submitted_by || r.user_id || 'Anonymous'}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', color: 'var(--color-text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatDate(r.submitted_at || r.created_at)}
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem' }}>
                      <Link
                        to={`/authority/reports/${r.id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.35rem 0.7rem', background: 'var(--color-primary)',
                          color: '#fff', borderRadius: 6, textDecoration: 'none',
                          fontSize: '0.75rem', fontWeight: 600
                        }}
                      >
                        <Eye size={12} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
