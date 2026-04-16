import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJJ0SEyrJBj8K06inSptRjG5VYkvhKeR8",
  authDomain: "hawaain-hr-pro-e8574.firebaseapp.com",
  projectId: "hawaain-hr-pro-e8574",
  storageBucket: "hawaain-hr-pro-e8574.firebasestorage.app",
  messagingSenderId: "819292919841",
  appId: "1:819292919841:web:38afa35d769901d2e6ab60",
  measurementId: "G-8MGDGTR865"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EMPTY_COMPANY_ID = 'sunisland-resort-and-spa';
const KEEP_COMPANY_ID = 'villa-park';

async function deleteDuplicateCompany() {
  console.log('=== Checking duplicate Villa Park company ===\n');

  // Check if empty company exists
  const emptyRef = doc(db, 'companies', EMPTY_COMPANY_ID);
  const emptySnap = await getDoc(emptyRef);

  if (!emptySnap.exists()) {
    console.log('✅ Duplicate company does not exist. Nothing to delete.');
    return;
  }

  const emptyData = emptySnap.data();
  console.log(`Found company to delete:`);
  console.log(`  ID: ${EMPTY_COMPANY_ID}`);
  console.log(`  Name: ${emptyData.name}`);
  console.log(`  Code: ${emptyData.code || '(none)'}`);

  // Check the company we want to keep
  const keepRef = doc(db, 'companies', KEEP_COMPANY_ID);
  const keepSnap = await getDoc(keepRef);

  if (!keepSnap.exists()) {
    console.error(`❌ ERROR: Company to keep (${KEEP_COMPANY_ID}) does not exist!`);
    console.error('Aborting to prevent data loss.');
    process.exit(1);
  }

  const keepData = keepSnap.data();
  console.log(`\nCompany to keep:`);
  console.log(`  ID: ${KEEP_COMPANY_ID}`);
  console.log(`  Name: ${keepData.name}`);
  console.log(`  Code: ${keepData.code || '(none)'}`);

  // Count employees under each
  const emptyCountQ = query(collection(db, 'employees'), where('companyId', '==', EMPTY_COMPANY_ID));
  const emptyCountSnap = await getDocs(emptyCountQ);
  console.log(`\nEmployees with companyId "${EMPTY_COMPANY_ID}": ${emptyCountSnap.size}`);

  const keepCountQ = query(collection(db, 'employees'), where('companyId', '==', KEEP_COMPANY_ID));
  const keepCountSnap = await getDocs(keepCountQ);
  console.log(`Employees with companyId "${KEEP_COMPANY_ID}": ${keepCountSnap.size}`);

  if (emptyCountSnap.size > 0) {
    console.error(`\n❌ WARNING: The company to delete has ${emptyCountSnap.size} employees!`);
    console.error('You should migrate these employees first.');
    process.exit(1);
  }

  console.log(`\n✅ Safe to delete: The company has 0 employees.`);
  console.log(`\nProceeding to delete company ID: ${EMPTY_COMPANY_ID}`);

  // Delete the empty company
  await deleteDoc(emptyRef);
  console.log(`\n✅ Successfully deleted company: ${EMPTY_COMPANY_ID}`);
  console.log('\nNext steps:');
  console.log('1. Refresh your browser');
  console.log('2. The company dropdown should now only show one Villa Park');
  console.log('3. Dashboard and Leave Planner should show all 868 employees');
}

deleteDuplicateCompany().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exitCode = 1;
});
