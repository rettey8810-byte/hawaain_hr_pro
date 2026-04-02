import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwfgswf9xgHm1Fa81g4VsGxE2oVKhRZyg",
  authDomain: "hawaain-hr-pro.firebaseapp.com",
  projectId: "hawaain-hr-pro",
  storageBucket: "hawaain-hr-pro.firebasestorage.app",
  messagingSenderId: "677637131407",
  appId: "1:677637131407:web:078b36b5ad6c1259dff4fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Superadmin credentials
const SUPERADMIN_EMAIL = "retey.ay@hotmail.com";
const SUPERADMIN_PASSWORD = "Adhu1447";
const SUPERADMIN_NAME = "Rettey Admin";

async function createSuperadmin() {
  try {
    console.log("Creating superadmin user...");
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      SUPERADMIN_EMAIL, 
      SUPERADMIN_PASSWORD
    );
    
    const user = userCredential.user;
    
    // Update profile
    await updateProfile(user, {
      displayName: SUPERADMIN_NAME
    });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      role: 'superadmin',
      companyId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log("✅ Superadmin created successfully!");
    console.log("Email:", SUPERADMIN_EMAIL);
    console.log("Password:", SUPERADMIN_PASSWORD);
    console.log("UID:", user.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("✅ Superadmin user already exists");
      console.log("Email:", SUPERADMIN_EMAIL);
      console.log("Password:", SUPERADMIN_PASSWORD);
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

createSuperadmin();
