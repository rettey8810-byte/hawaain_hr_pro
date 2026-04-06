import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
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

const CORRECT_COMPANY_ID = "sunisland-resort-and-spa";

async function checkAndFixUser() {
  try {
    console.log("=== CHECKING USER COMPANY ID ===\n");
    const cred = await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    const userId = cred.user.uid;
    
    console.log("User ID:", userId);
    
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("Current userData.companyId:", data.companyId);
      console.log("Should be:", CORRECT_COMPANY_ID);
      
      if (data.companyId !== CORRECT_COMPANY_ID) {
        console.log("\n❌ MISMATCH - Updating...");
        await updateDoc(doc(db, 'users', userId), {
          companyId: CORRECT_COMPANY_ID,
          updatedAt: new Date().toISOString()
        });
        console.log("✅ User companyId updated to:", CORRECT_COMPANY_ID);
      } else {
        console.log("\n✅ Already correct!");
      }
    } else {
      console.log("❌ User document not found");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkAndFixUser();
