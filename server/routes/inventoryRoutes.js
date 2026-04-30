const express = require('express');
const router = express.Router();
const {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
} = require('../controllers/inventoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getInventoryStats);
router.route('/').get(restrictTo('admin'), getInventory).post(restrictTo('admin'), createInventoryItem);
router.route('/:id').get(restrictTo('admin'), getInventoryItem).put(restrictTo('admin'), updateInventoryItem).delete(restrictTo('admin'), deleteInventoryItem);

module.exports = router;
