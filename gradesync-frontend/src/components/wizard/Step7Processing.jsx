/**
 * Step 7: Processing - Run comparison job and show real-time progress
 */
import { useState, useEffect, useRef } from 'react';
import { runComparison, getJobStatus } from '../../services/api';

const POLL_INTERVAL = 1200; // ms

export default function Step7Processing({ data, onNext, onBack, onData }) {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('pending');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Đang khởi tạo...');
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const startedRef = useRef(false);

  // Start the job
  useEffect(() => {
    const startJob = async () => {
      if (startedRef.current) return;
      startedRef.current = true;
      try {
        const payload = {
          sheetA: data.sheetA,
          sheetB: data.sheetB,
          headerRowA: data.analysis?.fileA?.detectedHeaderRow,
          headerRowB: data.analysis?.fileB?.detectedHeaderRow,
          identityMapping: data.identityMapping,
          scoreMappings: data.scoreMappings,
          compareRules: data.compareRules,
          saveTemplate: data.saveTemplate,
          templateName: data.templateName,
        };
        const res = await runComparison(data.uploadId, payload);
        setJobId(res.jobId);
      } catch (e) {
        setStatus('failed');
        setError(e.message);
      }
    };
    startJob();
  }, [
    data.analysis?.fileA?.detectedHeaderRow,
    data.analysis?.fileB?.detectedHeaderRow,
    data.compareRules,
    data.identityMapping,
    data.saveTemplate,
    data.scoreMappings,
    data.sheetA,
    data.sheetB,
    data.templateName,
    data.uploadId,
  ]);

  // Poll status
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await getJobStatus(jobId);
        setStatus(res.status);
        setProgress(res.progress || 0);
        setMessage(res.message || '');

        if (res.status === 'done') {
          clearInterval(pollRef.current);
          onData({ jobId, result: res.result });
          setTimeout(() => onNext(), 600);
        } else if (res.status === 'failed') {
          clearInterval(pollRef.current);
          setError(res.error || 'Có lỗi xảy ra');
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [jobId, onData, onNext]);

  const STEPS_MESSAGES = [
    { at: 0, msg: 'Đang chuẩn bị...' },
    { at: 5, msg: 'Đang đọc File A...' },
    { at: 20, msg: 'Đang đọc File B...' },
    { at: 35, msg: 'Đang chuẩn hóa và ghép sinh viên...' },
    { at: 70, msg: 'Đang so sánh điểm...' },
    { at: 85, msg: 'Đang tạo file Excel kết quả...' },
    { at: 100, msg: 'Hoàn thành!' },
  ];

  return (
    <div className="card animate-fadeIn">
      <div className="card-header">
        <div className="card-title">Đang xử lý so sánh</div>
        <div className="card-subtitle">Hệ thống đang so sánh dữ liệu điểm giữa 2 file</div>
      </div>
      <div className="card-body" style={{ padding: 40 }}>
        {status !== 'failed' ? (
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8 }}>
              {status === 'done' ? 'Hoàn thành!' : 'Đang xử lý...'}
            </h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: 28 }}>{message}</p>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--gray-600)' }}>Tiến trình</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: 12 }}>
                <div className="progress-fill" style={{ width: `${progress}%`, borderRadius: 6 }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginTop: 24 }}>
              {STEPS_MESSAGES.map((step) => (
                <div key={step.at} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: progress >= step.at ? (progress > step.at ? 'var(--success)' : 'var(--primary)') : 'var(--gray-300)',
                  fontSize: 14, fontWeight: progress >= step.at ? 600 : 400,
                  transition: 'all 0.3s'
                }}>
                  <span>{progress > step.at ? '✓' : progress >= step.at ? '⏳' : '○'}</span>
                  <span>{step.msg}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: 8 }}>Xử lý thất bại</h3>
            <div className="alert alert-danger" style={{ textAlign: 'left', marginBottom: 20 }}>{error}</div>
            <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>
          </div>
        )}
      </div>
    </div>
  );
}
