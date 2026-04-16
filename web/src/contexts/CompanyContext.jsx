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
      if (['superadmin', 'gm', 'hrm', 'dept_head', 'supervisor'].includes(userData.role)) {
        const companiesSnap = await getDocs(collection(db, 'companies'));
        const companiesList = companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(companiesList);
        
        // Set first company as default or from localStorage
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        if (savedCompanyId) {
          const found = companiesList.find(c => c.id === savedCompanyId);
          if (found) setCurrentCompany(found);
          else if (companiesList.length > 0) setCurrentCompany(companiesList[0]);
        } else if (companiesList.length > 0) {
          setCurrentCompany(companiesList[0]);
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
    isSuperAdmin: () => userData?.role === 'superadmin',
    companyId: currentCompany?.id
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}
