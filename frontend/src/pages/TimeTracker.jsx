import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function TimeTracker() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [entries, setEntries] = useState([]);
  const [allStatus, setAllStatus] = useState([]);
  const [elapsed, setElapsed] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [s, e] = await Promise.all([
      api.get(`/time/status/${user.id}`),
      api.get(`/time/entries/${user.id}`)
    ]);
    setStatus(s.data);
    setEntries(e.data);
    if (user.role === 'owner') {
      const all = await api.get('/time/all-status');
      setAllStatus(all.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!status?.clocked_in || !status?.entry?.clock_in) return;
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
    setElapsed('');
    load();
  };

  const calcHours = (entry) => {
    if (!entry.clock_out) return '-';
    const diff = new Date(entry.clock_out) - new Date(entry.clock_in);
    return (diff / 3600000).toFixed(2) + ' ש"ע';
  };

  if (loading) return <div className="empty-state">טוען...</div>;

  return (
    <div>
      <h1 className="page-title">שעון נוכחות</h1>

      <div style={{ display: 'grid', gridTemplateColumns: user.role === 'owner' ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>שלום, {user.name}</div>
          <div style={{
            fontSize: 48, fontWeight: 700, fontFamily: 'monospace',
            color: status?.clocked_in ? '#22c55e' : '#94a3b8', marginBottom: 16
          }}>
            {status?.clocked_in ? elapsed || '00:00:00' : '—'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            {status?.clocked_in
              ? `כניסה: ${new Date(status.entry.clock_in).toLocaleTimeString('he-IL')}`
              : 'לא מחובר כרגע'}
          </div>
          {status?.clocked_in ? (
            <button className="btn btn-danger" onClick={clockOut} style={{ padding: '12px 32px', fontSize: 16 }}>
              Clock Out
            </button>
          ) : (
            <button className="btn btn-success" onClick={clockIn} style={{ padding: '12px 32px', fontSize: 16 }}>
              Clock In
            </button>
          )}
        </div>

        {user.role === 'owner' && (
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>סטטוס צוות</h2>
            {allStatus.length === 0 ? (
              <div className="empty-state">אין עובדים</div>
            ) : (
              allStatus.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: e.clocked_in ? '#22c55e' : '#e2e8f0', flexShrink: 0
                  }} />
                  <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{e.name.charAt(0)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
                    {e.clocked_in && (
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        מאז {new Date(e.clock_in).toLocaleTimeString('he-IL')}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: e.clocked_in ? '#22c55e' : '#94a3b8' }}>
                    {e.clocked_in ? 'עובד' : 'לא עובד'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>היסטוריה</h2>
        {entries.length === 0 ? (
          <div className="empty-state">אין רשומות</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['תאריך', 'כניסה', 'יציאה', 'שעות'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 20).map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px' }}>{new Date(e.date).toLocaleDateString('he-IL')}</td>
                  <td style={{ padding: '8px 12px' }}>{new Date(e.clock_in).toLocaleTimeString('he-IL')}</td>
                  <td style={{ padding: '8px 12px' }}>{e.clock_out ? new Date(e.clock_out).toLocaleTimeString('he-IL') : <span style={{ color: '#22c55e' }}>פעיל</span>}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>{calcHours(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
