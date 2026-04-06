import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
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

async function checkData() {
  try {
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Get sample passports
    const passportsSnap = await getDocs(query(collection(db, 'passports'), limit(5)));
    console.log("=== PASSPORTS ===");
    passportsSnap.docs.forEach(d => {
      const data = d.data();
      console.log(`Passport: ${data.passportNumber}`);
      console.log(`  employeeId: ${data.employeeId}`);
    });

    // Get sample employees
    const employeesSnap = await getDocs(query(collection(db, 'employees'), limit(5)));
    console.log("\n=== EMPLOYEES ===");
    employeesSnap.docs.forEach(d => {
      const data = d.data();
      console.log(`Doc ID: ${d.id}`);
      console.log(`  name: "${data.name}"`);
      console.log(`  employeeId: "${data.employeeId}"`);
    });

    // Check if passport employeeId matches employee doc ID
    console.log("\n=== CHECKING MATCH ===");
    const passport = passportsSnap.docs[0]?.data();
    if (passport) {
      const matchingEmp = employeesSnap.docs.find(e => e.id === passport.employeeId);
      if (matchingEmp) {
        console.log(`✅ Found match: ${matchingEmp.data().name}`);
      } else {
        console.log(`❌ No employee found with ID: ${passport.employeeId}`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkData();
