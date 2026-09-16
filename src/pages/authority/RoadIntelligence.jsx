import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

import useApi from '../../hooks/useApi';
import { getRoadSegments } from '../../services/api';
import RoadHealthGauge from '../../components/RoadHealthGauge';
import StatusBadge from '../../components/StatusBadge';
import { StatCardSkeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { getHealthLabel, getRiskColor, truncateId } from '../../utils/helpers';

function getStatusFromScore(score) {
  if (score >= 75) return 'HEALTHY';
  if (score >= 50) return 'WATCH';
  if (score >= 25) return 'DEGRADING';
  return 'CRITICAL';
}

const STATUS_OPTIONS = ['All', 'HEALTHY', 'WATCH', 'DEGRADING', 'CRITICAL'];
const SORT_OPTIONS = [
  { value: 'health_asc', label: 'Health (Worst First)' },
  { value: 'health_desc', label: 'Health (Best First)' },
  { value: 'risk_desc', label: 'Risk (Highest First)' },
  { value: 'risk_asc', label: 'Risk (Lowest First)' },
];

export default function RoadIntelligence() {
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('health_asc');

  const { data: roadsData, loading, error, refetch } = useApi(getRoadSegments);
  const roads = roadsData?.segments || roadsData || [];

  const zones = ['All', ...Array.from(new Set(roads.map(r => r.zone).filter(Boolean)))];

  const filtered = roads
    .filter(r => {
      const matchSearch = !search ||
        (r.name || r.road_name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(r.id).toLowerCase().includes(search.toLowerCase());
      const matchZone = zoneFilter === 'All' || r.zone === zoneFilter;
      const status = getStatusFromScore(r.health_score ?? 50);
      const matchStatus = statusFilter === 'All' || status === statusFilter;
      return matchSearch && matchZone && matchStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'health_asc': return (a.health_score ?? 50) - (b.health_score ?? 50);
        case 'health_desc': return (b.health_score ?? 50) - (a.health_score ?? 50);
        case 'risk_desc': return (b.risk_score ?? 0) - (a.risk_score ?? 0);
        case 'risk_asc': return (a.risk_score ?? 0) - (b.risk_score ?? 0);
        default: return 0;
      }
    });

  const summaryStats = {
    total: roads.length,
    healthy: roads.filter(r => (r.health_score ?? 50) >= 75).length,
    watch: roads.filter(r => { const s = r.health_score ?? 50; return s >= 50 && s < 75; }).length,
    degrading: roads.filter(r => { const s = r.health_score ?? 50; return s >= 25 && s < 50; }).length,
    critical: roads.filter(r => (r.health_score ?? 50) < 25).length,
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
          Road Intelligence
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
          AI-powered health and risk assessment for all road segments
        </p>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.875rem' }}>
          {loading ? Array(5).fill(0).map((_, i) => <StatCardSkeleton key={i} />) : [
            { label: 'Total Segments', value: summaryStats.total, color: 'var(--color-primary)', icon: Activity },
            { label: 'Healthy', value: summaryStats.healthy, color: '#22c55e', icon: CheckCircle },
            { label: 'Watch', value: summaryStats.watch, color: '#eab308', icon: Activity },
            { label: 'Degrading', value: summaryStats.degrading, color: '#f97316', icon: AlertTriangle },
            { label: 'Critical', value: summaryStats.critical, color: '#ef4444', icon: AlertTriangle },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--color-surface)', borderRadius: 10, padding: '1rem',
              border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <s.icon size={20} color={s.color} />
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
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
            placeholder="Search road name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'var(--color-background)',
              color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Zone */}
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
          {zones.map(z => <option key={z} value={z}>{z === 'All' ? 'All Zones' : z}</option>)}
        </select>

        {/* Status */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
              color: statusFilter === s ? '#fff' : 'var(--color-text-secondary)',
            }}>{s}</button>
          ))}
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginLeft: 'auto' }}>
          {filtered.length} segments
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {Array(6).fill(0).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No road segments found" description="Try adjusting your filters." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((road, idx) => {
            const score = road.health_score ?? 50;
            const risk = road.risk_score ?? 0;
            const status = getStatusFromScore(score);
            const statusColors = { HEALTHY: '#22c55e', WATCH: '#eab308', DEGRADING: '#f97316', CRITICAL: '#ef4444' };
            return (
              <div
                key={road.id || idx}
                style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${statusColors[status]}30`,
                  padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem',
                  transition: 'box-shadow 0.15s'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', margin: '0 0 0.15rem 0' }}>
                      {truncateId(road.id)}
                    </p>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {road.name || road.road_name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      {road.zone && (
                        <span style={{ padding: '0.1rem 0.45rem', borderRadius: 999, background: 'var(--color-primary)', color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>
                          {road.zone}
                        </span>
                      )}
                      <span style={{ padding: '0.1rem 0.45rem', borderRadius: 999, background: `${statusColors[status]}18`, color: statusColors[status], fontSize: '0.68rem', fontWeight: 600 }}>
                        {status}
                      </span>
                    </div>
                  </div>
                  <RoadHealthGauge score={score} size={100} showLabel />
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { label: 'Risk Score', value: Math.round(risk), color: risk >= 75 ? '#ef4444' : risk >= 50 ? '#f97316' : '#22c55e' },
                    { label: 'Total Reports', value: road.total_reports ?? '—', color: 'var(--color-text-primary)' },
                    { label: 'Recurring', value: road.recurring_damage_count ?? 0, color: road.recurring_damage_count > 0 ? '#f97316' : 'var(--color-text-primary)' },
                    { label: 'Last Repair', value: road.days_since_repair != null ? `${road.days_since_repair}d ago` : '—', color: 'var(--color-text-primary)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--color-background)', borderRadius: 7, padding: '0.5rem 0.6rem', border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '0.67rem', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/authority/roads/${road.id}`}
                    style={{
                      flex: 1, display: 'block', padding: '0.5rem 0.875rem',
                      background: 'var(--color-primary)', color: '#fff',
                      borderRadius: 7, textDecoration: 'none', fontSize: '0.78rem',
                      fontWeight: 600, textAlign: 'center'
                    }}
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/authority/reports?road_segment=${road.id}`}
                    style={{
                      flex: 1, display: 'block', padding: '0.5rem 0.875rem',
                      background: 'var(--color-border)', color: 'var(--color-text-primary)',
                      borderRadius: 7, textDecoration: 'none', fontSize: '0.78rem',
                      fontWeight: 600, textAlign: 'center'
                    }}
                  >
                    View Reports
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
