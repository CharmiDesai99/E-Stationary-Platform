const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.GMAIL_USER || 'bhutpalak4@gmail.com',
    pass: process.env.GMAIL_PASS || 'idpkrhgnvsdgbsez'
  }
});

console.log('Testing SMTP connection for bhutpalak4@gmail.com...');
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Verification FAILED:', error.message);
  } else {
    console.log('SMTP Server is ready to send messages: PASS');
    
    transporter.sendMail({
      from: 'bhutpalak4@gmail.com',
      to: 'bhutpalak4@gmail.com',
      subject: 'Test Email - Shree Sales Verification',
      text: 'This is a test email from Shree Sales system verification.'
    }).then(info => {
      console.log('Test email SENT successfully! Message ID:', info.messageId);
    }).catch(err => {
      console.error('Test email send FAILED:', err.message);
    });
  }
});
