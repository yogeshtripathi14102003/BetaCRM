
require('dotenv').config();
const nodemailer = require('nodemailer');

const port = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  requireTLS: port === 587,
  tls: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
});

transporter.verify()
  .then(() => {
    console.log('SMTP Connected Successfully');
  })
  .catch((error) => {
    console.error('SMTP Connection Failed');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
  });
