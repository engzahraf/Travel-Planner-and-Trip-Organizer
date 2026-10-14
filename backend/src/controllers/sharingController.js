const db = require('../config/db');

// GET /api/sharing/trip/:tripId/collaborators
exports.getTripCollaborators = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;

    const [trips] = await db.execute('SELECT user_id, title FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const isOwner = trips[0].user_id === req.user.id;
    if (!isOwner && req.user.role !== 'ADMIN') {
      // Check if user is a viewer
      const [shares] = await db.execute(
        'SELECT id FROM trip_shares WHERE trip_id = ? AND shared_with_user_id = ?',
        [tripId, req.user.id]
      );
      if (shares.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const [collaborators] = await db.execute(
      `SELECT ts.id AS share_id, ts.role, ts.created_at,
              u.id AS user_id, u.name, u.email, u.username, u.avatar
       FROM trip_shares ts
       JOIN users u ON u.id = ts.shared_with_user_id
       WHERE ts.trip_id = ?
       ORDER BY ts.created_at DESC`,
      [tripId]
    );

    res.json({
      success: true,
      data: {
        isOwner,
        collaborators
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/sharing/trip/:tripId/share
exports.shareTrip = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Please select a user to share with.' });
    }

    const [trips] = await db.execute('SELECT user_id, title FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) return res.status(404).json({ success: false, message: 'Trip not found.' });
    const trip = trips[0];

    if (trip.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can share this trip.' });
    }

    if (parseInt(targetUserId, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You already own this trip!' });
    }

    // Check if target user exists
    const [targetUser] = await db.execute('SELECT id, name FROM users WHERE id = ?', [targetUserId]);
    if (targetUser.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check existing share
    const [existing] = await db.execute(
      'SELECT id FROM trip_shares WHERE trip_id = ? AND shared_with_user_id = ?',
      [tripId, targetUserId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'This trip is already shared with this user.' });
    }

    await db.execute(
      `INSERT INTO trip_shares (trip_id, shared_with_user_id, role) VALUES (?, ?, 'VIEWER')`,
      [tripId, targetUserId]
    );

    // Create notification for recipient
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, ?, ?, 'share', ?)`,
      [
        targetUserId,
        'Trip Shared With You ✈️',
        `${req.user.name} shared the trip "${trip.title}" with you (View Only).`,
        `/trips/${tripId}`
      ]
    );

    res.status(201).json({
      success: true,
      message: `Trip "${trip.title}" successfully shared with ${targetUser[0].name} (View Only).`
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sharing/trip/:tripId/share/:targetUserId
exports.removeShare = async (req, res, next) => {
  try {
    const { tripId, targetUserId } = req.params;

    const [trips] = await db.execute('SELECT user_id, title FROM trips WHERE id = ?', [tripId]);
    if (trips.length === 0) return res.status(404).json({ success: false, message: 'Trip not found.' });
    const trip = trips[0];

    if (trip.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can revoke share access.' });
    }

    await db.execute(
      'DELETE FROM trip_shares WHERE trip_id = ? AND shared_with_user_id = ?',
      [tripId, targetUserId]
    );

    // Send notification
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'share')`,
      [
        targetUserId,
        'Trip Access Revoked',
        `Your access to the trip "${trip.title}" was removed by the owner.`
      ]
    );

    res.json({
      success: true,
      message: 'Share access removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/sharing/shared-with-me (Page: Shared With Me)
exports.getTripsSharedWithMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [trips] = await db.execute(
      `SELECT t.*, 
         DATEDIFF(t.end_date, t.start_date) + 1 AS duration_days,
         u.name AS owner_name, u.avatar AS owner_avatar,
         (SELECT COUNT(*) FROM trip_days td 
          JOIN destinations d ON d.day_id = td.id 
          WHERE td.trip_id = t.id) AS destinations_count,
         (SELECT COUNT(*) FROM photos p WHERE p.trip_id = t.id) AS photos_count,
         COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.trip_id = t.id), 0) AS total_spent
       FROM trip_shares ts
       JOIN trips t ON t.id = ts.trip_id
       JOIN users u ON u.id = t.user_id
       WHERE ts.shared_with_user_id = ?
       ORDER BY ts.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: { trips }
    });
  } catch (err) {
    next(err);
  }
};
