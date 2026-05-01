import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' };
const CATEGORIES = ['General', 'Maintenance', 'Tenant Management', 'Financial', 'Leasing', 'Inspection', 'Administrative'];

const CATEGORY_COLORS = {
  'General':            { bg: '#f3f4f6', color: '#374151' },
  'Maintenance':        { bg: '#fef3c7', color: '#92400e' },
  'Tenant Management':  { bg: '#dbeafe', color: '#1e40af' },
  'Financial':          { bg: '#dcfce7', color: '#166534' },
  'Leasing':            { bg: '#ede9fe', color: '#5b21b6' },
  'Inspection':         { bg: '#fee2e2', color: '#991b1b' },
  'Administrative':     { bg: '#f0fdf4', color: '#15803d' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [myOnly, setMyOnly] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '', description: '', due_date: '',
    assignee_ids: [], reminder_at: '', category: 'General'
  });

  useEffect(() => {
    Promise.all([api.get('/tasks'), api.get('/users')]).then(([t, u]) => {
      setTasks(t.data);
      setUsers(u.data);
      setLoading(false);
    });
  }, []);

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && (t.category || 'General') !== categoryFilter) return false;
    if (myOnly && !t.assignees?.some(a => a.id === user.id)) return false;
    return true;
  });

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catTasks = filtered.filter(t => (t.category || 'General') === cat);
    if (catTasks.length > 0) acc[cat] = catTasks;
    return acc;
  }, {});
  if (filtered.filter(t => !t.category || t.category === 'General').length === 0) {
    delete grouped['General'];
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...form, created_by: user.id });
      const { data } = await api.get('/tasks');
      setTasks(data);
      setShowNew(false);
      setForm({ title: '', description: '', due_date: '', assignee_ids: [], reminder_at: '', category: 'General' });
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating task');
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

  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
            Task Board
          </h1>
          <p style={{ color: 'var(--slate-500)', fontSize: 13, marginTop: 2 }}>
            {tasks.length} total tasks
          </p>
        </div>
        {user.role === 'owner' && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            + New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {statusFilters.map(f => (
          <button key={f.value} className="btn" onClick={() => setStatusFilter(f.value)}
            style={{
              background: statusFilter === f.value ? 'var(--grad-primary)' : 'var(--white)',
              color: statusFilter === f.value ? '#fff' : 'var(--slate-600)',
              border: statusFilter === f.value ? 'none' : '1.5px solid var(--slate-200)',
              boxShadow: statusFilter === f.value ? '0 4px 14px rgba(168,85,247,.3)' : 'none',
              fontSize: 12
            }}>
            {f.label}
          </button>
        ))}

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ width: 'auto', padding: '7px 12px', fontSize: 12, borderRadius: '999px' }}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button className="btn" onClick={() => setMyOnly(!myOnly)}
          style={{
            background: myOnly ? '#ede9fe' : 'var(--white)',
            color: myOnly ? 'var(--purple)' : 'var(--slate-600)',
            border: myOnly ? '1.5px solid var(--purple-light)' : '1.5px solid var(--slate-200)',
            fontSize: 12
          }}>
          My Tasks
        </button>
      </div>

      {/* Tasks by Category */}
      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div>No tasks found</div>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catTasks]) => (
          <div key={category} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                padding: '3px 12px', borderRadius: '999px', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: CATEGORY_COLORS[category]?.bg || '#f3f4f6',
                color: CATEGORY_COLORS[category]?.color || '#374151',
              }}>
                {category}
              </div>
              <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{catTasks.length} task{catTasks.length !== 1 ? 's' : ''}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--slate-100)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catTasks.map(task => (
                <div key={task.id}
                  className="card"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  style={{
                    cursor: 'pointer', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.15s',
                    ':hover': { transform: 'translateY(-1px)' }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--slate-900)' }}>{task.title}</div>
                    {task.description && (
                      <div style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 3 }}>
                        {task.description.slice(0, 90)}{task.description.length > 90 ? '...' : ''}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                      {task.due_date && (
                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                          Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {task.assignees?.map(a => (
                        <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--slate-600)' }}>
                          <span className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>{a.name.charAt(0)}</span>
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ color: 'var(--slate-200)', fontSize: 20, marginLeft: 16 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* New Task Modal */}
      {showNew && (
        <div className="modal-overlay">
          <div className="card" style={{ width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>New Task</h2>
              <button onClick={() => setShowNew(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--slate-500)' }}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Reminder</label>
                  <input type="datetime-local" value={form.reminder_at} onChange={e => setForm(f => ({ ...f, reminder_at: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {users.map(u => (
                    <button type="button" key={u.id} onClick={() => toggleAssignee(u.id)}
                      className="btn"
                      style={{
                        fontSize: 12, padding: '5px 12px',
                        background: form.assignee_ids.includes(u.id) ? 'var(--grad-primary)' : 'var(--slate-100)',
                        color: form.assignee_ids.includes(u.id) ? '#fff' : 'var(--slate-600)',
                        border: 'none',
                        boxShadow: form.assignee_ids.includes(u.id) ? '0 2px 8px rgba(168,85,247,.3)' : 'none'
                      }}>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
