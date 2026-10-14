const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/trip/:tripId', journalController.getEntriesByTrip);
router.post('/trip/:tripId', journalController.addEntry);
router.put('/:id', journalController.updateEntry);
router.delete('/:id', journalController.deleteEntry);

module.exports = router;
