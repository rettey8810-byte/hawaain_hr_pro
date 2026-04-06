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

async function checkCompanies() {
  try {
    console.log("=== CHECKING ALL COMPANIES ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get all companies
    const companiesSnap = await getDocs(collection(db, 'companies'));
    console.log(`Found ${companiesSnap.size} companies:\n`);

    for (const companyDoc of companiesSnap.docs) {
      const companyId = companyDoc.id;
      const companyData = companyDoc.data();
      
      // Count employees for this company
      const empQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId)
      );
      const empSnap = await getDocs(empQuery);
      
      console.log(`Company: ${companyData.name || 'Unnamed'} (${companyId})`);
      console.log(`  Employees: ${empSnap.size}`);
      console.log('---');
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkCompanies();
