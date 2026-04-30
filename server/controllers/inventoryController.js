const Inventory = require('../models/Inventory');

const emitRealtime = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items
 * @access  Private
 */
const getInventory = async (req, res, next) => {
  try {
    const { category, lowStock } = req.query;
    const filter = {};

    if (category) filter.category = category;

    let items = await Inventory.find(filter).sort({ category: 1, name: 1 });

    // Filter low stock items if requested
    if (lowStock === 'true') {
      items = items.filter((item) => item.quantity <= item.minStockLevel);
    }

    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/inventory/:id
 * @access  Private
 */
const getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/inventory
 * @desc    Add inventory item
 * @access  Private
 */
const createInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.create(req.body);
    emitRealtime(req, 'inventory:created', { itemId: item._id, name: item.name });
    res.status(201).json({ success: true, message: 'Item added to inventory', item });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory item
 * @access  Private
 */
const updateInventoryItem = async (req, res, next) => {
  try {
    // If adding stock, update lastRestocked date
    if (req.body.quantity !== undefined) {
      req.body.lastRestocked = new Date();
    }

    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    emitRealtime(req, 'inventory:updated', { itemId: item._id, name: item.name });

    res.json({ success: true, message: 'Inventory updated', item });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/inventory/:id
 * @access  Private (Admin)
 */
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    emitRealtime(req, 'inventory:deleted', { itemId: item._id, name: item.name });
    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/inventory/stats
 * @desc    Get inventory statistics
 * @access  Private
 */
const getInventoryStats = async (req, res, next) => {
  try {
    const all = await Inventory.find();
    const lowStock = all.filter((i) => i.quantity <= i.minStockLevel);
    const totalValue = all.reduce((sum, i) => sum + i.quantity * i.pricePerUnit, 0);

    const byCategory = {};
    all.forEach((i) => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    });

    res.json({
      success: true,
      total: all.length,
      lowStockCount: lowStock.length,
      totalValue,
      byCategory,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
};
