/**
 * Step 8: Results - Show summary statistics and download button
 * Enhanced with GSAP counter animations for stat cards
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Download, CheckCircle, AlertTriangle, XCircle, RefreshCw, Trophy, TrendingUp } from 'lucide-react';
import { downloadResult } from '../../services/api';

function StatCard({ num, label, cls }) {
  const numRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;

    // Entrance animation
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
    );

    // Counter animation
    if (numRef.current && typeof num === 'number' && num > 0) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: num,
        duration: 0.8,
        ease: 'power1.out',
        delay: 0.2,
        onUpdate: () => {
          if (numRef.current) numRef.current.textContent = Math.round(obj.val);
        },
      });
    }
  }, [num]);

  const handleHover = (enter) => {
    gsap.to(cardRef.current, {
      y: enter ? -3 : 0,
      boxShadow: enter ? '0 6px 20px rgba(0,0,0,0.09)' : 'none',
      duration: 0.18, ease: 'power2.out',
    });
  };

  return (
    <div
      className={`stat-card ${cls}`}
      ref={cardRef}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <div className="stat-card-num" ref={numRef}>{num ?? 0}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default function Step8Results({ data, onReset }) {
  const { result, jobId } = data;
  const containerRef = useRef(null);
  const headerRef    = useRef(null);
  const downloadRef  = useRef(null);

  const downloadUrl = downloadResult(jobId);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(headerRef.current,
        { opacity: 0, scale: 0.95, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      ).fromTo(downloadRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        '-=0.1'
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (!result) return (
    <div className="card"><div className="card-body"><p>Không có dữ liệu kết quả</p></div></div>
  );

  const hasIssues = result.differentScores > 0 || result.identityWarnings > 0 ||
    result.missingStudents > 0 || result.extraStudents > 0 ||
    result.duplicatedIdsA > 0 || result.duplicatedIdsB > 0;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header Status ── */}
      <div ref={headerRef} className="card" style={{
        background: hasIssues
          ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
          : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        borderColor: hasIssues ? 'var(--warning-border)' : 'var(--success-border)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: hasIssues ? 'rgba(217,119,6,0.08)' : 'rgba(21,128,61,0.08)',
        }} />
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {hasIssues
            ? <AlertTriangle size={34} color="#92400e" />
            : <Trophy size={34} color="#166534" />
          }
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: hasIssues ? '#92400e' : '#166534', marginBottom: 4 }}>
              {hasIssues ? 'Phát hiện sự khác biệt' : '🎉 Hai file hoàn toàn khớp nhau!'}
            </h2>
            <p style={{ color: hasIssues ? '#78350f' : '#14532d', fontSize: 14 }}>
              {hasIssues
                ? `Phát hiện ${result.differentScores} dòng điểm khác và ${result.identityWarnings} cảnh báo thông tin SV`
                : `Tất cả ${result.matchedStudents} sinh viên đã khớp. Điểm giống nhau hoàn toàn!`
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={15} style={{ marginRight: 7 }} />
            Thống kê kết quả so sánh
          </div>
        </div>
        <div className="card-body">
          <div className="stats-grid">
            <StatCard num={result.totalStudentsA}   label="SV File A"            cls="info" />
            <StatCard num={result.totalStudentsB}   label="SV File B"            cls="info" />
            <StatCard num={result.matchedStudents}  label="SV ghép thành công"   cls="success" />
            <StatCard num={result.differentScores}  label="Dòng khác điểm"       cls={result.differentScores  > 0 ? 'danger'  : 'success'} />
            <StatCard num={result.identityWarnings} label="SV sai thông tin"      cls={result.identityWarnings > 0 ? 'warning' : 'success'} />
            <StatCard num={result.missingStudents}  label="SV thiếu trong B"      cls={result.missingStudents  > 0 ? 'orange'  : 'success'} />
            <StatCard num={result.extraStudents}    label="SV dư trong B"         cls={result.extraStudents    > 0 ? 'info'    : 'success'} />
            <StatCard num={(result.duplicatedIdsA||0)+(result.duplicatedIdsB||0)} label="MSSV bị trùng" cls={((result.duplicatedIdsA||0)+(result.duplicatedIdsB||0)) > 0 ? 'purple' : 'success'} />
          </div>
        </div>
      </div>

      {/* ── Alert Messages ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {result.differentScores > 0 && (
          <div className="alert alert-danger">
            <XCircle size={16} />
            <div><strong>{result.differentScores} dòng điểm khác nhau</strong> — Xem chi tiết trong sheet <strong>KHAC_DIEM</strong></div>
          </div>
        )}
        {result.identityWarnings > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle size={16} />
            <div><strong>{result.identityWarnings} sinh viên</strong> có cùng MSSV nhưng khác họ tên/lớp — Sheet <strong>SAI_THONG_TIN_SV</strong></div>
          </div>
        )}
        {result.missingStudents > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle size={16} />
            <div><strong>{result.missingStudents} sinh viên</strong> có trong File A nhưng không có trong File B</div>
          </div>
        )}
        {result.extraStudents > 0 && (
          <div className="alert alert-info">
            <AlertTriangle size={16} />
            <div><strong>{result.extraStudents} sinh viên</strong> có trong File B nhưng không có trong File A</div>
          </div>
        )}
        {!hasIssues && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            <div>Tuyệt vời! Không phát hiện bất kỳ sai lệch nào giữa 2 file bảng điểm.</div>
          </div>
        )}
      </div>

      {/* ── Download ── */}
      <div ref={downloadRef} className="card" style={{
        border: '1px solid var(--primary-border)',
        background: 'var(--primary-bg)',
      }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>
              📥 Tải file kết quả Excel
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
              File <strong>.xlsx</strong> gồm 8 sheet: Tổng quan · Khác điểm · Sai thông tin · Thiếu/Dư SV · Trùng MSSV · Highlight màu
            </p>
            <p style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 4 }}>
              Ô điểm khác: <strong>nền đỏ + viền đỏ đậm</strong> trong sheet FILE_A/B_HIGHLIGHT
            </p>
          </div>
          <button
            onClick={() => window.open(downloadUrl, '_blank')}
            className="btn btn-primary btn-lg"
            style={{ flexShrink: 0, minWidth: 160, gap: 8 }}
            id="btn-download-result"
          >
            <Download size={20} /> Tải .xlsx
          </button>
        </div>
      </div>

      {/* ── Reset ── */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <button className="btn btn-secondary" onClick={onReset} id="btn-compare-new">
          <RefreshCw size={16} /> So sánh file mới
        </button>
      </div>
    </div>
  );
}
