import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
  startAfter
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

async function auditEmployeesCompanyIds() {
  const counts = new Map();
  let lastDoc = null;
  let total = 0;
  const pageSize = 500;

  while (true) {
    const base = [limit(pageSize)];
    const constraints = lastDoc ? [startAfter(lastDoc), ...base] : base;
    const q = query(collection(db, 'employees'), ...constraints);

    const snap = await getDocs(q);
    if (snap.empty) break;

    for (const d of snap.docs) {
      const data = d.data();
      const cid = data.companyId ?? '(missing)';
      counts.set(cid, (counts.get(cid) || 0) + 1);
      total++;
    }

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < pageSize) break;
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  console.log('=== Employees companyId audit ===');
  console.log('Total employees scanned:', total);
  console.log('Unique companyId values:', sorted.length);
  console.log('--- Top companyId counts ---');
  for (const [cid, c] of sorted.slice(0, 30)) {
    console.log(`${c}\t${cid}`);
  }
}

auditEmployeesCompanyIds().catch((err) => {
  console.error('Audit failed:', err);
  process.exitCode = 1;
});
