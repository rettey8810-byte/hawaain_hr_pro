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

async function checkQuerySize() {
  try {
    console.log("=== CHECKING EMPLOYEE QUERY SIZE ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get company ID
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const companyId = companiesSnap.docs[0]?.id;
    console.log(`Company ID: ${companyId}\n`);

    // Query ALL employees by companyId (exactly like the UI does)
    const q = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId)
    );
    const snap = await getDocs(q);
    
    console.log(`Query returned: ${snap.size} employees\n`);
    
    if (snap.size > 0) {
      console.log("First 10 employees found:");
      snap.docs.slice(0, 10).forEach(d => {
        const data = d.data();
        console.log(`  - ${data.name || 'NO NAME'} (${d.id})`);
      });
    }

    // Now check visas and see if their employeeIds match
    console.log(`\n=== CHECKING VISA MATCHES ===\n`);
    const visaSnap = await getDocs(collection(db, 'visas'));
    console.log(`Total visas: ${visaSnap.size}`);
    
    // Build employee lookup
    const employeeMap = {};
    snap.docs.forEach(d => {
      employeeMap[d.id] = d.data().name;
    });
    
    let matched = 0;
    let unmatched = 0;
    
    visaSnap.docs.forEach(v => {
      const visa = v.data();
      if (employeeMap[visa.employeeId]) {
        matched++;
      } else {
        unmatched++;
        if (unmatched <= 5) {
          console.log(`❌ Unmatched: Visa ${visa.visaNumber} -> employeeId ${visa.employeeId}`);
        }
      }
    });
    
    console.log(`\nSummary:`);
    console.log(`  Visas with matching employee: ${matched}`);
    console.log(`  Visas with unknown employee: ${unmatched}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkQuerySize();
