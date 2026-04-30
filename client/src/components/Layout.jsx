import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Main app layout wrapper — sidebar + content area
 */
export default function Layout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar title={title} />
        <main style={{ flex: 1, overflow: 'auto', padding: '28px' }} className="page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
