/**
 * Comparison Routes
 */
const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/comparison.controller');

// Upload files
router.post('/upload', upload.fields([{ name: 'fileA', maxCount: 1 }, { name: 'fileB', maxCount: 1 }]), ctrl.uploadFiles);

// Get sheets
router.get('/:uploadId/sheets', ctrl.getSheets);

// Analyze
router.post('/:uploadId/analyze', ctrl.analyzeFiles);

// Run comparison job
router.post('/:uploadId/run', ctrl.runComparison);

// Job status
router.get('/jobs/:jobId/status', ctrl.getJobStatus);

// Download result
router.get('/jobs/:jobId/download', ctrl.downloadResult);

// History
router.get('/history', ctrl.getHistory);

module.exports = router;
