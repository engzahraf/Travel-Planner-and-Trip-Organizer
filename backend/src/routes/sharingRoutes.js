const express = require('express');
const router = express.Router();
const sharingController = require('../controllers/sharingController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/shared-with-me', sharingController.getTripsSharedWithMe);
router.get('/trip/:tripId/collaborators', sharingController.getTripCollaborators);
router.post('/trip/:tripId/share', sharingController.shareTrip);
router.delete('/trip/:tripId/share/:targetUserId', sharingController.removeShare);

module.exports = router;
