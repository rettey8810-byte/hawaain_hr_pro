import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, limit } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

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

async function exportPassports() {
  try {
    console.log("Authenticating...");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    const q = query(collection(db, 'passports'), limit(20));
    const snap = await getDocs(q);
    
    console.log(`Found ${snap.size} passports (showing first 20):\n`);
    console.log('PassportNumber | EmployeeId');
    console.log('-'.repeat(50));
    
    snap.docs.forEach(d => {
      const data = d.data();
      console.log(`${data.passportNumber || 'N/A'} | ${data.employeeId || 'N/A'}`);
    });

    // Save all to file
    const allQ = query(collection(db, 'passports'));
    const allSnap = await getDocs(allQ);
    const passports = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    fs.writeFileSync('firestore_passports.json', JSON.stringify(passports, null, 2));
    console.log(`\n✅ Exported ${passports.length} passports to firestore_passports.json`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

exportPassports();
