/**
 * History Page - List past comparison jobs
 */
import { useState, useEffect } from 'react';
import { Clock, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getHistory, downloadResult } from '../services/api';

function StatusBadge({ status }) {
  const map = {
    done: { cls: 'badge-success', icon: '✅', label: 'Hoàn thành' },
    processing: { cls: 'badge-info', icon: '⏳', label: 'Đang xử lý' },
    pending: { cls: 'badge-gray', icon: '🕐', label: 'Chờ xử lý' },
    failed: { cls: 'badge-danger', icon: '❌', label: 'Lỗi' },
  };
  const info = map[status] || map.pending;
  return <span className={`badge ${info.cls}`}>{info.icon} {info.label}</span>;
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((res) => setJobs(res.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Lịch Sử So Sánh" subtitle="Tất cả lịch sử job so sánh trong phiên hiện tại">
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Clock size={18} style={{ marginRight: 6 }} />Lịch Sử Job</div>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            setLoading(true);
            getHistory().then(r => setJobs(r.jobs||[])).finally(() => setLoading(false));
          }}>🔄 Refresh</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--gray-500)' }}>Đang tải...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Chưa có lịch sử</h3>
              <p>Thực hiện so sánh đầu tiên để xem lịch sử tại đây</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Trạng thái</th>
                    <th>Kết quả</th>
                    <th>Thời gian tạo</th>
                    <th>Hoàn thành lúc</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="cell-mssv">{job.id.split('-')[0]}...</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td>
                        {job.result ? (
                          <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span>✅ Ghép: <strong>{job.result.matchedStudents}</strong></span>
                            {job.result.differentScores > 0 && <span style={{ color: 'var(--danger)' }}>🔴 Khác điểm: <strong>{job.result.differentScores}</strong></span>}
                            {job.result.missingStudents > 0 && <span style={{ color: 'var(--orange)' }}>🟠 Thiếu: <strong>{job.result.missingStudents}</strong></span>}
                          </div>
                        ) : job.error ? (
                          <span style={{ color: 'var(--danger)', fontSize: 12 }}>{job.error}</span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {new Date(job.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {job.completedAt ? new Date(job.completedAt).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td>
                        {job.status === 'done' && job.downloadAvailable && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => window.open(downloadResult(job.id), '_blank')}
                          >
                            <Download size={13} /> Tải .xlsx
                          </button>
                        )}
                        {job.status === 'done' && !job.downloadAvailable && (
                          <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>Chỉ còn lịch sử</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
