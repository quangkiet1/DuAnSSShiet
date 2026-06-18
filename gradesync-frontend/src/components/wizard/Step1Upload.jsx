/**
 * Step 1: Upload File A and File B
 */
import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { uploadFiles } from '../../services/api';

const MAX_MB = 50;

function FileDropZone({ label, file, onFile, color }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
      style={{ borderColor: file ? undefined : color, minHeight: 200 }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleChange} />
      <div className="upload-zone-icon">
        {file ? <FileSpreadsheet size={20} /> : <Upload size={20} />}
      </div>
      <h3 style={{ color: file ? 'var(--success)' : undefined }}>
        {file ? file.name : label}
      </h3>
      {!file && (
        <p>Kéo thả file Excel vào đây hoặc <strong>click để chọn</strong><br />
          Hỗ trợ: .xlsx, .xlsm, .xls · Tối đa {MAX_MB}MB</p>
      )}
      {file && (
        <div className="file-info">
          <FileSpreadsheet size={16} />
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </div>
      )}
    </div>
  );
}

export default function Step1Upload({ onNext, onData }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const validate = (f) => {
    if (!f) return null;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xlsm', 'xls'].includes(ext)) return 'Chỉ cho phép file Excel (.xlsx, .xlsm, .xls)';
    if (f.size > MAX_MB * 1024 * 1024) return `File quá lớn. Tối đa ${MAX_MB}MB`;
    return null;
  };

  const handleUpload = async () => {
    if (!fileA || !fileB) { setError('Vui lòng chọn đủ 2 file'); return; }
    const errA = validate(fileA); if (errA) { setError(`File A: ${errA}`); return; }
    const errB = validate(fileB); if (errB) { setError(`File B: ${errB}`); return; }

    setLoading(true);
    setError('');
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

  return (
    <div className="card animate-fadeIn">
      <div className="card-header">
        <div>
          <div className="card-title">Upload 2 file bảng điểm</div>
          <div className="card-subtitle">Chọn hai file Excel, hệ thống sẽ tự nhận diện cấu trúc.</div>
        </div>
      </div>
      <div className="card-body">
        <div className="two-col" style={{ gap: 24 }}>
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>A</span>
              File Bảng Điểm A
            </label>
            <FileDropZone label="Chọn File A" file={fileA} onFile={setFileA} color="var(--primary)" />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: 'var(--success)', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>B</span>
              File Bảng Điểm B
            </label>
            <FileDropZone label="Chọn File B" file={fileB} onFile={setFileB} color="var(--success)" />
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 16 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading && progress > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--gray-600)' }}>
              <span>Đang upload...</span><span>{progress}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleUpload}
            disabled={loading || !fileA || !fileB}
          >
            {loading ? <><span className="spinner" />Đang upload...</> : <><Upload size={18} />Tiếp theo: Chọn Sheet</>}
          </button>
        </div>
      </div>
    </div>
  );
}
