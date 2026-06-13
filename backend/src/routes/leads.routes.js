const express = require('express');
const leadsController = require('../controllers/leads.controller');
const leadEmailsController = require('../controllers/leadEmails.controller');
const leadPhonesController = require('../controllers/leadPhones.controller');
const leadSocialsController = require('../controllers/leadSocials.controller');

const router = express.Router();

router.get('/summary', leadsController.getSummary);
router.delete('/', leadsController.clearAll);

router.get('/emails', leadEmailsController.getLeadEmails);
router.delete('/emails', leadEmailsController.clearLeadEmails);

router.get('/phones', leadPhonesController.getLeadPhones);
router.delete('/phones', leadPhonesController.clearLeadPhones);

router.get('/socials', leadSocialsController.getLeadSocials);
router.delete('/socials', leadSocialsController.clearLeadSocials);

module.exports = router;
