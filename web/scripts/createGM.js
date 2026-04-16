import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJJ0SEyrJBj8K06inSptRjG5VYkvhKeR8",
  authDomain: "hawaain-hr-pro-e8574.firebaseapp.com",
  projectId: "hawaain-hr-pro-e8574",
  storageBucket: "hawaain-hr-pro-e8574.firebasestorage.app",
  messagingSenderId: "819292919841",
  appId: "1:819292919841:web:38afa35d769901d2e6ab60"
};

// GM credentials
const GM_EMAIL = "gm@villa-park.com.mv";
const GM_PASSWORD = "GM@2024!VP";
const GM_NAME = "General Manager";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createGM() {
  try {
    console.log("=== Creating General Manager ===\n");
    
    // Check if user already exists
    const usersQuery = query(collection(db, 'users'), where('email', '==', GM_EMAIL));
    const usersSnap = await getDocs(usersQuery);
    
    if (!usersSnap.empty) {
      console.log("✅ GM user already exists");
      const existingDoc = usersSnap.docs[0];
      console.log("Email:", GM_EMAIL);
      console.log("Password:", GM_PASSWORD);
      console.log("UID:", existingDoc.id);
      console.log("Role:", existingDoc.data().role);
      return;
    }
    
    // Create auth user
    console.log("Creating GM auth user...");
    const userCredential = await createUserWithEmailAndPassword(auth, GM_EMAIL, GM_PASSWORD);
    const uid = userCredential.user.uid;
    console.log("✅ Auth user created:", uid);
    
    // Update profile
    await updateProfile(userCredential.user, {
      displayName: GM_NAME
    });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', uid), {
      name: GM_NAME,
      email: GM_EMAIL,
      role: 'gm',
      companyId: 'villa-park',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log("✅ GM user document created");
    console.log("\n=== GM Login Credentials ===");
    console.log("Email:", GM_EMAIL);
    console.log("Password:", GM_PASSWORD);
    console.log("Name:", GM_NAME);
    console.log("Role:", "gm");
    console.log("Company:", "villa-park");
    console.log("\nLogin URL: https://hawaain-hr-pro.web.app/login");
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("✅ GM user already exists");
      console.log("Email:", GM_EMAIL);
      console.log("Password:", GM_PASSWORD);
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

createGM();
