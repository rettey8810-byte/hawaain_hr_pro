const fs = require('fs');

const data = JSON.parse(fs.readFileSync('Construction_Work_Force.json', 'utf8'));
console.log('Total Villa Construction records:', data.length);
console.log('First 3 employees:');
data.slice(0, 3).forEach(emp => {
  console.log(`  - ${emp.Name} (${emp['Passport No']})`);
});
