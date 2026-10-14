const db = require('../config/db');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [[userStats]] = await db.execute(
      `SELECT 
         COUNT(*) AS total_users,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
         SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS admin_users
       FROM users`
    );

    const [[tripStats]] = await db.execute(
      `SELECT 
         COUNT(*) AS total_trips,
         SUM(CASE WHEN status = 'ONGOING' THEN 1 ELSE 0 END) AS ongoing_trips,
         SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_trips,
         SUM(CASE WHEN status = 'UPCOMING' THEN 1 ELSE 0 END) AS upcoming_trips
       FROM trips`
    );

    const [[photoStats]] = await db.execute(`SELECT COUNT(*) AS total_photos FROM photos`);
    const [[expenseStats]] = await db.execute(`SELECT COALESCE(SUM(amount), 0) AS total_expenses_amount, COUNT(*) as total_expenses_count FROM expenses`);
    const [[destStats]] = await db.execute(`SELECT COUNT(*) AS total_destinations FROM destinations`);

    // Top visited countries
    const [topCountries] = await db.execute(
      `SELECT country, COUNT(*) as trip_count 
       FROM trips 
       GROUP BY country 
       ORDER BY trip_count DESC 
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        users: userStats,
        trips: tripStats,
        photos: photoStats.total_photos,
        expenses: expenseStats,
        destinations: destStats.total_destinations,
        topCountries
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const search = req.query.search ? req.query.search.trim() : '';

    let query = `
      SELECT u.id, u.username, u.name, u.email, u.role, u.is_active, u.created_at,
             COUNT(DISTINCT t.id) AS trips_count,
             COUNT(DISTINCT p.id) AS photos_count
      FROM users u
      LEFT JOIN trips t ON t.user_id = u.id
      LEFT JOIN photos p ON p.user_id = u.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const [users] = await db.execute(query, params);

    res.json({
      success: true,
      data: { users }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (parseInt(targetUserId, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
    }

    const [rows] = await db.execute('SELECT is_active, name FROM users WHERE id = ?', [targetUserId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = rows[0].is_active ? 0 : 1;
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, targetUserId]);

    res.json({
      success: true,
      message: `User ${rows[0].name} has been ${newStatus ? 'activated' : 'deactivated'}.`,
      data: { isActive: newStatus }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/messages
exports.getAdminMessages = async (req, res, next) => {
  try {
    const [messages] = await db.execute(
      `SELECT am.*, u.name AS recipient_name, u.email AS recipient_email
       FROM admin_messages am
       LEFT JOIN users u ON u.id = am.recipient_user_id
       ORDER BY am.created_at DESC`
    );

    res.json({
      success: true,
      data: { messages }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/messages (Send direct message or broadcast)
exports.sendMessage = async (req, res, next) => {
  try {
    const { title, message, recipientUserId, isBroadcast } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Message title and body are required.' });
    }

    const broadcast = isBroadcast === true || isBroadcast === 'true' || !recipientUserId;

    if (broadcast) {
      // 1. Record in admin_messages
      await db.execute(
        `INSERT INTO admin_messages (sender_admin_id, recipient_user_id, title, message, is_broadcast)
         VALUES (?, NULL, ?, ?, 1)`,
        [req.user.id, title.trim(), message.trim()]
      );

      // 2. Broadcast notification to all active users
      const [users] = await db.execute('SELECT id FROM users WHERE is_active = 1');
      for (const u of users) {
        await db.execute(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'admin_message')`,
          [u.id, `📢 Announcement: ${title.trim()}`, message.trim()]
        );
      }

      res.status(201).json({
        success: true,
        message: `Broadcast message sent to all ${users.length} active users!`
      });
    } else {
      // Single recipient
      await db.execute(
        `INSERT INTO admin_messages (sender_admin_id, recipient_user_id, title, message, is_broadcast)
         VALUES (?, ?, ?, ?, 0)`,
        [req.user.id, recipientUserId, title.trim(), message.trim()]
      );

      // Notification to recipient
      await db.execute(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'admin_message')`,
        [recipientUserId, `📩 Admin Message: ${title.trim()}`, message.trim()]
      );

      res.status(201).json({
        success: true,
        message: 'Message sent directly to user.'
      });
    }
  } catch (err) {
    next(err);
  }
};
