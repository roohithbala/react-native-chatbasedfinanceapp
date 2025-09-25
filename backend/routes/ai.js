const express = require('express');
const auth = require('../middleware/auth');
const {
  getSpendingPredictions,
  getEmotionalSpendingAnalysis,
  getSpendingSummary
} = require('../controllers/aiController');

const router = express.Router();

// Get spending predictions
router.get('/predict/:userId?', auth, getSpendingPredictions);

// Get emotional spending analysis
router.get('/emotions/:userId?', auth, getEmotionalSpendingAnalysis);

// Get spending summary
router.get('/summary/:period?', auth, getSpendingSummary);

module.exports = router;