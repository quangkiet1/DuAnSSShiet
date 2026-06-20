import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle }) {
  const headerRef  = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: -16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.05 }
      );
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', delay: 0.15 }
      );
    });
    return () => ctx.revert();
  }, [title]); // re-animate khi chuyển trang

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="page-header" ref={headerRef}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>
        <main className="page-body" ref={contentRef}>
          {children}
        </main>
      </div>
    </div>
  );
}
