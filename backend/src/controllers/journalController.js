const db = require('../config/db');

// Helper to check trip access (owner or viewer)
const checkTripAccess = async (tripId, userId) => {
  const [trips] = await db.execute('SELECT id, user_id FROM trips WHERE id = ?', [tripId]);
  if (trips.length === 0) return { exists: false };
  const trip = trips[0];
  const isOwner = trip.user_id === userId;
  if (isOwner) return { exists: true, isOwner: true };

  const [shares] = await db.execute(
    'SELECT id FROM trip_shares WHERE trip_id = ? AND shared_with_user_id = ?',
    [tripId, userId]
  );
  return { exists: true, isOwner: false, isShared: shares.length > 0 };
};

// GET /api/journal/trip/:tripId
exports.getEntriesByTrip = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const access = await checkTripAccess(tripId, req.user.id);

    if (!access.exists) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!access.isOwner && !access.isShared && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [entries] = await db.execute(
      `SELECT j.*, td.day_number, d.name AS destination_name
       FROM journal_entries j
       LEFT JOIN trip_days td ON td.id = j.day_id
       LEFT JOIN destinations d ON d.id = j.destination_id
       WHERE j.trip_id = ?
       ORDER BY j.entry_date DESC, j.id DESC`,
      [tripId]
    );

    res.json({
      success: true,
      data: { entries }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/journal/trip/:tripId
exports.addEntry = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const { title, content, entryDate, dayId, destinationId } = req.body;

    const access = await checkTripAccess(tripId, req.user.id);
    if (!access.exists) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!access.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can write journal entries.' });
    }

    if (!title || !content || !entryDate) {
      return res.status(400).json({ success: false, message: 'Title, content, and date are required.' });
    }

    const [result] = await db.execute(
      `INSERT INTO journal_entries (trip_id, day_id, destination_id, title, content, entry_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        dayId || null,
        destinationId || null,
        title.trim(),
        content.trim(),
        entryDate
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Journal entry recorded! ✍️',
      data: { entryId: result.insertId }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/journal/:id
exports.updateEntry = async (req, res, next) => {
  try {
    const entryId = req.params.id;
    const { title, content, entryDate, dayId, destinationId } = req.body;

    const [rows] = await db.execute(
      `SELECT j.*, t.user_id FROM journal_entries j JOIN trips t ON t.id = j.trip_id WHERE j.id = ?`,
      [entryId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    const entry = rows[0];

    if (entry.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.execute(
      `UPDATE journal_entries SET
         title = COALESCE(?, title),
         content = COALESCE(?, content),
         entry_date = COALESCE(?, entry_date),
         day_id = COALESCE(?, day_id),
         destination_id = COALESCE(?, destination_id)
       WHERE id = ?`,
      [title, content, entryDate, dayId, destinationId, entryId]
    );

    res.json({ success: true, message: 'Journal entry updated.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/journal/:id
exports.deleteEntry = async (req, res, next) => {
  try {
    const entryId = req.params.id;

    const [rows] = await db.execute(
      `SELECT j.*, t.user_id FROM journal_entries j JOIN trips t ON t.id = j.trip_id WHERE j.id = ?`,
      [entryId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.execute('DELETE FROM journal_entries WHERE id = ?', [entryId]);

    res.json({ success: true, message: 'Journal entry deleted.' });
  } catch (err) {
    next(err);
  }
};
