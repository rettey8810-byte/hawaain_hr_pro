import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
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

// Villa Construction Company ID
const VILLA_CONSTRUCTION_ID = "IkYokZm5QyPTF1ZUNP7O";

async function importVillaConstruction() {
  try {
    console.log("=== IMPORTING VILLA CONSTRUCTION EMPLOYEES ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Read Construction Work Force JSON
    const jsonData = JSON.parse(fs.readFileSync('Construction_Work_Force.json', 'utf8'));
    console.log(`Total records in JSON: ${jsonData.length}\n`);

    // Get existing employees from Sunisland (to check for duplicates)
    const existingEmps = await getDocs(collection(db, 'employees'));
    const existingPassports = new Set();
    const existingNames = new Set();
    
    existingEmps.docs.forEach(d => {
      const data = d.data();
      // We need to check passports collection for passport numbers
    });

    // Get existing passports
    const existingPassportSnap = await getDocs(collection(db, 'passports'));
    const existingPassportNumbers = new Set();
    existingPassportSnap.docs.forEach(d => {
      existingPassportNumbers.add(d.data().passportNumber?.toUpperCase().trim());
    });
    
    console.log(`Existing passports in Firestore: ${existingPassportNumbers.size}`);

    // Check which employees already exist
    let existing = 0;
    let newEmployees = [];
    
    for (const record of jsonData) {
      const passportNo = record['Passport No']?.toUpperCase().trim();
      
      if (existingPassportNumbers.has(passportNo)) {
        existing++;
      } else {
        newEmployees.push(record);
      }
    }
    
    console.log(`\n📊 Analysis:`);
    console.log(`  Already exist: ${existing}`);
    console.log(`  New to import: ${newEmployees.length}\n`);

    if (newEmployees.length === 0) {
      console.log("✅ All Villa Construction employees already imported!");
      return;
    }

    console.log(`Sample new employees to import:`);
    newEmployees.slice(0, 5).forEach(emp => {
      console.log(`  - ${emp.Name} (${emp['Passport No']})`);
    });
    console.log("");

    // Import new employees
    let imported = 0;
    let failed = 0;
    
    for (const record of newEmployees) {
      try {
        const employeeId = `villa-construction_${record.ID}`;
        
        // Create employee document
        const employeeData = {
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
        };
        
        await addDoc(collection(db, 'employees'), employeeData);
        
        // Create passport document
        if (record['Passport No']) {
          await addDoc(collection(db, 'passports'), {
            employeeId: employeeId,
            passportNumber: record['Passport No'].toUpperCase().trim(),
            country: record.Nationality || '',
            companyId: VILLA_CONSTRUCTION_ID,
            createdAt: new Date().toISOString()
          });
        }
        
        // Create work permit document
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
        
        // Create visa document
        if (record.VIsaExpiry && record.VIsaExpiry !== '1899-12-30') {
          await addDoc(collection(db, 'visas'), {
            employeeId: employeeId,
            visaNumber: record.WP || '',
            visaType: 'Work',
            expiryDate: record.VIsaExpiry,
            companyId: VILLA_CONSTRUCTION_ID,
            createdAt: new Date().toISOString()
          });
        }
        
        imported++;
        if (imported % 10 === 0) {
          console.log(`  Imported ${imported}/${newEmployees.length}...`);
        }
      } catch (err) {
        console.error(`  ❌ Failed to import ${record.Name}: ${err.message}`);
        failed++;
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`  Successfully imported: ${imported}`);
    console.log(`  Failed: ${failed}`);
    console.log(`\nRefresh the Villa Construction page to see the new employees.`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

importVillaConstruction();
