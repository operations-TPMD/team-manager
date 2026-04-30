import { useState, useEffect } from 'react';
import api from '../api';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' });
  const [error, setError] = useState('');

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', role: 'employee' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`למחוק את ${name}?`)) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="page-title">ניהול צוות</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>חברי הצוות ({users.length})</h2>
          {users.length === 0 ? (
            <div className="empty-state">אין חברי צוות</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #f1f5f9'
                }}>
                  <span className="avatar">{u.name.charAt(0)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                  </div>
                  <span className={`badge badge-${u.role}`}>
                    {u.role === 'owner' ? 'מנהל' : 'עובד'}
                  </span>
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => handleDelete(u.id, u.name)}>
                    מחק
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>הוסף חבר צוות</h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>שם מלא *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>כתובת מייל *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>תפקיד</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="employee">עובד</option>
                <option value="owner">מנהל</option>
              </select>
            </div>
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              הוסף לצוות
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
