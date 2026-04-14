/**
 * Script to fix missing companyId on employee records
 * Run this in the browser console or as a standalone Node.js script with Firebase Admin
 */

import { collection, query, getDocs, where, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../src/firebase/config.js';

async function fixEmployeeCompanyIds() {
  console.log('[FixScript] Starting companyId fix for employees...');
  
  // First, check what companies exist
  const companiesSnap = await getDocs(collection(db, 'companies'));
  const companies = companiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log('[FixScript] Found companies:', companies.map(c => ({ id: c.id, name: c.name })));
  
  if (companies.length === 0) {
    console.error('[FixScript] No companies found! Cannot fix employees.');
    return;
  }
  
  // Default to first company if employees don't have companyId
  const defaultCompanyId = companies[0].id;
  console.log('[FixScript] Using default companyId:', defaultCompanyId);
  
  // Get all employees without companyId
  const employeesQuery = query(collection(db, 'employees'), limit(100));
  const employeesSnap = await getDocs(employeesQuery);
  
  console.log(`[FixScript] Found ${employeesSnap.docs.length} total employees`);
  
  let fixedCount = 0;
  let alreadyHasCompanyId = 0;
  let errors = [];
  
  for (const docSnapshot of employeesSnap.docs) {
    const data = docSnapshot.data();
    const employeeId = docSnapshot.id;
    
    if (!data.companyId) {
      try {
        // Try to determine company from Division field or use default
        let companyId = defaultCompanyId;
        
        // Check if Division field indicates company
        const division = data.Division || data.division || '';
        if (division.toLowerCase().includes('villa park')) {
          const villaParkCompany = companies.find(c => 
            c.name?.toLowerCase().includes('villa park') || 
            c.id === 'villa-park'
          );
          if (villaParkCompany) companyId = villaParkCompany.id;
        } else if (division.toLowerCase().includes('sun island')) {
          const sunIslandCompany = companies.find(c => 
            c.name?.toLowerCase().includes('sun island') || 
            c.id === 'sunisland-resort-and-spa'
          );
          if (sunIslandCompany) companyId = sunIslandCompany.id;
        }
        
        await updateDoc(doc(db, 'employees', employeeId), {
          companyId: companyId,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`[FixScript] Fixed employee ${employeeId} (${data.FullName || data.name}) with companyId: ${companyId}`);
        fixedCount++;
      } catch (err) {
        console.error(`[FixScript] Error fixing employee ${employeeId}:`, err);
        errors.push({ employeeId, error: err.message });
      }
    } else {
      alreadyHasCompanyId++;
      console.log(`[FixScript] Employee ${employeeId} already has companyId: ${data.companyId}`);
    }
  }
  
  console.log('\n[FixScript] Summary:');
  console.log(`  - Total employees checked: ${employeesSnap.docs.length}`);
  console.log(`  - Already had companyId: ${alreadyHasCompanyId}`);
  console.log(`  - Fixed (added companyId): ${fixedCount}`);
  console.log(`  - Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n[FixScript] Errors encountered:');
    errors.forEach(e => console.log(`    - ${e.employeeId}: ${e.error}`));
  }
}

// Run the fix
fixEmployeeCompanyIds().then(() => {
  console.log('[FixScript] Done!');
}).catch(err => {
  console.error('[FixScript] Fatal error:', err);
});
