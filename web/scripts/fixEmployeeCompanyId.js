import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

async function fixCompanyId() {
  try {
    console.log("=== FIXING EMPLOYEE COMPANY ID ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get company ID
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const companyId = companiesSnap.docs[0]?.id;
    console.log(`Company ID: ${companyId}\n`);

    // Get all employees
    const employeesSnap = await getDocs(collection(db, 'employees'));
    console.log(`Total employees: ${employeesSnap.size}\n`);

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const empDoc of employeesSnap.docs) {
      const data = empDoc.data();
      
      if (data.companyId === companyId) {
        alreadyCorrect++;
        continue;
      }

      // Update with companyId
      await updateDoc(doc(db, 'employees', empDoc.id), {
        companyId: companyId
      });
      fixed++;

      if (fixed % 100 === 0) {
        console.log(`Fixed ${fixed}...`);
      }
    }

    console.log(`\n✅ COMPLETE!`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Already correct: ${alreadyCorrect}`);
    console.log(`   Total: ${fixed + alreadyCorrect}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixCompanyId();
