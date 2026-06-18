/**
 * Step 4: Map identity columns (MSSV, HoTen, Lop) between File A and File B
 */
import { useState } from 'react';
import { Users, AlertTriangle } from 'lucide-react';

function ColumnSelect({ label, headers, value, onChange, required }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <select className="form-control" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}>
        <option value="">-- Không chọn --</option>
        {headers.map((h, i) => (
          <option key={i} value={i}>{h || `Cột ${i + 1}`}</option>
        ))}
      </select>
    </div>
  );
}

function MappingRow({ label, icon, headersA, headersB, valueA, valueB, onChangeA, onChangeB, required, hint }) {
  return (
    <tr>
      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--gray-700)', whiteSpace: 'nowrap' }}>
        {icon} {label}
        {hint && <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 400 }}>{hint}</div>}
      </td>
      <td style={{ padding: '8px 16px' }}>
        <ColumnSelect label="" headers={headersA} value={valueA} onChange={onChangeA} required={required} />
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 20 }}>↔</td>
      <td style={{ padding: '8px 16px' }}>
        <ColumnSelect label="" headers={headersB} value={valueB} onChange={onChangeB} required={required} />
      </td>
    </tr>
  );
}

export default function Step4Identity({ data, onNext, onBack, onData }) {
  const { analysis } = data;
  const headersA = analysis.fileA.headers;
  const headersB = analysis.fileB.headers;
  const suggested = analysis.suggestedMapping?.suggestedIdentity;

  const [mssvA, setMssvA] = useState(suggested?.mssv?.a?.colIndex ?? null);
  const [mssvB, setMssvB] = useState(suggested?.mssv?.b?.colIndex ?? null);
  const [hotenA, setHotenA] = useState(suggested?.hoten?.a?.colIndex ?? null);
  const [hotenB, setHotenB] = useState(suggested?.hoten?.b?.colIndex ?? null);
  const [lopA, setLopA] = useState(suggested?.lop?.a?.colIndex ?? null);
  const [lopB, setLopB] = useState(suggested?.lop?.b?.colIndex ?? null);

  const [error, setError] = useState('');

  const handleNext = () => {
    if (mssvA === null) { setError('Cần chọn cột MSSV trong File A'); return; }
    if (mssvB === null) { setError('Cần chọn cột MSSV trong File B'); return; }
    setError('');
    onData({
      identityMapping: {
        mssv: { a: mssvA, b: mssvB },
        hoten: { a: hotenA, b: hotenB },
        lop: { a: lopA, b: lopB },
      },
    });
    onNext();
  };

  return (
    <div className="card animate-fadeIn">
      <div className="card-header">
        <div>
          <div className="card-title"><Users size={18} style={{ marginRight: 6 }} />Mapping Thông Tin Sinh Viên</div>
          <div className="card-subtitle">
            Xác nhận cột tương ứng giữa 2 file. Hệ thống đã tự gợi ý — bạn có thể điều chỉnh lại.
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Suggestion confidence */}
        {suggested && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <AlertTriangle size={16} />
            <div>
              Gợi ý tự động:
              MSSV A ({suggested.mssv?.a?.confidence || 0}%) ↔ MSSV B ({suggested.mssv?.b?.confidence || 0}%)·
              Họ tên A ({suggested.hoten?.a?.confidence || 0}%) ↔ Họ tên B ({suggested.hoten?.b?.confidence || 0}%)·
              Lớp A ({suggested.lop?.a?.confidence || 0}%) ↔ Lớp B ({suggested.lop?.b?.confidence || 0}%)
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="mapping-table">
            <thead>
              <tr>
                <th style={{ width: 180 }}>Ý nghĩa</th>
                <th>
                  <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700, marginRight: 6 }}>A</span>
                  {data.fileAInfo?.name}
                </th>
                <th style={{ width: 40 }}></th>
                <th>
                  <span style={{ background: 'var(--success)', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 12, fontWeight: 700, marginRight: 6 }}>B</span>
                  {data.fileBInfo?.name}
                </th>
              </tr>
            </thead>
            <tbody>
              <MappingRow
                label="Mã số SV" icon="🔑" required
                hint="Dùng để ghép sinh viên giữa 2 file"
                headersA={headersA} headersB={headersB}
                valueA={mssvA} valueB={mssvB}
                onChangeA={setMssvA} onChangeB={setMssvB}
              />
              <MappingRow
                label="Họ và tên" icon="👤"
                hint="Kiểm tra tên trùng / không trùng"
                headersA={headersA} headersB={headersB}
                valueA={hotenA} valueB={hotenB}
                onChangeA={setHotenA} onChangeB={setHotenB}
              />
              <MappingRow
                label="Lớp / Mã lớp" icon="🏫"
                hint="Kiểm tra lớp có khớp không"
                headersA={headersA} headersB={headersB}
                valueA={lopA} valueB={lopB}
                onChangeA={setLopA} onChangeB={setLopB}
              />
            </tbody>
          </table>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 16 }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>
          <button className="btn btn-primary" onClick={handleNext}>
            Tiếp theo: Mapping điểm →
          </button>
        </div>
      </div>
    </div>
  );
}
