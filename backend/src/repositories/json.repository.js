const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'data.json');

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ leads: [], settings: {}, logs: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    return { leads: [], settings: {}, logs: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getAll() {
  return readData();
}

function saveAll(data) {
  writeData(data);
}

function getLeads() {
  return readData().leads || [];
}

function saveLeads(leads) {
  const data = readData();
  data.leads = leads;
  writeData(data);
}

function getLogs() {
  return readData().logs || [];
}

function saveLogs(logs) {
  const data = readData();
  data.logs = logs;
  writeData(data);
}

module.exports = {
  getAll,
  saveAll,
  getLeads,
  saveLeads,
  getLogs,
  saveLogs
};
