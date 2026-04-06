import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
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

// Parse date from CSV format (e.g., "27-Apr-26")
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'NaN') return null;
  try {
    const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11 };
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = 2000 + parseInt(parts[2]);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
  } catch (e) {}
  return null;
}

async function findEmployeeByPassport(companyId, passportNo) {
  if (!passportNo || passportNo === 'NaN') return null;
  const passportKey = passportNo.toString().trim().toUpperCase();
  
  // Search in passports collection
  const q = query(
    collection(db, 'passports'),
    where('companyId', '==', companyId),
    where('passportNumber', '==', passportKey)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const passportData = snap.docs[0].data();
    const employeeId = passportData.employeeId;
    // Get employee data
    const empSnap = await getDoc(doc(db, 'employees', employeeId));
    if (empSnap.exists()) {
      return { id: employeeId, data: empSnap.data() };
    }
  }
  return null;
}

async function checkWorkPermitExists(employeeId, permitNumber) {
  const q = query(
    collection(db, 'workPermits'),
    where('employeeId', '==', employeeId),
    where('permitNumber', '==', permitNumber)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

async function checkVisaExists(employeeId, visaNumber) {
  const q = query(
    collection(db, 'visas'),
    where('employeeId', '==', employeeId),
    where('visaNumber', '==', visaNumber)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

async function importVisaDetails() {
  try {
    console.log("=== IMPORTING VISA DETAILS ONLY ===\n");

    console.log("Authenticating...");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    const companiesQuery = query(collection(db, 'companies'));
    const companiesSnap = await getDocs(companiesQuery);
    if (companiesSnap.empty) {
      console.log("❌ No company found!");
      process.exit(1);
    }
    const companyId = companiesSnap.docs[0].id;
    console.log(`Using company: ${companyId}\n`);

    const jsonPath = path.join(__dirname, '..', '..', 'master_list_data.json');
    if (!fs.existsSync(jsonPath)) {
      console.log("❌ master_list_data.json not found!");
      process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Total records in JSON: ${jsonData.length}`);

    // Filter records with visa details
    const recordsWithVisa = jsonData.filter(r => r.WorkpermitNumber);
    console.log(`Records with visa details: ${recordsWithVisa.length}\n`);

    let processed = 0;
    let skipped = 0;
    let added = 0;
    let errors = 0;

    for (const record of recordsWithVisa) {
      try {
        const passportNo = record.PassportNo;
        if (!passportNo || passportNo === 'NaN') {
          skipped++;
          continue;
        }

        const employee = await findEmployeeByPassport(companyId, passportNo);
        if (!employee) {
          console.log(`⚠️ Employee not found for passport: ${passportNo} (${record.FullName})`);
          skipped++;
          continue;
        }

        const employeeId = employee.id;
        const employeeData = employee.data;

        // Update employee with visa info if not present
        const updates = {};
        if (!employeeData.passportNo && record.PassportNo) {
          updates.passportNo = record.PassportNo.toString().trim().toUpperCase();
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'employees', employeeId), updates);
        }

        // Check and add work permit if not exists
        const wpExists = await checkWorkPermitExists(employeeId, record.WorkpermitNumber);
        if (!wpExists && record.WorkpermitNumber) {
          await addDoc(collection(db, 'workPermits'), {
            companyId: companyId,
            employeeId: employeeId,
            permitNumber: record.WorkpermitNumber,
            employer: record.Division || '',
            jobPosition: record.Designation || '',
            wpState: record.WorkpermitState || '',
            contractExpiry: parseDate(record.WorkpermitContractExpiry),
            expiryDate: parseDate(record.WorkpermitExpiryDate),
            createdAt: new Date().toISOString()
          });
          added++;
        }

        // Check and add visa if not exists
        const visaExists = await checkVisaExists(employeeId, record.WorkVisaNumber);
        if (!visaExists && record.WorkVisaNumber) {
          await addDoc(collection(db, 'visas'), {
            companyId: companyId,
            employeeId: employeeId,
            visaNumber: record.WorkVisaNumber,
            visaType: 'Work',
            expiryDate: parseDate(record.WorkVisaExpiryDate),
            createdAt: new Date().toISOString()
          });
          added++;
        }

        processed++;

        if (processed % 50 === 0) {
          console.log(`   Processed ${processed}/${recordsWithVisa.length}...`);
        }

      } catch (err) {
        console.error(`Error processing ${record.FullName}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   New documents added: ${added}`);
    console.log(`   Skipped (no match/dup): ${skipped}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

importVisaDetails();
