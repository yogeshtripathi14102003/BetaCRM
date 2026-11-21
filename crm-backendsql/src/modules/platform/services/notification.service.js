const { Op } = require('sequelize');
const { Notification } = require('../models');
const { paginate } = require('../../../core/database/paginate');
const { notFound } = require('../../../core/errors/httpErrors');

const toDTO = (n) => ({
  id: String(n.id),
  type: n.type,
  title: n.title,
  body: n.body || '',
  link: n.link || null,
  data: n.data || null,
  isRead: !!n.readAt,
  readAt: n.readAt,
  createdAt: n.createdAt,
});

// ---- DUSRE MODULES / SERVICES ke liye ----
//   await notificationService.notify(userId, { type: 'followup', title: 'Followup due', body: '...', link: '/crm/followups' })
exports.notify = async (userId, { type = 'info', title, body, link, data }, options = {}) =>
  toDTO(await Notification.create({ userId, type, title: String(title).slice(0, 150), body: body ? String(body).slice(0, 500) : null, link, data }, options));

exports.notifyMany = async (userIds, payload, options = {}) => {
  const ids = [...new Set(userIds.map(String))];
  if (!ids.length) return 0;
  const { type = 'info', title, body, link, data } = payload;
  await Notification.bulkCreate(ids.map((userId) => ({ userId, type, title: String(title).slice(0, 150), body: body ? String(body).slice(0, 500) : null, link, data })), options);
  return ids.length;
};

// ---- user apni notifications ----
exports.list = async (userId, q) => {
  const where = { userId, ...(q.unread === 'true' && { readAt: null }), ...(q.type && { type: q.type }) };
  const { items, meta } = await paginate(Notification, { where, query: q, sortable: ['createdAt'] });
  return { items: items.map(toDTO), meta: { ...meta, unread: await exports.unreadCount(userId) } };
};

exports.unreadCount = (userId) => Notification.count({ where: { userId, readAt: null } });

const own = async (id, userId) => {
  const n = await Notification.findOne({ where: { id, userId } }); // dusre ki notification = 404
  if (!n) throw notFound('Notification not found');
  return n;
};

exports.markRead = async (id, userId) => {
  const n = await own(id, userId);
  if (!n.readAt) await n.update({ readAt: new Date() });
  return toDTO(n);
};

exports.markAllRead = async (userId) => {
  const [affected] = await Notification.update({ readAt: new Date() }, { where: { userId, readAt: null } });
  return { affected };
};

exports.remove = async (id, userId) => (await own(id, userId)).destroy();

// padhi hui purani notifications saaf (maintenance job)
exports.cleanup = (days = 90) =>
  Notification.destroy({ where: { readAt: { [Op.lt]: new Date(Date.now() - days * 24 * 3600 * 1000) } } });
