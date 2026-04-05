/**
 * Script to import Construction_Work_Force.json data into Firestore
 * Run this script once to upload the construction worker data
 * 
 * Usage:
 * 1. Make sure you have Firebase Admin SDK credentials
 * 2. Run: node importConstructionData.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with your service account
// You'll need to download your serviceAccountKey.json from Firebase Console
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read the construction data
const constructionData = require('../Construction_Work_Force.json');

async function importData() {
  console.log(`Starting import of ${constructionData.length} construction workers...`);
  
  const batch = db.batch();
  const companyId = 'villa-construction'; // The company ID for construction workers
  
  for (let i = 0; i < constructionData.length; i++) {
    const worker = constructionData[i];
    const docRef = db.collection('constructionWorkers').doc();
    
    batch.set(docRef, {
      ...worker,
      companyId: companyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Firestore batch limit is 500 operations
    if ((i + 1) % 500 === 0) {
      console.log(`Committing batch ${Math.floor(i / 500) + 1}...`);
      await batch.commit();
      console.log(`Batch ${Math.floor(i / 500) + 1} committed.`);
    }
  }
  
  // Commit remaining documents
  console.log('Committing final batch...');
  await batch.commit();
  
  console.log(`\n✅ Successfully imported ${constructionData.length} construction workers to Firestore!`);
  console.log(`Company ID: ${companyId}`);
  console.log(`Collection: constructionWorkers`);
  
  process.exit(0);
}

importData().catch(error => {
  console.error('❌ Error importing data:', error);
  process.exit(1);
});
