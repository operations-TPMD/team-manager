import { useState } from 'react';

export default function TimeReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const exportExcel = () => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    window.open(`/api/time/export?${params}`, '_blank');
  };

  const setThisMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFrom(first.toISOString().split('T')[0]);
    setTo(last.toISOString().split('T')[0]);
  };

  const setLastMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    setFrom(first.toISOString().split('T')[0]);
    setTo(last.toISOString().split('T')[0]);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
          Hours Report
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 13, marginTop: 2 }}>
          Export team working hours to Excel
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Select Date Range</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="btn btn-ghost" onClick={setThisMonth} style={{ fontSize: 12 }}>This Month</button>
          <button className="btn btn-ghost" onClick={setLastMonth} style={{ fontSize: 12 }}>Last Month</button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn btn-orange" onClick={exportExcel}
            style={{ flexShrink: 0, padding: '10px 24px' }}>
            ⬇️ Export to Excel
          </button>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, #faf5ff, #f0fdf4)', border: '1px solid #e9d5ff' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 28 }}>📊</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--purple)', marginBottom: 4 }}>
              Excel Report Includes
            </div>
            <div style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.7 }}>
              • All team members within the selected date range<br />
              • Clock-in and clock-out times per day<br />
              • Total hours per entry<br />
              • Employee name and email
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
