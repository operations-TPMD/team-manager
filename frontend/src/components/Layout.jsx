import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',         label: 'משימות',    icon: '✅' },
  { to: '/time',     label: 'שעון',      icon: '⏱️' },
  { to: '/report',   label: "דו''ח שעות", icon: '📊' },
  { to: '/team',     label: 'צוות',      icon: '👥', ownerOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#1e293b', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Team Manager</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{user?.name}</div>
          <span className={`badge badge-${user?.role}`} style={{ marginTop: 6 }}>
            {user?.role === 'owner' ? 'מנהל' : 'עובד'}
          </span>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems
            .filter(item => !item.ownerOnly || user?.role === 'owner')
            .map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? '#2563eb' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s'
                })}
              >
                <span>{item.icon}</span>
                <span style={{ fontSize: 14 }}>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ width: '100%' }}>
            יציאה
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
