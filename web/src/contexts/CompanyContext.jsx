import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

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
    console.log('[CompanyContext] Loading companies for user:', user?.email, 'userData.companyId:', userData?.companyId, 'role:', userData?.role);
    try {
      // If super admin OR GM OR HRM OR dept_head, load all companies
      const role = (userData?.role || '').toLowerCase();
      if (['superadmin', 'gm', 'hrm', 'dept_head', 'supervisor'].includes(role)) {
        const companiesSnap = await getDocs(collection(db, 'companies'));
        const companiesList = companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(companiesList);
        
        // Default company selection priority:
        // 1) user's assigned companyId (prevents HOD landing in wrong company)
        // 2) localStorage selectedCompanyId (user's last selection)
        // 3) Legacy company name mapping (for data migration)
        // 4) first company
        const preferredCompanyId = userData?.companyId;
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        
        // Legacy company ID mapping - map old string IDs to real company docs
        const legacyCompanyMap = {
          'sunisland-resort-and-spa': 'Villa Park',
          'villa-park': 'Villa Park'
        };
        
        let pickCompanyId = preferredCompanyId || savedCompanyId;
        let selectedCompany = null;
        
        if (pickCompanyId) {
          selectedCompany = companiesList.find(c => c.id === pickCompanyId) || null;
        }
        
        // If no match, try legacy mapping by company name
        if (!selectedCompany && preferredCompanyId && legacyCompanyMap[preferredCompanyId]) {
          const targetName = legacyCompanyMap[preferredCompanyId];
          selectedCompany = companiesList.find(c => 
            c.name === targetName || c.Name === targetName
          ) || null;
          if (selectedCompany) {
            console.log('[CompanyContext] Matched legacy companyId to:', selectedCompany.id, selectedCompany.name);
          }
        }
        
        if (!selectedCompany && companiesList.length > 0) {
          selectedCompany = companiesList[0];
        }

        if (selectedCompany) {
          setCurrentCompany(selectedCompany);
          localStorage.setItem('selectedCompanyId', selectedCompany.id);
        }
      } else {
        // Regular user - load their assigned company
        if (userData.companyId) {
          console.log('[CompanyContext] Loading company for user:', userData.companyId);
          const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
          if (companyDoc.exists()) {
            const companyData = { id: companyDoc.id, ...companyDoc.data() };
            console.log('[CompanyContext] Company loaded:', companyData.id, companyData.name);
            setCompanies([companyData]);
            setCurrentCompany(companyData);
          } else {
            console.warn('[CompanyContext] Company not found in Firestore:', userData.companyId);
            // Fallback: try to find villa-park company (data migration issue)
            const fallbackDoc = await getDoc(doc(db, 'companies', 'villa-park'));
            if (fallbackDoc.exists()) {
              const companyData = { id: fallbackDoc.id, ...fallbackDoc.data() };
              console.log('[CompanyContext] Fallback company loaded:', companyData.id, companyData.name);
              setCompanies([companyData]);
              setCurrentCompany(companyData);
            } else {
              console.warn('[CompanyContext] Fallback company also not found');
            }
          }
        } else {
          console.warn('[CompanyContext] No companyId in userData for:', user?.email);
        }
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
    isSuperAdmin: () => (userData?.role || '').toLowerCase() === 'superadmin',
    companyId: currentCompany?.id
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}
