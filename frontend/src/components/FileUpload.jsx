/**
 * src/components/FileUpload.jsx
 * Drag-and-drop file upload with preview, progress simulation, type indicator.
 */
import { useState, useRef } from 'react';
import { Upload, X, Film, Image, CheckCircle, Loader } from 'lucide-react';

export default function FileUpload({ onFileSelect, acceptedTypes = 'image/*,video/*', label = 'Upload Evidence', supportedFormats = '.jpg .jpeg .png .mp4 .mov .webm' }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const isVideo = file?.type?.startsWith('video/');
  const isImage = file?.type?.startsWith('image/');

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
    onFileSelect?.(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const remove = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect?.(null);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {/* Preview */}
        {isImage && preview && (
          <div style={{ position: 'relative', height: 200, background: 'var(--color-bg-elevated)' }}>
            <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        {isVideo && (
          <div style={{ height: 160, background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Film size={40} color="var(--color-primary)" style={{ opacity: 0.7 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Video file ready for analysis</p>
          </div>
        )}

        {/* File info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-bg-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {isVideo ? <Film size={18} color="var(--color-primary)" /> : <Image size={18} color="var(--color-primary)" />}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{file.name}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {formatSize(file.size)} · {isVideo ? 'Video' : 'Image'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <CheckCircle size={16} color="#10b981" />
            <button onClick={remove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, borderRadius: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '32px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        background: dragging ? 'rgba(59,130,246,0.05)' : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <Upload size={28} color="var(--color-text-muted)" style={{ marginBottom: 8 }} />
      <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        Drag & drop or click to browse
      </p>
      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>{supportedFormats}</p>
    </div>
  );
}
