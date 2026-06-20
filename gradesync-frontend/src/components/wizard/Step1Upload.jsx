/**
 * Step 1: Upload File A and File B
 * Hỗ trợ kéo thả file vào toàn bộ cửa sổ (window-level drag & drop)
 * hoặc click để chọn file từ hệ thống.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { uploadFiles } from '../../services/api';

const MAX_MB = 50;
const VALID_EXTS = ['xlsx', 'xlsm', 'xls'];

function validate(f) {
  if (!f) return null;
  const ext = f.name.split('.').pop().toLowerCase();
  if (!VALID_EXTS.includes(ext)) return 'Chỉ cho phép file Excel (.xlsx, .xlsm, .xls)';
  if (f.size > MAX_MB * 1024 * 1024) return `File quá lớn. Tối đa ${MAX_MB}MB`;
  return null;
}

function formatSize(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Drop zone cho từng file (A hoặc B)
 */
function FileDropZone({ label, file, onFile, onClear, color, badge }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const err = validate(file);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  return (
    <div
      className={`upload-zone ${dragging ? 'drag-over' : ''} ${file ? 'has-file' : ''} ${err ? 'has-error' : ''}`}
      style={{ borderColor: file ? undefined : color, minHeight: 220, cursor: 'pointer' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
      aria-label={`Vùng thả ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm,.xls"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ''; }}
      />

      {/* Badge A / B */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: color, color: '#fff',
        borderRadius: 6, padding: '2px 10px',
        fontSize: 12, fontWeight: 800, letterSpacing: 1,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        {badge}
      </div>

      {/* Clear button */}
      {file && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer',
            borderRadius: '50%', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray-600)',
          }}
          title="Xoá file"
          aria-label="Xoá file"
        >
          <X size={14} />
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <div className="upload-zone-icon" style={{
          width: 56, height: 56,
          background: file ? 'var(--success-bg)' : (dragging ? 'var(--primary-bg)' : 'var(--gray-100)'),
          color: file ? 'var(--success)' : (dragging ? 'var(--primary)' : 'var(--gray-500)'),
          borderRadius: 14,
          transition: 'all 0.2s',
        }}>
          {file ? <CheckCircle2 size={28} /> : (dragging ? <Upload size={28} /> : <FileSpreadsheet size={28} />)}
        </div>

        {file ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)', textAlign: 'center', wordBreak: 'break-all' }}>
              {file.name}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--success-bg)', color: 'var(--success)',
              borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600,
            }}>
              <FileSpreadsheet size={13} /> {formatSize(file.size)}
            </div>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: dragging ? 'var(--primary)' : 'var(--gray-700)', textAlign: 'center' }}>
              {dragging ? '↓ Thả file vào đây!' : label}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.6, textAlign: 'center' }}>
              Kéo thả file vào ô này hoặc <strong>click để chọn</strong><br />
              Hỗ trợ: .xlsx, .xlsm, .xls · Tối đa {MAX_MB}MB
            </p>
          </>
        )}

        {err && (
          <div style={{
            fontSize: 12, color: 'var(--danger)', background: 'var(--danger-bg)',
            padding: '4px 10px', borderRadius: 6, fontWeight: 600,
          }}>
            ⚠ {err}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Step1Upload({ onNext, onData }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [windowDragging, setWindowDragging] = useState(false);
  const dragCountRef = useRef(0);

  // ── Window-level drag overlay ─────────────────────────────────────────────────
  useEffect(() => {
    const isExcelFile = (dt) =>
      [...(dt?.items || [])].some(
        (item) => item.kind === 'file' && (
          item.type.includes('spreadsheet') ||
          item.type.includes('excel') ||
          item.type === ''  // Chrome returns '' for local files
        )
      );

    const onDragEnter = (e) => {
      e.preventDefault();
      dragCountRef.current += 1;
      if (dragCountRef.current === 1) setWindowDragging(true);
    };

    const onDragLeave = (e) => {
      e.preventDefault();
      dragCountRef.current -= 1;
      if (dragCountRef.current === 0) setWindowDragging(false);
    };

    const onDragOver = (e) => e.preventDefault();

    const onDrop = (e) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setWindowDragging(false);

      const files = [...(e.dataTransfer?.files || [])].filter((f) => {
        const ext = f.name.split('.').pop().toLowerCase();
        return VALID_EXTS.includes(ext);
      });

      if (files.length === 0) return;

      if (files.length === 1) {
        // Thả 1 file: gán vào ô trống trước, nếu cả 2 trống thì gán A
        if (!fileA) setFileA(files[0]);
        else if (!fileB) setFileB(files[0]);
        else setFileA(files[0]); // Thay thế A nếu cả 2 đã có
      } else {
        // Thả 2 file cùng lúc: file nhỏ hơn (theo tên) → A, lớn hơn → B
        const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
        setFileA(sorted[0]);
        if (sorted[1]) setFileB(sorted[1]);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover',  onDragOver);
    window.addEventListener('drop',      onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover',  onDragOver);
      window.removeEventListener('drop',      onDrop);
    };
  }, [fileA, fileB]);

  // ── Upload handler ────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    setError('');
    if (!fileA || !fileB) { setError('Vui lòng chọn đủ 2 file Excel'); return; }
    const errA = validate(fileA); if (errA) { setError(`File A: ${errA}`); return; }
    const errB = validate(fileB); if (errB) { setError(`File B: ${errB}`); return; }

    setLoading(true);
    try {
      const result = await uploadFiles(fileA, fileB, setProgress);
      onData({
        uploadId: result.uploadId,
        fileAInfo: result.fileAInfo,
        fileBInfo: result.fileBInfo,
      });
      onNext();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const bothReady = fileA && fileB && !validate(fileA) && !validate(fileB);

  return (
    <>
      {/* ── Window-level drag overlay ──────────────────────────────────────── */}
      {windowDragging && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(29,78,216,0.12)',
          backdropFilter: 'blur(2px)',
          border: '3px dashed var(--primary)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, pointerEvents: 'none',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '28px 48px',
            boxShadow: '0 8px 40px rgba(29,78,216,0.25)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <Upload size={48} color="var(--primary)" />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
              Thả file Excel vào đây
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
              Thả 1 file → gán vào ô trống · Thả 2 file → gán cả A và B
            </p>
          </div>
        </div>
      )}

      <div className="card animate-fadeIn">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Upload size={16} style={{ marginRight: 8 }} />
              Upload 2 file bảng điểm Excel
            </div>
            <div className="card-subtitle">
              Kéo thả file Excel vào ô bên dưới, hoặc kéo thả vào bất kỳ đâu trên màn hình này.
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="two-col" style={{ gap: 24 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>
                File Bảng Điểm A
              </label>
              <FileDropZone
                label="Kéo thả hoặc click để chọn File A"
                file={fileA}
                onFile={setFileA}
                onClear={() => setFileA(null)}
                color="var(--primary)"
                badge="A"
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>
                File Bảng Điểm B
              </label>
              <FileDropZone
                label="Kéo thả hoặc click để chọn File B"
                file={fileB}
                onFile={setFileB}
                onClear={() => setFileB(null)}
                color="var(--success)"
                badge="B"
              />
            </div>
          </div>

          {/* Tip kéo thả */}
          {!fileA && !fileB && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'var(--primary-bg)', borderRadius: 8,
              border: '1px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: 'var(--primary)',
            }}>
              <Upload size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Mẹo:</strong> Bạn có thể kéo 2 file Excel từ Desktop và thả đồng thời vào cửa sổ này để tự động điền cả hai ô.
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-danger" style={{ marginTop: 16 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Upload Progress */}
          {loading && progress > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--gray-600)' }}>
                <span>Đang upload lên server...</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Action */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleUpload}
              disabled={loading || !bothReady}
              id="btn-upload-next"
            >
              {loading
                ? <><span className="spinner" />Đang upload...</>
                : <><Upload size={18} />Tiếp theo: Chọn Sheet</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
