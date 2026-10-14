const db = require('../config/db');
const uploadToCloudinary = require('../utils/cloudinaryUpload');

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

// GET /api/photos/memories (Global memories gallery for current user)
exports.getAllMemories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tripId, destinationId, favoritesOnly } = req.query;

    let query = `
      SELECT p.*, t.title AS trip_title, t.country, td.day_number, d.name AS destination_name
      FROM photos p
      JOIN trips t ON t.id = p.trip_id
      LEFT JOIN trip_days td ON td.id = p.day_id
      LEFT JOIN destinations d ON d.id = p.destination_id
      WHERE (p.user_id = ? OR t.id IN (
        SELECT trip_id FROM trip_shares WHERE shared_with_user_id = ?
      ))
    `;
    const params = [userId, userId];

    if (tripId) {
      query += ` AND p.trip_id = ?`;
      params.push(tripId);
    }

    if (destinationId) {
      query += ` AND p.destination_id = ?`;
      params.push(destinationId);
    }

    if (favoritesOnly === 'true' || favoritesOnly === '1') {
      query += ` AND p.is_favorite = 1`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const [photos] = await db.execute(query, params);

    res.json({
      success: true,
      data: { photos }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/photos/trip/:tripId
exports.getPhotosByTrip = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const access = await checkTripAccess(tripId, req.user.id);

    if (!access.exists) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!access.isOwner && !access.isShared && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [photos] = await db.execute(
      `SELECT p.*, td.day_number, d.name AS destination_name
       FROM photos p
       LEFT JOIN trip_days td ON td.id = p.day_id
       LEFT JOIN destinations d ON d.id = p.destination_id
       WHERE p.trip_id = ?
       ORDER BY p.created_at DESC`,
      [tripId]
    );

    res.json({
      success: true,
      data: { photos }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/photos/trip/:tripId
exports.uploadPhotos = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const { dayId, destinationId, caption } = req.body;

    const access = await checkTripAccess(tripId, req.user.id);
    if (!access.exists) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!access.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can upload photos.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one photo to upload.' });
    }

    const insertedPhotos = [];

for (const file of req.files) {
  const uploadedImage = await uploadToCloudinary(
    file.buffer,
    'photos'
  );

  const imageUrl = uploadedImage.url;

  const [result] = await db.execute(
    `INSERT INTO photos (trip_id, day_id, destination_id, user_id, image_url, caption)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      tripId,
      dayId || null,
      destinationId || null,
      req.user.id,
      imageUrl,
      caption ? caption.trim() : null
    ]
  );

  insertedPhotos.push({
    id: result.insertId,
    image_url: imageUrl,
    caption: caption || null
  });
}

    res.status(201).json({
      success: true,
      message: `${insertedPhotos.length} photo(s) uploaded successfully! 📸`,
      data: { photos: insertedPhotos }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/photos/:id/favorite
exports.toggleFavorite = async (req, res, next) => {
  try {
    const photoId = req.params.id;

    const [rows] = await db.execute(
      `SELECT p.*, t.user_id AS owner_id 
       FROM photos p JOIN trips t ON t.id = p.trip_id 
       WHERE p.id = ?`,
      [photoId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Photo not found.' });
    const photo = rows[0];

    if (photo.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const newFav = photo.is_favorite ? 0 : 1;
    await db.execute('UPDATE photos SET is_favorite = ? WHERE id = ?', [newFav, photoId]);

    res.json({
      success: true,
      message: newFav ? 'Added to favorites ❤️' : 'Removed from favorites.',
      data: { isFavorite: newFav }
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/photos/:id
exports.deletePhoto = async (req, res, next) => {
  try {
    const photoId = req.params.id;

    const [rows] = await db.execute(
      `SELECT p.*, t.user_id AS owner_id 
       FROM photos p JOIN trips t ON t.id = p.trip_id 
       WHERE p.id = ?`,
      [photoId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Photo not found.' });
    const photo = rows[0];

    if (photo.owner_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.execute('DELETE FROM photos WHERE id = ?', [photoId]);

    res.json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
