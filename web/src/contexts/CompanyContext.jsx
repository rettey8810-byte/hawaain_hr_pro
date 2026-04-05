import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CompanyContext = createContext();

export function useCompany() {
  return useContext(CompanyContext);
}

// Pre-defined companies that can be switched to
const PREDEFINED_COMPANIES = [
  { 
    id: 'sun-island', 
    name: 'Sun Island', 
    type: 'resort',
    logo: '/sun-island-logo.png',
    description: 'Sun Island Resort & Spa'
  },
  { 
    id: 'villa-construction', 
    name: 'Villa Construction', 
    type: 'construction',
    logo: '/construction-logo.png',
    description: 'Villa Construction Workforce',
    dataSource: 'local' // Uses local JSON file
  },
  { 
    id: 'villa-park', 
    name: 'Villa Park', 
    type: 'external',
    logo: '/villa-park-logo.png',
    description: 'Villa Park Staff'
  },
  { 
    id: 'sister-property', 
    name: 'Sister Property', 
    type: 'external',
    logo: '/sister-property-logo.png',
    description: 'Sister Property Staff'
  },
  { 
    id: '3rd-party', 
    name: '3rd Party Staff', 
    type: 'external',
    logo: '/3rd-party-logo.png',
    description: 'Third Party Contractors'
  },
  { 
    id: 'visitors', 
    name: 'Visitors', 
    type: 'visitors',
    logo: '/visitors-logo.png',
    description: 'Visitor Management'
  }
];

export function CompanyProvider({ children }) {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
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
      // Build the list of available companies
      let availableCompanies = [];
      
      // If super admin or GM/HRM, they can access all predefined companies
      if (userData.role === 'superadmin' || userData.role === 'gm' || userData.role === 'hrm') {
        // Start with predefined companies
        availableCompanies = [...PREDEFINED_COMPANIES];
        
        // Also load any custom companies from Firestore
        const customCompaniesSnap = await getDocs(collection(db, 'companies'));
        const customCompanies = customCompaniesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          type: doc.data().type || 'custom'
        }));
        
        // Merge without duplicates (only add custom companies not in predefined)
        customCompanies.forEach(custom => {
          if (!availableCompanies.find(c => c.id === custom.id)) {
            availableCompanies.push(custom);
          }
        });
        
        // Ensure Sun Island is always included
        if (!availableCompanies.find(c => c.id === 'sun-island')) {
          availableCompanies.unshift(PREDEFINED_COMPANIES[0]);
        }
      } else {
        // Regular user - only their assigned company
        if (userData.companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
          if (companyDoc.exists()) {
            availableCompanies.push({ 
              id: companyDoc.id, 
              ...companyDoc.data() 
            });
          }
        }
      }
      
      setCompanies(availableCompanies);
      
      // Set default company from localStorage or Sun Island as default
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      if (savedCompanyId) {
        const found = availableCompanies.find(c => c.id === savedCompanyId);
        if (found) {
          setCurrentCompany(found);
        } else {
          // Default to Sun Island if available
          const sunIsland = availableCompanies.find(c => c.id === 'sun-island');
          setCurrentCompany(sunIsland || availableCompanies[0] || null);
        }
      } else {
        // Default to Sun Island
        const sunIsland = availableCompanies.find(c => c.id === 'sun-island');
        setCurrentCompany(sunIsland || availableCompanies[0] || null);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = (companyId) => {
    console.log('switchCompany called with:', companyId);
    console.log('Available companies:', companies.map(c => c.id));
    const company = companies.find(c => c.id === companyId);
    console.log('Found company:', company);
    if (company) {
      setCurrentCompany(company);
      localStorage.setItem('selectedCompanyId', companyId);
      // Navigate to dashboard instead of reloading
      navigate('/', { replace: true });
    } else {
      console.error('Company not found:', companyId);
      alert('Company not found. Please refresh the page.');
    }
  };

  const canSwitchCompany = () => {
    return userData?.role === 'superadmin' || userData?.role === 'gm' || userData?.role === 'hrm';
  };

  const getCompanyDisplayName = () => {
    return currentCompany?.name || currentCompany?.companyName || 'Unknown Company';
  };

  const isConstructionCompany = () => {
    return currentCompany?.id === 'villa-construction' || currentCompany?.type === 'construction';
  };

  const isExternalCompany = () => {
    return currentCompany?.type === 'external' || currentCompany?.type === 'visitors';
  };

  const value = {
    currentCompany,
    companies,
    loading,
    switchCompany,
    canSwitchCompany,
    getCompanyDisplayName,
    isConstructionCompany,
    isExternalCompany,
    isSuperAdmin: () => userData?.role === 'superadmin',
    companyId: currentCompany?.id,
    companyType: currentCompany?.type || 'resort'
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}
