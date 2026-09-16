/**
 * src/components/Loading.jsx
 * Skeleton loaders and spinner variants used throughout the app.
 */

/** Full-page centered spinner */
export function PageLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Skeleton block */
export function Skeleton({ width = '100%', height = 20, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 'var(--radius-sm)', flexShrink: 0, ...style }}
    />
  );
}

/** Skeleton stat card */
export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={36} />
      <Skeleton width="80%" height={12} />
    </div>
  );
}

/** Skeleton table row */
export function TableRowSkeleton({ cols = 7 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <Skeleton height={16} />
        </td>
      ))}
    </tr>
  );
}

/** Inline spinner */
export function Spinner({ size = 16 }) {
  return (
    <>
      <div style={{
        width: size, height: size,
        border: `2px solid rgba(255,255,255,0.3)`,
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default PageLoader;
