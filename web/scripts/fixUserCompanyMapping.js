/**
 * Fix user companyId mapping - change villa-park to sunisland-resort-and-spa
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
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

async function fixUserCompanyMapping() {
  try {
    console.log("=== FIXING USER COMPANY MAPPING ===\n");
    
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    // Find all users with companyId 'villa-park'
    const usersQuery = query(
      collection(db, 'users'),
      where('companyId', '==', 'villa-park')
    );
    const usersSnap = await getDocs(usersQuery);
    
    console.log(`Found ${usersSnap.size} users with companyId='villa-park'`);
    
    let fixedCount = 0;
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`\nFixing user: ${userData.email || userId}`);
      console.log(`  Current companyId: ${userData.companyId}`);
      console.log(`  New companyId: sunisland-resort-and-spa`);
      
      await updateDoc(doc(db, 'users', userId), {
        companyId: 'sunisland-resort-and-spa',
        updatedAt: new Date().toISOString()
      });
      
      fixedCount++;
      console.log(`  ✅ Fixed`);
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Fixed ${fixedCount} users`);
    console.log('\n✅ Users can now re-login and see Villa Park employees!');
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixUserCompanyMapping();
