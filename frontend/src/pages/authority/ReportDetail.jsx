import { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, RefreshCw, Wrench, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

import useApi from '../../hooks/useApi';
import { getReport, getRoadHistory, assignRepair } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge';
import StatusBadge from '../../components/StatusBadge';
import RiskScoreCard from '../../components/RiskScoreCard';
import TimelineView from '../../components/TimelineView';
import BeforeAfterView from '../../components/BeforeAfterView';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatDamageType, formatDate, formatCoords, truncateId } from '../../utils/helpers';

const TABS = ['Overview', 'AI Analysis', 'Road History', 'Repair'];

function VideoStats({ evidence }) {
  if (!evidence) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
      {[
        { label: 'Frame Count', value: evidence.frame_count || '—' },
        { label: 'Duration', value: evidence.duration ? `${evidence.duration}s` : '—' },
        { label: 'Frames Analyzed', value: evidence.frames_analyzed || '—' },
      ].map(s => (
        <div key={s.label} style={{ background: 'var(--color-background)', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem 0' }}>{s.label}</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function RepairTab({ report }) {
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await assignRepair({ report_id: report.id, road_segment_id: report.road_segment_id });
      toast.success('Repair assigned to field team!');
    } catch (e) {
      toast.error('Failed to assign repair. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const steps = [
    { label: 'Report Submitted', done: true, date: report.submitted_at },
    { label: 'AI Verified', done: report.ai_verified, date: null },
    { label: 'Repair Assigned', done: ['ASSIGNED', 'IN_PROGRESS', 'VERIFIED', 'RESOLVED'].includes(report.status), date: null },
    { label: 'In Progress', done: ['IN_PROGRESS', 'VERIFIED', 'RESOLVED'].includes(report.status), date: null },
    { label: 'Resolved', done: ['VERIFIED', 'RESOLVED'].includes(report.status), date: null },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
          Repair Workflow
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((step, idx) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: step.done ? 'var(--color-success)' : 'var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {step.done
                  ? <CheckCircle size={14} color="#fff" />
                  : <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{idx + 1}</span>
                }
              </div>
              <div>
                <p style={{ fontSize: '0.88rem', fontWeight: step.done ? 600 : 400, color: step.done ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', margin: 0 }}>
                  {step.label}
                </p>
                {step.date && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {formatDate(step.date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!['ASSIGNED', 'IN_PROGRESS', 'VERIFIED', 'RESOLVED'].includes(report.status) && (
        <button
          onClick={handleAssign}
          disabled={assigning}
          style={{
            padding: '0.6rem 1.25rem', background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
            cursor: assigning ? 'not-allowed' : 'pointer', opacity: assigning ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <Wrench size={15} />
          {assigning ? 'Assigning…' : 'Assign Repair'}
        </button>
      )}
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchReport = useCallback(() => getReport(id), [id]);
  const { data: report, loading, error, refetch } = useApi(fetchReport);

  const roadSegmentId = report?.road_segment_id;
  const fetchHistory = useCallback(() => {
    if (!roadSegmentId) return Promise.resolve([]);
    return getRoadHistory(roadSegmentId);
  }, [roadSegmentId]);
  const { data: historyData, loading: histLoading } = useApi(fetchHistory);

  const history = historyData?.events || historyData || [];

  if (loading) return (
    <div className="page-wrapper fade-in">
      {Array(8).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 40, marginBottom: 8, borderRadius: 8 }} />)}
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!report) return <ErrorState message="Report not found." onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Back */}
      <Link to="/authority/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem' }}>
        <ArrowLeft size={15} /> Back to Reports
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
            Report <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>#{truncateId(report.id)}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SeverityBadge severity={report.severity || report.ai_severity} />
            <StatusBadge status={report.status} />
            {report.is_recurring && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 999, background: 'rgba(249,115,22,0.15)', color: '#f97316', fontSize: '0.72rem', fontWeight: 600 }}>
                <RefreshCw size={11} /> Recurring
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.65rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: 600,
              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Left: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>
                Report Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { icon: MapPin, label: 'Location', value: report.location || 'Unknown location' },
                  { icon: MapPin, label: 'Coordinates', value: formatCoords(report.latitude, report.longitude) },
                  { icon: Calendar, label: 'Submitted', value: formatDate(report.submitted_at || report.created_at) },
                  { icon: User, label: 'Submitted By', value: report.submitted_by || report.user_id || 'Anonymous' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <item.icon size={15} style={{ color: 'var(--color-text-secondary)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '0.87rem', color: 'var(--color-text-primary)', margin: 0, fontWeight: 500 }}>{item.value}</p>
                    </div>
                  </div>
                ))}
                {report.road_segment_id && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <MapPin size={15} style={{ color: 'var(--color-text-secondary)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>Road Segment</p>
                      <Link to={`/authority/roads/${report.road_segment_id}`} style={{ fontSize: '0.87rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                        {report.road_segment_name || truncateId(report.road_segment_id)}
                      </Link>
                    </div>
                  </div>
                )}
                {report.notes && (
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem 0' }}>Notes</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5, background: 'var(--color-background)', padding: '0.6rem', borderRadius: 6 }}>
                      {report.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Risk + Recurring */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {report.risk_score != null && (
              <RiskScoreCard score={report.risk_score} breakdown={report.risk_breakdown} />
            )}
            {report.is_recurring && (
              <div style={{ background: 'rgba(249,115,22,0.08)', borderRadius: 'var(--radius-lg)', padding: '1rem', border: '1px solid rgba(249,115,22,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <RefreshCw size={16} color="#f97316" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f97316', margin: 0 }}>Recurring Damage Detected</h4>
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  This damage type has been reported at this location multiple times. RoadIQ's pattern recognition flagged this as a recurring structural issue requiring priority attention.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'AI Analysis' && (
        <div>
          {report.ai_result || report.ai_analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <BeforeAfterView
                beforeUrl={report.evidence_url || report.image_url}
                afterUrl={null}
                aiResult={report.ai_result || report.ai_analysis}
                damageName={formatDamageType(report.ai_damage_type || report.damage_type)}
              />
              {report.video_evidence && <VideoStats evidence={report.video_evidence} />}
              {/* AI Details */}
              <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 0, marginBottom: '1rem' }}>AI Analysis Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Damage Type', value: formatDamageType(report.ai_damage_type || report.damage_type) },
                    { label: 'Severity', value: report.ai_severity || report.severity || '—' },
                    { label: 'Confidence', value: report.ai_confidence ? `${(report.ai_confidence * 100).toFixed(1)}%` : '—' },
                    { label: 'Risk Score', value: report.risk_score ? Math.round(report.risk_score) : '—' },
                    { label: 'AI Verified', value: report.ai_verified ? 'Yes' : 'No' },
                    { label: 'Model', value: report.ai_model || 'RoadIQ v2' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--color-background)', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem 0' }}>{s.label}</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <AlertTriangle size={32} color="var(--color-text-secondary)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                AI analysis not yet available for this report.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Road History Tab */}
      {activeTab === 'Road History' && (
        <div>
          {histLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 60, marginBottom: 8, borderRadius: 8 }} />)
          ) : history.length > 0 ? (
            <TimelineView events={history} />
          ) : (
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <Clock size={32} color="var(--color-text-secondary)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                {roadSegmentId ? 'No history events found for this road.' : 'No road segment associated with this report.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Repair Tab */}
      {activeTab === 'Repair' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <RepairTab report={report} />
        </div>
      )}
    </div>
  );
}
