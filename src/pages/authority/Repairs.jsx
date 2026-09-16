import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, CheckCircle, Clock, AlertTriangle, ChevronRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import useApi from '../../hooks/useApi';
import { getRepairs, updateRepairStatus } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatDamageType, formatDate, truncateId } from '../../utils/helpers';

const STATUS_FLOW = {
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'VERIFIED',
  VERIFIED: null,
};

const STATUS_LABELS = {
  ASSIGNED: 'Start Repair',
  IN_PROGRESS: 'Mark Verified',
  VERIFIED: 'Completed',
};

const FILTER_TABS = ['All', 'Assigned', 'In Progress', 'Verified'];
const TAB_STATUS = { 'All': null, 'Assigned': 'ASSIGNED', 'In Progress': 'IN_PROGRESS', 'Verified': 'VERIFIED' };

function RepairCard({ repair, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const nextStatus = STATUS_FLOW[repair.status];

  const handleUpdate = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await updateRepairStatus(repair.id, { status: nextStatus });
      toast.success(`Repair ${repair.id ? `#${truncateId(repair.id)}` : ''} updated to ${nextStatus.replace(/_/g, ' ')}`);
      onStatusUpdate();
    } catch {
      toast.error('Failed to update repair status.');
    } finally {
      setUpdating(false);
    }
  };

  const timeline = [
    { label: 'Assigned', date: repair.assigned_at },
    { label: 'Started', date: repair.started_at },
    { label: 'Completed', date: repair.completed_at },
  ].filter(t => t.date);

  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)', padding: '1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
              #{truncateId(repair.id)}
            </span>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {repair.road_segment_name || repair.road_name || `Road ${truncateId(repair.road_segment_id)}`}
            </h3>
            <SeverityBadge severity={repair.severity} />
            <StatusBadge status={repair.status} />
          </div>

          {/* Damage Type */}
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 0.875rem 0' }}>
            {formatDamageType(repair.damage_type || 'Unknown damage')}
          </p>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '0.875rem' }}>
            {repair.assigned_team && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                <Wrench size={13} />
                <span><strong style={{ color: 'var(--color-text-primary)' }}>Team:</strong> {repair.assigned_team}</span>
              </div>
            )}
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {timeline.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  <Calendar size={12} />
                  <span>{t.label}: <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(t.date)}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
          {nextStatus && (
            <button
              onClick={handleUpdate}
              disabled={updating}
              style={{
                padding: '0.5rem 1rem', background: nextStatus === 'VERIFIED' ? '#22c55e' : 'var(--color-primary)',
                color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600,
                fontSize: '0.8rem', cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap'
              }}
            >
              {nextStatus === 'VERIFIED' ? <CheckCircle size={13} /> : <Wrench size={13} />}
              {updating ? 'Updating…' : STATUS_LABELS[repair.status] || 'Update'}
            </button>
          )}
          {repair.report_id && (
            <Link
              to={`/authority/reports/${repair.report_id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.5rem 1rem', background: 'var(--color-border)',
                color: 'var(--color-text-primary)', borderRadius: 7,
                textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap'
              }}
            >
              <ChevronRight size={13} /> View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Repairs() {
  const [activeTab, setActiveTab] = useState('All');
  const { data: repairsData, loading, error, refetch } = useApi(getRepairs);

  const repairs = repairsData?.repairs || repairsData || [];

  const statusFilter = TAB_STATUS[activeTab];
  const filtered = statusFilter ? repairs.filter(r => r.status === statusFilter) : repairs;

  const stats = {
    total: repairs.length,
    inProgress: repairs.filter(r => r.status === 'IN_PROGRESS').length,
    assigned: repairs.filter(r => r.status === 'ASSIGNED').length,
    verified: repairs.filter(r => r.status === 'VERIFIED').length,
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
          Repair Management
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
          Track and manage field repair operations
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--color-text-primary)', icon: Wrench },
            { label: 'In Progress', value: stats.inProgress, color: '#6366f1', icon: Clock },
            { label: 'Assigned', value: stats.assigned, color: '#f97316', icon: AlertTriangle },
            { label: 'Verified', value: stats.verified, color: '#22c55e', icon: CheckCircle },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--color-surface)', borderRadius: 10, padding: '0.75rem 1.25rem',
              border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <s.icon size={18} color={s.color} />
              <div>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.6rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.87rem', fontWeight: 600,
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2
            }}
          >
            {tab}
            <span style={{ marginLeft: '0.35rem', fontSize: '0.72rem', color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
              ({TAB_STATUS[tab] ? repairs.filter(r => r.status === TAB_STATUS[tab]).length : repairs.length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 140, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${activeTab.toLowerCase()} repairs`} description="No repairs match the current filter." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((repair, idx) => (
            <RepairCard key={repair.id || idx} repair={repair} onStatusUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
