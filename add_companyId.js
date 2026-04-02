const fs = require('fs');
const path = require('path');

// Read the JSON file
const inputFile = path.join(__dirname, 'Xpat_Audit_fixed.json');
const outputFile = path.join(__dirname, 'Xpat_Audit_with_companyId.json');

console.log('Reading JSON file...');
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log(`Processing ${data.length} records...`);

// Single company for all records
const COMPANY_ID = 'villa-resorts-and-hotel';

// Add companyId to each record
const updatedData = data.map((record, index) => {
  return {
    ...record,
    companyId: COMPANY_ID
  };
});

console.log(`\nAdded companyId "${COMPANY_ID}" to ${updatedData.length} records`);

// Write updated file
fs.writeFileSync(outputFile, JSON.stringify(updatedData, null, 2));
console.log(`\nSaved to: ${outputFile}`);
