import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',       label: 'Tasks',       icon: '✅' },
  { to: '/time',   label: 'Time Clock',  icon: '⏱️' },
  { to: '/report', label: 'Reports',     icon: '📊' },
  { to: '/team',   label: 'Team',        icon: '👥', ownerOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 240, background: 'var(--purple-darkest)',
        display: 'flex', flexDirection: 'column',
        padding: 0, flexShrink: 0,
        boxShadow: '4px 0 20px rgba(0,0,0,.15)'
      }}>
        {/* Logo area */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,.07)'
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,.4)',
            marginBottom: 4
          }}>The Property Management</div>
          <div style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em',
            background: 'linear-gradient(135deg, #d946ef, #a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Doctor
          </div>
          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {user?.name?.charAt(0)}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                {user?.role === 'owner' ? 'Manager' : 'Employee'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,.25)', padding: '0 12px', marginBottom: 8, textTransform: 'uppercase' }}>
            Navigation
          </div>
          {navItems
            .filter(item => !item.ownerOnly || user?.role === 'owner')
            .map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: '10px', marginBottom: 3,
                  color: isActive ? '#fff' : 'rgba(255,255,255,.5)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(217,70,239,.25), rgba(168,85,247,.25))'
                    : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  borderLeft: isActive ? '3px solid #d946ef' : '3px solid transparent',
                })}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px 0', borderRadius: '10px',
              background: 'rgba(255,255,255,.06)', border: 'none',
              color: 'rgba(255,255,255,.5)', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.15s'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: '100%' }}>
        {children}
      </main>
    </div>
  );
}
