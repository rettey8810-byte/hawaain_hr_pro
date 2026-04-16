import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
  limit,
  startAfter
} from 'firebase/firestore';

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

const OLD_COMPANY_ID = "sunisland-resort-and-spa";
const NEW_COMPANY_ID = "villa-park";
const BATCH_SIZE = 500;

async function fixLeavesCompanyId() {
  console.log("=== FIXING LEAVES COMPANY ID ===\n");
  console.log(`Changing from "${OLD_COMPANY_ID}" to "${NEW_COMPANY_ID}"\n`);

  let lastDoc = null;
  let totalUpdated = 0;
  let batchCount = 0;

  while (true) {
    // Build query
    let q;
    if (lastDoc) {
      q = query(
        collection(db, 'leaves'),
        where('companyId', '==', OLD_COMPANY_ID),
        limit(BATCH_SIZE),
        startAfter(lastDoc)
      );
    } else {
      q = query(
        collection(db, 'leaves'),
        where('companyId', '==', OLD_COMPANY_ID),
        limit(BATCH_SIZE)
      );
    }

    const snap = await getDocs(q);

    if (snap.empty) {
      console.log("No more leaves to update.");
      break;
    }

    // Update batch
    const batch = writeBatch(db);
    let batchSize = 0;

    for (const docSnap of snap.docs) {
      const leaveRef = doc(db, 'leaves', docSnap.id);
      batch.update(leaveRef, {
        companyId: NEW_COMPANY_ID,
        updatedAt: new Date().toISOString()
      });
      batchSize++;
    }

    await batch.commit();
    totalUpdated += batchSize;
    batchCount++;

    console.log(`Batch ${batchCount}: Updated ${batchSize} leaves (Total: ${totalUpdated})`);

    lastDoc = snap.docs[snap.docs.length - 1];

    // If we got fewer than BATCH_SIZE docs, we're done
    if (snap.docs.length < BATCH_SIZE) {
      break;
    }
  }

  console.log(`\n✅ Successfully updated ${totalUpdated} leave documents!`);
  console.log("\nRefresh the Leave Planner page to see the leaves.");
}

fixLeavesCompanyId().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
