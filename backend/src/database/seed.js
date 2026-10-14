const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedAdmin() {
  try {
    const adminUsername = 'zahraf';
    const adminEmail = 'zahraf@travelplanner.local';
    const rawPassword = 'AdminPassword123!';

    const [existing] = await db.execute(
      "SELECT id, username, role FROM users WHERE username = ? OR role = 'ADMIN'",
      [adminUsername]
    );

    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      await db.execute(
        `INSERT INTO users (username, name, email, password, role, is_active) 
         VALUES (?, ?, ?, ?, 'ADMIN', 1)`,
        [adminUsername, 'Zahraf (Admin)', adminEmail, hashedPassword]
      );
      console.log(`👑 Admin account created: username="${adminUsername}", password="${rawPassword}"`);
    } else {
      console.log(`👑 Admin account "${existing[0].username}" is already ready.`);
    }
  } catch (err) {
    console.error('Error seeding admin account:', err);
  }
}

module.exports = { seedAdmin };
