import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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

async function listEmployees() {
  try {
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

    const q = query(collection(db, 'employees'), orderBy('employeeId'), limit(20));
    const snap = await getDocs(q);
    
    console.log(`First 20 employees:\n`);
    snap.docs.forEach(d => {
      const data = d.data();
      console.log(`DocID: ${d.id}`);
      console.log(`  employeeId: "${data.employeeId}"`);
      console.log(`  name: "${data.name}"`);
      console.log('---');
    });

  } catch (error) {
    console.error("Error:", error.message);
  }
}

listEmployees();
