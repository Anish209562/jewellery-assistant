const express = require('express');
const router = express.Router();
const {
  getWorkers,
  getWorker,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkerStats,
} = require('../controllers/workerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getWorkerStats);
router.route('/').get(restrictTo('admin'), getWorkers).post(restrictTo('admin'), createWorker);
router.route('/:id').get(restrictTo('admin'), getWorker).put(restrictTo('admin'), updateWorker).delete(restrictTo('admin'), deleteWorker);

module.exports = router;
