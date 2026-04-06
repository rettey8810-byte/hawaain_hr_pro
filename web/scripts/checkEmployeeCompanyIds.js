import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';
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

async function checkEmployeeCompanyIds() {
  try {
    console.log("=== CHECKING EMPLOYEE COMPANY IDs ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get company ID
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const companyId = companiesSnap.docs[0]?.id;
    console.log(`Expected Company ID: ${companyId}\n`);

    // Count employees with and without companyId
    const allEmps = await getDocs(collection(db, 'employees'));
    let withCompanyId = 0;
    let withoutCompanyId = 0;
    let wrongCompanyId = 0;

    allEmps.docs.forEach(d => {
      const data = d.data();
      if (!data.companyId) {
        withoutCompanyId++;
      } else if (data.companyId === companyId) {
        withCompanyId++;
      } else {
        wrongCompanyId++;
      }
    });

    console.log(`Total employees: ${allEmps.size}`);
    console.log(`  With correct companyId: ${withCompanyId}`);
    console.log(`  Without companyId: ${withoutCompanyId}`);
    console.log(`  With wrong companyId: ${wrongCompanyId}\n`);

    // Query employees by companyId (like the UI does)
    const q = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      limit(5)
    );
    const querySnap = await getDocs(q);
    console.log(`Query result (employees with matching companyId): ${querySnap.size}\n`);

    if (querySnap.size > 0) {
      console.log("Sample employees found:");
      querySnap.docs.forEach(d => {
        console.log(`  - ${d.data().name} (${d.id})`);
      });
    } else {
      console.log("❌ NO EMPLOYEES FOUND with matching companyId!");
      console.log("This is why 'Unknown' shows in Visas/Passports/WorkPermits.\n");
    }

    // Check a sample visa and its employeeId link
    const visaQ = query(collection(db, 'visas'), limit(3));
    const visaSnap = await getDocs(visaQ);
    console.log("\nSample visas and their employeeId links:");
    visaSnap.docs.forEach(d => {
      const v = d.data();
      console.log(`  Visa: ${v.visaNumber}, employeeId: ${v.employeeId}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkEmployeeCompanyIds();
