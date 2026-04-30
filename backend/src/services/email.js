const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendReminderEmail(to, taskTitle, dueDate) {
  await transporter.sendMail({
    from: `"Team Manager" <${process.env.GMAIL_USER}>`,
    to,
    subject: `תזכורת: ${taskTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #2563eb;">תזכורת למשימה</h2>
        <p>יש לך משימה פתוחה: <strong>${taskTitle}</strong></p>
        ${dueDate ? `<p>תאריך יעד: <strong>${new Date(dueDate).toLocaleDateString('he-IL')}</strong></p>` : ''}
        <p style="color: #6b7280;">כנס למערכת לצפייה בפרטים המלאים.</p>
      </div>
    `
  });
}

module.exports = { sendReminderEmail };
