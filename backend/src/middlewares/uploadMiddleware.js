const multer = require('multer');
const path = require('path');

// Store uploaded images temporarily in memory.
// Controllers will upload these buffers to Cloudinary.
const storage = multer.memoryStorage();

// Allow common image formats only.
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  if (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    return cb(null, true);
  }

  cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed.'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum per image
  },
  fileFilter
});

module.exports = upload;