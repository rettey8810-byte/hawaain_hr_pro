import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, limit } from 'firebase/firestore';
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

async function checkEmployees() {
  try {
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

    const q = query(collection(db, 'employees'), limit(5));
    const snap = await getDocs(q);
    
    console.log(`Found ${snap.size} employees (showing first 5):\n`);
    snap.docs.forEach(d => {
      const data = d.data();
      console.log('Employee:', d.id);
      console.log('  Name:', data.name);
      console.log('  EmployeeId:', data.employeeId);
      console.log('  Division:', data.division);
      console.log('  Department:', data.department);
      console.log('---');
    });

    // Count total
    const allSnap = await getDocs(collection(db, 'employees'));
    console.log(`\nTotal employees in Firestore: ${allSnap.size}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkEmployees();
