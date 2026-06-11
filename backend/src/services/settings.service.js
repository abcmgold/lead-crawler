const dbRepo = require('../repositories/db.repository');

const EMPTY_SETTINGS = {
  host: '',
  port: '',
  user: '',
  pass: '',
  secure: false,
  senderName: '',
  senderEmail: ''
};

// SMTP settings are stored in the smtp_settings table (single row, id = 1)
async function getSettings() {
  const settings = await dbRepo.getSmtpSettings();
  return settings || { ...EMPTY_SETTINGS };
}

async function getPublicSettings() {
  const settings = await getSettings();
  return { ...settings, pass: settings.pass ? '********' : '' };
}

// Persists new SMTP settings. If `pass` is blank or the masked placeholder,
// the previously stored password is kept unchanged.
async function saveSettings(data) {
  const current = await getSettings();
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

  await dbRepo.saveSmtpSettings(updated);
  return updated;
}

module.exports = { getSettings, getPublicSettings, saveSettings };
