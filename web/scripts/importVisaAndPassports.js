import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
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
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return null;
}

async function findEmployeeByEmpId(companyId, empId) {
  if (!empId) return null;
  const q = query(
    collection(db, 'employees'),
    where('companyId', '==', companyId),
    where('employeeId', '==', empId.toString())
  );
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, data: snap.docs[0].data() };
  return null;
}

async function checkWorkPermitExists(employeeId, permitNumber) {
  const q = query(
    collection(db, 'workPermits'),
    where('employeeId', '==', employeeId),
    where('permitNumber', '==', permitNumber)
  );
  return !(await getDocs(q)).empty;
}

async function checkVisaExists(employeeId, visaNumber) {
  const q = query(
    collection(db, 'visas'),
    where('employeeId', '==', employeeId),
    where('visaNumber', '==', visaNumber)
  );
  return !(await getDocs(q)).empty;
}

async function checkPassportExists(companyId, passportNo) {
  const q = query(
    collection(db, 'passports'),
    where('companyId', '==', companyId),
    where('passportNumber', '==', passportNo.toString().trim().toUpperCase())
  );
  return !(await getDocs(q)).empty;
}

async function importAll() {
  try {
    console.log("=== IMPORTING PASSPORTS & VISA DETAILS ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    const companiesSnap = await getDocs(collection(db, 'companies'));
    if (companiesSnap.empty) {
      console.log("❌ No company found!");
      process.exit(1);
    }
    const companyId = companiesSnap.docs[0].id;
    console.log(`Company: ${companyId}\n`);

    const data = JSON.parse(fs.readFileSync('master_list_data.json', 'utf8'));
    console.log(`Total JSON records: ${data.length}`);

    // Filter records with visa details
    const withVisa = data.filter(r => r.WorkpermitNumber && r.PassportNo);
    console.log(`Records with passport + visa: ${withVisa.length}\n`);

    let processed = 0, addedPassports = 0, addedWP = 0, addedVisas = 0, skipped = 0, errors = 0;

    for (const record of withVisa) {
      try {
        // Find employee by EmpID
        const emp = await findEmployeeByEmpId(companyId, record.EmpID);
        if (!emp) {
          console.log(`⚠️ Employee not found: EmpID=${record.EmpID}, Name=${record.FullName}`);
          skipped++;
          continue;
        }

        const employeeId = emp.id;
        const passportNo = record.PassportNo.toString().trim().toUpperCase();

        // Add passport if not exists
        const passportExists = await checkPassportExists(companyId, passportNo);
        if (!passportExists) {
          await addDoc(collection(db, 'passports'), {
            companyId: companyId,
            employeeId: employeeId,
            passportNumber: passportNo,
            country: record.Nationality || '',
            expiryDate: record.PassportExpiry && record.PassportExpiry !== 'NaT' ? record.PassportExpiry.split(' ')[0] : null,
            createdAt: new Date().toISOString()
          });
          addedPassports++;
        }

        // Add work permit if not exists
        const wpExists = await checkWorkPermitExists(employeeId, record.WorkpermitNumber);
        if (!wpExists) {
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
          addedWP++;
        }

        // Add visa if not exists
        const visaExists = await checkVisaExists(employeeId, record.WorkVisaNumber);
        if (!visaExists) {
          await addDoc(collection(db, 'visas'), {
            companyId: companyId,
            employeeId: employeeId,
            visaNumber: record.WorkVisaNumber,
            visaType: 'Work',
            expiryDate: parseDate(record.WorkVisaExpiryDate),
            createdAt: new Date().toISOString()
          });
          addedVisas++;
        }

        processed++;
        if (processed % 50 === 0) {
          console.log(`   Progress: ${processed}/${withVisa.length}...`);
        }

      } catch (err) {
        console.error(`Error on ${record.FullName}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ IMPORT COMPLETE!`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Passports added: ${addedPassports}`);
    console.log(`   Work Permits added: ${addedWP}`);
    console.log(`   Visas added: ${addedVisas}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

importAll();
