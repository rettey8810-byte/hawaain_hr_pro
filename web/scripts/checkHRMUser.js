import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
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

async function checkHRMUser() {
  console.log("=== CHECKING HRM USER ===\n");

  // Find HRM user
  const usersQuery = query(collection(db, 'users'), where('email', '==', HRM_EMAIL));
  const usersSnap = await getDocs(usersQuery);

  if (usersSnap.empty) {
    console.error("❌ HRM user not found:", HRM_EMAIL);
    return;
  }

  const userData = usersSnap.docs[0].data();
  console.log("HRM User Found:");
  console.log("  Email:", userData.email);
  console.log("  Role:", userData.role);
  console.log("  CompanyId:", userData.companyId);
  console.log("  Custom Permissions:", JSON.stringify(userData.customPermissions, null, 2));

  // Check employees permissions
  if (userData.customPermissions?.employees) {
    console.log("\nEmployee Permissions:");
    console.log("  View:", userData.customPermissions.employees.view);
    console.log("  Create:", userData.customPermissions.employees.create);
    console.log("  Edit:", userData.customPermissions.employees.edit);
    console.log("  Delete:", userData.customPermissions.employees.delete);
  } else {
    console.log("\nNo custom permissions set - using defaults");
  }
}

async function findEmployee4869() {
  console.log("\n=== SEARCHING FOR EMPLOYEE 4869 ===\n");

  // Search by employeeId
  const q1 = query(collection(db, 'employees'), where('employeeId', '==', '4869'));
  const snap1 = await getDocs(q1);

  console.log("Search by employeeId='4869':", snap1.size, "found");
  snap1.forEach(doc => {
    const data = doc.data();
    console.log("  ID:", doc.id);
    console.log("  Name:", data.name);
    console.log("  EmpID:", data.employeeId);
    console.log("  CompanyId:", data.companyId);
    console.log("---");
  });

  // Search by EmpID field
  const q2 = query(collection(db, 'employees'), where('EmpID', '==', 4869));
  const snap2 = await getDocs(q2);

  console.log("\nSearch by EmpID=4869:", snap2.size, "found");
  snap2.forEach(doc => {
    const data = doc.data();
    console.log("  ID:", doc.id);
    console.log("  Name:", data.FullName || data.name);
    console.log("  EmpID:", data.EmpID);
    console.log("  CompanyId:", data.companyId);
    console.log("---");
  });

  // Search by name
  const q3 = query(collection(db, 'employees'), where('FullName', '==', 'ABDUL RASHEED ALI'));
  const snap3 = await getDocs(q3);

  console.log("\nSearch by FullName='ABDUL RASHEED ALI':", snap3.size, "found");
  snap3.forEach(doc => {
    const data = doc.data();
    console.log("  ID:", doc.id);
    console.log("  Name:", data.FullName);
    console.log("  EmpID:", data.EmpID);
    console.log("  CompanyId:", data.companyId);
    console.log("---");
  });
}

async function main() {
  await checkHRMUser();
  await findEmployee4869();
}

main().catch(err => {
  console.error("Error:", err.message);
});
