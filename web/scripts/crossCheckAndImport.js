import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyAJJ0SEyrJBj8K06inSptRjG5VYkvhKeR8",
  authDomain: "hawaain-hr-pro-e8574.firebaseapp.com",
  projectId: "hawaain-hr-pro-e8574",
  storageBucket: "hawaain-hr-pro-e8574.firebasestorage.app",
  messagingSenderId: "819292919841",
  appId: "1:819292919841:web:38afa35d769901d2e6ab60"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const SUPERADMIN_EMAIL = "retey.ay@hotmail.com";
const SUPERADMIN_PASSWORD = "Adhu1447";
const VILLA_CONSTRUCTION_ID = "IkYokZm5QyPTF1ZUNP7O";

async function crossCheckAndImport() {
  try {
    console.log("=== CROSS-CHECKING NAMES AND IMPORTING MISSING ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Read Construction Work Force JSON
    const jsonData = JSON.parse(fs.readFileSync('Construction_Work_Force.json', 'utf8'));
    console.log(`📁 Construction Work Force records: ${jsonData.length}`);

    // Get ALL existing employees from Firestore
    const existingSnap = await getDocs(collection(db, 'employees'));
    const existingNames = new Set();
    
    existingSnap.docs.forEach(d => {
      const name = d.data().name?.toLowerCase().trim();
      if (name) existingNames.add(name);
    });
    
    console.log(`🔥 Existing employees in Firestore: ${existingNames.size}\n`);

    // Cross-check - find missing
    const missingEmployees = [];
    
    for (const record of jsonData) {
      const name = record.Name?.toLowerCase().trim();
      if (name && !existingNames.has(name)) {
        missingEmployees.push(record);
      }
    }
    
    console.log(`📊 CROSS-CHECK RESULTS:`);
    console.log(`  ✅ Already in database: ${jsonData.length - missingEmployees.length}`);
    console.log(`  ❌ Missing (need import): ${missingEmployees.length}\n`);

    if (missingEmployees.length === 0) {
      console.log("🎉 All Villa Construction employees already in database!");
      return;
    }

    // Show first 10 missing
    console.log(`First 10 missing employees:`);
    missingEmployees.slice(0, 10).forEach((emp, i) => {
      console.log(`  ${i + 1}. ${emp.Name} (${emp['Passport No'] || 'no passport'})`);
    });
    console.log("");

    // Import missing employees
    console.log(`🚀 Importing ${missingEmployees.length} missing employees...\n`);
    
    let imported = 0;
    let failed = 0;
    
    for (const record of missingEmployees) {
      try {
        const employeeId = `villa_${record.ID}`;
        
        // Create employee
        await addDoc(collection(db, 'employees'), {
          employeeId: record.ID?.toString(),
          name: record.Name,
          department: record.Department || 'Villa Construction',
          section: record.Section || '',
          designation: record.Designation || '',
          nationality: record.Nationality || '',
          companyId: VILLA_CONSTRUCTION_ID,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Create passport
        if (record['Passport No']) {
          await addDoc(collection(db, 'passports'), {
            employeeId: employeeId,
            passportNumber: record['Passport No'].toUpperCase().trim(),
            country: record.Nationality || '',
            companyId: VILLA_CONSTRUCTION_ID,
            createdAt: new Date().toISOString()
          });
        }
        
        // Create work permit
        if (record.WP) {
          await addDoc(collection(db, 'workPermits'), {
            employeeId: employeeId,
            permitNumber: record.WP,
            jobPosition: record.Designation || '',
            employer: 'Villa Construction',
            expiryDate: record.WPExpiry || '',
            companyId: VILLA_CONSTRUCTION_ID,
            createdAt: new Date().toISOString()
          });
        }
        
        imported++;
        if (imported % 10 === 0) {
          console.log(`  Progress: ${imported}/${missingEmployees.length} imported...`);
        }
      } catch (err) {
        console.error(`  ❌ Failed: ${record.Name} - ${err.message}`);
        failed++;
      }
    }
    
    console.log(`\n✅ IMPORT COMPLETE!`);
    console.log(`  Successfully imported: ${imported}`);
    console.log(`  Failed: ${failed}`);
    console.log(`\n📝 Total Villa Construction employees now: ${existingNames.size + imported}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

crossCheckAndImport();
