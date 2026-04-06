import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
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

const CORRECT_COMPANY_ID = "6FXQ9ZuBvSdbjXNZ6yHJ";

async function fixUserCompanyId() {
  try {
    console.log("=== FIXING USER COMPANY ID ===\n");
    const cred = await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    console.log("✅ Logged in as:", cred.user.email);
    
    const userId = cred.user.uid;
    console.log("User ID:", userId);
    console.log("Setting companyId to:", CORRECT_COMPANY_ID, "\n");

    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      companyId: CORRECT_COMPANY_ID,
      updatedAt: new Date().toISOString()
    });

    console.log("✅ User companyId updated successfully!");
    console.log("\nRefresh the web app and employee names should now appear correctly.");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixUserCompanyId();
