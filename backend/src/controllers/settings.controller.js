const settingsService = require('../services/settings.service');

function getSettings(req, res) {
  res.json(settingsService.getPublicSettings());
}

module.exports = { getSettings };
