// src/utils/mailer.js
const nodemailer = require('nodemailer');

const HOST = process.env.MAILERSEND_HOST;
const PORT = Number(process.env.MAILERSEND_PORT || 587);
const SMTP_USER = process.env.MAILERSEND_USER;
const SMTP_PASS = process.env.MAILERSEND_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || `No-Reply <${SMTP_USER}>`;

if (!HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn("[mailer] Missing MailerSend SMTP credentials. Emails will fail.");
}

const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: false, // TLS handled automatically for port 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Send email via MailerSend SMTP
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 */
async function sendMail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });

  return info;
}

module.exports = { sendMail };
