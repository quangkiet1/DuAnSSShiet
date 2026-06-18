import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
