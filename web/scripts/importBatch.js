import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwfgswf9xgHm1Fa81g4VsGxE2oVKhRZyg",
  authDomain: "hawaain-hr-pro.firebaseapp.com",
  projectId: "hawaain-hr-pro",
  storageBucket: "hawaain-hr-pro.firebasestorage.app",
  messagingSenderId: "677637131407",
  appId: "1:677637131407:web:078b36b5ad6c1259dff4fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Superadmin credentials
const SUPERADMIN_EMAIL = "retey.ay@hotmail.com";
const SUPERADMIN_PASSWORD = "Adhu1447";

// Config - adjust these as needed
const BATCH_SIZE = 100; // Import only this many per run

// Helper function to safely parse dates
function safeDate(dateValue) {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

// Check if employee already exists
async function employeeExists(companyId, empId) {
  const q = query(
    collection(db, 'employees'),
    where('companyId', '==', companyId),
    where('employeeId', '==', empId?.toString() || '')
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

async function batchImport() {
  try {
    console.log("=== BATCH IMPORT MODE ===");
    console.log(`Max per run: ${BATCH_SIZE} employees\n`);

    // Login as superadmin
    console.log("Authenticating...");
    const userCredential = await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get company
    const companiesQuery = query(collection(db, 'companies'));
    const companiesSnap = await getDocs(companiesQuery);
    let companyId;
    if (companiesSnap.empty) {
      console.log("No company found! Run full import first.");
      process.exit(1);
    }
    companyId = companiesSnap.docs[0].id;
    console.log(`Using company: ${companyId}\n`);

    // Count existing employees
    const existingQuery = query(collection(db, 'employees'), where('companyId', '==', companyId));
    const existingSnap = await getDocs(existingQuery);
    const existingCount = existingSnap.size;
    console.log(`Already imported: ${existingCount} employees`);

    // Read JSON
    const jsonPath = path.join(__dirname, '..', '..', 'Xpat_Audit.json');
    if (!fs.existsSync(jsonPath)) {
      console.log("❌ Xpat_Audit.json not found!");
      process.exit(1);
    }

    // Read JSON with encoding detection
    let buffer = fs.readFileSync(jsonPath);
    let jsonData;
    
    // Check for UTF-16 BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      jsonData = buffer.toString('utf16le');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      jsonData = buffer.toString('utf16be');
    } else {
      jsonData = buffer.toString('utf8');
    }
    
    // Remove BOM if still present
    if (jsonData.charCodeAt(0) === 0xFEFF) {
      jsonData = jsonData.substring(1);
    }
    
    // Clean invalid characters
    jsonData = jsonData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    jsonData = jsonData.replace(/: NaN/g, ': null');
    jsonData = jsonData.replace(/:NaN/g, ':null');
    const allEmployees = JSON.parse(jsonData);
    console.log(`Total in file: ${allEmployees.length} employees`);
    console.log(`Remaining: ${allEmployees.length - existingCount}\n`);

    if (existingCount >= allEmployees.length) {
      console.log("✅ All employees already imported!");
      process.exit(0);
    }

    // Find employees not yet imported
    let importedThisRun = 0;
    let skipped = 0;
    let errors = 0;
    let toProcess = [];

    for (const emp of allEmployees) {
      const exists = await employeeExists(companyId, emp.EmpID);
      if (exists) {
        skipped++;
      } else if (importedThisRun < BATCH_SIZE) {
        toProcess.push(emp);
        importedThisRun++;
      }
    }

    console.log(`Processing ${toProcess.length} new employees...\n`);

    // Import batch
    for (const emp of toProcess) {
      try {
        // Create employee
        const employeeData = {
          companyId: companyId,
          employeeId: emp.EmpID?.toString() || '',
          name: emp.EmployeeName || '',
          division: emp.Division || '',
          department: emp.Department || '',
          section: emp.Section || '',
          status: emp.EmpStatus?.toLowerCase() === 'active' ? 'active' : 'inactive',
          country: emp.Country || '',
          qEmp: emp['Q-Emp'] || '',
          qPool: emp.Qpool || '',
          slotNo: emp.SlotNo || '',
          arrivalDate: safeDate(emp.ArrivalDate),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const empRef = await addDoc(collection(db, 'employees'), employeeData);
        const employeeDocId = empRef.id;

        // Create related documents
        const batchWrites = [];

        if (emp.PPNo && emp.PPExpiry && safeDate(emp.PPExpiry)) {
          batchWrites.push(addDoc(collection(db, 'passports'), {
            companyId: companyId,
            employeeId: employeeDocId,
            passportNumber: emp.PPNo,
            country: emp.Country || '',
            expiryDate: safeDate(emp.PPExpiry),
            createdAt: new Date().toISOString()
          }));
        }

        if (emp.WPNo && emp.WPExpiry && safeDate(emp.WPExpiry)) {
          batchWrites.push(addDoc(collection(db, 'workPermits'), {
            companyId: companyId,
            employeeId: employeeDocId,
            permitNumber: emp.WPNo,
            jobPosition: emp.Department || '',
            employer: emp.Division || '',
            wpState: emp.WPState || '',
            expiryDate: safeDate(emp.WPExpiry),
            createdAt: new Date().toISOString()
          }));
        }

        if (emp.VIsaExpiry && safeDate(emp.VIsaExpiry)) {
          batchWrites.push(addDoc(collection(db, 'visas'), {
            companyId: companyId,
            employeeId: employeeDocId,
            visaNumber: emp.WPNo || '',
            visaType: 'Work',
            expiryDate: safeDate(emp.VIsaExpiry),
            createdAt: new Date().toISOString()
          }));
        }

        if (emp.MedicalExpiry && safeDate(emp.MedicalExpiry)) {
          batchWrites.push(addDoc(collection(db, 'medicals'), {
            companyId: companyId,
            employeeId: employeeDocId,
            testDate: safeDate(emp.MedicalExpiry),
            expiryDate: safeDate(emp.MedicalExpiry),
            result: 'approved',
            createdAt: new Date().toISOString()
          }));
        }

        await Promise.all(batchWrites);

      } catch (empError) {
        console.error(`Error importing ${emp.EmployeeName}:`, empError.message);
        errors++;
      }
    }

    const newTotal = existingCount + importedThisRun - errors;
    console.log(`\n✅ Batch complete!`);
    console.log(`   Imported this run: ${importedThisRun - errors}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    console.log(`   Total in database: ${newTotal}/${allEmployees.length}`);
    console.log(`\n📝 Run this script daily to import ${BATCH_SIZE} more.`);
    console.log(`   Remaining: ${allEmployees.length - newTotal} employees`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

batchImport();
