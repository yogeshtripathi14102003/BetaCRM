const bus = require('../../../core/events/eventBus');
const E = require('../../../core/events/eventNames');
const mail = require('../../../core/integrations/email');
const sms = require('../../../core/integrations/sms');
const env = require('../../../config/env');
const auditService = require('../services/audit.service');
const notificationService = require('../services/notification.service');

exports.register = () => {
  // ---- mails ----
  bus.on(E.USER_PASSWORD_RESET_REQUESTED, ({ email, link }) =>
    mail.send({
      to: email,
      subject: `${env.APP_NAME}: Password reset`,
      text: `please open this link for password reset (30 min valid):\n${link}`,
    })
  );

  bus.on(E.USER_EMAIL_VERIFICATION_REQUESTED, ({ email, link }) =>
    mail.send({
      to: email,
      subject: `${env.APP_NAME}: Email verify karo`,
      text: `please open this link for email verification (24 hours valid):\n${link}`,
    })
  );

  bus.on(E.USER_LOGIN_OTP_REQUESTED, ({ channel, to, code, ttlMinutes }) => {
    const text = `${env.APP_NAME} login OTP: ${code} (${ttlMinutes} minute valid). Do Not Share any one this code .`;
    return channel === 'email' ? mail.send({ to, subject: `${env.APP_NAME}: Login OTP`, text }) : sms.send({ to, text });
  });

  // ---- security notifications (user ke bell me) ----
  [
    [E.USER_PASSWORD_CHANGED, 'Your password has been changed', 'If you have not changed your password, please inform the admin immediately..'],
    [E.USER_PASSWORD_RESET_DONE, 'Your password has been changed successfully', 'All your previous sessions have been invalidated or closed .'],
    [E.USER_2FA_ENABLED, 'Two-factor authentication on ', null],
    [E.USER_2FA_DISABLED, 'Two-factor authentication Closed ', 'if you cant do please change your password immediately.'],
  ].forEach(([event, title, body]) =>
    bus.on(event, ({ userId, ip }) => notificationService.notify(userId, { type: 'security', title, body: [body, ip && `IP: ${ip}`].filter(Boolean).join(' ') || undefined, link: '/profile' }))
  );

  // ---- audit trail ----
  [
    E.USER_REGISTERED,
    E.USER_LOGGED_IN,
    E.USER_LOGIN_FAILED,
    E.USER_PASSWORD_CHANGED,
    E.USER_PASSWORD_RESET_DONE,
    E.USER_2FA_ENABLED,
    E.USER_2FA_DISABLED,
  ].forEach((action) =>
    bus.on(action, ({ userId, ip, userAgent, ...meta }) =>
      auditService.log({ actorId: userId, action, entity: 'User', entityId: userId, ip, userAgent, meta })
    )
  );
};
