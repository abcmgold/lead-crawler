const express = require('express');
const templatesController = require('../controllers/templates.controller');

const router = express.Router();

router.get('/', templatesController.getTemplates);
router.post('/', templatesController.createTemplate);
router.put('/:id', templatesController.updateTemplate);
router.delete('/:id', templatesController.deleteTemplate);

module.exports = router;
