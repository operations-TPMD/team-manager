import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email });
      login(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Email not found. Please contact your manager.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--purple-darkest)',
    }}>
      {/* Left brand panel */}
      <div style={{
        width: '45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px',
        background: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 60%, #7c3aed 100%)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,.4)', marginBottom: 8, textTransform: 'uppercase' }}>
          The Property Management
        </div>
        <div style={{
          fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #d946ef, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 20, lineHeight: 1.1
        }}>
          Doctor<br/>Team Hub
        </div>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14, lineHeight: 1.7, maxWidth: 320 }}>
          Manage your team, track tasks, monitor working hours — all in one place.
        </p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Task Management', 'Time Tracking', 'Team Collaboration'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'linear-gradient(135deg, #d946ef, #a855f7)'
              }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--slate-50)', padding: '40px'
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--slate-900)', marginBottom: 6 }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: 14, marginBottom: 32 }}>
            Sign in with your work email to continue.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Work Email</label>
              <input
                type="email"
                placeholder="you@tpmd.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus required
                style={{ fontSize: 15, padding: '12px 16px' }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fee2e2', color: '#b91c1c',
                padding: '10px 14px', borderRadius: 10,
                fontSize: 13, marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--slate-500)', textAlign: 'center' }}>
            Don't have access? Contact your manager to be added to the system.
          </p>
        </div>
      </div>
    </div>
  );
}
