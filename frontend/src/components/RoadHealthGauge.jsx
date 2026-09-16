/**
 * src/components/RoadHealthGauge.jsx
 * SVG arc gauge displaying road health score 0–100.
 */

import { getHealthColor, getHealthLabel } from '../utils/helpers';

export default function RoadHealthGauge({ score = 0, size = 140, showLabel = true }) {
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle; // 260 degrees
  const scoreAngle = startAngle + (score / 100) * totalAngle;
  const color = getHealthColor(score);
  const label = getHealthLabel(score);

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (from, to, r) => {
    const x1 = cx + r * Math.cos(toRad(from));
    const y1 = cy + r * Math.sin(toRad(from));
    const x2 = cx + r * Math.cos(toRad(to));
    const y2 = cy + r * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const trackPath = arcPath(startAngle, endAngle, radius);
  const valuePath = score > 0 ? arcPath(startAngle, scoreAngle, radius) : null;
  const strokeW = size * 0.085;

  // Zone markers
  const zones = [
    { angle: startAngle + totalAngle * 0.0,  color: '#ef4444' },
    { angle: startAngle + totalAngle * 0.4,  color: '#f97316' },
    { angle: startAngle + totalAngle * 0.6,  color: '#f59e0b' },
    { angle: startAngle + totalAngle * 0.8,  color: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`} style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={trackPath} fill="none" stroke="var(--color-bg-elevated)" strokeWidth={strokeW} strokeLinecap="round" />
        {/* Value arc */}
        {valuePath && (
          <path d={valuePath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}55)`, transition: 'all 600ms ease' }} />
        )}
        {/* Center score */}
        <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: size * 0.22, fontWeight: 800, fill: color, fontFamily: 'Inter, sans-serif' }}>
          {score}
        </text>
        <text x={cx} y={cy + size * 0.18} textAnchor="middle"
          style={{ fontSize: size * 0.09, fill: 'var(--color-text-muted)', fontFamily: 'Inter, sans-serif' }}>
          / 100
        </text>
      </svg>
      {showLabel && (
        <span style={{
          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
          color, textTransform: 'uppercase',
          padding: '3px 12px', borderRadius: 99,
          background: `${color}18`, border: `1px solid ${color}40`,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
