/**
 * Step 2: Select sheets from each file
 */
import { useState } from 'react';
import { Layers, ChevronRight } from 'lucide-react';

export default function Step2Sheet({ data, onNext, onBack, onData }) {
  const { fileAInfo, fileBInfo } = data;
  const [sheetA, setSheetA] = useState(fileAInfo?.sheets?.[0] || '');
  const [sheetB, setSheetB] = useState(fileBInfo?.sheets?.[0] || '');

  const handleNext = () => {
    onData({ sheetA, sheetB });
    onNext();
  };

  return (
    <div className="card animate-fadeIn">
      <div className="card-header">
        <div>
          <div className="card-title"><Layers size={18} style={{ marginRight: 6 }} />Chọn Sheet Cần So Sánh</div>
          <div className="card-subtitle">Mỗi file có thể có nhiều sheet. Chọn sheet chứa bảng điểm.</div>
        </div>
      </div>
      <div className="card-body">
        <div className="two-col">
          <div className="sheet-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>A</span>
              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{fileAInfo?.name}</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chọn Sheet <span className="required">*</span></label>
              <select className="form-control" value={sheetA} onChange={(e) => setSheetA(e.target.value)}>
                {fileAInfo?.sheets?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="form-hint">{fileAInfo?.sheets?.length} sheet tìm thấy</div>
            </div>
          </div>

          <div className="sheet-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ background: 'var(--success)', color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>B</span>
              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{fileBInfo?.name}</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chọn Sheet <span className="required">*</span></label>
              <select className="form-control" value={sheetB} onChange={(e) => setSheetB(e.target.value)}>
                {fileBInfo?.sheets?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="form-hint">{fileBInfo?.sheets?.length} sheet tìm thấy</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>
          <button className="btn btn-primary" onClick={handleNext} disabled={!sheetA || !sheetB}>
            Tiếp theo: Phân tích file <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
