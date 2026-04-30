import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = { pending: 'ממתין', in_progress: 'בביצוע', done: 'הושלם' };

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
    if (!confirm('למחוק את המשימה?')) return;
    await api.delete(`/tasks/${id}`);
    navigate('/');
  };

  if (loading) return <div className="empty-state">טוען...</div>;
  if (!task) return <div className="empty-state">משימה לא נמצאה</div>;

  return (
    <div style={{ maxWidth: 680 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
        ← חזרה
      </button>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{task.title}</h1>
          <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
        </div>

        {task.description && (
          <p style={{ color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>{task.description}</p>
        )}

        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b', marginBottom: 16, flexWrap: 'wrap' }}>
          {task.due_date && <span>📅 יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>}
          {task.creator_name && <span>👤 נוצר ע"י: {task.creator_name}</span>}
          <span>🕒 {new Date(task.created_at).toLocaleDateString('he-IL')}</span>
        </div>

        {task.assignees?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>משויכים:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {task.assignees.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="avatar">{a.name.charAt(0)}</span>
                  <span style={{ fontSize: 13 }}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.reminders?.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 13, color: '#64748b' }}>
            🔔 תזכורת: {new Date(task.reminders[0].remind_at).toLocaleString('he-IL')}
            {task.reminders[0].sent && ' (נשלחה)'}
          </div>
        )}

        {user.role === 'owner' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, alignSelf: 'center', color: '#475569' }}>עדכן סטטוס:</span>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <button key={val} className="btn" onClick={() => updateStatus(val)}
                style={{
                  background: task.status === val ? '#2563eb' : '#e2e8f0',
                  color: task.status === val ? '#fff' : '#1e293b'
                }}>
                {label}
              </button>
            ))}
            <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={deleteTask}>
              מחק
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          הערות {task.notes?.length > 0 && `(${task.notes.length})`}
        </h2>

        {task.notes?.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>אין הערות עדיין</div>
        )}

        {task.notes?.map(n => (
          <div key={n.id} style={{
            padding: '10px 12px', background: '#f8fafc', borderRadius: 8,
            marginBottom: 8, borderRight: '3px solid #2563eb'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{n.author_name}</div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{n.content}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              {new Date(n.created_at).toLocaleString('he-IL')}
            </div>
          </div>
        ))}

        <form onSubmit={addNote} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="הוסף הערה..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">שלח</button>
        </form>
      </div>
    </div>
  );
}
