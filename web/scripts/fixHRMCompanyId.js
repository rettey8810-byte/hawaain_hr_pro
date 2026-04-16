import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  updateDoc,
  query,
  collection,
  where,
  getDocs
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

const HRM_EMAIL = "hrmgr.park@villaresorts.com";
const CORRECT_COMPANY_ID = "villa-park";

async function fixHRMCompanyId() {
  try {
    console.log("=== FIXING HRM USER COMPANY ID ===\n");

    // Find the HRM user by email
    const usersQuery = query(collection(db, 'users'), where('email', '==', HRM_EMAIL));
    const usersSnap = await getDocs(usersQuery);

    if (usersSnap.empty) {
      console.error("❌ HRM user not found:", HRM_EMAIL);
      return;
    }

    const userDoc = usersSnap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log("Found HRM user:", HRM_EMAIL);
    console.log("User ID:", userId);
    console.log("Current companyId:", userData.companyId);
    console.log("Setting companyId to:", CORRECT_COMPANY_ID, "\n");

    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      companyId: CORRECT_COMPANY_ID,
      updatedAt: new Date().toISOString()
    });

    console.log("✅ HRM user companyId updated successfully!");
    console.log("\nNext steps:");
    console.log("1. Log out of the web app");
    console.log("2. Log back in as the HRM user");
    console.log("3. Dashboard should now show all 868 employees");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixHRMCompanyId();
