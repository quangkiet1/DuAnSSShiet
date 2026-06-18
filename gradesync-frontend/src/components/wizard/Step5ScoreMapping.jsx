/**
 * Step 5: Map score columns between File A and File B
 */
import { useState } from 'react';
import { Plus, Trash2, BarChart3, AlertTriangle } from 'lucide-react';

function ScoreMappingRow({ mapping, idx, headersA, headersB, onChange, onRemove }) {
  return (
    <tr>
      <td style={{ padding: '8px 12px', color: 'var(--gray-400)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        #{idx + 1}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <select
          className="form-control"
          style={{ fontSize: 13 }}
          value={mapping.colIndexA ?? ''}
          onChange={(e) => onChange(idx, 'colIndexA', e.target.value === '' ? null : parseInt(e.target.value, 10),
            e.target.value === '' ? null : headersA[parseInt(e.target.value, 10)])}
        >
          <option value="">-- Không có --</option>
          {headersA.map((h, i) => <option key={i} value={i}>{h || `Cột ${i+1}`}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 4px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 20 }}>↔</td>
      <td style={{ padding: '8px 12px' }}>
        <select
          className="form-control"
          style={{ fontSize: 13 }}
          value={mapping.colIndexB ?? ''}
          onChange={(e) => onChange(idx, 'colIndexB', e.target.value === '' ? null : parseInt(e.target.value, 10),
            e.target.value === '' ? null : headersB[parseInt(e.target.value, 10)])}
        >
          <option value="">-- Không có --</option>
          {headersB.map((h, i) => <option key={i} value={i}>{h || `Cột ${i+1}`}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 12px' }}>
        <button className="btn btn-danger btn-sm btn-icon" onClick={() => onRemove(idx)} title="Xóa cặp này">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function Step5ScoreMapping({ data, onNext, onBack, onData }) {
  const headersA = data.analysis.fileA.headers;
  const headersB = data.analysis.fileB.headers;
  const suggested = data.analysis.suggestedMapping?.suggestedScores || [];

  // Init from suggestions
  const [mappings, setMappings] = useState(() =>
    suggested.length > 0
      ? suggested.map((s) => ({
          colIndexA: s.colIndexA,
          labelA: s.labelA,
          colIndexB: s.colIndexB,
          labelB: s.labelB,
        }))
      : [{ colIndexA: null, labelA: null, colIndexB: null, labelB: null }]
  );
  const [error, setError] = useState('');

  const addRow = () => {
    setMappings([...mappings, { colIndexA: null, labelA: null, colIndexB: null, labelB: null }]);
  };

  const removeRow = (idx) => {
    setMappings(mappings.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, field, colIdx, label) => {
    const updated = [...mappings];
    if (field === 'colIndexA') { updated[idx].colIndexA = colIdx; updated[idx].labelA = label; }
    if (field === 'colIndexB') { updated[idx].colIndexB = colIdx; updated[idx].labelB = label; }
    setMappings(updated);
  };

  const handleNext = () => {
    const valid = mappings.filter((m) => m.colIndexA !== null || m.colIndexB !== null);
    if (valid.length === 0) { setError('Cần ít nhất một cặp cột điểm để so sánh'); return; }
    setError('');
    onData({ scoreMappings: valid });
    onNext();
  };

  return (
    <div className="card animate-fadeIn">
      <div className="card-header">
        <div>
          <div className="card-title"><BarChart3 size={18} style={{ marginRight: 6 }} />Mapping Cột Điểm</div>
          <div className="card-subtitle">Chọn các cặp cột điểm cần so sánh. Hệ thống đã gợi ý sẵn.</div>
        </div>
      </div>
      <div className="card-body">
        {suggested.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <BarChart3 size={16} />
            Đã gợi ý {suggested.filter(s => s.colIndexA !== null && s.colIndexB !== null).length} cặp điểm tự động. Bạn có thể thêm hoặc xóa.
          </div>
        )}

        <div className="table-container" style={{ marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ background: 'var(--gray-800)', color: '#fff', padding: '10px 12px', width: 40, textAlign: 'center', fontSize: 12 }}>#</th>
                <th style={{ background: 'var(--primary)', color: '#fff', padding: '10px 16px', fontSize: 12 }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 3, padding: '1px 8px', marginRight: 6, fontSize: 12, fontWeight: 700 }}>A</span>
                  Cột điểm File A
                </th>
                <th style={{ background: 'var(--gray-800)', color: '#fff', padding: '10px 4px', width: 30 }}></th>
                <th style={{ background: 'var(--success)', color: '#fff', padding: '10px 16px', fontSize: 12 }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 3, padding: '1px 8px', marginRight: 6, fontSize: 12, fontWeight: 700 }}>B</span>
                  Cột điểm File B
                </th>
                <th style={{ background: 'var(--gray-800)', color: '#fff', padding: '10px 8px', width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, idx) => (
                <ScoreMappingRow
                  key={idx} idx={idx} mapping={m}
                  headersA={headersA} headersB={headersB}
                  onChange={handleChange} onRemove={removeRow}
                />
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn btn-outline btn-sm" onClick={addRow}>
          <Plus size={14} /> Thêm cặp điểm
        </button>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 16 }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>
          <button className="btn btn-primary" onClick={handleNext}>
            Tiếp theo: Cấu hình →
          </button>
        </div>
      </div>
    </div>
  );
}
