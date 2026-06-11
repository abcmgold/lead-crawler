const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', '..', 'system.log');

// Append a line to backend/system.log
function logSystem(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    console.error('Không thể ghi file log:', err.message);
  }
}

module.exports = { logSystem };
