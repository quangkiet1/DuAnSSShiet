import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { gsap } from 'gsap';
import { GitCompare, Clock, BookTemplate, Home, Zap } from 'lucide-react';

const navItems = [
  { icon: Home,        label: 'Tổng quan',      to: '/',          desc: 'Dashboard' },
  { icon: GitCompare,  label: 'So sánh mới',    to: '/compare',   desc: 'So sánh bảng điểm' },
  { icon: Clock,       label: 'Lịch sử',        to: '/history',   desc: 'Xem lại kết quả' },
  { icon: BookTemplate,label: 'Template',       to: '/templates', desc: 'Cấu hình lưu sẵn' },
];

export default function Sidebar() {
  const sidebarRef = useRef(null);
  const logoRef    = useRef(null);
  const navRef     = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo entrance
      gsap.fromTo(logoRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      );
      // Nav items stagger
      gsap.fromTo(navRef.current.querySelectorAll('.sidebar-item'),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', stagger: 0.07, delay: 0.25 }
      );
    }, sidebarRef);

    return () => ctx.revert();
  }, []);

  return (
    <aside className="sidebar" ref={sidebarRef}>
      {/* Logo */}
      <div className="sidebar-logo" ref={logoRef}>
        <div className="sidebar-logo-icon" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
          boxShadow: '0 4px 12px rgba(29,78,216,0.4)',
        }}>
          <Zap size={16} strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <h1>GradeSync</h1>
          <span>So sánh bảng điểm</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" ref={navRef}>
        <div className="sidebar-section-title">Menu chính</div>
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 'auto',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--gray-500)', textAlign: 'center',
          letterSpacing: '0.05em',
        }}>
          GradeSync v1.0 · 2026
        </div>
      </div>
    </aside>
  );
}
