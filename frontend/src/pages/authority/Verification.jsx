import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

import useApi from '../../hooks/useApi';
import { getVerifications, submitVerification } from '../../services/api';
import BeforeAfterView from '../../components/BeforeAfterView';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatDamageType, formatDate, truncateId } from '../../utils/helpers';

function FileUpload({ onFileSelect, selectedFile, onClear }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => !selectedFile && inputRef.current?.click()}
      style={{
        border: `2px dashed ${selectedFile ? 'var(--color-success)' : 'var(--color-border)'}`,
        borderRadius: 12, padding: '2rem', textAlign: 'center',
        cursor: selectedFile ? 'default' : 'pointer',
        background: selectedFile ? 'rgba(34,197,94,0.05)' : 'var(--color-background)',
        transition: 'all 0.2s'
      }}
    >
      <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleChange} style={{ display: 'none' }} />
      {selectedFile ? (
        <div>
          <CheckCircle size={28} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#22c55e', margin: '0 0 0.25rem 0' }}>
            {selectedFile.name}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem 0' }}>
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{ padding: '0.3rem 0.75rem', background: 'var(--color-border)', color: 'var(--color-text-secondary)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <X size={12} /> Remove
          </button>
        </div>
      ) : (
        <div>
          <Upload size={28} color="var(--color-text-secondary)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
            Drop after-repair photo or video here
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            or click to browse · JPG, PNG, MP4 supported
          </p>
        </div>
      )}
    </div>
  );
}

function VerificationCard({ item }) {
  const [uploadFile, setUploadFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!uploadFile) {
      toast.error('Please select an after-repair image or video.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('repair_id', item.repair_id || item.id);
      const res = await submitVerification(formData);
      setResult(res);
      toast.success('AI verification submitted! Processing…');
    } catch {
      toast.error('Verification submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)', padding: '1.5rem', marginBottom: '1.25rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)', margin: 0 }}>
            Repair #{truncateId(item.repair_id || item.id)}
          </p>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0.2rem 0 0 0' }}>
            {item.road_segment_name || item.road_name || 'Road Segment'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0.1rem 0 0 0' }}>
            {formatDamageType(item.damage_type)} · {formatDate(item.repair_date || item.completed_at)}
          </p>
        </div>
        <span style={{
          padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
          background: item.verified ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
          color: item.verified ? '#22c55e' : '#f97316'
        }}>
          {item.verified ? '✓ Verified' : 'Pending Verification'}
        </span>
      </div>

      {/* Before/After or existing result */}
      {(item.before_url || item.evidence_url) && (
        <div style={{ marginBottom: '1.25rem' }}>
          <BeforeAfterView
            beforeUrl={item.before_url || item.evidence_url}
            afterUrl={item.after_url}
            aiResult={result || item.ai_result}
            damageName={formatDamageType(item.damage_type)}
          />
        </div>
      )}

      {/* Upload Section */}
      {!item.verified && !result && (
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Camera size={15} /> Upload After-Repair Evidence
          </h4>
          <FileUpload
            onFileSelect={setUploadFile}
            selectedFile={uploadFile}
            onClear={() => setUploadFile(null)}
          />
          <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting || !uploadFile}
              style={{
                padding: '0.6rem 1.25rem', background: 'var(--color-primary)',
                color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600,
                fontSize: '0.85rem', cursor: submitting || !uploadFile ? 'not-allowed' : 'pointer',
                opacity: submitting || !uploadFile ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '0.45rem'
              }}
            >
              <CheckCircle size={15} />
              {submitting ? 'Submitting…' : 'Submit for AI Verification'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              AI analysis will run on FastAPI backend
            </p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#22c55e' }}>Verification Submitted</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            The AI is analyzing the after-repair evidence. Results will be available shortly.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Verification() {
  const { data: verificationData, loading, error, refetch } = useApi(() => getVerifications());

  const verifications = verificationData?.verifications || verificationData || [];

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page-wrapper fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
          Repair Verification
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Upload after-repair evidence for AI-powered quality verification
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.75rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem'
      }}>
        <AlertTriangle size={16} color="var(--color-primary)" />
        <p style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', margin: 0 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>AI Verification: </strong>
          RoadIQ's computer vision model compares before and after images to assess repair quality. AI analysis runs on the FastAPI backend and typically completes within 30 seconds.
        </p>
      </div>

      {loading ? (
        <div>
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 300, borderRadius: 12, marginBottom: 16 }} />)}
        </div>
      ) : verifications.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)', padding: '3rem', textAlign: 'center'
        }}>
          <CheckCircle size={40} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>No Verifications Pending</h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            All completed repairs have been verified. New verifications will appear here.
          </p>
        </div>
      ) : (
        <div>
          {verifications.map((item, idx) => (
            <VerificationCard key={item.id || item.repair_id || idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
