import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from './useFirestore';

/**
 * Hook to fetch data with automatic role-based filtering
 * 
 * Role visibility rules:
 * - superadmin: sees everything (all companies, all departments)
 * - gm: sees only their company's data
 * - hrm/hr: sees all data in their company
 * - dept_head: sees only their department's data in their company
 * - supervisor: sees only their department's data in their company
 * - staff: sees only their own data
 */
export function useFilteredFirestore(collectionName) {
  const { userData, filterByVisibility, isSuperAdmin } = useAuth();
  
  // Get all documents (useFirestore already filters by companyId)
  const { documents: allDocuments, loading, error, refresh } = useFirestore(collectionName);
  
  // Apply role-based filtering
  const filteredDocuments = useMemo(() => {
    if (!allDocuments || allDocuments.length === 0) return [];
    
    // Superadmin sees everything
    if (isSuperAdmin()) {
      return allDocuments;
    }
    
    // Apply visibility filter based on user's role
    return filterByVisibility(allDocuments);
  }, [allDocuments, userData, filterByVisibility, isSuperAdmin]);
  
  return {
    documents: filteredDocuments,
    allDocuments, // Keep original for reference if needed
    loading,
    error,
    refresh
  };
}

/**
 * Hook specifically for employee data with additional filtering
 */
export function useFilteredEmployees() {
  const { userData, isSuperAdmin } = useAuth();
  const { documents: allEmployees, loading, error, refresh } = useFirestore('employees');
  
  const employees = useMemo(() => {
    if (!allEmployees || allEmployees.length === 0) return [];
    
    const currentRole = userData?.role;
    const userDept = userData?.department;
    const userCompany = userData?.companyId;
    const userId = userData?.uid;
    
    // Superadmin sees everything
    if (isSuperAdmin()) {
      return allEmployees;
    }
    
    // GM and HR see all in their company
    if (['gm', 'hrm', 'hr', 'admin'].includes(currentRole)) {
      return allEmployees.filter(emp => emp.companyId === userCompany);
    }
    
    // Dept Head and Supervisor see only their department
    if (['dept_head', 'supervisor'].includes(currentRole)) {
      return allEmployees.filter(emp => 
        emp.companyId === userCompany && 
        emp.department === userDept
      );
    }
    
    // Staff sees only their own record (by email or userId match)
    if (currentRole === 'staff') {
      return allEmployees.filter(emp => 
        emp.companyId === userCompany && 
        (emp.email === userData?.email || emp.userId === userId)
      );
    }
    
    // Default: filter by company only
    return allEmployees.filter(emp => emp.companyId === userCompany);
  }, [allEmployees, userData, isSuperAdmin]);
  
  return {
    employees,
    allEmployees,
    loading,
    error,
    refresh
  };
}

/**
 * Hook for documents (passports, visas, etc.) with role-based filtering
 */
export function useFilteredDocuments(docType) {
  const { userData, isSuperAdmin } = useAuth();
  const { documents: allDocs, loading, error, refresh } = useFirestore(docType);
  
  const documents = useMemo(() => {
    if (!allDocs || allDocs.length === 0) return [];
    
    const currentRole = userData?.role;
    const userDept = userData?.department;
    const userCompany = userData?.companyId;
    
    // Superadmin sees everything
    if (isSuperAdmin()) {
      return allDocs;
    }
    
    // GM and HR see all in their company
    if (['gm', 'hrm', 'hr', 'admin'].includes(currentRole)) {
      return allDocs.filter(doc => doc.companyId === userCompany);
    }
    
    // Dept Head and Supervisor see only their department's employees' documents
    if (['dept_head', 'supervisor'].includes(currentRole)) {
      // Documents should have employeeDepartment field or we need to cross-reference
      return allDocs.filter(doc => 
        doc.companyId === userCompany && 
        (doc.employeeDepartment === userDept || doc.department === userDept)
      );
    }
    
    // Staff sees only their own documents
    if (currentRole === 'staff') {
      return allDocs.filter(doc => 
        doc.companyId === userCompany && 
        (doc.userId === userData?.uid || doc.createdBy === userData?.uid || doc.email === userData?.email)
      );
    }
    
    // Default: filter by company
    return allDocs.filter(doc => doc.companyId === userCompany);
  }, [allDocs, userData, isSuperAdmin, docType]);
  
  return {
    documents,
    allDocuments: allDocs,
    loading,
    error,
    refresh
  };
}

/**
 * Hook for leave data with role-based filtering
 */
export function useFilteredLeaves() {
  const { userData, isSuperAdmin } = useAuth();
  const { documents: allLeaves, loading, error, refresh } = useFirestore('leaves');
  
  const leaves = useMemo(() => {
    if (!allLeaves || allLeaves.length === 0) return [];
    
    const currentRole = userData?.role;
    const userDept = userData?.department;
    const userCompany = userData?.companyId;
    const userId = userData?.uid;
    
    // Superadmin sees everything
    if (isSuperAdmin()) {
      return allLeaves;
    }
    
    // GM sees all in their company
    if (['gm', 'hrm', 'hr', 'admin'].includes(currentRole)) {
      return allLeaves.filter(leave => leave.companyId === userCompany);
    }
    
    // Dept Head and Supervisor see leaves from their department
    if (['dept_head', 'supervisor'].includes(currentRole)) {
      return allLeaves.filter(leave => 
        leave.companyId === userCompany && 
        (leave.employeeDepartment === userDept || leave.department === userDept)
      );
    }
    
    // Staff sees only their own leaves
    if (currentRole === 'staff') {
      return allLeaves.filter(leave => 
        leave.companyId === userCompany && 
        (leave.userId === userId || leave.employeeId === userId || leave.createdBy === userId)
      );
    }
    
    return allLeaves.filter(leave => leave.companyId === userCompany);
  }, [allLeaves, userData, isSuperAdmin]);
  
  return {
    leaves,
    allLeaves,
    loading,
    error,
    refresh
  };
}
