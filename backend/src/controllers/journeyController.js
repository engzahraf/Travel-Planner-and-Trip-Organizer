const db = require('../config/db');

// Helper to check ownership of trip containing this day or destination
const verifyTripOwnershipByDayId = async (dayId, userId) => {
  const [rows] = await db.execute(
    `SELECT t.id, t.user_id FROM trips t 
     JOIN trip_days td ON td.trip_id = t.id 
     WHERE td.id = ?`,
    [dayId]
  );
  if (rows.length === 0) return { exists: false };
  return { exists: true, isOwner: rows[0].user_id === userId, tripId: rows[0].id };
};

const verifyTripOwnershipByDestId = async (destId, userId) => {
  const [rows] = await db.execute(
    `SELECT t.id, t.user_id, d.day_id FROM trips t 
     JOIN trip_days td ON td.trip_id = t.id 
     JOIN destinations d ON d.day_id = td.id
     WHERE d.id = ?`,
    [destId]
  );
  if (rows.length === 0) return { exists: false };
  return { exists: true, isOwner: rows[0].user_id === userId, tripId: rows[0].id, dayId: rows[0].day_id };
};

// PUT /api/days/:id
exports.updateDay = async (req, res, next) => {
  try {
    const dayId = req.params.id;
    const { title, notes, status } = req.body;

    const check = await verifyTripOwnershipByDayId(dayId, req.user.id);
    if (!check.exists) return res.status(404).json({ success: false, message: 'Day not found.' });
    if (!check.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You do not have permission to modify this day.' });
    }

    await db.execute(
      `UPDATE trip_days SET
         title = COALESCE(?, title),
         notes = COALESCE(?, notes),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [title, notes, status, dayId]
    );

    res.json({ success: true, message: 'Day itinerary updated.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/days/:dayId/destinations
exports.addDestination = async (req, res, next) => {
  try {
    const dayId = req.params.dayId;
    const { name, description, plannedTime, location, estimatedCost = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Destination name is required.' });
    }

    const check = await verifyTripOwnershipByDayId(dayId, req.user.id);
    if (!check.exists) return res.status(404).json({ success: false, message: 'Day not found.' });
    if (!check.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can add destinations.' });
    }

    // Get current max order index
    const [orderRows] = await db.execute(
      'SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM destinations WHERE day_id = ?',
      [dayId]
    );
    const nextOrder = orderRows[0].next_order;

    // Check if there is already an ONGOING destination in this day. If not and this is the first, could be ONGOING or UPCOMING.
    const [existingDests] = await db.execute(
      'SELECT id, status FROM destinations WHERE day_id = ?',
      [dayId]
    );

    let initialStatus = 'UPCOMING';
    if (existingDests.length === 0) {
      initialStatus = 'ONGOING';
    }

    const [result] = await db.execute(
      `INSERT INTO destinations 
       (day_id, name, description, planned_time, location, estimated_cost, status, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dayId,
        name.trim(),
        description ? description.trim() : null,
        plannedTime || null,
        location ? location.trim() : null,
        parseFloat(estimatedCost) || 0.00,
        initialStatus,
        nextOrder
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Destination added successfully.',
      data: { destinationId: result.insertId }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/destinations/:id
exports.updateDestination = async (req, res, next) => {
  try {
    const destId = req.params.id;
    const { name, description, plannedTime, location, estimatedCost, actualCost, status, orderIndex } = req.body;

    const check = await verifyTripOwnershipByDestId(destId, req.user.id);
    if (!check.exists) return res.status(404).json({ success: false, message: 'Destination not found.' });
    if (!check.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can update this destination.' });
    }

    await db.execute(
      `UPDATE destinations SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         planned_time = COALESCE(?, planned_time),
         location = COALESCE(?, location),
         estimated_cost = COALESCE(?, estimated_cost),
         actual_cost = COALESCE(?, actual_cost),
         status = COALESCE(?, status),
         order_index = COALESCE(?, order_index)
       WHERE id = ?`,
      [name, description, plannedTime, location, estimatedCost, actualCost, status, orderIndex, destId]
    );

    res.json({ success: true, message: 'Destination updated.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/destinations/:id/complete (Done Exploring workflow)
exports.completeDestination = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const destId = req.params.id;
    const check = await verifyTripOwnershipByDestId(destId, req.user.id);

    if (!check.exists) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }
    if (!check.isOwner && req.user.role !== 'ADMIN') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Only the trip owner can complete destinations.' });
    }

    const dayId = check.dayId;

    // 1. Mark current destination as COMPLETED
    await connection.execute(
      `UPDATE destinations SET status = 'COMPLETED' WHERE id = ?`,
      [destId]
    );

    // 2. Find the next UPCOMING destination in the same day (or subsequent days)
    const [nextDests] = await connection.execute(
      `SELECT id, name FROM destinations 
       WHERE day_id = ? AND status = 'UPCOMING' 
       ORDER BY order_index ASC, id ASC LIMIT 1`,
      [dayId]
    );

    let nextActivated = null;
    if (nextDests.length > 0) {
      const nextId = nextDests[0].id;
      await connection.execute(
        `UPDATE destinations SET status = 'ONGOING' WHERE id = ?`,
        [nextId]
      );
      nextActivated = nextDests[0];
    } else {
      // Check if all destinations for this day are completed, if so mark day as COMPLETED
      const [remaining] = await connection.execute(
        `SELECT COUNT(*) AS pending FROM destinations WHERE day_id = ? AND status != 'COMPLETED'`,
        [dayId]
      );
      if (remaining[0].pending === 0) {
        await connection.execute(`UPDATE trip_days SET status = 'COMPLETED' WHERE id = ?`, [dayId]);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: nextActivated
        ? `Destination completed! Next destination "${nextActivated.name}" is now Ongoing.`
        : `Destination completed! All destinations for this day are explored! 🎉`,
      data: {
        completedId: destId,
        nextOngoing: nextActivated
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// DELETE /api/destinations/:id
exports.deleteDestination = async (req, res, next) => {
  try {
    const destId = req.params.id;
    const check = await verifyTripOwnershipByDestId(destId, req.user.id);

    if (!check.exists) return res.status(404).json({ success: false, message: 'Destination not found.' });
    if (!check.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the trip owner can delete this destination.' });
    }

    await db.execute('DELETE FROM destinations WHERE id = ?', [destId]);

    res.json({ success: true, message: 'Destination deleted.' });
  } catch (err) {
    next(err);
  }
};

// Exploration Checklist Items
// POST /api/destinations/:destId/exploration
exports.addExplorationItem = async (req, res, next) => {
  try {
    const destId = req.params.destId;
    const { itemText } = req.body;

    if (!itemText || !itemText.trim()) {
      return res.status(400).json({ success: false, message: 'Item text is required.' });
    }

    const check = await verifyTripOwnershipByDestId(destId, req.user.id);
    if (!check.exists) return res.status(404).json({ success: false, message: 'Destination not found.' });
    if (!check.isOwner && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only trip owner can add exploration checklist items.' });
    }

    const [result] = await db.execute(
      'INSERT INTO exploration_items (destination_id, item_text) VALUES (?, ?)',
      [destId, itemText.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Exploration item added.',
      data: { itemId: result.insertId, itemText: itemText.trim(), isCompleted: 0 }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/exploration/:id/toggle
exports.toggleExplorationItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;

    const [rows] = await db.execute(
      `SELECT ei.*, t.user_id 
       FROM exploration_items ei
       JOIN destinations d ON d.id = ei.destination_id
       JOIN trip_days td ON td.id = d.day_id
       JOIN trips t ON t.id = td.trip_id
       WHERE ei.id = ?`,
      [itemId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    const item = rows[0];

    if (item.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const newCompleted = item.is_completed ? 0 : 1;
    await db.execute('UPDATE exploration_items SET is_completed = ? WHERE id = ?', [newCompleted, itemId]);

    res.json({
      success: true,
      message: newCompleted ? 'Item marked as completed! ✅' : 'Item marked as pending.',
      data: { isCompleted: newCompleted }
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/exploration/:id
exports.deleteExplorationItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;

    const [rows] = await db.execute(
      `SELECT ei.*, t.user_id 
       FROM exploration_items ei
       JOIN destinations d ON d.id = ei.destination_id
       JOIN trip_days td ON td.id = d.day_id
       JOIN trips t ON t.id = td.trip_id
       WHERE ei.id = ?`,
      [itemId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await db.execute('DELETE FROM exploration_items WHERE id = ?', [itemId]);

    res.json({ success: true, message: 'Exploration item deleted.' });
  } catch (err) {
    next(err);
  }
};
