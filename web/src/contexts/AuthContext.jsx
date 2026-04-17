import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { 
  ROLE_HIERARCHY, 
  canCreateRole, 
  getCreatableRoles, 
  canManageUser, 
  hasFeatureAccess,
  isHigherRole,
  getRoleLevel,
  canViewSalary,
  canViewEmployeeData
} from '../config/rolePermissions';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserDataState] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('auth_userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const isLegacyCompanyId = (companyId) => {
    const legacy = String(companyId || '').toLowerCase();
    return legacy === 'sunisland-resort-and-spa' || legacy === 'villa-park';
  };

  const setUserData = (data) => {
    setUserDataState(data);
    if (data) {
      localStorage.setItem('auth_userData', JSON.stringify(data));
    } else {
      localStorage.removeItem('auth_userData');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          let data = userDoc.data();
          
          // If superadmin has no company, auto-assign to first company
          if (data.role === 'superadmin' && !data.companyId) {
            const companiesQuery = query(collection(db, 'companies'), limit(1));
            const companiesSnap = await getDocs(companiesQuery);
            if (!companiesSnap.empty) {
              const firstCompanyId = companiesSnap.docs[0].id;
              await updateDoc(doc(db, 'users', user.uid), {
                companyId: firstCompanyId,
                updatedAt: new Date().toISOString()
              });
              data = { ...data, companyId: firstCompanyId };
            }
          }
          
          // Sync department, position, and companyId from employee record if missing
          // Also resync companyId if it's an old/legacy value (data migration)
          if (!data.department || !data.position || !data.companyId || isLegacyCompanyId(data.companyId)) {
            try {
              const emailCandidates = [
                user.email,
                (user.email || '').toLowerCase()
              ].filter(Boolean);

              const tryEmployeeQuery = async (field, value) => {
                const q = query(collection(db, 'employees'), where(field, '==', value));
                return getDocs(q);
              };

              let employeesSnap = null;
              for (const email of emailCandidates) {
                employeesSnap = await tryEmployeeQuery('Email', email);
                if (!employeesSnap.empty) break;

                employeesSnap = await tryEmployeeQuery('email', email);
                if (!employeesSnap.empty) break;

                employeesSnap = await tryEmployeeQuery('PersonalEmailID', email);
                if (!employeesSnap.empty) break;

                employeesSnap = await tryEmployeeQuery('personalEmail', email);
                if (!employeesSnap.empty) break;

                employeesSnap = await tryEmployeeQuery('E-mail', email);
                if (!employeesSnap.empty) break;
              }

              if (employeesSnap && !employeesSnap.empty) {
                const employeeData = employeesSnap.docs[0].data();
                console.log('[AuthContext] Employee sync match found for:', user.email, 'employeeId:', employeesSnap.docs[0].id);
                const updates = {};
                if (!data.department && employeeData['Department ']) {
                  updates.department = employeeData['Department '];
                }
                if (!data.position && employeeData['Designation']) {
                  updates.position = employeeData['Designation'];
                }

                const empCompanyId = employeeData.companyId || employeeData.CompanyId || employeeData.company || employeeData.Company;
                if (( !data.companyId || isLegacyCompanyId(data.companyId) ) && empCompanyId) {
                  updates.companyId = empCompanyId;
                  console.log('[AuthContext] Syncing companyId from employee record:', empCompanyId);
                }
                if (Object.keys(updates).length > 0) {
                  await updateDoc(doc(db, 'users', user.uid), updates);
                  data = { ...data, ...updates };
                }
              } else {
                console.warn('[AuthContext] No matching employee record found to sync for:', user.email);
              }
            } catch (err) {
              console.error('Error syncing employee data:', err);
            }
          }
          
          setUserData(data);
        } else {
          // Auto-create user document if missing
          const isSuperadmin = user.email === 'retey.ay@hotmail.com';
          
          // Get first company for superadmin
          let companyId = null;
          if (isSuperadmin) {
            const companiesQuery = query(collection(db, 'companies'), limit(1));
            const companiesSnap = await getDocs(companiesQuery);
            if (!companiesSnap.empty) {
              companyId = companiesSnap.docs[0].id;
            }
          }
          
          // Try to get department/position from employee record
          let department = null;
          let position = null;
          try {
            const employeesQuery = query(
              collection(db, 'employees'),
              where('Email', '==', user.email)
            );
            const employeesSnap = await getDocs(employeesQuery);
            if (!employeesSnap.empty) {
              const employeeData = employeesSnap.docs[0].data();
              department = employeeData['Department '] || null;
              position = employeeData['Designation'] || null;
              // Also get companyId from employee if available
              if (!companyId && employeeData.companyId) {
                companyId = employeeData.companyId;
              }
            }
          } catch (err) {
            console.error('Error fetching employee data during auto-create:', err);
          }
          
          const newUserData = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: isSuperadmin ? 'superadmin' : 'staff',
            companyId: companyId,
            department: department,
            position: position,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', user.uid), newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Simplified signup with just name and password
  // Email will be generated or handled separately
  const signup = async (userData) => {
    const { email, password, name, role = 'staff', companyId = null, createdBy = null } = userData;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role,
      companyId,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  // Role checks based on new hierarchy
  const currentRole = userData?.role;
  
  // Legacy checks for backward compatibility
  const isHR = () => ['hrm', 'ahrm', 'hr', 'admin', 'superadmin', 'gm'].includes(userData?.role);
  const isGM = () => ['gm', 'general_manager', 'admin', 'superadmin'].includes(userData?.role);
  const isHRorGM = () => isHR() || isGM();
  const isAdmin = () => ['admin', 'superadmin'].includes(userData?.role);
  const isSuperAdmin = () => userData?.role === 'superadmin';
  
  // New hierarchical role checks
  const isHRM = () => userData?.role === 'hrm';
  const isDeptHead = () => userData?.role === 'dept_head';
  const isSupervisor = () => userData?.role === 'supervisor';
  const isStaff = () => userData?.role === 'staff';
  
  // Permission checks - uses custom permissions if set, otherwise defaults
  const canCreateUserRole = (targetRole) => canCreateRole(currentRole, targetRole);
  const getAllowedRolesToCreate = () => getCreatableRoles(currentRole);
  const canManageOtherUser = (otherUserRole) => canManageUser(currentRole, otherUserRole);
  
  const hasAccess = (feature, action) => {
    // First check if user has custom permissions set
    const customPerms = userData?.customPermissions;
    if (customPerms && customPerms[feature] && typeof customPerms[feature][action] === 'boolean') {
      return customPerms[feature][action];
    }
    // Fall back to default role-based permissions
    return hasFeatureAccess(currentRole, feature, action);
  };
  
  const isRoleHigherThan = (otherRole) => isHigherRole(currentRole, otherRole);
  const getCurrentRoleLevel = () => getRoleLevel(currentRole);

  // Data visibility filters based on role
  const getDataVisibilityFilter = () => {
    const userDept = userData?.department;
    // Prefer the currently selected company from CompanyContext (stored in localStorage)
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    let userCompany = selectedCompanyId || userData?.companyId;

    // Normalize legacy ids
    if (isLegacyCompanyId(userCompany)) {
      userCompany = selectedCompanyId || null;
    }
    
    switch (currentRole) {
      case 'superadmin':
        return { type: 'all' }; // See everything
      case 'gm':
        return { type: 'company', companyId: userCompany }; // GM sees only their company
      case 'hrm':
      case 'hr':
        return { type: 'company', companyId: userCompany }; // HR sees all in their company
      case 'dept_head':
        return { type: 'department', department: userDept, companyId: userCompany }; // Dept Head sees only their department
      case 'supervisor':
        return { type: 'department', department: userDept, companyId: userCompany }; // Supervisor sees only their department
      case 'staff':
        return { type: 'own', userId: user?.uid, companyId: userCompany }; // Staff sees only their own data
      default:
        return { type: 'company', companyId: userCompany };
    }
  };

  // Check if user can view specific employee data
  const canViewEmployee = (employee) => {
    const visibility = getDataVisibilityFilter();
    
    switch (visibility.type) {
      case 'all':
        return true;
      case 'company':
        return employee.companyId === visibility.companyId;
      case 'department':
        const empDept = employee['Department '] || employee.Department || employee.department || '';
        return employee.companyId === visibility.companyId && empDept === visibility.department;
      case 'own':
        // Staff can see if the employee record is linked to their user account
        // This requires employees to have a userId field linking to auth
        return employee.userId === visibility.userId || employee.email === userData?.email;
      default:
        return false;
    }
  };

  // Filter array of employees/documents based on visibility
  const filterByVisibility = (items) => {
    const visibility = getDataVisibilityFilter();
    
    if (visibility.type === 'all') return items;
    
    // Debug logging for department filter
    if (visibility.type === 'department' && items.length > 0) {
      const sampleDepts = items.slice(0, 5).map(i => ({ 
        id: i.id, 
        dept: i['Department '] || i.Department || i.department || 'NONE',
        companyId: i.companyId 
      }));
      console.log('[filterByVisibility] Sample departments:', sampleDepts);
      console.log('[filterByVisibility] Looking for dept:', visibility.department, 'in company:', visibility.companyId);
    }
    
    return items.filter(item => {
      switch (visibility.type) {
        case 'company':
          return item.companyId === visibility.companyId;
        case 'department':
          const itemDept = item['Department '] || item.Department || item.department || '';
          const matches = item.companyId === visibility.companyId && itemDept === visibility.department;
          if (!matches && item.id === items[0]?.id) {
            console.log('[filterByVisibility] First item dept check:', { itemDept, expected: visibility.department, companyId: item.companyId });
          }
          return matches;
        case 'own':
          return item.userId === visibility.userId || item.createdBy === visibility.userId || item.email === userData?.email;
        default:
          return false;
      }
    });
  };

  // Access Level-based visibility checks (new system)
  const canViewSalaryData = (targetUserRole, isOwnData = false) => {
    const accessLevel = userData?.accessLevel || 'level4';
    return canViewSalary(accessLevel, targetUserRole, isOwnData);
  };

  const canViewEmployeeByAccessLevel = (employee) => {
    const accessLevel = userData?.accessLevel || 'level4';
    const viewerDepartment = userData?.department;
    return canViewEmployeeData(accessLevel, employee.department, viewerDepartment);
  };

  // Get user's access level
  const getUserAccessLevel = () => userData?.accessLevel || 'level4';

  const value = {
    user,
    userData,
    login,
    signup,
    logout,
    // Legacy checks
    isHR,
    isGM,
    isHRorGM,
    isAdmin,
    isSuperAdmin,
    // New role checks
    isHRM,
    isDeptHead,
    isSupervisor,
    isStaff,
    // Permission functions
    canCreateUserRole,
    getAllowedRolesToCreate,
    canManageOtherUser,
    hasAccess,
    isRoleHigherThan,
    getCurrentRoleLevel,
    // Data visibility functions
    getDataVisibilityFilter,
    canViewEmployee,
    filterByVisibility,
    // Access Level-based visibility (new system)
    canViewSalaryData,
    canViewEmployeeByAccessLevel,
    getUserAccessLevel,
    // Raw data
    currentRole,
    ROLE_HIERARCHY,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
