const db = require('../config/db');

// Helper to check trip access (owner or viewer)
const checkTripAccess = async (tripId, userId) => {
  const [trips] = await db.execute('SELECT id, user_id, budget, currency FROM trips WHERE id = ?', [tripId]);
  if (trips.length === 0) return { exists: false };
  const trip = trips[0];
  const isOwner = trip.user_id === userId;

  if (isOwner) return { exists: true, isOwner: true, trip };

  const [shares] = await db.execute(
    'SELECT id FROM trip_shares WHERE trip_id = ? AND shared_with_user_id = ?',
    [tripId, userId]
  );
  return { exists: true, isOwner: false, isShared: shares.length > 0, trip };
};

// GET /api/expenses/trip/:tripId
exports.getExpensesByTrip = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const access = await checkTripAccess(tripId, req.user.id);

    if (!access.exists) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!access.isOwner && !access.isShared && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [expenses] = await db.execute(
      `SELECT e.*, td.day_number, d.name AS destination_name
       FROM expenses e
       LEFT JOIN trip_days td ON td.id = e.day_id
       LEFT JOIN destinations d ON d.id = e.destination_id
       WHERE e.trip_id = ?
       ORDER BY e.expense_date DESC, e.id DESC`,
      [tripId]
    );

    // Calculate summary
    const [summaryRows] = await db.execute(
      `SELECT 
         COALESCE(SUM(amount), 0) AS total_spent,
         category,
         COUNT(*) as count
       FROM expenses 
       WHERE trip_id = ? 
       GROUP BY category`,
      [tripId]
    );

    const totalSpent = summaryRows.reduce((acc, row) => acc + parseFloat(row.total_spent), 0);
    const budget = parseFloat(access.trip.budget) || 0;
    const remaining = budget - totalSpent;

    res.json({
      success: true,
      data: {
        currency: access.trip.currency,
        budget,
        totalSpent,
        remaining,
        categoryBreakdown: summaryRows,
        expenses
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/expenses/trip/:tripId
exports.addExpense = async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const { title, amount, category = 'Other', expenseDate, dayId, destinationId, notes } = req.body;

    const access = await checkTripAccess(tripId, req.user.id);
    if (!access.exists) return res.status(404).json({ success: false, message: 'Trip not found.' });
    if (!access.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can record expenses.' });
    }

    if (!title || !amount || !expenseDate) {
      return res.status(400).json({ success: false, message: 'Title, amount, and date are required.' });
    }

    const [result] = await db.execute(
      `INSERT INTO expenses (trip_id, day_id, destination_id, title, amount, category, expense_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        dayId || null,
        destinationId || null,
        title.trim(),
        parseFloat(amount),
        category,
        expenseDate,
        notes ? notes.trim() : null
      ]
    );

    // If linked to destination, update actual_cost
    if (destinationId) {
      await db.execute(
        `UPDATE destinations SET actual_cost = (
          SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE destination_id = ?
        ) WHERE id = ?`,
        [destinationId, destinationId]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Expense added successfully.',
      data: { expenseId: result.insertId }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const { title, amount, category, expenseDate, dayId, destinationId, notes } = req.body;

    const [rows] = await db.execute(
      `SELECT e.*, t.user_id FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = ?`,
      [expenseId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Expense not found.' });
    const exp = rows[0];

    if (exp.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.execute(
      `UPDATE expenses SET
         title = COALESCE(?, title),
         amount = COALESCE(?, amount),
         category = COALESCE(?, category),
         expense_date = COALESCE(?, expense_date),
         day_id = COALESCE(?, day_id),
         destination_id = COALESCE(?, destination_id),
         notes = COALESCE(?, notes)
       WHERE id = ?`,
      [title, amount, category, expenseDate, dayId, destinationId, notes, expenseId]
    );

    res.json({ success: true, message: 'Expense updated.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    const expenseId = req.params.id;

    const [rows] = await db.execute(
      `SELECT e.*, t.user_id FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = ?`,
      [expenseId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Expense not found.' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.execute('DELETE FROM expenses WHERE id = ?', [expenseId]);

    res.json({ success: true, message: 'Expense deleted.' });
  } catch (err) {
    next(err);
  }
};
