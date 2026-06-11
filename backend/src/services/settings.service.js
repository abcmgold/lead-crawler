// SMTP settings are configured via environment variables and are read-only at runtime.
function getSettings() {
  return {
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT || '',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    senderName: process.env.SMTP_SENDER_NAME || '',
    senderEmail: process.env.SMTP_SENDER_EMAIL || '',
    secure: process.env.SMTP_SECURE === 'true'
  };
}

function getPublicSettings() {
  const settings = getSettings();
  return { ...settings, pass: settings.pass ? '********' : '' };
}

module.exports = { getSettings, getPublicSettings };
