const express = require('express');
const router = express.Router();
const {
  getOrders,
  getMyOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const adminOnlyForUploads = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return restrictTo('admin')(req, res, next);
  }
  return next();
};

// All order routes require authentication
router.use(protect);

router.get('/stats', getOrderStats);
router.get('/my-orders', restrictTo('worker'), getMyOrders);
router.route('/').get(restrictTo('admin'), getOrders).post(restrictTo('admin'), upload.array('images', 5), createOrder);
router.route('/:id').get(getOrder).put(adminOnlyForUploads, upload.array('images', 5), updateOrder).delete(restrictTo('admin'), deleteOrder);

module.exports = router;
