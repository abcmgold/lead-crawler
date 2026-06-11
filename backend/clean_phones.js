const fs = require('fs');
const path = require('path');

// Clean the actual data file (root data.json)
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const validPhoneRegex = /^0\d{9}$/;
let fixedCount = 0;

data.leads = data.leads.map(function(lead) {
  var phones = (lead.phone || '')
    .split(',')
    .map(function(p) { return p.trim().replace(/[\s.\-]/g, ''); })
    .filter(function(p) { return validPhoneRegex.test(p); });

  // Deduplicate
  var seen = {};
  var uniquePhones = phones.filter(function(p) {
    if (seen[p]) return false;
    seen[p] = true;
    return true;
  }).slice(0, 2);

  var cleanPhone = uniquePhones.join(', ');
  if (cleanPhone !== lead.phone) fixedCount++;
  return Object.assign({}, lead, { phone: cleanPhone });
});

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
console.log('Done. Fixed: ' + fixedCount + ' / ' + data.leads.length + ' leads');
// Show sample
data.leads.slice(0, 3).forEach(function(l) {
  console.log(l.email + ' | ' + l.phone);
});
