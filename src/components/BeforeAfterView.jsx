/**
 * src/components/BeforeAfterView.jsx
 * Side-by-side before/after repair image comparison with AI result overlay.
 */
import { CheckCircle, AlertTriangle, Camera } from 'lucide-react';

function ImagePlaceholder({ label, type }) {
  const colors = {
    before: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', icon: '#ef4444', text: 'Before Repair' },
    after:  { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', icon: '#10b981', text: 'After Repair' },
  };
  const c = colors[type] || colors.before;
  return (
    <div style={{ background: c.bg, border: `2px dashed ${c.border}`, borderRadius: 'var(--radius-md)', height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Camera size={32} color={c.icon} style={{ opacity: 0.6 }} />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{c.text}<br /><span style={{ fontSize: '0.7rem' }}>{label}</span></p>
    </div>
  );
}

export default function BeforeAfterView({ beforeUrl, afterUrl, aiResult, damageName, showDemo = true }) {
  const cleared = !aiResult?.damage_detected;

  return (
    <div>
      {/* Before / After images */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            ● Before
          </p>
          {beforeUrl
            ? <img src={beforeUrl} alt="Before repair" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 200, objectFit: 'cover' }} />
            : <ImagePlaceholder label={damageName || 'Critical damage'} type="before" />}
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            ● After
          </p>
          {afterUrl
            ? <img src={afterUrl} alt="After repair" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 200, objectFit: 'cover' }} />
            : <ImagePlaceholder label="Post-repair evidence" type="after" />}
        </div>
      </div>

      {/* AI Result */}
      {aiResult && (
        <div style={{
          padding: 16, borderRadius: 'var(--radius-md)',
          background: cleared ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${cleared ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {cleared
              ? <CheckCircle size={22} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
              : <AlertTriangle size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4, color: cleared ? '#10b981' : '#f59e0b' }}>
                {cleared ? '✓ Repair Verified — Damage Resolved' : '⚠ Possible Residual Damage'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                {cleared
                  ? 'AI analysis detected no significant road damage in the post-repair image.'
                  : 'AI detected possible remaining damage. Manual verification recommended.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { label: 'Damage Detected', value: aiResult.damage_detected ? 'Yes' : 'No' },
                  { label: 'AI Confidence', value: `${Math.round((aiResult.confidence || 0) * 100)}%` },
                  { label: 'Verification', value: aiResult.verification_status || '—' },
                  { label: 'Residual Damage', value: aiResult.remaining_damage || 'None' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
              {showDemo && aiResult.is_demo && (
                <p style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  ⓘ Demo AI Result — Real YOLO inference available with backend connected
                </p>
              )}
            </div>
          </div>

          {cleared && (
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['✓ Damage resolved', '✓ Road Health updated', '✓ Case Closed'].map((t) => (
                <span key={t} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
