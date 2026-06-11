const express = require('express');
const crawlController = require('../controllers/crawl.controller');

const router = express.Router();

router.post('/', crawlController.crawl);

module.exports = router;
