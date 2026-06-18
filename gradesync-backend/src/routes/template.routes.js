/**
 * Template Routes
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/template.controller');

router.get('/', ctrl.listTemplates);
router.post('/', ctrl.createTemplate);
router.get('/:id', ctrl.getTemplate);
router.delete('/:id', ctrl.deleteTemplate);

module.exports = router;
