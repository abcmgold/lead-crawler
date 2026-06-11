const express = require('express');
const leadsController = require('../controllers/leads.controller');

const router = express.Router();

router.get('/', leadsController.getLeads);
router.delete('/', leadsController.clearLeads);
router.post('/clean-phones', leadsController.cleanPhones);

module.exports = router;
