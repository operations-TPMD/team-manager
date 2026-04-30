import { useState, useEffect } from 'react';
import api from '../api';

export default function TimeReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      // Fetch all entries for display (use a separate endpoint)
      const { data } = await api.get(`/time/entries/all?${params}`);
      setEntries(data);
    } catch {
      // fallback: fetch per user not implemented, show empty
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    window.open(`/api/time/export?${params}`, '_blank');
  };

  const totalHours = entries.reduce((sum, e) => {
    if (!e.clock_out) return sum;
    return sum + (new Date(e.clock_out) - new Date(e.clock_in)) / 3600000;
  }, 0);

  return (
    <div>
      <h1 className="page-title">דו"ח שעות</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>מתאריך</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>עד תאריך</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={exportExcel}>
            ⬇️ ייצוא Excel
          </button>
        </div>
        <p style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>
          לחץ על "ייצוא Excel" להורדת דו"ח מפורט לפי תאריכים שנבחרו.
        </p>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, color: '#475569' }}>
          הדו"ח המלא זמין להורדה בלחיצה על "ייצוא Excel" — כולל כל חברי הצוות, שעות כניסה ויציאה וסה"כ שעות לכל שורה.
        </p>
      </div>
    </div>
  );
}
