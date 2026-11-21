const env = require('../../config/env');
const logger = require('../logger');

let transporter = null;
const getTransporter = () => {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
};

// SMTP configured na ho to mail console log me print hoti hai (dev ke liye)
exports.send = async ({ to, subject, text, html }) => {
  const t = getTransporter();
  if (!t) {
    // production me body (OTP/links) kabhi log nahi hoti
    logger.warn(env.NODE_ENV === 'production' ? { to, subject } : { to, subject, text }, '[email] SMTP configured nahi, mail send nahi hui');
    return { skipped: true };
  }
  return t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
};



// const env = require('../../config/env');
// const logger = require('../logger');

// let transporter = null;

// const getTransporter = () => {
//   if (!env.SMTP_HOST) return null;

//   if (!transporter) {
//     const nodemailer = require('nodemailer');

//     const port = Number(env.SMTP_PORT || 587);

//     transporter = nodemailer.createTransport({
//       host: env.SMTP_HOST,
//       port,
//       secure: port === 465,

//       auth: {
//         user: env.SMTP_USER,
//         pass: env.SMTP_PASS,
//       },

//       // Port 587 par STARTTLS compulsory
//       requireTLS: port === 587,

//       tls: {
//         minVersion: 'TLSv1.2',
//         rejectUnauthorized: true,
//       },

//       connectionTimeout: 15000,
//       greetingTimeout: 15000,
//       socketTimeout: 20000,
//     });
//   }

//   return transporter;
// };

// // SMTP connection test
// exports.verifyConnection = async () => {
//   const t = getTransporter();

//   if (!t) {
//     throw new Error('SMTP configuration missing');
//   }

//   return t.verify();
// };

// // Send email
// exports.send = async ({ to, subject, text, html }) => {
//   const t = getTransporter();

//   if (!t) {
//     logger.warn(
//       env.NODE_ENV === 'production'
//         ? { to, subject }
//         : { to, subject, text },
//       '[email] SMTP configured nahi, mail send nahi hui'
//     );

//     return { skipped: true };
//   }

//   return t.sendMail({
//     from: env.MAIL_FROM,
//     to,
//     subject,
//     text,
//     html,
//   });
// };
