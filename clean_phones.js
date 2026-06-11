const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'backend', 'data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const validPhoneRegex = /^0\d{9}$/;
let fixedCount = 0;

data.leads = data.leads.map(lead => {
  const phones = (lead.phone || '')
    .split(',')
    .map(p => p.trim().replace(/[\s.\-]/g, ''))
    .filter(p => validPhoneRegex.test(p));

  const cleanPhone = [...new Set(phones)].slice(0, 2).join(', ');
  if (cleanPhone !== lead.phone) fixedCount++;
  return { ...lead, phone: cleanPhone };
});

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
console.log('Done. Fixed: ' + fixedCount + ' / ' + data.leads.length + ' leads');
