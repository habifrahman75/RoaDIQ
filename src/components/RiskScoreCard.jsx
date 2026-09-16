/**
 * src/components/RiskScoreCard.jsx
 * Explainable risk score with factor breakdown.
 */
import { getRiskColor, getRiskLabel } from '../utils/helpers';

export default function RiskScoreCard({ score = 0, breakdown = [], compact = false }) {
  const color = getRiskColor(score);
  const label = getRiskLabel(score);
  const maxScore = 100;
  const r = compact ? 28 : 40;
  const size = compact ? 72 : 96;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / maxScore) * c;

  return (
    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: compact ? 12 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: breakdown.length ? 16 : 0 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-bg-card)" strokeWidth={compact ? 6 : 8} />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={compact ? 6 : 8}
              strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 600ms ease', filter: `drop-shadow(0 0 4px ${color}66)` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: compact ? '1rem' : '1.2rem', fontWeight: 800, color }}>{score}</span>
            {!compact && <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>/100</span>}
          </div>
        </div>

        <div>
          <p style={{ fontSize: compact ? '0.75rem' : '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            {compact ? 'Risk Score' : 'Repair Risk Score'}
          </p>
          <p style={{ fontWeight: 700, fontSize: compact ? '0.9rem' : '1rem', color }}>{label} RISK</p>
          {!compact && breakdown.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {breakdown.length} risk factors identified
            </p>
          )}
        </div>
      </div>

      {!compact && breakdown.length > 0 && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Risk Breakdown
          </p>
          {breakdown.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 1 }}>{item.factor}</p>
                {item.description && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{item.description}</p>
                )}
              </div>
              <span style={{
                flexShrink: 0, marginLeft: 12,
                fontSize: '0.85rem', fontWeight: 700,
                color: item.score >= 20 ? '#ef4444' : item.score >= 15 ? '#f97316' : '#f59e0b',
              }}>
                +{item.score}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>TOTAL</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color }}>{score}</span>
          </div>
        </div>
      )}
    </div>
  );
}
