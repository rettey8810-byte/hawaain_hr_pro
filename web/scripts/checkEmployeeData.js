import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, where } from 'firebase/firestore';
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

async function checkEmployeeData() {
  try {
    console.log("=== CHECKING EMPLOYEE DATA ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get company ID
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const companyId = companiesSnap.docs[0]?.id;
    console.log(`Company ID: ${companyId}\n`);

    // Query employees by companyId (same as UI)
    const q = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      limit(10)
    );
    const snap = await getDocs(q);
    
    console.log(`Found ${snap.size} employees\n`);
    console.log("Sample employee data:");
    snap.docs.forEach(d => {
      const data = d.data();
      console.log(`\nDoc ID: ${d.id}`);
      console.log(`  companyId: ${data.companyId}`);
      console.log(`  name: "${data.name}"`);
      console.log(`  employeeId: "${data.employeeId}"`);
    });

    // Check if companyId matches
    console.log(`\nCompany ID match check:`);
    const mismatch = snap.docs.filter(d => d.data().companyId !== companyId);
    console.log(`Mismatched: ${mismatch.length}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkEmployeeData();
