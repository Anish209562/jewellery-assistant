const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getWorkerAccounts,
  createWorkerAccount,
  deleteWorkerAccount,
} = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.route('/workers').get(requireAuth, requireAdmin, getWorkerAccounts).post(requireAuth, requireAdmin, createWorkerAccount);
router.delete('/workers/:id', requireAuth, requireAdmin, deleteWorkerAccount);

module.exports = router;
