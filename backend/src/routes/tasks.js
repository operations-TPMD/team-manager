const express = require('express');
const router = express.Router();
const pool = require('../db');
const { sendAssignmentEmail } = require('../services/email');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name AS creator_name,
        COALESCE(json_agg(json_build_object('id', au.id, 'name', au.name, 'email', au.email))
          FILTER (WHERE au.id IS NOT NULL), '[]') AS assignees
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users au ON ta.user_id = au.id
      GROUP BY t.id, u.name
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await pool.query(`
      SELECT t.*, u.name AS creator_name FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `, [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const [assignees, notes, reminders] = await Promise.all([
      pool.query(`SELECT u.id, u.name, u.email FROM task_assignments ta
        JOIN users u ON ta.user_id = u.id WHERE ta.task_id = $1`, [req.params.id]),
      pool.query(`SELECT n.*, u.name AS author_name FROM task_notes n
        JOIN users u ON n.user_id = u.id WHERE n.task_id = $1 ORDER BY n.created_at`, [req.params.id]),
      pool.query(`SELECT * FROM task_reminders WHERE task_id = $1 ORDER BY remind_at`, [req.params.id])
    ]);

    res.json({ ...task.rows[0], assignees: assignees.rows, notes: notes.rows, reminders: reminders.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, description, due_date, created_by, assignee_ids, reminder_at, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const task = await client.query(
      'INSERT INTO tasks (title, description, due_date, created_by, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, due_date || null, created_by, category || 'General']
    );
    const taskId = task.rows[0].id;

    if (assignee_ids?.length) {
      for (const uid of assignee_ids) {
        await client.query('INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)', [taskId, uid]);
        // Send email notification
        try {
          const userRes = await client.query('SELECT name, email FROM users WHERE id = $1', [uid]);
          if (userRes.rows.length > 0) {
            const { name, email } = userRes.rows[0];
            sendAssignmentEmail(email, name, title, category || 'General').catch(e => console.error('Email error:', e));
          }
        } catch (emailErr) {
          console.error('Assignment email error:', emailErr.message);
        }
      }
    }

    if (reminder_at) {
      await client.query('INSERT INTO task_reminders (task_id, remind_at) VALUES ($1, $2)', [taskId, reminder_at]);
    }
    await client.query('COMMIT');
    res.status(201).json(task.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.patch('/:id', async (req, res) => {
  const { status, title, description, due_date, category } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET
        status = COALESCE($1, status),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        due_date = COALESCE($4, due_date),
        category = COALESCE($5, category),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [status, title, description, due_date, category, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/notes', async (req, res) => {
  const { user_id, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const result = await pool.query(
      'INSERT INTO task_notes (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
