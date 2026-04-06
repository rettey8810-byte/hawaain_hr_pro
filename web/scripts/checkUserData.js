import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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

async function checkUserData() {
  try {
    console.log("=== CHECKING USER DATA ===\n");
    const cred = await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in as:", cred.user.email);
    console.log("User UID:", cred.user.uid, "\n");

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("User data from Firestore:");
      console.log("  name:", data.name);
      console.log("  email:", data.email);
      console.log("  role:", data.role);
      console.log("  companyId:", data.companyId);
      console.log("  createdAt:", data.createdAt);
    } else {
      console.log("❌ User document NOT FOUND in Firestore!");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkUserData();
