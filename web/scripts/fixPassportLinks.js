import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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

async function fixPassportLinks() {
  try {
    console.log("=== FIXING PASSPORT-EMPLOYEE LINKS ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get all employees
    const employeesSnap = await getDocs(collection(db, 'employees'));
    const employees = {};
    employeesSnap.docs.forEach(d => {
      const empId = d.data().employeeId;
      if (empId) {
        employees[empId] = { docId: d.id, name: d.data().name };
      }
    });
    console.log(`Loaded ${Object.keys(employees).length} employees`);

    // Get all passports
    const passportsSnap = await getDocs(collection(db, 'passports'));
    console.log(`Found ${passportsSnap.size} passports\n`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let notFound = 0;

    for (const passportDoc of passportsSnap.docs) {
      const passport = passportDoc.data();
      const currentEmpId = passport.employeeId;
      
      // Check if current employeeId points to a valid employee
      const matchingEmp = employeesSnap.docs.find(e => e.id === currentEmpId);
      
      if (matchingEmp && matchingEmp.data().name) {
        alreadyCorrect++;
        continue;
      }

      // Try to find by passport number via employee name lookup
      // First, get employee name from the full ID if it contains underscore
      if (currentEmpId && currentEmpId.includes('_')) {
        const numericId = currentEmpId.split('_')[1];
        const correctEmp = employees[numericId];
        
        if (correctEmp) {
          await updateDoc(doc(db, 'passports', passportDoc.id), {
            employeeId: correctEmp.docId
          });
          console.log(`Fixed: ${passport.passportNumber} -> ${correctEmp.name}`);
          fixed++;
        } else {
          console.log(`Not found: ${passport.passportNumber} (EmpID: ${numericId})`);
          notFound++;
        }
      } else {
        notFound++;
      }
    }

    console.log(`\n✅ COMPLETE!`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Already correct: ${alreadyCorrect}`);
    console.log(`   Not found: ${notFound}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixPassportLinks();
