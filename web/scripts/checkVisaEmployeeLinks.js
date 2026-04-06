import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
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

async function checkVisaEmployeeLinks() {
  try {
    console.log("=== CHECKING VISA-EMPLOYEE LINKS ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get first 10 visas
    const visaSnap = await getDocs(collection(db, 'visas'));
    const visas = visaSnap.docs.slice(0, 10);
    
    console.log(`Checking ${visas.length} visas:\n`);
    
    for (const visaDoc of visas) {
      const visa = visaDoc.data();
      const employeeId = visa.employeeId;
      
      // Try to get the employee
      const empSnap = await getDoc(doc(db, 'employees', employeeId));
      
      if (empSnap.exists()) {
        const empData = empSnap.data();
        console.log(`✅ Visa ${visa.visaNumber} -> Employee: ${empData.name || 'NO NAME'} (${employeeId})`);
      } else {
        console.log(`❌ Visa ${visa.visaNumber} -> Employee NOT FOUND: ${employeeId}`);
      }
    }

    // Summary stats
    let found = 0;
    let notFound = 0;
    
    for (const visaDoc of visaSnap.docs) {
      const visa = visaDoc.data();
      const empSnap = await getDoc(doc(db, 'employees', visa.employeeId));
      if (empSnap.exists()) {
        found++;
      } else {
        notFound++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total visas: ${visaSnap.size}`);
    console.log(`Linked to existing employees: ${found}`);
    console.log(`Broken links (employee not found): ${notFound}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkVisaEmployeeLinks();
