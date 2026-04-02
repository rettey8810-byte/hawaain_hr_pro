import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const db = getFirestore(app);
const auth = getAuth(app);

// Superadmin credentials
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

async function importEmployeeData() {
  try {
    console.log("=== Employee Data Import ===\n");

    // Login as superadmin
    console.log("Authenticating as superadmin...");
    const userCredential = await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    const adminUid = userCredential.user.uid;
    console.log("✅ Logged in as:", SUPERADMIN_EMAIL);

    // Get or create company
    console.log("\nFinding company...");
    const companiesQuery = query(collection(db, 'companies'));
    const companiesSnap = await getDocs(companiesQuery);
    
    let companyId;
    if (companiesSnap.empty) {
      console.log("Creating new company...");
      const companyRef = await addDoc(collection(db, 'companies'), {
        name: "Villa Hotels & Resorts",
        code: "VILLA001",
        address: "Maldives",
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: adminUid
      });
      companyId = companyRef.id;
      console.log("✅ Company created:", companyId);
    } else {
      companyId = companiesSnap.docs[0].id;
      console.log("✅ Using existing company:", companyId);
    }

    // Read JSON file with encoding handling
    console.log("\nReading Xpat_Audit.json...");
    const jsonPath = path.join(__dirname, '..', '..', 'Xpat_Audit.json');
    
    // Try reading as buffer first to detect encoding
    const buffer = fs.readFileSync(jsonPath);
    let jsonData;
    
    // Check for UTF-16 BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      // UTF-16 LE
      jsonData = buffer.toString('utf16le', 2);
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      // UTF-16 BE
      jsonData = buffer.swap16().toString('utf16le', 2);
    } else {
      // UTF-8 with possible BOM
      jsonData = buffer.toString('utf8');
    }
    
    // Remove BOM if still present
    if (jsonData.charCodeAt(0) === 0xFEFF) {
      jsonData = jsonData.substring(1);
    }
    
    // Clean up any invalid characters and handle NaN
    jsonData = jsonData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    
    // Fix NaN values (replace with null)
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

        // Create insurance notification if exists
        if (emp.InsuranceExpiry) {
          await addDoc(collection(db, 'notifications'), {
            companyId: companyId,
            employeeId: employeeDocId,
            type: 'insurance_expiry',
            title: `Insurance Expiry: ${emp.EmployeeName}`,
            message: `Insurance expires on ${safeDate(emp.InsuranceExpiry) || 'N/A'}`,
            expiryDate: safeDate(emp.InsuranceExpiry),
            read: false,
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
    console.log(`\nRefresh http://localhost:5173/ to see the data!`);

  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

importEmployeeData();
