const express = require('express');
const router = express.Router();
const pool = require('../db');
const ExcelJS = require('exceljs');

router.post('/clock-in', async (req, res) => {
  const { user_id } = req.body;
  try {
    const active = await pool.query(
      'SELECT id FROM time_entries WHERE user_id = $1 AND clock_out IS NULL', [user_id]
    );
    if (active.rows.length > 0) return res.status(400).json({ error: 'Already clocked in' });
    const result = await pool.query(
      'INSERT INTO time_entries (user_id, clock_in, date) VALUES ($1, NOW(), CURRENT_DATE) RETURNING *',
      [user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clock-out', async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE time_entries SET clock_out = NOW() WHERE user_id = $1 AND clock_out IS NULL RETURNING *',
      [user_id]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Not clocked in' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:user_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM time_entries WHERE user_id = $1 AND clock_out IS NULL', [req.params.user_id]
    );
    res.json({ clocked_in: result.rows.length > 0, entry: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all-status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email,
        te.clock_in, te.id AS entry_id,
        CASE WHEN te.id IS NOT NULL THEN true ELSE false END AS clocked_in
      FROM users u
      LEFT JOIN time_entries te ON u.id = te.user_id AND te.clock_out IS NULL
      WHERE u.role = 'employee'
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', async (req, res) => {
  const { from, to } = req.query;
  try {
    const result = await pool.query(`
      SELECT u.name, u.email, te.date, te.clock_in, te.clock_out,
        ROUND(EXTRACT(EPOCH FROM (COALESCE(te.clock_out, NOW()) - te.clock_in)) / 3600, 2) AS hours
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      WHERE ($1::date IS NULL OR te.date >= $1::date)
        AND ($2::date IS NULL OR te.date <= $2::date)
      ORDER BY u.name, te.date
    `, [from || null, to || null]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('שעות עבודה');
    sheet.columns = [
      { header: 'שם', key: 'name', width: 20 },
      { header: 'מייל', key: 'email', width: 30 },
      { header: 'תאריך', key: 'date', width: 15 },
      { header: 'כניסה', key: 'clock_in', width: 20 },
      { header: 'יציאה', key: 'clock_out', width: 20 },
      { header: 'שעות', key: 'hours', width: 10 },
    ];
    result.rows.forEach(row => {
      sheet.addRow({
        name: row.name,
        email: row.email,
        date: new Date(row.date).toLocaleDateString('he-IL'),
        clock_in: new Date(row.clock_in).toLocaleTimeString('he-IL'),
        clock_out: row.clock_out ? new Date(row.clock_out).toLocaleTimeString('he-IL') : 'פעיל',
        hours: parseFloat(row.hours)
      });
    });
    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=time-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
