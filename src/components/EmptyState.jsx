/**
 * src/components/EmptyState.jsx
 */
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no items to display here yet.',
  action = null,
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      gap: 12,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={28} color="var(--color-text-muted)" />
      </div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: 320 }}>{description}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
