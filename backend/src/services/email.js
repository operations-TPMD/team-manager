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
    from: `"TPMD Team Manager" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Reminder: ${taskTitle}`,
    html: `
      <div style="font-family: Poppins, Arial, sans-serif; max-width: 500px; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #d946ef, #7c3aed); padding: 24px; color: #fff;">
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px;">The Property Management Doctor</div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Task Reminder</h2>
        </div>
        <div style="padding: 24px;">
          <p style="color: #475569; margin: 0 0 12px;">You have a pending task:</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 14px; border-left: 3px solid #a855f7; margin-bottom: 16px;">
            <strong style="color: #0f172a;">${taskTitle}</strong>
            ${dueDate ? `<div style="color: #64748b; font-size: 13px; margin-top: 4px;">Due: ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Log in to view full details.</p>
        </div>
      </div>
    `
  });
}

async function sendAssignmentEmail(to, assigneeName, taskTitle, taskCategory) {
  await transporter.sendMail({
    from: `"TPMD Team Manager" <${process.env.GMAIL_USER}>`,
    to,
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Poppins, Arial, sans-serif; max-width: 500px; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #d946ef, #7c3aed); padding: 24px; color: #fff;">
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px;">The Property Management Doctor</div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">New Task Assigned</h2>
        </div>
        <div style="padding: 24px;">
          <p style="color: #475569; margin: 0 0 12px;">Hi ${assigneeName}, you've been assigned a new task:</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 14px; border-left: 3px solid #d946ef; margin-bottom: 16px;">
            <strong style="color: #0f172a; font-size: 15px;">${taskTitle}</strong>
            ${taskCategory ? `<div style="margin-top: 6px;"><span style="background: #ede9fe; color: #7c3aed; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${taskCategory}</span></div>` : ''}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Log in to view details, add notes, and update progress.</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendReminderEmail, sendAssignmentEmail };
