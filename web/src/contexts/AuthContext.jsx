import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, limit } from 'firebase/firestore';
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
          
          const newUserData = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role: isSuperadmin ? 'superadmin' : 'staff',
            companyId: companyId,
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
  const isHR = () => ['hrm', 'hr', 'admin', 'superadmin', 'gm'].includes(userData?.role);
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
    const userCompany = userData?.companyId;
    
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
        return employee.companyId === visibility.companyId && employee.department === visibility.department;
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
    
    return items.filter(item => {
      switch (visibility.type) {
        case 'company':
          return item.companyId === visibility.companyId;
        case 'department':
          return item.companyId === visibility.companyId && item.department === visibility.department;
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
