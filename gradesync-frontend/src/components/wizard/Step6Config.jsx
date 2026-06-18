/**
 * Step 6: Configure comparison rules
 */
import { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export default function Step6Config({ data, onNext, onBack, onData }) {
  const [rules, setRules] = useState({
    tolerance: 0.001,
    caseInsensitive: true,
    ignoreAccents: false,
  });
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const update = (key, val) => setRules((r) => ({ ...r, [key]: val }));

  const handleNext = () => {
    onData({ compareRules: rules, saveTemplate, templateName: templateName.trim() });
    onNext();
  };

  return (
    <div className="card animate-fadeIn">
      <div className="card-header">
        <div className="card-title"><Settings size={18} style={{ marginRight: 6 }} />Cấu Hình Quy Tắc So Sánh</div>
        <div className="card-subtitle">Tùy chỉnh cách hệ thống so sánh điểm và chuẩn hóa dữ liệu</div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Score Rules */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16 }}>📊 Quy tắc so sánh điểm</h4>
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Sai số cho phép</label>
              <input
                type="number" className="form-control" step="0.001" min="0" max="1"
                value={rules.tolerance}
                onChange={(e) => update('tolerance', parseFloat(e.target.value) || 0)}
              />
              <div className="form-hint">Ví dụ: 0.001 = coi 8.500 và 8.5 là giống nhau</div>
            </div>
          </div>
        </div>

        <hr className="divider" style={{ margin: 0 }} />

        {/* Name Rules */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 16 }}>👤 Quy tắc so sánh họ tên</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="checkbox-group">
              <input type="checkbox" id="caseInsensitive" checked={rules.caseInsensitive}
                onChange={(e) => update('caseInsensitive', e.target.checked)} />
              <label htmlFor="caseInsensitive">Bỏ qua hoa/thường (khuyến nghị)</label>
            </div>
            <div className="checkbox-group">
              <input type="checkbox" id="ignoreAccents" checked={rules.ignoreAccents}
                onChange={(e) => update('ignoreAccents', e.target.checked)} />
              <label htmlFor="ignoreAccents">Bỏ qua dấu tiếng Việt khi so sánh tên</label>
            </div>
          </div>
        </div>

        <hr className="divider" style={{ margin: 0 }} />

        {/* Template Save */}
        <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: 20, border: '1px solid var(--gray-200)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 12 }}>
            <Save size={16} style={{ marginRight: 6, display: 'inline' }} />Lưu template mapping
          </h4>
          <div className="checkbox-group" style={{ marginBottom: saveTemplate ? 12 : 0 }}>
            <input type="checkbox" id="saveTemplate" checked={saveTemplate}
              onChange={(e) => setSaveTemplate(e.target.checked)} />
            <label htmlFor="saveTemplate">Lưu mapping này thành template để dùng lại lần sau</label>
          </div>
          {saveTemplate && (
            <div className="form-group" style={{ marginBottom: 0, marginTop: 12 }}>
              <label className="form-label">Tên template <span className="required">*</span></label>
              <input type="text" className="form-control"
                placeholder="Ví dụ: Bảng điểm Học kỳ 1 - 2024"
                value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card" style={{ padding: 16, background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 10 }}>Tóm tắt cấu hình</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--gray-700)' }}>
            <div>• Sai số điểm: <strong>{rules.tolerance}</strong></div>
            <div>• Phân biệt hoa/thường: <strong>{rules.caseInsensitive ? 'Không' : 'Có'}</strong></div>
            <div>• Phân biệt dấu tiếng Việt: <strong>{rules.ignoreAccents ? 'Không' : 'Có'}</strong></div>
            <div>• Số cặp điểm so sánh: <strong>{data.scoreMappings?.filter(m => m.colIndexA !== null || m.colIndexB !== null).length || 0}</strong></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>
          <button className="btn btn-primary btn-lg" onClick={handleNext}>
            🚀 Bắt đầu so sánh
          </button>
        </div>
      </div>
    </div>
  );
}
