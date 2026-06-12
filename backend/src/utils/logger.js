const fs = require('fs');
const path = require('path');

let LOG_FILE = path.join(__dirname, '..', '..', 'system.log');

// If running in a serverless environment, fallback to /tmp
if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  LOG_FILE = path.join('/tmp', 'system.log');
}

// Append a line to system.log and output to console
function logSystem(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}`;

  // Log to standard console output so serverless log collectors capture them
  if (level === 'ERROR') {
    console.error(logLine);
  } else if (level === 'WARNING') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }

  try {
    fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf8');
  } catch (err) {
    // If it's a read-only file system, try writing to /tmp/system.log
    if (err.code === 'EROFS' && LOG_FILE !== path.join('/tmp', 'system.log')) {
      LOG_FILE = path.join('/tmp', 'system.log');
      try {
        fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf8');
      } catch (innerErr) {
        // Silently ignore if even /tmp is read-only
      }
    } else if (err.code !== 'EROFS') {
      // Only print filesystem error if it's not EROFS to avoid logs pollution on serverless
      console.error('Không thể ghi file log:', err.message);
    }
  }
}

module.exports = { logSystem };

