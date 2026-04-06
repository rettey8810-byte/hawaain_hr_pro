import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, query, where } from 'firebase/firestore';
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

async function checkExists(collectionName, employeeId, field, value) {
  const q = query(
    collection(db, collectionName),
    where('employeeId', '==', employeeId),
    where(field, '==', value)
  );
  return !(await getDocs(q)).empty;
}

async function updateAndImport() {
  try {
    console.log("=== UPDATING EMPLOYEES & IMPORTING VISA DATA ===\n");
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
    console.log(`JSON records: ${data.length}`);

    // Get all existing employees
    const empSnap = await getDocs(collection(db, 'employees'));
    const employees = {};
    empSnap.docs.forEach(d => {
      const docId = d.id;
      // Extract numeric ID from doc ID like "sunisland-resort-and-spa_1420"
      const match = docId.match(/_(\d+)$/);
      if (match) {
        employees[match[1]] = { docId, data: d.data() };
      }
    });
    console.log(`Existing employees in Firestore: ${Object.keys(employees).length}`);

    // Filter JSON records with visa
    const withVisa = data.filter(r => r.WorkpermitNumber && r.PassportNo && r.EmpID);
    console.log(`Records with visa: ${withVisa.length}\n`);

    let updated = 0, addedPassports = 0, addedWP = 0, addedVisas = 0, skipped = 0, errors = 0;

    for (const record of withVisa) {
      try {
        const empIdStr = record.EmpID.toString();
        const emp = employees[empIdStr];
        
        if (!emp) {
          skipped++;
          continue;
        }

        const docId = emp.docId;
        const passportNo = record.PassportNo.toString().trim().toUpperCase();

        // Update employee with correct data
        await updateDoc(doc(db, 'employees', docId), {
          employeeId: empIdStr,
          name: record.FullName || '',
          division: record.Division || '',
          department: record.Department || record['Department '] || '',
          section: record.Section || '',
          designation: record.Designation || '',
          nationality: record.Nationality || '',
          updatedAt: new Date().toISOString()
        });
        updated++;

        // Add passport if not exists
        const passportExists = await checkExists('passports', docId, 'passportNumber', passportNo);
        if (!passportExists) {
          await addDoc(collection(db, 'passports'), {
            companyId: companyId,
            employeeId: docId,
            passportNumber: passportNo,
            country: record.Nationality || '',
            expiryDate: record.PassportExpiry && record.PassportExpiry !== 'NaT' ? record.PassportExpiry.split(' ')[0] : null,
            createdAt: new Date().toISOString()
          });
          addedPassports++;
        }

        // Add work permit if not exists
        const wpExists = await checkExists('workPermits', docId, 'permitNumber', record.WorkpermitNumber);
        if (!wpExists) {
          await addDoc(collection(db, 'workPermits'), {
            companyId: companyId,
            employeeId: docId,
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
        const visaExists = await checkExists('visas', docId, 'visaNumber', record.WorkVisaNumber);
        if (!visaExists) {
          await addDoc(collection(db, 'visas'), {
            companyId: companyId,
            employeeId: docId,
            visaNumber: record.WorkVisaNumber,
            visaType: 'Work',
            expiryDate: parseDate(record.WorkVisaExpiryDate),
            createdAt: new Date().toISOString()
          });
          addedVisas++;
        }

        if ((updated + skipped) % 50 === 0) {
          console.log(`   Progress: ${updated} updated, ${skipped} skipped...`);
        }

      } catch (err) {
        console.error(`Error on ${record.FullName}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ COMPLETE!`);
    console.log(`   Employees updated: ${updated}`);
    console.log(`   Passports added: ${addedPassports}`);
    console.log(`   Work Permits added: ${addedWP}`);
    console.log(`   Visas added: ${addedVisas}`);
    console.log(`   Skipped (no match): ${skipped}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

updateAndImport();
