/**
 * src/pages/contributor/ReportForm.jsx
 * Multi-step road damage report wizard (5 steps):
 *   1 – Choose evidence type (Photo / Video)
 *   2 – Upload evidence
 *   3 – Location
 *   4 – Description
 *   5 – Submit & AI Analysis result
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image, Film, MapPin, AlignLeft, Cpu,
  ChevronRight, ChevronLeft, Check, RefreshCw,
  ArrowRight, LocateFixed, Info, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { analyzeReport, submitReport } from '../../services/api';
import FileUpload from '../../components/FileUpload';
import AIAnalysisResult from '../../components/AIAnalysisResult';
import { Spinner } from '../../components/Loading';

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Evidence Type' },
  { id: 2, label: 'Upload'        },
  { id: 3, label: 'Location'      },
  { id: 4, label: 'Description'   },
  { id: 5, label: 'Submit'        },
];

const DEMO_LAT  = 11.0838;
const DEMO_LNG  = 77.142;
const DEMO_ROAD = 'RS-104 Main Road — Zone A';

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const done   = step.id < current;
        const active = step.id === current;
        const color  = done ? '#10b981' : active ? 'var(--color-primary)' : 'var(--color-border)';
        const textC  = done || active ? '#fff' : 'var(--color-text-muted)';
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: color, color: textC,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700,
                transition: 'background 250ms ease',
                flexShrink: 0,
              }}>
                {done ? <Check size={14} /> : step.id}
              </div>
              <span style={{ fontSize: '0.65rem', color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#10b981' : 'var(--color-border)', margin: '0 4px', marginBottom: 20, transition: 'background 250ms ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Evidence Type ─────────────────────────────────────────────────────
function StepEvidenceType({ value, onChange }) {
  const options = [
    {
      key: 'photo',
      icon: Image,
      title: 'Upload Photo',
      description: 'Capture a clear photo of the road damage. Best for single incidents or fixed positions.',
      accept: '.jpg .jpeg .png',
      tip: 'Works best in good lighting. Stand within 3 meters of the damage.',
    },
    {
      key: 'video',
      icon: Film,
      title: 'Upload Video',
      description: 'Drive-through video evidence. AI analyzes all frames automatically to detect and deduplicate incidents.',
      accept: '.mp4 .mov .webm',
      tip: 'AI Video Pipeline',
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Choose Evidence Type</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
        Select how you want to document the road damage.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {options.map((opt) => {
          const selected = value === opt.key;
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              style={{
                background: selected ? 'rgba(59,130,246,0.1)' : 'var(--color-bg-elevated)',
                border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 200ms ease',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: selected ? 'rgba(59,130,246,0.2)' : 'var(--color-bg-card)',
                  border: `1px solid ${selected ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} color={selected ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: selected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{opt.title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{opt.accept}</p>
                </div>
                {selected && (
                  <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} color="#fff" />
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: opt.key === 'video' ? 14 : 0 }}>
                {opt.description}
              </p>

              {opt.key === 'video' && (
                <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginTop: 4 }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#06b6d4', marginBottom: 6 }}>AI Video Pipeline</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {['Video Upload', 'Frame Extraction', 'YOLO Detection', 'Object Tracking', 'Deduplication', 'Single Incident'].map((stage, i, arr) => (
                      <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '0.65rem', color: '#06b6d4', fontWeight: 500, background: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                          {stage}
                        </span>
                        {i < arr.length - 1 && <ArrowRight size={10} color="var(--color-text-muted)" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Upload Evidence ───────────────────────────────────────────────────
function StepUpload({ evidenceType, onFileSelect, file }) {
  const isVideo = evidenceType === 'video';
  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Upload {isVideo ? 'Video' : 'Photo'} Evidence</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
        {isVideo
          ? 'Upload a video of the road. The AI will analyze every frame and extract unique damage incidents.'
          : 'Upload a clear photo of the road damage. Good lighting and proximity improve detection accuracy.'}
      </p>

      <FileUpload
        onFileSelect={onFileSelect}
        acceptedTypes={isVideo ? 'video/mp4,video/quicktime,video/webm' : 'image/jpeg,image/jpg,image/png'}
        label={`Click or drag to upload ${isVideo ? 'video' : 'photo'}`}
        supportedFormats={isVideo ? '.mp4  .mov  .webm' : '.jpg  .jpeg  .png'}
      />

      {isVideo && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <Info size={15} color="var(--color-primary)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>AI will analyze all video frames</strong> — extract frames, run YOLO detection, track objects across frames, and deduplicate overlapping detections into unique incidents.
          </p>
        </div>
      )}

      {!isVideo && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <Info size={15} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Tips for better detection:</strong> Stand 1–3 meters from damage. Include surrounding road surface. Good daylight helps accuracy.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Location ──────────────────────────────────────────────────────────
function StepLocation({ location, onChange }) {
  const [locating, setLocating] = useState(false);
  const [demoNote, setDemoNote] = useState(false);

  const handleGeolocate = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
            road: DEMO_ROAD,
          });
          setLocating(false);
          toast.success('Location captured');
        },
        () => {
          // fallback to demo coords
          onChange({ lat: DEMO_LAT, lng: DEMO_LNG, road: DEMO_ROAD });
          setLocating(false);
          setDemoNote(true);
          toast('Using demo coordinates (geolocation denied)', { icon: '📍' });
        },
        { timeout: 6000 }
      );
    } else {
      onChange({ lat: DEMO_LAT, lng: DEMO_LNG, road: DEMO_ROAD });
      setLocating(false);
      setDemoNote(true);
    }
  };

  const captured = location.lat && location.lng;

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Set Location</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
        Tell us where this damage is located so authorities can find and prioritize it.
      </p>

      <button
        onClick={handleGeolocate}
        disabled={locating}
        className="btn btn-primary"
        style={{ marginBottom: 20, width: '100%', justifyContent: 'center', padding: '12px 20px' }}
      >
        {locating ? <Spinner size={16} /> : <LocateFixed size={16} />}
        {locating ? 'Getting location…' : captured ? 'Re-capture My Location' : 'Use My Current Location'}
      </button>

      {demoNote && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
          <AlertTriangle size={14} color="#f59e0b" />
          <p style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Demo coordinates used — geolocation unavailable in this environment.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Latitude</label>
          <input
            type="text"
            className="form-input"
            value={location.lat || ''}
            onChange={(e) => onChange({ ...location, lat: e.target.value })}
            placeholder="e.g. 11.083800"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Longitude</label>
          <input
            type="text"
            className="form-input"
            value={location.lng || ''}
            onChange={(e) => onChange({ ...location, lng: e.target.value })}
            placeholder="e.g. 77.142000"
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Road / Segment (optional)</label>
        <input
          type="text"
          className="form-input"
          value={location.road || ''}
          onChange={(e) => onChange({ ...location, road: e.target.value })}
          placeholder="e.g. RS-104 Main Road Zone A"
        />
      </div>

      {/* Map Preview Box */}
      {captured && (
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={22} color="var(--color-primary)" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 3 }}>Location Captured ✓</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              {parseFloat(location.lat).toFixed(5)}, {parseFloat(location.lng).toFixed(5)}
            </p>
            {location.road && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{location.road}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Description ───────────────────────────────────────────────────────
function StepDescription({ value, onChange }) {
  const MAX = 400;
  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Add Description (Optional)</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
        Provide any extra context about the damage. You can also skip this step — AI does the heavy lifting.
      </p>

      <div style={{ position: 'relative' }}>
        <textarea
          className="form-textarea"
          rows={6}
          maxLength={MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Large pothole near Sector 4 intersection, approximately half a meter wide. Gets worse after rain..."
          style={{ resize: 'vertical', lineHeight: 1.6, fontSize: '0.875rem' }}
        />
        <span style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: '0.72rem', color: value.length > MAX * 0.85 ? '#f59e0b' : 'var(--color-text-muted)',
        }}>
          {value.length} / {MAX}
        </span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
        <Info size={14} color="#10b981" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          Your description helps road engineers understand context — nearby landmarks, water drainage issues, or recurring patterns are especially useful.
        </p>
      </div>
    </div>
  );
}

