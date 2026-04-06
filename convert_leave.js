const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Convert Leave Status.xlsx
const leaveFile = path.join(__dirname, 'Leave Status.xlsx');
const leaveWorkbook = XLSX.readFile(leaveFile);
const leaveSheet = leaveWorkbook.Sheets[leaveWorkbook.SheetNames[0]];
const leaveData = XLSX.utils.sheet_to_json(leaveSheet);

fs.writeFileSync(
  path.join(__dirname, 'Leave_Status.json'),
  JSON.stringify(leaveData, null, 2)
);

console.log(`✅ Leave Status: ${leaveData.length} records converted`);
console.log('Columns:', Object.keys(leaveData[0] || {}));
