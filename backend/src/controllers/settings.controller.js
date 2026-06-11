const settingsService = require('../services/settings.service');

async function getSettings(req, res) {
  res.json(await settingsService.getPublicSettings());
}

async function postSettings(req, res) {
  const { host, port, user, pass, secure, senderName, senderEmail } = req.body;
  const updated = await settingsService.saveSettings({ host, port, user, pass, secure, senderName, senderEmail });
  res.json({ ...updated, pass: updated.pass ? '********' : '' });
}

module.exports = { getSettings, postSettings };
