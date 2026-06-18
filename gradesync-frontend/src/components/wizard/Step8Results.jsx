/**
 * Step 8: Results - Show summary statistics and download button
 */
import { Download, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { downloadResult } from '../../services/api';

function StatCard({ num, label, cls }) {
  return (
    <div className={`stat-card ${cls}`}>
      <div className="stat-card-num">{num ?? 0}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default function Step8Results({ data, onReset }) {
  const { result, jobId } = data;

  const downloadUrl = downloadResult(jobId);

  if (!result) return (
    <div className="card"><div className="card-body"><p>Không có dữ liệu kết quả</p></div></div>
  );

  const hasIssues = result.differentScores > 0 || result.identityWarnings > 0 ||
    result.missingStudents > 0 || result.extraStudents > 0 || result.duplicatedIdsA > 0 || result.duplicatedIdsB > 0;

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="card" style={{ background: hasIssues ? 'var(--warning-bg)' : 'var(--success-bg)', borderColor: hasIssues ? 'var(--warning-border)' : 'var(--success-border)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {hasIssues ? <AlertTriangle size={32} color="#92400e" /> : <CheckCircle size={32} color="#166534" />}
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: hasIssues ? '#92400e' : '#166534', marginBottom: 4 }}>
              {hasIssues ? 'Phát hiện sự khác biệt' : 'Hai file hoàn toàn khớp nhau'}
            </h2>
            <p style={{ color: hasIssues ? '#78350f' : '#14532d', fontSize: 14 }}>
              {hasIssues
                ? `Hệ thống phát hiện ${result.differentScores} dòng điểm khác và ${result.identityWarnings} cảnh báo thông tin SV`
                : `Tất cả ${result.matchedStudents} sinh viên đã khớp. Điểm giống nhau hoàn toàn!`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="card">
        <div className="card-header"><div className="card-title">Thống kê kết quả</div></div>
        <div className="card-body">
          <div className="stats-grid">
            <StatCard num={result.totalStudentsA} label="SV File A" cls="info" />
            <StatCard num={result.totalStudentsB} label="SV File B" cls="info" />
            <StatCard num={result.matchedStudents} label="SV ghép thành công" cls="success" />
            <StatCard num={result.differentScores} label="Dòng khác điểm" cls={result.differentScores > 0 ? 'danger' : 'success'} />
            <StatCard num={result.identityWarnings} label="SV sai thông tin" cls={result.identityWarnings > 0 ? 'warning' : 'success'} />
            <StatCard num={result.missingStudents} label="SV thiếu trong B" cls={result.missingStudents > 0 ? 'orange' : 'success'} />
            <StatCard num={result.extraStudents} label="SV dư trong B" cls={result.extraStudents > 0 ? 'info' : 'success'} />
            <StatCard num={(result.duplicatedIdsA || 0) + (result.duplicatedIdsB || 0)} label="Lớp + MSSV trùng" cls={((result.duplicatedIdsA||0)+(result.duplicatedIdsB||0)) > 0 ? 'purple' : 'success'} />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {result.differentScores > 0 && (
        <div className="alert alert-danger">
          <XCircle size={16} />
          <div><strong>{result.differentScores} dòng điểm khác nhau</strong> — Chi tiết trong sheet KHAC_DIEM của file kết quả</div>
        </div>
      )}
      {result.identityWarnings > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} />
          <div><strong>{result.identityWarnings} sinh viên có cùng MSSV nhưng khác họ tên/lớp</strong> — Kiểm tra sheet SAI_THONG_TIN_SV</div>
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

      {/* Download */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>Tải file kết quả Excel</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
              File <strong>.xlsx</strong> chứa 8 sheet: Tổng quan · Khác điểm · Sai thông tin · Thiếu/Dư SV · Trùng MSSV · Highlight màu
            </p>
            <p style={{ color: 'var(--gray-500)', fontSize: 12, marginTop: 4 }}>
              Ô điểm khác: <strong>nền đỏ + viền đỏ đậm</strong> trong sheet FILE_A_HIGHLIGHT và FILE_B_HIGHLIGHT
            </p>
          </div>
          <button
            onClick={() => window.open(downloadUrl, '_blank')}
            className="btn btn-primary btn-lg"
            style={{ flexShrink: 0, minWidth: 180 }}
          >
            <Download size={20} /> Tải .xlsx
          </button>
        </div>
      </div>

      {/* Reset */}
      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-secondary" onClick={onReset}>
          <RefreshCw size={16} /> So sánh file mới
        </button>
      </div>
    </div>
  );
}
