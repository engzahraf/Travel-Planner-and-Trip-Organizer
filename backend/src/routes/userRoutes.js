const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/avatar', upload.single('avatar'), userController.updateAvatar);
router.put('/change-password', userController.changePassword);
router.get('/search', userController.searchUsers);

module.exports = router;
