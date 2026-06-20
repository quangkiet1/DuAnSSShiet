/**
 * RulesPanel - Giao diện tùy chỉnh luật so sánh (Tolerance & Options)
 * Hiển thị dạng card gọn gàng, mặc định collapsed, expand khi click vào.
 */
import { useState } from 'react';
import { Settings2, ChevronDown, ChevronUp, Info } from 'lucide-react';

const DEFAULT_RULES = {
  tolerance: 0.001,
  caseInsensitive: true,
  ignoreAccents: false,
  ignoreRounding: false,
};

function TooltipIcon({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <Info
        size={13}
        color="var(--gray-400)"
        style={{ cursor: 'pointer', verticalAlign: 'middle', marginLeft: 4 }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--gray-900)', color: '#fff',
          fontSize: 11, lineHeight: 1.5, padding: '5px 9px',
          borderRadius: 6, whiteSpace: 'nowrap', zIndex: 99,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          maxWidth: 220, whiteSpace: 'normal', textAlign: 'center',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{
        position: 'relative', width: 40, height: 22, flexShrink: 0,
      }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
        />
        <span style={{
          position: 'absolute', inset: 0,
          background: checked ? 'var(--primary)' : 'var(--gray-300)',
          borderRadius: 11,
          transition: 'background 0.2s',
          cursor: 'pointer',
        }} onClick={() => onChange(!checked)} />
        <span style={{
          position: 'absolute',
          top: 3, left: checked ? 21 : 3,
          width: 16, height: 16,
          background: '#fff', borderRadius: '50%',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
    </label>
  );
}

export default function RulesPanel({ rules, onRulesChange }) {
  const [open, setOpen] = useState(false);
  const current = { ...DEFAULT_RULES, ...(rules || {}) };

  const update = (key, value) => {
    onRulesChange({ ...current, [key]: value });
  };

  // Tóm tắt rules hiện tại
  const activeRules = [];
  if (current.tolerance <= 0) activeRules.push('So sánh chính xác tuyệt đối');
  else if (current.tolerance >= 0.05) activeRules.push(`Dung sai ±${current.tolerance}`);
  if (current.caseInsensitive) activeRules.push('Bỏ qua hoa/thường');
  if (current.ignoreAccents) activeRules.push('Bỏ qua dấu tiếng Việt');
  if (current.ignoreRounding) activeRules.push('Bỏ qua làm tròn (9.0 = 9)');

  return (
    <div className="card animate-fadeIn" style={{ border: '1px solid var(--primary-border)', background: 'var(--primary-bg)' }}>
      {/* Header - luôn hiện */}
      <div
        className="card-header"
        style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: '12px 16px' }}
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Settings2 size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary)' }}>
            Tùy chỉnh luật so sánh
          </span>
          {!open && (
            <span style={{
              fontSize: 12, color: 'var(--gray-500)', marginLeft: 4,
              display: 'flex', gap: 6, flexWrap: 'wrap',
            }}>
              {activeRules.length > 0
                ? activeRules.map((r, i) => (
                  <span key={i} style={{
                    background: 'var(--primary)', color: '#fff',
                    borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600,
                  }}>{r}</span>
                ))
                : <span style={{ color: 'var(--gray-400)' }}>Cấu hình mặc định</span>
              }
            </span>
          )}
        </div>
        <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Body - chỉ hiện khi mở */}
      {open && (
        <div className="card-body" style={{ borderTop: '1px solid var(--primary-border)', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* ── Dung sai điểm số ── */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ marginBottom: 6 }}>
                Dung sai điểm số
                <TooltipIcon text="Chênh lệch tối đa được coi là 'giống nhau'. VD: 0.001 nghĩa là 9.000 = 8.999 (do làm tròn hệ thống)." />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'Chính xác tuyệt đối (0)', value: 0 },
                  { label: '±0.001 (mặc định)', value: 0.001 },
                  { label: '±0.05 (1 chữ số lẻ)', value: 0.05 },
                  { label: '±0.5 (làm tròn)', value: 0.5 },
                ].map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="radio"
                      name="tolerance"
                      value={opt.value}
                      checked={current.tolerance === opt.value}
                      onChange={() => update('tolerance', opt.value)}
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {/* Custom tolerance input */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>Tự nhập:</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.001"
                  value={current.tolerance}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0) update('tolerance', v);
                  }}
                  className="form-control"
                  style={{ width: 100, fontSize: 13 }}
                />
              </div>
            </div>

            {/* ── Toggle: Bỏ qua hoa/thường ── */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 12, padding: '12px 14px',
              background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', marginBottom: 4 }}>
                  Bỏ qua hoa / thường
                  <TooltipIcon text="'NGUYỄN VĂN A' = 'nguyễn văn a'. Nên bật để tránh sai khác không cần thiết." />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  So sánh họ tên không phân biệt chữ hoa thường
                </div>
              </div>
              <ToggleSwitch
                id="rule-case"
                checked={current.caseInsensitive}
                onChange={(v) => update('caseInsensitive', v)}
              />
            </div>

            {/* ── Toggle: Bỏ qua dấu tiếng Việt ── */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 12, padding: '12px 14px',
              background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', marginBottom: 4 }}>
                  Bỏ qua lỗi gõ dấu tiếng Việt
                  <TooltipIcon text="Nguyễn Văn A = Nguyến Văn A (thiếu dấu). Dùng khi dữ liệu nhập tay có thể sai dấu." />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  "Nguyễn" = "Nguyến", "Hòa" = "Hoa"...
                </div>
              </div>
              <ToggleSwitch
                id="rule-accents"
                checked={current.ignoreAccents}
                onChange={(v) => update('ignoreAccents', v)}
              />
            </div>

            {/* ── Toggle: Bỏ qua làm tròn số ── */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: 12, padding: '12px 14px',
              background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)', marginBottom: 4 }}>
                  Bỏ qua chênh lệch làm tròn
                  <TooltipIcon text="9.0 = 9, 8.50 = 8.5. Phù hợp khi một file lưu điểm dạng '9.0' còn file kia lưu '9'." />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  "9.0" = "9", "8.50" = "8.5"...
                </div>
              </div>
              <ToggleSwitch
                id="rule-rounding"
                checked={current.ignoreRounding}
                onChange={(v) => update('ignoreRounding', v)}
              />
            </div>

          </div>

          {/* Preview */}
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'var(--gray-50)', borderRadius: 8,
            border: '1px solid var(--gray-200)',
            fontSize: 12, color: 'var(--gray-600)',
          }}>
            <strong>Cấu hình hiện tại:</strong>{' '}
            {activeRules.length > 0 ? activeRules.join(' · ') : 'Dung sai mặc định ±0.001, bỏ qua hoa/thường'}
          </div>
        </div>
      )}
    </div>
  );
}
