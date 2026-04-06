import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
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

async function debugWorkPermits() {
  try {
    console.log("=== DEBUGGING WORK PERMITS ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get company ID from company context (what the UI uses)
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const sunislandCompany = companiesSnap.docs.find(d => d.id === 'sunisland-resort-and-spa');
    console.log("Sunisland Company ID:", sunislandCompany?.id);
    console.log("Sunisland Company Name:", sunislandCompany?.data().name, "\n");

    // Get work permits for sunisland
    const wpQuery = query(
      collection(db, 'workPermits'),
      where('companyId', '==', 'sunisland-resort-and-spa')
    );
    const wpSnap = await getDocs(wpQuery);
    console.log(`Work permits with sunisland companyId: ${wpSnap.size}\n`);

    // Get employees for sunisland
    const empQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', 'sunisland-resort-and-spa')
    );
    const empSnap = await getDocs(empQuery);
    console.log(`Employees with sunisland companyId: ${empSnap.size}\n`);

    // Build employee map
    const employeeMap = {};
    empSnap.docs.forEach(d => {
      employeeMap[d.id] = d.data().name;
    });

    // Check first 10 work permits
    console.log("First 10 work permits:");
    let found = 0;
    let notFound = 0;
    
    wpSnap.docs.slice(0, 10).forEach(d => {
      const wp = d.data();
      const empName = employeeMap[wp.employeeId];
      if (empName) {
        console.log(`✅ ${wp.permitNumber} -> ${empName}`);
        found++;
      } else {
        console.log(`❌ ${wp.permitNumber} -> employeeId: ${wp.employeeId} (NOT FOUND)`);
        notFound++;
      }
    });
    
    console.log(`\nSummary: ${found} found, ${notFound} not found`);

    // If not found, check if employee exists under different ID
    if (notFound > 0) {
      console.log("\n--- Checking if employees exist with different IDs ---");
      const sampleWp = wpSnap.docs[0]?.data();
      if (sampleWp) {
        console.log(`Looking for employee: ${sampleWp.employeeId}`);
        const empDoc = await getDoc(doc(db, 'employees', sampleWp.employeeId));
        console.log(`Employee exists: ${empDoc.exists()}`);
        if (empDoc.exists()) {
          console.log(`Employee data:`, empDoc.data());
        }
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

debugWorkPermits();
