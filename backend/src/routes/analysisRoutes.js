const express = require('express');
const analysisController = require('../controllers/analysisController');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/analyze', upload.single('image'), analysisController.analyzeGemstone);
router.get('/history', analysisController.getHistory);
router.delete('/history', analysisController.clearHistory);
router.get('/report/:id', analysisController.getReportById);
router.delete('/report/:id', analysisController.deleteReportById);
router.get('/prices', adminController.getAllPrices);

module.exports = router;
