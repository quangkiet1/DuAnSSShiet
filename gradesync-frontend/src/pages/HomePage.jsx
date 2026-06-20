import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  ArrowRight, GitCompare, ListChecks, ShieldCheck,
  BookOpen, Zap, BarChart3, Clock, FileCheck,
} from 'lucide-react';
import Layout from '../components/layout/Layout';

const FEATURES = [
  {
    icon: ListChecks,
    color: 'var(--primary)',
    bg: 'var(--primary-bg)',
    title: 'Ghép tự động theo MSSV',
    desc: 'Hệ thống tự nhận diện cột MSSV và ghép sinh viên giữa 2 file mà không cần cấu hình thủ công.',
  },
  {
    icon: BarChart3,
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    title: 'So sánh nhiều cột điểm',
    desc: 'Mapping các cột CLO, thi, thực hành... theo chiều ngang. Hỗ trợ cột tên trùng nhau.',
  },
  {
    icon: ShieldCheck,
    color: '#7c3aed',
    bg: '#f5f3ff',
    title: 'Phát hiện sai lệch',
    desc: 'Báo cáo điểm khác nhau, sinh viên thiếu/dư, MSSV trùng, và cảnh báo sai tên/lớp.',
  },
  {
    icon: FileCheck,
    color: '#0f766e',
    bg: '#f0fdfa',
    title: 'Xuất Excel highlight',
    desc: 'File kết quả 8 sheet: tổng quan, khác điểm, sai thông tin, và dữ liệu gốc có highlight màu.',
  },
  {
    icon: Clock,
    color: '#b45309',
    bg: '#fffbeb',
    title: 'Lưu lịch sử & Template',
    desc: 'Lưu cấu hình mapping vào SQLite. Lần sau mở file tương tự, hệ thống tự gợi ý template.',
  },
  {
    icon: Zap,
    color: '#c2410c',
    bg: '#fff7ed',
    title: 'Xử lý nhanh — Worker Thread',
    desc: 'Logic so sánh chạy trên luồng riêng biệt, giao diện không bị đơ dù file có hàng nghìn dòng.',
  },
];

function FeatureCard({ icon: Icon, color, bg, title, desc, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.fromTo(el,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out', delay: 0.1 + index * 0.07 }
    );
    return () => tween.kill();
  }, [index]);

  const handleHover = (enter) => {
    gsap.to(ref.current, {
      y: enter ? -4 : 0,
      boxShadow: enter ? '0 8px 24px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.05)',
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={ref}
      className="card"
      style={{ cursor: 'default', transition: 'none' }}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: bg, display: 'grid', placeItems: 'center',
          boxShadow: `0 0 0 1px ${color}22`,
        }}>
          <Icon size={20} color={color} />
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const heroRef  = useRef(null);
  const btnRef   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.05 });

      tl.fromTo(heroRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      ).fromTo(btnRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' },
        '-=0.2'
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <Layout title="Tổng quan" subtitle="Phần mềm so sánh bảng điểm Excel — GradeSync v1.0">
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Hero Section ── */}
        <section className="card" ref={heroRef} style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #6366f1 100%)',
          border: 'none', overflow: 'hidden', position: 'relative',
        }}>
          {/* Background decorations */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, right: 60,
            width: 160, height: 160, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }} />

          <div className="card-body" style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
            padding: '28px 28px', position: 'relative',
          }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.12)', color: '#93c5fd',
                borderRadius: 20, padding: '4px 12px',
                fontSize: 12, fontWeight: 600, marginBottom: 14,
              }}>
                <Zap size={13} /> Tự động hoàn toàn · Worker Thread
              </div>
              <h1 style={{
                fontSize: 26, fontWeight: 800, color: '#fff',
                lineHeight: 1.25, marginBottom: 10,
              }}>
                So sánh bảng điểm<br />
                <span style={{ color: '#93c5fd' }}>chính xác, nhanh chóng</span>
              </h1>
              <p style={{ color: '#bfdbfe', fontSize: 14, maxWidth: 520, lineHeight: 1.7 }}>
                Upload 2 file Excel — hệ thống tự nhận diện cột MSSV, ghép sinh viên
                và xuất báo cáo chi tiết chỉ trong vài giây.
              </p>
            </div>

            <div ref={btnRef} style={{ flexShrink: 0 }}>
              <Link to="/compare" className="btn btn-lg" style={{
                background: '#fff', color: 'var(--primary)',
                fontWeight: 700, fontSize: 15,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: 'none', padding: '12px 24px',
                gap: 10,
              }}>
                <GitCompare size={20} />
                Bắt đầu so sánh
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats Row ── */}
        <QuickStats />

        {/* ── Features Grid ── */}
        <div>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: 'var(--gray-900)',
            marginBottom: 14, paddingLeft: 2,
          }}>
            Tính năng nổi bật
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}

function QuickStats() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current.querySelectorAll('.qs-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.08, delay: 0.3 }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  const stats = [
    { label: 'Tự động ghép MSSV', value: '100%', color: 'var(--primary)' },
    { label: 'Sheet kết quả Excel', value: '8',    color: 'var(--success)' },
    { label: 'Dung sai mặc định',   value: '±0.001', color: '#7c3aed' },
    { label: 'Lưu trữ offline',     value: 'SQLite', color: '#0f766e' },
  ];

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 12,
    }}>
      {stats.map((s) => (
        <div key={s.label} className="qs-card card" style={{ overflow: 'hidden' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '14px 10px' }}>
            <div style={{
              fontSize: 22, fontWeight: 800, color: s.color,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
