/**
 * src/components/AIAnalysisResult.jsx
 * Displays AI detection result including video frame analysis breakdown.
 */
import { CheckCircle, AlertTriangle, XCircle, Cpu } from 'lucide-react';

const STATUS_CONFIG = {
  AI_VERIFIED:    { icon: CheckCircle, color: '#10b981', label: 'AI VERIFIED',        bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
  NEEDS_EVIDENCE: { icon: AlertTriangle, color: '#f59e0b', label: 'NEEDS BETTER EVIDENCE', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  DUPLICATE:      { icon: XCircle, color: '#64748b', label: 'DUPLICATE REPORT',       bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.25)' },
  PROCESSING:     { icon: Cpu, color: '#3b82f6', label: 'PROCESSING',                 bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)' },
};

export default function AIAnalysisResult({ result, isProcessing = false }) {
  if (isProcessing) {
    return (
      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center' }}>
        <Cpu size={32} color="var(--color-primary)" style={{ marginBottom: 12 }} />
        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>AI Evidence Analysis</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
          Analyzing uploaded evidence for road damage...
        </p>
        {result?.frames_analyzed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div><p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{result.frames_analyzed}</p><p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Frames Processing</p></div>
          </div>
        )}
        <div className="skeleton" style={{ height: 6, borderRadius: 99, maxWidth: 240, margin: '16px auto 0' }} />
      </div>
    );
  }

  if (!result) return null;

  const status = result.status || 'AI_VERIFIED';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AI_VERIFIED;
  const Icon = cfg.icon;
  const isVerified = status === 'AI_VERIFIED';

  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-md)', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Icon size={20} color={cfg.color} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Evidence Analysis</p>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.08em' }}>
            {cfg.label}
          </span>
        </div>
        {result.is_demo && (
          <span style={{ marginLeft: 'auto', fontSize: '0.67rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-elevated)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--color-border)' }}>
            DEMO RESULT
          </span>
        )}
      </div>

      {/* Video analysis stats */}
      {result.frames_analyzed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16, padding: 14, background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{result.frames_analyzed}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Frames Analyzed</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.color }}>{result.frames_with_detection || 0}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Frames with Detection</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{result.unique_incidents || 0}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Unique Incidents</p>
          </div>
        </div>
      )}

      {/* Detection details */}
      {isVerified && result.damage_type && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { label: 'Damage Type', value: result.damage_type },
            { label: 'Confidence', value: `${Math.round((result.confidence || 0) * 100)}%` },
            { label: 'Severity', value: result.severity },
            { label: 'Estimated Size', value: result.estimated_size || '—' },
            { label: 'Location Ref', value: result.location_ref || '—' },
            { label: 'Risk Score', value: result.risk_score ? `${result.risk_score} / 100` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '8px 12px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rejection reason */}
      {status === 'NEEDS_EVIDENCE' && result.rejection_reason && (
        <div style={{ marginTop: 14, padding: 12, background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p style={{ fontSize: '0.8rem', color: '#f59e0b' }}>{result.rejection_reason}</p>
        </div>
      )}

      {/* Demo disclaimer */}
      {result.is_demo && (
        <p style={{ marginTop: 12, fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          ⓘ Simulated YOLO Result — Connect FastAPI backend for real-time inference
        </p>
      )}
    </div>
  );
}
