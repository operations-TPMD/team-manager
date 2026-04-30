import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = { pending: 'ממתין', in_progress: 'בביצוע', done: 'הושלם' };
const STATUS_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'pending', label: 'ממתין' },
  { value: 'in_progress', label: 'בביצוע' },
  { value: 'done', label: 'הושלם' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [myOnly, setMyOnly] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', assignee_ids: [], reminder_at: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tasks'), api.get('/users')]).then(([t, u]) => {
      setTasks(t.data);
      setUsers(u.data);
      setLoading(false);
    });
  }, []);

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (myOnly && !t.assignees?.some(a => a.id === user.id)) return false;
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...form, created_by: user.id });
      const { data } = await api.get('/tasks');
      setTasks(data);
      setShowNew(false);
      setForm({ title: '', description: '', due_date: '', assignee_ids: [], reminder_at: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'שגיאה');
    }
  };

  const toggleAssignee = (id) => {
    setForm(f => ({
      ...f,
      assignee_ids: f.assignee_ids.includes(id)
        ? f.assignee_ids.filter(x => x !== id)
        : [...f.assignee_ids, id]
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>משימות</h1>
        {user.role === 'owner' && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ משימה חדשה</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <button key={f.value} className="btn" onClick={() => setFilter(f.value)}
            style={{ background: filter === f.value ? '#2563eb' : '#e2e8f0', color: filter === f.value ? '#fff' : '#1e293b' }}>
            {f.label}
          </button>
        ))}
        <button className="btn" onClick={() => setMyOnly(!myOnly)}
          style={{ background: myOnly ? '#7c3aed' : '#e2e8f0', color: myOnly ? '#fff' : '#1e293b' }}>
          המשימות שלי
        </button>
      </div>

      {loading ? (
        <div className="empty-state">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">אין משימות</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => (
            <div key={task.id} className="card" onClick={() => navigate(`/tasks/${task.id}`)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{task.title}</div>
                {task.description && (
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                    {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  {task.due_date && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}
                    </span>
                  )}
                  {task.assignees?.map(a => (
                    <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' }}>
                      <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                        {a.name.charAt(0)}
                      </span>
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: 18, marginRight: 8 }}>›</span>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>משימה חדשה</h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>כותרת *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>תיאור</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>תאריך יעד</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>תזכורת (מייל)</label>
                <input type="datetime-local" value={form.reminder_at} onChange={e => setForm(f => ({ ...f, reminder_at: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>שיוך לחברי צוות</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {users.map(u => (
                    <button type="button" key={u.id} onClick={() => toggleAssignee(u.id)}
                      className="btn" style={{
                        background: form.assignee_ids.includes(u.id) ? '#2563eb' : '#e2e8f0',
                        color: form.assignee_ids.includes(u.id) ? '#fff' : '#1e293b'
                      }}>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>ביטול</button>
                <button type="submit" className="btn btn-primary">צור משימה</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
