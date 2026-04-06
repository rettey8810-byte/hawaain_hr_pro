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

const VILLA_CONSTRUCTION_ID = "IkYokZm5QyPTF1ZUNP7O";

async function checkImportProgress() {
  try {
    console.log("=== CHECKING VILLA CONSTRUCTION IMPORT PROGRESS ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

    // Check employees
    const empQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', VILLA_CONSTRUCTION_ID)
    );
    const empSnap = await getDocs(empQuery);
    console.log(`✅ Villa Construction Employees: ${empSnap.size}`);

    if (empSnap.size > 0) {
      console.log("\nSample employees:");
      empSnap.docs.slice(0, 5).forEach(d => {
        console.log(`  - ${d.data().name}`);
      });
    }

    // Check passports
    const passQuery = query(
      collection(db, 'passports'),
      where('companyId', '==', VILLA_CONSTRUCTION_ID)
    );
    const passSnap = await getDocs(passQuery);
    console.log(`\n✅ Villa Construction Passports: ${passSnap.size}`);

    // Check work permits
    const wpQuery = query(
      collection(db, 'workPermits'),
      where('companyId', '==', VILLA_CONSTRUCTION_ID)
    );
    const wpSnap = await getDocs(wpQuery);
    console.log(`✅ Villa Construction Work Permits: ${wpSnap.size}`);

    console.log("\n📝 Expected: 235 employees from Construction Work Force");
    console.log(`📊 Current: ${empSnap.size} employees imported`);

    if (empSnap.size >= 235) {
      console.log("\n✅ ALL EMPLOYEES IMPORTED!");
    } else if (empSnap.size > 0) {
      console.log("\n⏳ Import in progress or partial...");
    } else {
      console.log("\n❌ No employees imported yet");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkImportProgress();
