
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

// Helper to sign JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  let connection;

  try {
    const { username, name, email, password, confirmPassword } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, name, email, and password are required.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 50 characters.'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanName = name.trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.'
      });
    }

    // Check for duplicate username
    const [existingUsername] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [cleanUsername]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Check for duplicate email
    const [existingEmail] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please login or use another email.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO users
        (username, name, email, password, role,
         email_verified, email_verification_token,
         email_verification_expires)
       VALUES (?, ?, ?, ?, 'USER', 1, NULL, NULL)`,
      [
        cleanUsername,
        cleanName,
        cleanEmail,
        hashedPassword
      ]
    );

    const newUserId = result.insertId;

    await connection.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'system')`,
      [
        newUserId,
        'Welcome to Travel Planner! 🎒',
        'Your account is ready! Start planning your first journey!'
      ]
    );

    await connection.commit();

    // Auto-login: generate token and return user data
    const token = generateToken(newUserId, 'USER');

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome aboard!',
      data: {
        token,
        user: {
          id: newUserId,
          username: cleanUsername,
          name: cleanName,
          email: cleanEmail,
          role: 'USER',
          avatar: null
        }
      }
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Registration rollback failed:', rollbackError.message);
      }
    }

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This username or email is already registered. Please try again.'
      });
    }

    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// GET /api/auth/verify-email?token=...
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid verification token is required.'
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const [users] = await db.execute(
      `SELECT id, email_verification_expires
       FROM users
       WHERE email_verification_token = ?`,
      [tokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already-used verification link. Please request a new link.'
      });
    }

    const user = users[0];

   if (
  !user.email_verification_expires ||
  new Date(user.email_verification_expires.replace(' ', 'T') + 'Z') < new Date()
) { 
      return res.status(400).json({
        success: false,
        message: 'This verification link has expired. Please request a new one.'
      });
    }

    await db.execute(
      `UPDATE users
       SET email_verified = 1,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE id = ?`,
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    const cleanEmail = String(req.body.email || '')
      .toLowerCase()
      .trim();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const [users] = await db.execute(
      `SELECT id, name, email, email_verified
       FROM users
       WHERE email = ?`,
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account was found with that email.'
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'This email address is already verified. You can log in.'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await db.execute(
      `UPDATE users
       SET email_verification_token = ?,
           email_verification_expires = ?
       WHERE id = ?`,
      [tokenHash, expires, user.id]
    );

    await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    return res.json({
      success: true,
      message: 'A fresh verification email has been sent.'
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email (or username) and password.'
      });
    }

    const loginValue = email.trim();

    const [users] = await db.execute(
      `SELECT id, username, name, email, password, role, avatar,
              is_active, email_verified, email_verification_token
       FROM users
       WHERE email = ? OR username = ?`,
      [loginValue.toLowerCase(), loginValue]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    // Email verification check removed - users can log in immediately after registration

    const token = generateToken(user.id, user.role);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const [users] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'If that email exists in our system, password reset instructions have been issued.'
      });
    }

    const resetToken = crypto.randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.execute(
      `UPDATE users
       SET reset_password_token = ?, reset_password_expires = ?
       WHERE id = ?`,
      [resetToken, expires, users[0].id]
    );

    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'system')`,
      [
        users[0].id,
        'Password Reset Code',
        `Your reset code is: ${resetToken}`
      ]
    );

    return res.json({
      success: true,
      message: 'Password reset code generated. In development, check notifications or use the token.',
      data: { resetToken }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const [users] = await db.execute(
      `SELECT id, reset_password_expires
       FROM users
       WHERE email = ? AND reset_password_token = ?`,
      [email.toLowerCase().trim(), resetToken]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code or email.'
      });
    }

    const user = users[0];

    if (
      !user.reset_password_expires ||
      new Date(user.reset_password_expires) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users
       SET password = ?,
           reset_password_token = NULL,
           reset_password_expires = NULL
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.'
    });
  } catch (err) {
    next(err);
  }
};
