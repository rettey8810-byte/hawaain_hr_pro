import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAwfgswf9xgHm1Fa81g4VsGxE2oVKhRZyg",
  authDomain: "hawaain-hr-pro.firebaseapp.com",
  projectId: "hawaain-hr-pro",
  storageBucket: "hawaain-hr-pro.firebasestorage.app",
  messagingSenderId: "677637131407",
  appId: "1:677637131407:web:078b36b5ad6c1259dff4fa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
