import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
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

async function auditCompanies() {
  const snap = await getDocs(collection(db, 'companies'));

  console.log('=== Companies in Firestore ===');
  console.log('Total companies:', snap.size);
  console.log('--- Company Details ---');

  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Name: ${data.name || '(no name)'}`);
    console.log(`  Code: ${data.code || '(no code)'}`);
    console.log('---');
  }
}

auditCompanies().catch((err) => {
  console.error('Audit failed:', err);
  process.exitCode = 1;
});
