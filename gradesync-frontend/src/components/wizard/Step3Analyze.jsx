/**
 * Step 3: Analyze files - show detected headers and data preview
 */
import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { analyzeFiles } from '../../services/api';

function ConfidenceBadge({ score }) {
  if (score >= 70) return <span className="conf-badge conf-high">✓ {score}%</span>;
  if (score >= 40) return <span className="conf-badge conf-med">~ {score}%</span>;
  return <span className="conf-badge conf-low">? {score}%</span>;
}

function TypeBadge({ type }) {
  const map = {
    mssv: { label: 'MSSV', cls: 'badge-primary' },
    hoten: { label: 'Họ tên', cls: 'badge-info' },
    lop: { label: 'Lớp', cls: 'badge-purple' },
    diem: { label: 'Điểm', cls: 'badge-success' },
    stt: { label: 'STT', cls: 'badge-gray' },
    other: { label: '—', cls: 'badge-gray' },
  };
  const info = map[type] || map.other;
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

function shortHeader(label, fallback) {
  if (!label) return fallback;
  const parts = String(label).split(' / ').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return fallback;
  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2];
  if (/^CLO|^PLO|^ILO/i.test(last) && prev) return `${prev} · ${last}`;
  return last;
}

function DataPreview({ headers, preview, label }) {
  if (!headers || !preview) return null;
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)', marginBottom: 8 }}>
        Preview {label} ({preview.length} dòng mẫu)
      </div>
      <div className="table-container" style={{ maxHeight: 220, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i} title={h}>{shortHeader(h, `Cột ${i+1}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnGrid({ columns, label }) {
  if (!columns) return null;
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)', marginBottom: 10 }}>
        Nhận diện cột - {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {columns.filter(c => c.analysis.type !== 'other' || c.analysis.confidence > 0).map((col) => (
          <div key={col.colIndex} style={{
            padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-200)',
            background: col.analysis.type !== 'other' ? 'var(--gray-50)' : '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <TypeBadge type={col.analysis.type} />
              <ConfidenceBadge score={col.analysis.confidence} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', marginBottom: 4 }}>
              <span title={col.header}>{shortHeader(col.header, `Cột ${col.colIndex + 1}`)}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
              Ví dụ: {col.sampleValues?.slice(0, 2).join(', ') || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Step3Analyze({ data, onNext, onBack, onData }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    let mounted = true;
    analyzeFiles(data.uploadId, data.sheetA, data.sheetB)
      .then((result) => {
        if (!mounted) return;
        setAnalysis(result);
        onData({ analysis: result });
      })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [data.uploadId, data.sheetA, data.sheetB, onData]);

  if (loading) return (
    <div className="card animate-fadeIn">
      <div className="card-body" style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ color: 'var(--gray-700)' }}>Đang phân tích file...</h3>
        <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>Hệ thống đang tự dò header và nhận diện cột dữ liệu</p>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
          style={{ marginTop: 28 }}
        >
          ← Quay lại chọn sheet
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div className="card animate-fadeIn">
      <div className="card-body">
        <div className="alert alert-danger"><AlertTriangle size={16} />{error}</div>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 16 }}>← Quay lại</button>
      </div>
    </div>
  );

  const { fileA, fileB, matchedTemplate } = analysis;

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {matchedTemplate && (
        <div className="alert alert-info">
          <CheckCircle size={16} />
          Phát hiện template phù hợp: <strong>{matchedTemplate.name}</strong> (độ khớp: {matchedTemplate.similarity}%). Template sẽ được áp dụng ở bước mapping.
        </div>
      )}

      {/* File A */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>A</span>
              File A: {data.fileAInfo?.name}
            </div>
            <div className="card-subtitle">
              Dòng header phát hiện: dòng {fileA.detectedHeaderRow + 1} (độ tin cậy: {fileA.headerConfidence}%) · {fileA.totalDataRows} dòng dữ liệu
            </div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ColumnGrid columns={fileA.columns} label="File A" />
          <hr className="divider" style={{ margin: '4px 0' }} />
          <DataPreview headers={fileA.headers} preview={fileA.preview} label="File A" />
        </div>
      </div>

      {/* File B */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'var(--success)', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>B</span>
              File B: {data.fileBInfo?.name}
            </div>
            <div className="card-subtitle">
              Dòng header phát hiện: dòng {fileB.detectedHeaderRow + 1} (độ tin cậy: {fileB.headerConfidence}%) · {fileB.totalDataRows} dòng dữ liệu
            </div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ColumnGrid columns={fileB.columns} label="File B" />
          <hr className="divider" style={{ margin: '4px 0' }} />
          <DataPreview headers={fileB.headers} preview={fileB.preview} label="File B" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>
        <button className="btn btn-primary" onClick={onNext}>
          Tự động cấu hình & bắt đầu so sánh
        </button>
      </div>
    </div>
  );
}
