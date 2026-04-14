/**
 * Script to create missing Villa Park company in Firestore
 * Run: node web/scripts/createMissingCompany.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
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

async function createMissingCompany() {
  try {
    console.log("=== CREATING MISSING VILLA PARK COMPANY ===\n");
    
    // Login as superadmin
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in as superadmin\n");

    // Check if villa-park company exists
    const companyDoc = await getDoc(doc(db, 'companies', 'villa-park'));
    
    if (companyDoc.exists()) {
      console.log("✅ Villa Park company already exists:");
      console.log(companyDoc.data());
      return;
    }

    // Create the company
    const villaParkData = {
      name: "Villa Park",
      code: "villa-park",
      description: "Villa Park Resort and Spa",
      location: "Maldives",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        timezone: "Indian/Maldives",
        currency: "USD",
        dateFormat: "DD/MM/YYYY"
      }
    };

    await setDoc(doc(db, 'companies', 'villa-park'), villaParkData);
    console.log("✅ Created Villa Park company (ID: villa-park)");
    console.log(villaParkData);

    // Count employees that will now be visible
    const employeesSnap = await getDocs(collection(db, 'employees'));
    let villaParkEmployees = 0;
    employeesSnap.forEach(doc => {
      const data = doc.data();
      if (data.companyId === 'villa-park' || data.Division?.toLowerCase().includes('villa park')) {
        villaParkEmployees++;
      }
    });
    
    console.log(`\n📊 Found ${villaParkEmployees} employees with villa-park companyId`);
    console.log("\n✅ DONE! Users with companyId='villa-park' will now see employees after re-login.");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

createMissingCompany();
