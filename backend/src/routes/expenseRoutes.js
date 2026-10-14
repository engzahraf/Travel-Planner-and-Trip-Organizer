const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/trip/:tripId', expenseController.getExpensesByTrip);
router.post('/trip/:tripId', expenseController.addExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
