import { Link } from 'react-router-dom';
import { RefreshCw, AlertTriangle, Info } from 'lucide-react';

import useApi from '../../hooks/useApi';
import { getRecurringDamage } from '../../services/api';
import RecurringAlert from '../../components/RecurringAlert';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

export default function RecurringDamage() {
  const { data: recurringData, loading, error, refetch } = useApi(getRecurringDamage);
  const recurring = recurringData?.alerts || recurringData || [];

  const criticalCount = recurring.filter(r => r.alert_level === 'CRITICAL' || r.severity === 'CRITICAL').length;
  const highCount = recurring.filter(r => r.alert_level === 'HIGH' || r.severity === 'HIGH').length;

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Recurring Damage Alerts
            </h1>
            <span style={{
              padding: '0.2rem 0.6rem', borderRadius: 999, background: 'rgba(249,115,22,0.15)',
              color: '#f97316', fontSize: '0.8rem', fontWeight: 700
            }}>
              {loading ? '—' : recurring.length}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Road locations with repeated damage patterns detected by RoadIQ AI
          </p>
        </div>
      </div>

      {/* Alert Level Summary */}
      {!loading && recurring.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '0.875rem 1.25rem'
          }}>
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', margin: 0, lineHeight: 1 }}>{criticalCount}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>Critical Alerts</p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 10, padding: '0.875rem 1.25rem'
          }}>
            <RefreshCw size={20} color="#f97316" />
            <div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f97316', margin: 0, lineHeight: 1 }}>{highCount}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>High Alerts</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 180, borderRadius: 12 }} />)}
        </div>
      ) : recurring.length === 0 ? (
        <EmptyState
          title="No Recurring Alerts"
          description="No recurring damage patterns detected. All road issues appear to be isolated incidents."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
          {recurring.map((item, idx) => (
            <div key={item.road_segment_id || idx}>
              <RecurringAlert data={item} />
              {item.road_segment_id && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
                  <Link
                    to={`/authority/roads/${item.road_segment_id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      fontSize: '0.8rem', color: 'var(--color-primary)',
                      textDecoration: 'none', fontWeight: 600
                    }}
                  >
                    View Road Memory →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Explainer Section */}
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <Info size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            What is Recurring Damage?
          </h2>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem 0', lineHeight: 1.65 }}>
          RoadIQ's unique AI memory system tracks damage patterns over time at each road location. When the same type of damage is reported <strong style={{ color: 'var(--color-text-primary)' }}>3 or more times</strong> within a 90-day window, it's flagged as <em>recurring</em> — indicating a deeper structural issue that short-term repairs cannot resolve.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.65 }}>
          Unlike traditional systems, RoadIQ correlates historical repairs, weather patterns, and traffic load to determine <strong style={{ color: 'var(--color-text-primary)' }}>why</strong> damage keeps recurring — enabling authorities to make targeted, cost-effective infrastructure improvements rather than repeated patch repairs.
        </p>
      </div>
    </div>
  );
}
