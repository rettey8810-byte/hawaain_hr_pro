const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase config - same as your app
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

async function fixHRMRole() {
  try {
    // Find the HRM by email
    const email = 'hrmgr.park@villaresorts.com';
    
    // Query users collection by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const usersSnap = await getDocs(usersQuery);
    
    if (usersSnap.empty) {
      console.log('User not found in users collection');
      return;
    }
    
    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();
    
    console.log('Current user data:', userData);
    console.log('Current role:', userData.role);
    
    // Update role to hrm
    await updateDoc(doc(db, 'users', userDoc.id), {
      role: 'hrm',
      department: 'HUMAN RESOURCES',
      position: 'DIRECTOR',
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Successfully updated role to "hrm" for', email);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

fixHRMRole();
