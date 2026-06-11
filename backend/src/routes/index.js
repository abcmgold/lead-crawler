const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const authRoutes = require('./auth.routes');
const leadsRoutes = require('./leads.routes');
const crawlRoutes = require('./crawl.routes');
const historyRoutes = require('./history.routes');
const emailRoutes = require('./email.routes');
const settingsRoutes = require('./settings.routes');
const templatesRoutes = require('./templates.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/leads', authenticate, leadsRoutes);
router.use('/crawl', authenticate, crawlRoutes);
router.use('/history', authenticate, historyRoutes);
router.use('/send-emails', authenticate, emailRoutes);
router.use('/settings', authenticate, authorize('ADMIN'), settingsRoutes);
router.use('/templates', authenticate, templatesRoutes);

module.exports = router;
