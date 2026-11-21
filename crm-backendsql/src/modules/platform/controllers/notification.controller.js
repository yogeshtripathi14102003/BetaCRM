const asyncHandler = require('../../../core/utils/asyncHandler');
const { ok } = require('../../../core/utils/apiResponse');
const notificationService = require('../services/notification.service');

// Sab endpoints user ki APNI notifications par chalte hain (extra permission nahi)
// GET /api/v1/notifications?unread=true&type&page&limit   (meta.unread = unread count)
exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await notificationService.list(req.user.id, req.query);
  return ok(res, items, 'OK', meta);
});
// GET /api/v1/notifications/unread-count
exports.unreadCount = asyncHandler(async (req, res) => ok(res, { count: await notificationService.unreadCount(req.user.id) }));
// POST /api/v1/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => ok(res, await notificationService.markAllRead(req.user.id), 'Sab padhi hui mark ho gayi'));
// POST /api/v1/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => ok(res, await notificationService.markRead(req.params.id, req.user.id)));
// DELETE /api/v1/notifications/:id
exports.remove = asyncHandler(async (req, res) => {
  await notificationService.remove(req.params.id, req.user.id);
  return ok(res, null, 'Notification deleted');
});
