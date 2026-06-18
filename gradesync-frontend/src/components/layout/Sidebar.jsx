import { NavLink } from 'react-router-dom';
import { GitCompare, Clock, BookTemplate, Home } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Tổng quan', to: '/' },
  { icon: GitCompare, label: 'So sánh mới', to: '/compare' },
  { icon: Clock, label: 'Lịch sử', to: '/history' },
  { icon: BookTemplate, label: 'Template mapping', to: '/templates' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">G</div>
        <div className="sidebar-logo-text">
          <h1>GradeSync</h1>
          <span>So sánh bảng điểm</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu chính</div>
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px', borderTop: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '11px', color: 'var(--gray-500)', textAlign: 'center' }}>
          GradeSync v1.0
        </div>
      </div>
    </aside>
  );
}
