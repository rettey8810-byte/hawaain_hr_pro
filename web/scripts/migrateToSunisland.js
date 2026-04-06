import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
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

const OLD_COMPANY_ID = "6FXQ9ZuBvSdbjXNZ6yHJ";
const NEW_COMPANY_ID = "sunisland-resort-and-spa";

async function migrateEmployees() {
  try {
    console.log("=== MIGRATING EMPLOYEES TO SUNISLAND RESORT ===\n");
    await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in\n");

    const collections = ['employees', 'passports', 'visas', 'workPermits', 'medicals'];
    
    for (const collName of collections) {
      console.log(`\n--- Migrating ${collName} ---`);
      
      // Get all documents with old companyId
      const q = query(
        collection(db, collName),
        where('companyId', '==', OLD_COMPANY_ID)
      );
      const snap = await getDocs(q);
      
      console.log(`Found ${snap.size} documents`);
      
      if (snap.size === 0) continue;
      
      // Update in batches of 500
      let batch = writeBatch(db);
      let count = 0;
      let updated = 0;
      
      for (const docSnap of snap.docs) {
        const docRef = doc(db, collName, docSnap.id);
        batch.update(docRef, { companyId: NEW_COMPANY_ID });
        count++;
        updated++;
        
        if (count === 500) {
          await batch.commit();
          console.log(`  Updated ${updated}...`);
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      // Commit remaining
      if (count > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Total updated: ${updated}`);
    }

    console.log("\n=== MIGRATION COMPLETE ===");
    console.log("Refresh the web app - all 887 staff should now appear under Sunisland Resort and Spa!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

migrateEmployees();
