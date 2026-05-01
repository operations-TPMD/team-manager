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
      setError(err.response?.data?.error || 'Error adding team member');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
          Team Management
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 13, marginTop: 2 }}>
          {users.length} team member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Members list */}
        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--slate-900)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
            Members
          </h2>
          {users.length === 0 ? (
            <div className="empty-state">No team members yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {users.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: '1px solid var(--slate-100)'
                }}>
                  <span className="avatar">{u.name.charAt(0)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--slate-900)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{u.email}</div>
                  </div>
                  <span className={`badge badge-${u.role}`}>
                    {u.role === 'owner' ? 'Manager' : 'Employee'}
                  </span>
                  <button className="btn btn-danger"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => handleDelete(u.id, u.name)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add member form */}
        <div className="card">
          <h2 style={{ fontSize: 11, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate-500)' }}>
            Add Member
          </h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Smith"
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@tpmd.io"
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="employee">Employee</option>
                <option value="owner">Manager</option>
              </select>
            </div>
            {error && (
              <div style={{
                background: '#fee2e2', color: '#b91c1c',
                padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12
              }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Add to Team
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
