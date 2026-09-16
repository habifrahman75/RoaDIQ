/**
 * src/pages/Verification.jsx
 * Before/after repair verification page with AI result display.
 * Authorities upload after-repair image, AI checks remaining damage.
 */
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, AlertCircle, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { getVerifications, submitVerification } from '../services/api';
import { useApi } from '../hooks/useApi';
import SeverityBadge from '../components/SeverityBadge';
import { PageLoader, Spinner } from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatDamageType, formatDate } from '../utils/helpers';

// ── Verification Status ───────────────────────────────────────────────────────
function VerifBadge({ status }) {
  const map = {
    CLEARED: { label: 'Cleared',      bg: 'rgba(16,185,129,0.15)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
    PARTIAL: { label: 'Partial Fix',  bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
    FAILED:  { label: 'Not Resolved', bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', border: 'rgba(239,68,68,0.3)'   },
  };
  const s = map[status] || { label: status, bg: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)', border: 'var(--color-border)' };
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

// ── Image Upload Area ─────────────────────────────────────────────────────────
function ImageUpload({ label, preview, onChange }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  };

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>{label}</p>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${drag ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          background: drag ? 'var(--color-primary-glow)' : 'var(--color-bg-elevated)',
          transition: 'border-color var(--transition), background var(--transition)',
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onChange(e.target.files?.[0])} />
        {preview
          ? <img src={preview} alt="Preview" style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
          : (
            <>
              <ImageIcon size={28} color="var(--color-text-muted)" />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Click or drag &amp; drop an image
              </p>
            </>
          )
        }
      </div>
    </div>
  );
}

// ── AI Result Card ────────────────────────────────────────────────────────────
function AIResult({ result }) {
  if (!result) return null;
  const cleared = result.verification_status === 'CLEARED';
  return (
    <div style={{
      padding: 20,
      borderRadius: 'var(--radius-md)',
      background: cleared ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${cleared ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {cleared
          ? <CheckCircle size={22} color="#10b981" />
          : <AlertCircle  size={22} color="#ef4444" />
        }
        <p style={{ fontWeight: 700, fontSize: '1rem' }}>
          {cleared ? 'Repair Verified — Road Cleared' : 'Damage Still Detected'}
        </p>
        <VerifBadge status={result.verification_status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
        <div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>AI Confidence</p>
          <p style={{ fontWeight: 700 }}>{Math.round((result.confidence || 0) * 100)}%</p>
        </div>
        <div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Remaining Damage</p>
          <p style={{ fontWeight: 700 }}>{result.remaining_damage || 'None'}</p>
        </div>
      </div>
      {result.detections?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>Detections</p>
          {result.detections.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatDamageType(d.damage_type)}</span>
              <SeverityBadge severity={d.severity} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {Math.round(d.confidence * 100)}% conf.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Submit Form ───────────────────────────────────────────────────────────────
function SubmitVerificationForm({ onSuccess }) {
  const [reportId, setReportId] = useState('');
  const [afterFile, setAfterFile] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleAfterImage = (file) => {
    if (!file) return;
    setAfterFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAfterPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportId.trim()) { toast.error('Report ID is required'); return; }
    if (!afterFile)       { toast.error('After-repair image is required'); return; }

    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('report_id', reportId);
      formData.append('after_image', afterFile);
      const res = await submitVerification(formData);
      setResult(res);
      toast.success('Verification submitted successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <ShieldCheck size={20} color="var(--color-primary)" />
        <p style={{ fontWeight: 700, fontSize: '1rem' }}>Submit Repair Verification</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            Report ID
          </label>
          <input
            className="form-input"
            placeholder="e.g. rpt_007"
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Before Image
            </p>
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              minHeight: 140,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-bg-elevated)',
              gap: 8,
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem',
            }}>
              <ImageIcon size={24} />
              <p>Fetched from report</p>
              <p style={{ fontSize: '0.72rem', opacity: 0.6 }}>(Provided by field user)</p>
            </div>
          </div>
          <ImageUpload label="After Repair Image *" preview={afterPreview} onChange={handleAfterImage} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? <><Spinner size={15} /> Analyzing with AI…</>
            : <><Upload size={15} /> Submit for AI Verification</>
          }
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div className="divider" />
          <p style={{ fontWeight: 600, marginBottom: 12 }}>AI Verification Result</p>
          <AIResult result={result} />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Verification() {
  const { data: verifications, loading, error, refetch } = useApi(getVerifications);

  if (loading) return <div className="page-wrapper"><PageLoader /></div>;
  if (error)   return <div className="page-wrapper"><ErrorState message={error} onRetry={refetch} /></div>;

  return (
    <div className="page-wrapper fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Repair Verification</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Submit after-repair images for AI analysis. The AI compares before/after images to confirm road restoration.
        </p>
      </div>

      {/* Submit Form */}
      <SubmitVerificationForm onSuccess={refetch} />

      {/* Past Verifications */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 600 }}>Verification History</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {verifications?.length || 0} records
          </span>
        </div>

        {!verifications || verifications.length === 0
          ? <EmptyState icon={ShieldCheck} title="No verifications yet" description="Verified repairs will appear here." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {verifications.map((v) => (
                <div key={v.id} style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>
                        {formatDamageType(v.damage_type)} — {v.road_segment_name}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        Report #{v.report_id} · Verified {formatDate(v.verified_at)}
                      </p>
                    </div>
                    <VerifBadge status={v.ai_result?.verification_status} />
                  </div>

                  {/* Before / After */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {['before', 'after'].map((which) => (
                      <div key={which}>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          {which} repair
                        </p>
                        <div style={{
                          height: 100,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                        }}>
                          {v[`${which}_image_url`]
                            ? <img src={v[`${which}_image_url`]} alt={which} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : `${which.charAt(0).toUpperCase() + which.slice(1)} image`
                          }
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Result */}
                  <AIResult result={v.ai_result} />
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
