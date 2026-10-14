const express = require('express');
const router = express.Router();
const journeyController = require('../controllers/journeyController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Days
router.put('/days/:id', journeyController.updateDay);
router.post('/days/:dayId/destinations', journeyController.addDestination);

// Destinations
router.put('/destinations/:id', journeyController.updateDestination);
router.post('/destinations/:id/complete', journeyController.completeDestination);
router.delete('/destinations/:id', journeyController.deleteDestination);

// Exploration Items
router.post('/destinations/:destId/exploration', journeyController.addExplorationItem);
router.put('/exploration/:id/toggle', journeyController.toggleExplorationItem);
router.delete('/exploration/:id', journeyController.deleteExplorationItem);

module.exports = router;
