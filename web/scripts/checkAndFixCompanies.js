/**
 * Script to check existing companies and fix employee companyId mapping
 * Run: node scripts/checkAndFixCompanies.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, setDoc, query, where } from 'firebase/firestore';
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

async function checkAndFixCompanies() {
  try {
    console.log("=== CHECKING EXISTING COMPANIES ===\n");
    
    // Login as superadmin
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in as superadmin\n");

    // Get all companies
    const companiesSnap = await getDocs(collection(db, 'companies'));
    console.log(`Found ${companiesSnap.size} companies:\n`);

    const companies = [];
    for (const companyDoc of companiesSnap.docs) {
      const companyId = companyDoc.id;
      const companyData = companyDoc.data();
      companies.push({ id: companyId, ...companyData });
      console.log(`- ID: ${companyId}`);
      console.log(`  Name: ${companyData.name || 'Unnamed'}`);
      console.log('---');
    }

    // Check if villa-park exists
    const villaParkExists = companies.some(c => c.id === 'villa-park');
    const sunislandExists = companies.some(c => c.id === 'sunisland-resort-and-spa');

    console.log('\n=== ANALYSIS ===');
    console.log(`villa-park exists: ${villaParkExists}`);
    console.log(`sunisland-resort-and-spa exists: ${sunislandExists}`);

    if (!villaParkExists && sunislandExists) {
      console.log('\n📝 Villa Park employees exist but company not found.');
      console.log('   Employees may have companyId: "villa-park" but company is "sunisland-resort-and-spa"');
      
      // Option 1: Create villa-park company
      console.log('\n=== OPTION 1: Create villa-park company ===');
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
      
      // Count employees with villa-park companyId
      const employeesQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', 'villa-park')
      );
      const villaParkEmployees = await getDocs(employeesQuery);
      console.log(`📊 Found ${villaParkEmployees.size} employees with companyId='villa-park'`);
    }

    if (companies.length === 0) {
      console.log('\n❌ No companies found at all! Creating default Villa Park company...');
      
      const defaultCompany = {
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

      await setDoc(doc(db, 'companies', 'villa-park'), defaultCompany);
      console.log("✅ Created default Villa Park company");
    }

    console.log('\n✅ DONE! Please re-login to see the changes.');

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

checkAndFixCompanies();
