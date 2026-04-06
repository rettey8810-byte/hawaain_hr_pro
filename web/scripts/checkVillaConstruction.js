import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
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

async function checkVillaConstructionData() {
  try {
    console.log("=== CHECKING VILLA CONSTRUCTION DATA ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get all companies
    const companiesSnap = await getDocs(collection(db, 'companies'));
    console.log("Companies found:");
    companiesSnap.docs.forEach(d => {
      console.log(`  - ${d.data().name} (${d.id})`);
    });
    console.log("");

    // Find Villa Construction
    const villaCompany = companiesSnap.docs.find(d => 
      d.data().name?.toLowerCase().includes('villa') && 
      d.data().name?.toLowerCase().includes('construction')
    );

    if (!villaCompany) {
      console.log("❌ Villa Construction company NOT FOUND");
      return;
    }

    const villaId = villaCompany.id;
    console.log(`✅ Villa Construction ID: ${villaId}\n`);

    // Check employees for Villa Construction
    const empQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', villaId)
    );
    const empSnap = await getDocs(empQuery);
    console.log(`Employees with Villa Construction companyId: ${empSnap.size}`);
    
    if (empSnap.size > 0) {
      console.log("Sample employees:");
      empSnap.docs.slice(0, 5).forEach(d => {
        const data = d.data();
        console.log(`  - ${data.name} (${d.id})`);
      });
    } else {
      console.log("❌ NO EMPLOYEES FOUND for Villa Construction");
      console.log("This is why the Employees page shows 0\n");
    }

    // Check passports for Villa Construction
    const passQuery = query(
      collection(db, 'passports'),
      where('companyId', '==', villaId)
    );
    const passSnap = await getDocs(passQuery);
    console.log(`\nPassports with Villa Construction companyId: ${passSnap.size}`);
    
    if (passSnap.size > 0) {
      console.log("Sample passports:");
      passSnap.docs.slice(0, 5).forEach(d => {
        const data = d.data();
        console.log(`  - ${data.passportNumber} -> employeeId: ${data.employeeId}`);
      });
    } else {
      console.log("❌ NO PASSPORTS FOUND for Villa Construction\n");
    }

    // Check if data exists under different company
    console.log("\n=== CHECKING IF DATA IS UNDER DIFFERENT COMPANY ===");
    const allEmps = await getDocs(collection(db, 'employees'));
    const villaEmps = allEmps.docs.filter(d => {
      const data = d.data();
      return data.name?.toLowerCase().includes('villa') || 
             data.department?.toLowerCase().includes('construction');
    });
    console.log(`Employees with 'villa' or 'construction' in name/dept: ${villaEmps.length}`);
    
    // Show company distribution
    const companyCounts = {};
    allEmps.docs.forEach(d => {
      const cid = d.data().companyId || 'no-company';
      companyCounts[cid] = (companyCounts[cid] || 0) + 1;
    });
    
    console.log("\nEmployee distribution by companyId:");
    for (const [cid, count] of Object.entries(companyCounts)) {
      const companyName = companiesSnap.docs.find(c => c.id === cid)?.data().name || cid;
      console.log(`  ${companyName}: ${count}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkVillaConstructionData();
