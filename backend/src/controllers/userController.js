const bcrypt = require('bcryptjs');
const db = require('../config/db');
const uploadToCloudinary = require('../utils/cloudinaryUpload');

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, username, name, email, role, avatar, created_at,
       (SELECT COUNT(*) FROM trips WHERE user_id = users.id) AS total_trips,
       (SELECT COUNT(*) FROM photos WHERE user_id = users.id) AS total_photos
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      data: { user: rows[0] }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    await db.execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);

    const [updated] = await db.execute(
      'SELECT id, username, name, email, role, avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updated[0] }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file.'
      });
    }

    const uploadedImage = await uploadToCloudinary(
      req.file.buffer,
      'avatars'
    );

    const avatarUrl = uploadedImage.url;

    await db.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile photo updated successfully!',
      data: { avatar: avatarUrl }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search?q=query (for sharing trips with other registered users)
exports.searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) {
      return res.json({ success: true, data: { users: [] } });
    }

    const [rows] = await db.execute(
      `SELECT id, username, name, email, avatar 
       FROM users 
       WHERE (name LIKE ? OR email LIKE ? OR username LIKE ?) 
       AND id != ? AND is_active = 1
       LIMIT 10`,
      [`%${query}%`, `%${query}%`, `%${query}%`, req.user.id]
    );

    res.json({
      success: true,
      data: { users: rows }
    });
  } catch (err) {
    next(err);
  }
};
