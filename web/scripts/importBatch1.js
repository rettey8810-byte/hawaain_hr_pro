import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NEW Firebase configuration (hawaain-hr-pro-e8574)
const firebaseConfig = {
  apiKey: "AIzaSyAJJ0SEyrJBj8K06inSptRjG5VYkvhKeR8",
  authDomain: "hawaain-hr-pro-e8574.firebaseapp.com",
  projectId: "hawaain-hr-pro-e8574",
  storageBucket: "hawaain-hr-pro-e8574.firebasestorage.app",
  messagingSenderId: "819292919841",
  appId: "1:819292919841:web:38afa35d769901d2e6ab60",
  measurementId: "G-8MGDGTR865"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Superadmin credentials to create
const SUPERADMIN_EMAIL = "retey.ay@hotmail.com";
const SUPERADMIN_PASSWORD = "Adhu1447";

// Helper function to safely parse dates
function safeDate(dateValue) {
  if (!dateValue) return '';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

async function createSuperadmin() {
  console.log("=== Creating Superadmin ===\n");
  
  try {
    // Check if user already exists
    const usersQuery = query(collection(db, 'users'), where('email', '==', SUPERADMIN_EMAIL));
    const usersSnap = await getDocs(usersQuery);
    
    if (!usersSnap.empty) {
      console.log("✅ Superadmin already exists");
      return usersSnap.docs[0].id;
    }
    
    // Create auth user
    console.log("Creating auth user...");
    const userCredential = await createUserWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    const uid = userCredential.user.uid;
    console.log("✅ Auth user created:", uid);
    
    // Create user document
    await setDoc(doc(db, 'users', uid), {
      email: SUPERADMIN_EMAIL,
      role: 'superadmin',
      name: 'Super Admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log("✅ User document created");
    
    return uid;
  } catch (error) {
    console.error("❌ Error creating superadmin:", error.message);
    throw error;
  }
}

async function importBatch1() {
  try {
    console.log("\n=== Batch 1 Import ===\n");
    
    // Create superadmin first
    const adminUid = await createSuperadmin();
    
    // Create company
    console.log("\nCreating company...");
    const companyRef = await addDoc(collection(db, 'companies'), {
      name: "Villa Hotels & Resorts",
      code: "VILLA001",
      address: "Maldives",
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: adminUid
    });
    const companyId = companyRef.id;
    console.log("✅ Company created:", companyId);

    // Read Batch 1 JSON file
    console.log("\nReading batch_1_of_6.json...");
    const jsonPath = path.join(__dirname, '..', '..', 'batches', 'batch_1_of_6.json');
    
    // Try reading as buffer first to detect encoding
    const buffer = fs.readFileSync(jsonPath);
    let jsonData;
    
    // Check for UTF-16 BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      jsonData = buffer.toString('utf16le', 2);
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      jsonData = buffer.swap16().toString('utf16le', 2);
    } else {
      jsonData = buffer.toString('utf8');
    }
    
    // Remove BOM if still present
    if (jsonData.charCodeAt(0) === 0xFEFF) {
      jsonData = jsonData.substring(1);
    }
    
    // Clean up any invalid characters and handle NaN
    jsonData = jsonData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    jsonData = jsonData.replace(/: NaN/g, ': null');
    jsonData = jsonData.replace(/:NaN/g, ':null');
    
    const employees = JSON.parse(jsonData);
    console.log(`Found ${employees.length} records to import`);

    let imported = 0;
    let errors = 0;

    for (const emp of employees) {
      try {
        // Create employee
        const employeeData = {
          companyId: companyId,
          employeeId: emp.EmpID?.toString() || '',
          name: emp.EmployeeName || '',
          division: emp.Division || '',
          department: emp.Department || '',
          section: emp.Section || '',
          status: emp.EmpStatus?.toLowerCase() === 'active' ? 'active' : 'inactive',
          country: emp.Country || '',
          qEmp: emp['Q-Emp'] || '',
          qPool: emp.Qpool || '',
          slotNo: emp.SlotNo || '',
          arrivalDate: safeDate(emp.ArrivalDate),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const empRef = await addDoc(collection(db, 'employees'), employeeData);
        const employeeDocId = empRef.id;

        // Create passport
        if (emp.PPNo && emp.PPExpiry) {
          await addDoc(collection(db, 'passports'), {
            companyId: companyId,
            employeeId: employeeDocId,
            passportNumber: emp.PPNo,
            country: emp.Country || '',
            expiryDate: safeDate(emp.PPExpiry),
            createdAt: new Date().toISOString()
          });
        }

        // Create work permit
        if (emp.WPNo && emp.WPExpiry) {
          await addDoc(collection(db, 'workPermits'), {
            companyId: companyId,
            employeeId: employeeDocId,
            permitNumber: emp.WPNo,
            jobPosition: emp.Department || '',
            employer: emp.Division || '',
            wpState: emp.WPState || '',
            expiryDate: safeDate(emp.WPExpiry),
            createdAt: new Date().toISOString()
          });
        }

        // Create visa
        if (emp.VIsaExpiry) {
          await addDoc(collection(db, 'visas'), {
            companyId: companyId,
            employeeId: employeeDocId,
            visaNumber: emp.WPNo || '',
            visaType: 'Work',
            expiryDate: safeDate(emp.VIsaExpiry),
            createdAt: new Date().toISOString()
          });
        }

        // Create medical
        if (emp.MedicalExpiry) {
          await addDoc(collection(db, 'medicals'), {
            companyId: companyId,
            employeeId: employeeDocId,
            testDate: safeDate(emp.MedicalExpiry),
            expiryDate: safeDate(emp.MedicalExpiry),
            result: 'approved',
            createdAt: new Date().toISOString()
          });
        }

        imported++;
        
        if (imported % 50 === 0) {
          console.log(`Progress: ${imported}/${employees.length}...`);
        }

      } catch (empError) {
        console.error(`Error importing ${emp.EmployeeName}:`, empError.message);
        errors++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported} employees`);
    console.log(`   Errors: ${errors}`);
    console.log(`\nLogin with: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);

  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

importBatch1();
