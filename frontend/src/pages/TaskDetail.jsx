import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' };

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api.get(`/tasks/${id}`).then(r => { setTask(r.data); setLoading(false); });
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    await api.patch(`/tasks/${id}`, { status });
    load();
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await api.post(`/tasks/${id}/notes`, { user_id: user.id, content: note });
    setNote('');
    load();
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    navigate('/');
  };

  if (loading) return <div className="empty-state">Loading...</div>;
  if (!task) return <div className="empty-state">Task not found</div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 20, fontSize: 13 }}>
        ← Back to Tasks
      </button>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            {task.category && task.category !== 'General' && (
              <div style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', background: '#ede9fe', color: 'var(--purple)',
                marginBottom: 8
              }}>
                {task.category}
              </div>
            )}
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.01em' }}>
              {task.title}
            </h1>
          </div>
          <span className={`badge badge-${task.status}`} style={{ marginLeft: 12, flexShrink: 0 }}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        {task.description && (
          <p style={{ color: 'var(--slate-600)', marginBottom: 16, lineHeight: 1.7, fontSize: 14 }}>
            {task.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--slate-500)', marginBottom: 16, flexWrap: 'wrap' }}>
          {task.due_date && (
            <span>📅 Due: {new Date(task.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
          {task.creator_name && <span>👤 Created by: {task.creator_name}</span>}
          <span>🕒 {new Date(task.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>

        {task.assignees?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="section-title">Assigned To</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              {task.assignees.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--slate-50)', borderRadius: '999px', border: '1px solid var(--slate-200)' }}>
                  <span className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{a.name.charAt(0)}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.reminders?.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔔 Reminder: {new Date(task.reminders[0].remind_at).toLocaleString('en-US')}
            {task.reminders[0].sent && <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 8px', borderRadius: '999px', fontSize: 10, fontWeight: 700 }}>SENT</span>}
          </div>
        )}

        {user.role === 'owner' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--slate-100)', paddingTop: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, alignSelf: 'center', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status:
            </span>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <button key={val} className="btn" onClick={() => updateStatus(val)}
                style={{
                  fontSize: 12, padding: '6px 14px',
                  background: task.status === val ? 'var(--grad-primary)' : 'var(--slate-100)',
                  color: task.status === val ? '#fff' : 'var(--slate-600)',
                  border: 'none',
                  boxShadow: task.status === val ? '0 2px 8px rgba(168,85,247,.3)' : 'none'
                }}>
                {label}
              </button>
            ))}
            <button className="btn btn-danger" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={deleteTask}>
              Delete Task
            </button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--slate-900)' }}>
          Notes {task.notes?.length > 0 && <span style={{ color: 'var(--slate-400)', fontWeight: 400 }}>({task.notes.length})</span>}
        </h2>

        {task.notes?.length === 0 && (
          <div style={{ color: 'var(--slate-400)', fontSize: 13, marginBottom: 16 }}>No notes yet. Add the first one below.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {task.notes?.map(n => (
            <div key={n.id} style={{
              padding: '12px 16px', background: 'var(--slate-50)', borderRadius: 10,
              borderLeft: '3px solid var(--purple-light)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)' }}>{n.author_name}</span>
                <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>
                  {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--slate-700)', lineHeight: 1.6 }}>{n.content}</div>
            </div>
          ))}
        </div>

        <form onSubmit={addNote} style={{ display: 'flex', gap: 8 }}>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Add Note</button>
        </form>
      </div>
    </div>
  );
}