// ── Step 5: Summary & Submit ──────────────────────────────────────────────────
function StepSubmit({ evidenceType, file, location, description, onSubmit, isSubmitting, isAnalyzing, aiResult, submitted, onReset }) {
  const navigate = useNavigate();

  if (submitted && aiResult) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={20} color="#10b981" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Report Submitted!</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>AI has analyzed your evidence. Review the results below.</p>
          </div>
        </div>

        <AIAnalysisResult result={aiResult} isProcessing={false} />

        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/contributor/reports')}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <ArrowRight size={15} /> View My Reports
          </button>
          <button
            onClick={onReset}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <RefreshCw size={15} /> Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Analyzing Evidence…</h2>
        <AIAnalysisResult result={null} isProcessing={true} />
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Running YOLO detection on your {evidenceType === 'video' ? 'video frames' : 'photo'}. Please wait…
          </p>
        </div>
      </div>
    );
  }

  const rows = [
    { label: 'Evidence Type', value: evidenceType === 'video' ? '🎬 Video' : '📷 Photo' },
    { label: 'File',          value: file ? file.name : '—' },
    { label: 'Location',      value: location.lat ? `${parseFloat(location.lat).toFixed(5)}, ${parseFloat(location.lng).toFixed(5)}` : '—' },
    { label: 'Road Segment',  value: location.road || '—' },
    { label: 'Description',   value: description || '(none provided)' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>Review & Submit</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
        Confirm your report details before submitting for AI analysis.
      </p>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20 }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, width: 110, flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {isSubmitting ? <><Spinner size={16} /> Submitting…</> : <><Cpu size={16} /> Submit Report & Run AI Analysis</>}
      </button>

      <p style={{ marginTop: 10, textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        Estimated analysis time: 2–3 seconds (demo mode)
      </p>
    </div>
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────
export default function ReportForm() {
  const [currentStep,  setCurrentStep]  = useState(1);
  const [evidenceType, setEvidenceType] = useState(null);   // 'photo' | 'video'
  const [file,         setFile]         = useState(null);
  const [location,     setLocation]     = useState({ lat: '', lng: '', road: '' });
  const [description,  setDescription]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [aiResult,     setAiResult]     = useState(null);
  const [submitted,    setSubmitted]    = useState(false);

  const canNext = useCallback(() => {
    if (currentStep === 1) return !!evidenceType;
    if (currentStep === 2) return !!file;
    if (currentStep === 3) return !!(location.lat && location.lng);
    return true; // steps 4 and 5
  }, [currentStep, evidenceType, file, location]);

  const goNext = () => {
    if (canNext()) setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitReport({ evidenceType, location, description });
    } catch {
      // mock always succeeds; ignore
    }
    setIsSubmitting(false);
    setIsAnalyzing(true);

    try {
      // Build FormData so the real backend receives multipart/form-data
      // (api.js mock path ignores this and returns mock data regardless)
      let evidencePayload;
      if (file && file instanceof File) {
        const fd = new FormData();
        fd.append('image', file, file.name);
        fd.append('latitude',  String(location.lat  || 0.0));
        fd.append('longitude', String(location.lng || 0.0));
        evidencePayload = fd;
      } else {
        // Fallback for mock mode where file may be null
        evidencePayload = { evidenceType, file };
      }

      const result = await analyzeReport(evidencePayload);
      // For photo evidence, nullify video-only stats
      if (evidenceType === 'photo') {
        result.frames_analyzed       = null;
        result.frames_with_detection = null;
      }
      setAiResult(result);
      setSubmitted(true);
      toast.success('Report submitted & AI analyzed!');
    } catch (err) {
      toast.error(`AI analysis failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setEvidenceType(null);
    setFile(null);
    setLocation({ lat: '', lng: '', road: '' });
    setDescription('');
    setIsSubmitting(false);
    setIsAnalyzing(false);
    setAiResult(null);
    setSubmitted(false);
  };

  return (
    <div className="page-wrapper fade-in">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Report Road Damage</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={currentStep} total={STEPS.length} />

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          {currentStep === 1 && (
            <StepEvidenceType value={evidenceType} onChange={setEvidenceType} />
          )}
          {currentStep === 2 && (
            <StepUpload evidenceType={evidenceType} onFileSelect={setFile} file={file} />
          )}
          {currentStep === 3 && (
            <StepLocation location={location} onChange={setLocation} />
          )}
          {currentStep === 4 && (
            <StepDescription value={description} onChange={setDescription} />
          )}
          {currentStep === 5 && (
            <StepSubmit
              evidenceType={evidenceType}
              file={file}
              location={location}
              description={description}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isAnalyzing={isAnalyzing}
              aiResult={aiResult}
              submitted={submitted}
              onReset={handleReset}
            />
          )}

          {/* Navigation — hide on step 5 */}
          {currentStep < 5 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={goBack}
                disabled={currentStep === 1}
                className="btn btn-secondary"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Skip button for step 4 */}
                {currentStep === 4 && (
                  <button onClick={() => setCurrentStep(5)} className="btn btn-secondary" style={{ color: 'var(--color-text-muted)' }}>
                    Skip
                  </button>
                )}
                <button
                  onClick={goNext}
                  disabled={!canNext()}
                  className="btn btn-primary"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
