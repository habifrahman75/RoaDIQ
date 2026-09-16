/**
 * src/components/StatCard.jsx
 * Metric card used in the dashboard overview.
 *
 * Props:
 *   title       – label text
 *   value       – main metric (string | number)
 *   icon        – Lucide icon component
 *   color       – accent color (CSS color)
 *   trend       – { value: number, label: string } (optional)
 *   subtitle    – secondary text (optional)
 */
export default function StatCard({ title, value, icon: Icon, color = 'var(--color-primary)', trend, subtitle }) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className="stat-card">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </p>
        {Icon && (
          <div style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-sm)',
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>

      {/* Value */}
      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, marginBottom: 8 }}>
        {value ?? '—'}
      </p>

      {/* Subtitle / Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: trendPositive ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {trendPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
