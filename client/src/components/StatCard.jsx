/**
 * Reusable Stat Card for dashboard KPIs
 */
export default function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorMap = {
    gold:    { bg: 'rgba(212,168,83,0.12)',  border: 'rgba(212,168,83,0.25)',  text: '#d4a853' },
    blue:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  text: '#3b82f6' },
    green:   { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   text: '#22c55e' },
    red:     { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
    purple:  { bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.25)', text: '#a855f7' },
    orange:  { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  };

  const c = colorMap[color] || colorMap.gold;

  return (
    <div className="stat-card">
      {/* Subtle gradient blob in background */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: c.bg, filter: 'blur(30px)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {subtitle}
            </div>
          )}
        </div>

        {Icon && (
          <div className="stat-icon" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <Icon size={22} color={c.text} />
          </div>
        )}
      </div>
    </div>
  );
}
