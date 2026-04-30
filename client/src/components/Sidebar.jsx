import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, Archive, Users, Sparkles,
  LogOut, Gem, MessageCircle, Shield
} from 'lucide-react';

const navItems = [
  { to: '/admin',     icon: Shield,          label: 'Admin Panel', roles: ['admin'] },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'worker'] },
  { to: '/orders',    icon: Package,          label: 'Orders', roles: ['admin'] },
  { to: '/my-orders', icon: Package,          label: 'My Orders', roles: ['worker'] },
  { to: '/inventory', icon: Archive,        label: 'Inventory', roles: ['admin'] },
  { to: '/workers',   icon: Users,             label: 'Workers', roles: ['admin'] },
  { to: '/ai-design', icon: Sparkles,          label: 'AI Design Assistant', roles: ['admin'] },
  { to: '/ai-chat',   icon: MessageCircle,     label: 'AI Chat', roles: ['worker'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: '240px',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Gem size={18} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.5 }}>
              JEWEL
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -2 }}>
              Manufacturing
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, padding: '0 4px', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Main Menu
        </div>
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: 'var(--accent)',
            border: '1px solid rgba(212,168,83,0.2)',
            flexShrink: 0
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
