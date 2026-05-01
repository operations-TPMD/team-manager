import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function TimeTracker() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [entries, setEntries] = useState([]);
  const [allStatus, setAllStatus] = useState([]);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [s, e] = await Promise.all([
        api.get(`/time/status/${user.id}`),
        api.get(`/time/entries/${user.id}`)
      ]);
      setStatus(s.data);
      setEntries(e.data);
      if (user.role === 'owner') {
        try {
          const all = await api.get('/time/all-status');
          setAllStatus(all.data);
        } catch { setAllStatus([]); }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load time data. Please refresh.');
      setStatus({ clocked_in: false, entry: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!status?.clocked_in || !status?.entry?.clock_in) {
      setElapsed('00:00:00');
      return;
    }
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(status.entry.clock_in).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const clockIn = async () => {
    await api.post('/time/clock-in', { user_id: user.id });
    load();
  };

  const clockOut = async () => {
    await api.post('/time/clock-out', { user_id: user.id });
    setElapsed('00:00:00');
    load();
  };

  const calcHours = (entry) => {
    if (!entry.clock_out) return '—';
    const diff = new Date(entry.clock_out) - new Date(entry.clock_in);
    return (diff / 3600000).toFixed(2) + 'h';
  };

  if (loading) return <div className="empty-state">Loading...</div>;
  if (error) return <div style={{ padding: 32, color: '#b91c1c', background: '#fee2e2', borderRadius: 12 }}>{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
          Time Clock
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 13, marginTop: 2 }}>
          Track your working hours
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'owner' ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>

        {/* Clock widget */}
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-500)', marginBottom: 8 }}>
            {user.name}
          </div>

          <div style={{
            fontSize: 52, fontWeight: 700, fontFamily: 'Poppins, monospace',
            letterSpacing: '-0.02em',
            background: status?.clocked_in ? 'var(--grad-primary)' : 'var(--slate-200)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8, transition: 'all 0.3s'
          }}>
            {elapsed}
          </div>

          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 28 }}>
            {status?.clocked_in
              ? `Clocked in at ${new Date(status.entry.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : 'Not clocked in'}
          </div>

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            <div className={`status-dot ${status?.clocked_in ? 'online' : 'offline'}`} />
            <span style={{ fontSize: 12, fontWeight: 600, color: status?.clocked_in ? '#22c55e' : 'var(--slate-400)' }}>
              {status?.clocked_in ? 'Working' : 'Offline'}
            </span>
          </div>

          {status?.clocked_in ? (
            <button className="btn btn-danger" onClick={clockOut}
              style={{ padding: '13px 40px', fontSize: 15, borderRadius: '999px' }}>
              Clock Out
            </button>
          ) : (
            <button className="btn btn-success" onClick={clockIn}
              style={{ padding: '13px 40px', fontSize: 15, borderRadius: '999px', boxShadow: '0 4px 20px rgba(34,197,94,.3)' }}>
              Clock In
            </button>
          )}
        </div>

        {/* Team status (owners only) */}
        {user.role === 'owner' && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 14 }}>Team Status</div>
            {allStatus.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>No employees</div>
            ) : (
              allStatus.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid var(--slate-100)'
                }}>
                  <div className={`status-dot ${e.clocked_in ? 'online' : 'offline'}`} />
                  <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{e.name.charAt(0)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>{e.name}</div>
                    {e.clocked_in && (
                      <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                        Since {new Date(e.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: e.clocked_in ? '#22c55e' : 'var(--slate-400)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {e.clocked_in ? 'Working' : 'Offline'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>Recent History</div>
        {entries.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>No time entries yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 20).map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{new Date(e.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{e.clock_out
                    ? new Date(e.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : <span style={{ color: '#22c55e', fontWeight: 600 }}>Active</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{calcHours(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
