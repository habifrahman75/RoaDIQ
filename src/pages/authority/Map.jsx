import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, X, Activity, AlertTriangle, Clock, BarChart2, RefreshCw, ChevronRight } from 'lucide-react';

import useApi from '../../hooks/useApi';
import { getReports, getRoadSegments } from '../../services/api';
import MapView from '../../components/MapView';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import RoadHealthGauge from '../../components/RoadHealthGauge';
import { Skeleton } from '../../components/Loading';
import { getHealthColor, getHealthLabel, getRiskColor, getRiskLabel, truncateId } from '../../utils/helpers';

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const LEGEND = [
  { label: 'Healthy', color: '#22c55e' },
  { label: 'Watch', color: '#eab308' },
  { label: 'Degrading', color: '#f97316' },
  { label: 'Critical', color: '#ef4444' },
];

function getStatusColor(score) {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

export default function Map() {
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const { data: reportsData, loading: reportsLoading } = useApi(getReports);
  const { data: roadsData, loading: roadsLoading } = useApi(getRoadSegments);

  const allReports = reportsData?.reports || reportsData || [];
  const roads = roadsData?.segments || roadsData || [];

  const filteredReports = severityFilter === 'ALL'
    ? allReports
    : allReports.filter(r => (r.severity || r.ai_severity) === severityFilter);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', overflow: 'hidden', gap: '1rem', padding: '1rem' }}>
      {/* Left Panel */}
      <div style={{
        width: 300, flexShrink: 0, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="var(--color-primary)" />
            Road Segments
          </h2>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {LEGEND.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {roadsLoading
            ? Array(5).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 64, marginBottom: 6, borderRadius: 8 }} />)
            : roads.map((road) => {
              const score = road.health_score ?? 50;
              const color = getStatusColor(score);
              const isSelected = selectedRoad?.id === road.id;
              return (
                <button
                  key={road.id}
                  onClick={() => setSelectedRoad(isSelected ? null : road)}
                  style={{
                    width: '100%', background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                    borderRadius: 8, padding: '0.6rem 0.75rem', cursor: 'pointer',
                    marginBottom: '0.35rem', textAlign: 'left', transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {road.name || road.road_name}
                    </span>
                    <ChevronRight size={12} color="var(--color-text-secondary)" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                      {truncateId(road.id)}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600, color,
                      background: `${color}18`, padding: '0.1rem 0.4rem', borderRadius: 999
                    }}>
                      {getHealthLabel(score)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                      {score}/100
                    </span>
                  </div>
                  {/* Mini health bar */}
                  <div style={{ marginTop: '0.35rem', height: 3, background: 'var(--color-border)', borderRadius: 999 }}>
                    <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.3s' }} />
                  </div>
                </button>
              );
            })
          }
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Severity Filter */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)', padding: '0.6rem 0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginRight: '0.25rem' }}>Filter:</span>
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: severityFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
                color: severityFilter === s ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {s}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            {filteredReports.length} reports
          </span>
        </div>

        {/* Map */}
        <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {reportsLoading
            ? <Skeleton style={{ width: '100%', height: '100%' }} />
            : <MapView reports={filteredReports} height="100%" zoom={12} />
          }
        </div>
      </div>

      {/* Road Detail Panel */}
      {selectedRoad && (
        <div style={{
          width: 280, flexShrink: 0, background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)', padding: '1.25rem', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', margin: '0 0 0.2rem 0' }}>
                {truncateId(selectedRoad.id)}
              </p>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {selectedRoad.name || selectedRoad.road_name}
              </h3>
            </div>
            <button onClick={() => setSelectedRoad(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Health Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <RoadHealthGauge score={selectedRoad.health_score ?? 50} size={110} showLabel />
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'Risk Score', value: selectedRoad.risk_score ?? 'N/A', icon: AlertTriangle },
              { label: 'Zone', value: selectedRoad.zone || 'Unknown', icon: MapPin },
              { label: 'Defects', value: selectedRoad.total_defects ?? '-', icon: BarChart2 },
              { label: 'Recurring', value: selectedRoad.recurring_damage_count ?? 0, icon: RefreshCw },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--color-background)', borderRadius: 8, padding: '0.6rem', border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem 0' }}>{stat.label}</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link
              to={`/authority/roads/${selectedRoad.id}`}
              style={{
                display: 'block', padding: '0.6rem 1rem', background: 'var(--color-primary)',
                color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.82rem',
                fontWeight: 600, textAlign: 'center'
              }}
            >
              View Road History
            </Link>
            <Link
              to={`/authority/reports?road_segment=${selectedRoad.id}`}
              style={{
                display: 'block', padding: '0.6rem 1rem', background: 'var(--color-border)',
                color: 'var(--color-text-primary)', borderRadius: 8, textDecoration: 'none',
                fontSize: '0.82rem', fontWeight: 600, textAlign: 'center'
              }}
            >
              View Reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
