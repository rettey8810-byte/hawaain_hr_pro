const fs = require('fs');
const path = require('path');

// Read the JSON file with encoding handling
const inputFile = path.join(__dirname, 'Xpat_Audit_fixed.json');
const outputDir = path.join(__dirname, 'batches');

console.log('Reading JSON file...');

// Try reading as buffer first to detect encoding
const buffer = fs.readFileSync(inputFile);
let jsonData;

// Check for UTF-16 BOM
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
  // UTF-16 LE
  jsonData = buffer.toString('utf16le', 2);
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
  // UTF-16 BE
  jsonData = buffer.swap16().toString('utf16le', 2);
} else {
  // UTF-8 with possible BOM
  jsonData = buffer.toString('utf8');
}

// Remove BOM if still present
if (jsonData.charCodeAt(0) === 0xFEFF) {
  jsonData = jsonData.substring(1);
}

// Clean up any invalid characters and handle NaN
jsonData = jsonData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
jsonData = jsonData.replace(/: NaN/g, ': null');
jsonData = jsonData.replace(/:NaN/g, ':null');

const data = JSON.parse(jsonData);
const totalRecords = data.length;
console.log(`Total records: ${totalRecords}`);

// Create batches directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Calculate batch size (split into 6 batches)
const numBatches = 6;
const batchSize = Math.ceil(totalRecords / numBatches);

console.log(`\nSplitting into ${numBatches} batches of ~${batchSize} records each...\n`);

// Split and save batches
for (let i = 0; i < numBatches; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, totalRecords);
  const batch = data.slice(start, end);
  
  const batchFile = path.join(outputDir, `batch_${i + 1}_of_${numBatches}.json`);
  fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2));
  
  console.log(`✅ Batch ${i + 1}: Records ${start + 1} to ${end} (${batch.length} records)`);
  console.log(`   Saved to: ${batchFile}`);
}

console.log(`\n✅ All ${numBatches} batches created in ${outputDir}/`);
console.log('\nUpload schedule:');
for (let i = 0; i < numBatches; i++) {
  console.log(`  Day ${i + 1}: Upload batch_${i + 1}_of_${numBatches}.json`);
}
