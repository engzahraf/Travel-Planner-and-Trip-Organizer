const db = require('../config/db');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [notifications] = await db.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [userId]
    );

    const [unread] = await db.execute(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        unreadCount: unread[0].count,
        notifications
      }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notifId = req.params.id;
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, req.user.id]
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};
