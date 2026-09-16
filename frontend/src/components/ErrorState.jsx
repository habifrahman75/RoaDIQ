/**
 * src/components/ErrorState.jsx
 */
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
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
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <AlertTriangle size={28} color="#ef4444" />
      </div>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        Failed to load data
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: 360 }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={onRetry}>
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
