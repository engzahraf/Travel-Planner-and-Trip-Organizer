const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authenticate);

router.get('/', tripController.getAllTrips);
router.get('/:id', tripController.getTripById);
router.post('/', upload.single('cover'), tripController.createTrip);
router.put('/:id', upload.single('cover'), tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
