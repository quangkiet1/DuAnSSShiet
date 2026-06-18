import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GitCompare, ListChecks, ShieldCheck } from 'lucide-react';
import Layout from '../components/layout/Layout';

function InfoRow({ icon: Icon, title, desc }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 6,
          background: 'var(--gray-100)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--gray-700)',
          flexShrink: 0,
        }}>
          <Icon size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: 15, color: 'var(--gray-900)', marginBottom: 4 }}>{title}</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Layout title="Tổng quan" subtitle="So sánh bảng điểm Excel theo Lớp + MSSV">
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <section className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 24, lineHeight: 1.25, color: 'var(--gray-900)', marginBottom: 6 }}>
                So sánh bảng điểm
              </h1>
              <p style={{ color: 'var(--gray-500)', fontSize: 14, maxWidth: 620 }}>
                Upload hai file Excel, hệ thống tự nhận diện cột Lớp, MSSV và các cột điểm rồi xuất file kết quả có highlight.
              </p>
            </div>
            <Link to="/compare" className="btn btn-primary btn-lg">
              <GitCompare size={18} />
              Bắt đầu
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <div className="three-col">
          <InfoRow
            icon={ListChecks}
            title="Ghép đúng sinh viên"
            desc="Dòng dữ liệu được khớp bằng cặp Lớp + MSSV trước khi so điểm."
          />
          <InfoRow
            icon={BookOpen}
            title="So theo chiều ngang"
            desc="Các cột điểm được mapping từ trái sang phải, phù hợp với nhiều cột CLO trùng tên."
          />
          <InfoRow
            icon={ShieldCheck}
            title="Nhận ô trống"
            desc="Nếu điểm bị xóa ở một vài ô/cột, kết quả sẽ báo File A hoặc File B đang trống."
          />
        </div>
      </div>
    </Layout>
  );
}
