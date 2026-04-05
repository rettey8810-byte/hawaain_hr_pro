import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

// Virtual companies for external staff management
const VIRTUAL_COMPANIES = [
  { id: 'sun_island', name: 'Sun Island', type: 'main', isVirtual: false },
  { id: 'construction', name: 'Construction Workforce', type: 'external', isVirtual: true },
  { id: 'villa_park', name: 'Villa Park Staff', type: 'external', isVirtual: true },
  { id: 'third_party', name: '3rd Party Staff', type: 'external', isVirtual: true },
  { id: 'sister_property', name: 'Sister Property Staff', type: 'external', isVirtual: true },
  { id: 'visitors', name: 'Visitors', type: 'external', isVirtual: true }
];

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }) {
  const { user, userData } = useAuth();
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userData) {
      loadCompanies();
    } else {
      setCurrentCompany(null);
      setCompanies([]);
      setLoading(false);
    }
  }, [user, userData]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      let allCompanies = [...VIRTUAL_COMPANIES];
      
      // If super admin, load all real companies from database
      if (userData.role === 'superadmin') {
        const companiesSnap = await getDocs(collection(db, 'companies'));
        const realCompanies = companiesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          isVirtual: false 
        }));
        // Merge real companies with virtual ones (avoid duplicates)
        const realCompanyIds = realCompanies.map(c => c.id);
        allCompanies = [
          ...realCompanies,
          ...VIRTUAL_COMPANIES.filter(vc => !realCompanyIds.includes(vc.id))
        ];
      } else {
        // Regular user - load their assigned company
        if (userData.companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
          if (companyDoc.exists()) {
            const companyData = { 
              id: companyDoc.id, 
              ...companyDoc.data(),
              isVirtual: false 
            };
            // Replace sun_island virtual company with real one if exists
            allCompanies = [
              companyData,
              ...VIRTUAL_COMPANIES.filter(vc => vc.id !== 'sun_island')
            ];
          }
        }
      }
      
      setCompanies(allCompanies);
      
      // Set default company from localStorage or first available
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      if (savedCompanyId) {
        const found = allCompanies.find(c => c.id === savedCompanyId);
        if (found) {
          setCurrentCompany(found);
        } else if (allCompanies.length > 0) {
          // Default to Sun Island or first company
          const sunIsland = allCompanies.find(c => c.id === 'sun_island') || allCompanies[0];
          setCurrentCompany(sunIsland);
        }
      } else {
        // Default to Sun Island or first company
        const sunIsland = allCompanies.find(c => c.id === 'sun_island') || allCompanies[0];
        setCurrentCompany(sunIsland);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('selectedCompanyId', companyId);
    }
  };

  const value = {
    currentCompany,
    companies,
    loading,
    switchCompany,
    isSuperAdmin: () => userData?.role === 'superadmin',
    companyId: currentCompany?.id,
    isExternalCompany: currentCompany?.type === 'external'
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}
