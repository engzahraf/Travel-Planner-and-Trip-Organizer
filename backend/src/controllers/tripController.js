const db = require('../config/db');
const uploadToCloudinary = require('../utils/cloudinaryUpload');

// Helper to calculate days between two dates inclusive
const calculateDaysCount = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Helper to generate day records
const generateTripDays = async (connection, tripId, startDateStr, daysCount) => {
  const startDate = new Date(startDateStr);
  for (let i = 0; i < daysCount; i++) {
    const currentDayDate = new Date(startDate);
    currentDayDate.setDate(startDate.getDate() + i);
    const dateStr = currentDayDate.toISOString().split('T')[0];

    await connection.execute(
      `INSERT INTO trip_days (trip_id, day_number, date, title, status)
       VALUES (?, ?, ?, ?, 'UPCOMING')`,
      [tripId, i + 1, dateStr, `Day ${i + 1}`]
    );
  }
};

// GET /api/trips
exports.getAllTrips = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // ONGOING, UPCOMING, COMPLETED, or undefined

    let query = `
      SELECT t.*, 
        DATEDIFF(t.end_date, t.start_date) + 1 AS duration_days,
        (SELECT COUNT(*) FROM trip_days td 
         JOIN destinations d ON d.day_id = td.id 
         WHERE td.trip_id = t.id) AS destinations_count,
        (SELECT COUNT(*) FROM photos p WHERE p.trip_id = t.id) AS photos_count,
        COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.trip_id = t.id), 0) AS total_spent
      FROM trips t
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (status && ['UPCOMING', 'ONGOING', 'COMPLETED'].includes(status.toUpperCase())) {
      query += ` AND t.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY t.start_date DESC`;

    const [trips] = await db.execute(query, params);

    res.json({
      success: true,
      data: { trips }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trips/:id
exports.getTripById = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;

    // Check ownership or share access
    const [trips] = await db.execute(
      `SELECT t.*, 
         DATEDIFF(t.end_date, t.start_date) + 1 AS duration_days,
         u.name AS owner_name, u.email AS owner_email,
         COALESCE((SELECT SUM(amount) FROM expenses WHERE trip_id = t.id), 0) AS total_spent
       FROM trips t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = ?`,
      [tripId]
    );

    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const trip = trips[0];
    const isOwner = trip.user_id === userId;

    // If not owner, check if shared
    let isSharedViewer = false;
    if (!isOwner) {
      const [shares] = await db.execute(
        'SELECT role FROM trip_shares WHERE trip_id = ? AND shared_with_user_id = ?',
        [tripId, userId]
      );
      if (shares.length === 0 && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this trip.'
        });
      }
      isSharedViewer = true;
    }

    // Fetch days with nested destinations and exploration items
    const [days] = await db.execute(
      `SELECT id, day_number, date, title, notes, status 
       FROM trip_days 
       WHERE trip_id = ? 
       ORDER BY day_number ASC`,
      [tripId]
    );

    // Fetch destinations for all days
    const [destinations] = await db.execute(
      `SELECT d.*, td.day_number 
       FROM destinations d
       JOIN trip_days td ON td.id = d.day_id
       WHERE td.trip_id = ?
       ORDER BY td.day_number ASC, d.order_index ASC, d.id ASC`,
      [tripId]
    );

    // Fetch exploration items for destinations
    const [items] = await db.execute(
      `SELECT ei.*, d.day_id 
       FROM exploration_items ei
       JOIN destinations d ON d.id = ei.destination_id
       JOIN trip_days td ON td.id = d.day_id
       WHERE td.trip_id = ?`,
      [tripId]
    );

    // Group items into destinations
    const itemsByDest = {};
    items.forEach(it => {
      if (!itemsByDest[it.destination_id]) itemsByDest[it.destination_id] = [];
      itemsByDest[it.destination_id].push(it);
    });

    // Group destinations into days
    const destsByDay = {};
    destinations.forEach(dest => {
      dest.exploration_items = itemsByDest[dest.id] || [];
      if (!destsByDay[dest.day_id]) destsByDay[dest.day_id] = [];
      destsByDay[dest.day_id].push(dest);
    });

    const populatedDays = days.map(d => ({
      ...d,
      destinations: destsByDay[d.id] || []
    }));

    // Find current active destination for quick journey resume
    const activeDest = destinations.find(d => d.status === 'ONGOING') || null;

    res.json({
      success: true,
      data: {
        trip,
        isOwner,
        isReadOnly: isSharedViewer,
        activeDestination: activeDest,
        days: populatedDays
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips
exports.createTrip = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const {
      title,
      country,
      startDate,
      endDate,
      travelersCount = 1,
      budget = 0,
      currency = 'USD'
    } = req.body;

    if (!title || !country || !startDate || !endDate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Trip name, country, start date, and end date are required.'
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Start date must be earlier than or equal to end date.'
      });
    }

    const daysCount = calculateDaysCount(startDate, endDate);
    if (daysCount > 365) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Trip duration cannot exceed 365 days.'
      });
    }

    // Determine initial trip status relative to today
    const today = new Date().toISOString().split('T')[0];
    let initialStatus = 'UPCOMING';
    if (startDate <= today && endDate >= today) {
      initialStatus = 'ONGOING';
    } else if (endDate < today) {
      initialStatus = 'COMPLETED';
    }

    let coverPhotoUrl = null;

if (req.file) {
  const uploadedImage = await uploadToCloudinary(
    req.file.buffer,
    'covers'
  );

  coverPhotoUrl = uploadedImage.url;
}

    const [tripResult] = await connection.execute(
      `INSERT INTO trips 
       (user_id, title, country, start_date, end_date, travelers_count, budget, currency, cover_photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        country.trim(),
        startDate,
        endDate,
        parseInt(travelersCount, 10) || 1,
        parseFloat(budget) || 0.00,
        currency.trim(),
        coverPhotoUrl,
        initialStatus
      ]
    );

    const tripId = tripResult.insertId;

    // Automatically generate days for this trip
    await generateTripDays(connection, tripId, startDate, daysCount);

    await connection.commit();

    // Create notification
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES (?, ?, ?, 'trip', ?)`,
      [
        userId,
        'Trip Created 🗺️',
        `Your trip to ${country} ("${title}") is created with ${daysCount} days itinerary.`,
        `/trips/${tripId}`
      ]
    );

    res.status(201).json({
      success: true,
      message: `Trip "${title}" created successfully with ${daysCount} days generated!`,
      data: {
        tripId,
        daysCount
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// PUT /api/trips/:id
exports.updateTrip = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const tripId = req.params.id;
    const userId = req.user.id;

    // Verify ownership
    const [existing] = await connection.execute(
      'SELECT * FROM trips WHERE id = ?',
      [tripId]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const trip = existing[0];
    if (trip.user_id !== userId && req.user.role !== 'ADMIN') {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can update trip settings.'
      });
    }

    const {
      title,
      country,
      startDate,
      endDate,
      travelersCount,
      budget,
      currency,
      status
    } = req.body;

    const newStart = startDate || trip.start_date;
    const newEnd = endDate || trip.end_date;

    if (new Date(newStart) > new Date(newEnd)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Start date must be earlier than or equal to end date.'
      });
    }

  let coverPhoto = trip.cover_photo;

if (req.file) {
  const uploadedImage = await uploadToCloudinary(
    req.file.buffer,
    'covers'
  );

  coverPhoto = uploadedImage.url;
}

    // If dates changed, recalculate days
    const datesChanged = (startDate && startDate !== trip.start_date) || (endDate && endDate !== trip.end_date);

    await connection.execute(
      `UPDATE trips SET
         title = ?, country = ?, start_date = ?, end_date = ?,
         travelers_count = ?, budget = ?, currency = ?,
         cover_photo = ?, status = ?
       WHERE id = ?`,
      [
        title ? title.trim() : trip.title,
        country ? country.trim() : trip.country,
        newStart,
        newEnd,
        travelersCount !== undefined ? parseInt(travelersCount, 10) : trip.travelers_count,
        budget !== undefined ? parseFloat(budget) : trip.budget,
        currency ? currency.trim() : trip.currency,
        coverPhoto,
        status || trip.status,
        tripId
      ]
    );

    if (datesChanged) {
      // Recompute days count
      const daysCount = calculateDaysCount(newStart, newEnd);
      // Delete old days and regenerate
      await connection.execute('DELETE FROM trip_days WHERE trip_id = ?', [tripId]);
      await generateTripDays(connection, tripId, newStart, daysCount);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Trip updated successfully.'
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// DELETE /api/trips/:id
exports.deleteTrip = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;

    const [existing] = await db.execute('SELECT user_id, title FROM trips WHERE id = ?', [tripId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    if (existing[0].user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can delete this trip.'
      });
    }

    await db.execute('DELETE FROM trips WHERE id = ?', [tripId]);

    res.json({
      success: true,
      message: `Trip "${existing[0].title}" was deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};
