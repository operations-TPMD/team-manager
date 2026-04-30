const cron = require('node-cron');
const pool = require('../db');
const { sendReminderEmail } = require('./email');

cron.schedule('* * * * *', async () => {
  try {
    const result = await pool.query(`
      SELECT tr.id, t.title, t.due_date,
        array_agg(DISTINCT u.email) AS emails
      FROM task_reminders tr
      JOIN tasks t ON tr.task_id = t.id
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON ta.user_id = u.id
      WHERE tr.remind_at <= NOW() AND tr.sent = false
      GROUP BY tr.id, t.title, t.due_date
    `);
    for (const reminder of result.rows) {
      for (const email of reminder.emails) {
        await sendReminderEmail(email, reminder.title, reminder.due_date);
      }
      await pool.query('UPDATE task_reminders SET sent = true WHERE id = $1', [reminder.id]);
    }
  } catch (err) {
    console.error('Reminder cron error:', err.message);
  }
});
