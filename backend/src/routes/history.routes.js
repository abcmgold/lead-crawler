const express = require('express');
const historyController = require('../controllers/history.controller');

const router = express.Router();

router.get('/', historyController.getHistory);
router.delete('/', historyController.clearHistory);

module.exports = router;
