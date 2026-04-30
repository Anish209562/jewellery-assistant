const express = require('express');
const router = express.Router();
const { generateDesign, chatAgent } = require('../controllers/aiController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// POST /api/ai/design — Generate jewellery design ideas
router.post('/design', restrictTo('admin'), generateDesign);

// POST /api/ai/chat — Business chat agent
router.post('/chat', chatAgent);

module.exports = router;
