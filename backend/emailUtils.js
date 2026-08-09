require('dotenv').config();
const nodemailer = require('nodemailer');

const gmailUser = (process.env.GMAIL_USER || 'bhutpalak4@gmail.com').trim();
const rawPass = process.env.GMAIL_PASS || '';
const gmailPass = rawPass.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: gmailUser,
    pass: gmailPass
  }
});

let smtpVerified = false;
let smtpStatusMessage = 'Initializing...';

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    smtpVerified = false;
    smtpStatusMessage = `FAIL: ${error.message}`;
    console.error('❌ [SMTP] Connection failed:', error.message);
  } else {
    smtpVerified = true;
    smtpStatusMessage = 'PASS: Ready to send emails';
    console.log('✅ [SMTP] Connection successful. Gmail user:', gmailUser);
  }
});

async function sendMail({ subject, text, html, to }) {
  if (!to) {
    console.error('❌ [EMAIL] Send skipped: No recipient specified.');
    return null;
  }
  try {
    const mailOptions = {
      from: gmailUser,
      to,
      subject,
      text
    };
    if (html) mailOptions.html = html;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL] Sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ [EMAIL] Send failed to ${to}:`, error.message);
    return null;
  }
}

module.exports = {
  sendMail,
  transporter,
  getSmtpStatus: () => ({ verified: smtpVerified, message: smtpStatusMessage })
};


