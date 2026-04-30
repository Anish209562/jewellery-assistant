import { Bell } from 'lucide-react';

/**
 * Top navigation bar
 */
export default function Navbar({ title }) {
  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      flexShrink: 0,
    }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Notification placeholder */}
        <button style={{
          background: 'none',
          border: '1px solid var(--border-strong)',
          borderRadius: '10px',
          width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 0.2s',
        }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        >
          <Bell size={16} />
        </button>

        {/* Gold accent bar */}
        <div style={{
          height: '32px',
          width: '2px',
          background: 'var(--accent-gradient)',
          borderRadius: '1px',
          opacity: 0.5,
        }} />

        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short', month: 'short', day: 'numeric'
          })}
        </div>
      </div>
    </header>
  );
}
