const settingsService = require('../services/settings.service');
const dbRepo = require('../repositories/db.repository');

async function getUserId(req) {
  if (req.user && req.user.id) return req.user.id;
  const account = await dbRepo.findUserByUsername(req.user.username);
  return account ? account.id : null;
}

async function getSettings(req, res) {
  const userId = await getUserId(req);
  res.json(await settingsService.getPublicSettings(userId));
}

async function postSettings(req, res) {
  const userId = await getUserId(req);
  const { host, port, user, pass, secure, senderName, senderEmail } = req.body;
  const updated = await settingsService.saveSettings(userId, { host, port, user, pass, secure, senderName, senderEmail });
  res.json({ ...updated, pass: updated.pass ? '********' : '' });
}

module.exports = { getSettings, postSettings };
