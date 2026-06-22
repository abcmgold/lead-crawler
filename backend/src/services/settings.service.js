const dbRepo = require('../repositories/db.repository');

const EMPTY_SETTINGS = {
  id: null,
  userId: '',
  host: '',
  port: '',
  user: '',
  pass: '',
  secure: false,
  senderName: '',
  senderEmail: ''
};

// SMTP settings are stored in the smtp_settings table per user
async function getSettings(userId) {
  const settings = await dbRepo.getSmtpSettings(userId);
  return settings || { ...EMPTY_SETTINGS };
}

async function getPublicSettings(userId) {
  const settings = await getSettings(userId);
  return { ...settings, pass: settings.pass ? '********' : '' };
}

// Persists new SMTP settings. If `pass` is blank or the masked placeholder,
// the previously stored password is kept unchanged.
async function saveSettings(userId, data) {
  const current = await getSettings(userId);
  const pass = (!data.pass || data.pass === '********') ? current.pass : data.pass;

  const updated = {
    host: data.host || '',
    port: data.port || '',
    user: data.user || '',
    pass,
    secure: !!data.secure,
    senderName: data.senderName || '',
    senderEmail: data.senderEmail || ''
  };

  await dbRepo.saveSmtpSettings(userId, updated);
  return updated;
}

module.exports = { getSettings, getPublicSettings, saveSettings };
