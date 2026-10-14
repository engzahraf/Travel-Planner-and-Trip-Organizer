const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authenticate);

router.get('/memories', photoController.getAllMemories);
router.get('/trip/:tripId', photoController.getPhotosByTrip);
router.post('/trip/:tripId', upload.array('photos', 10), photoController.uploadPhotos);
router.put('/:id/favorite', photoController.toggleFavorite);
router.delete('/:id', photoController.deletePhoto);

module.exports = router;
