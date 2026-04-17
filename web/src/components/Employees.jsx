import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Building2, Briefcase, FileText, AlertCircle, Grid, List, ChevronDown } from 'lucide-react';
import { collection, query, where, getDocs, limit, startAfter, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFilteredEmployees } from '../hooks/useFilteredFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { calculateDaysRemaining } from '../utils/helpers';

export default function Employees() {
  const { companyId } = useCompany();
  const { isHR, hasAccess, filterByVisibility, currentRole, userData } = useAuth();
  const canCreateEmployee = hasAccess('employees', 'create');
  const canEditEmployee = hasAccess('employees', 'edit');
  const canDeleteEmployee = hasAccess('employees', 'delete');
  
  // Debug logging for HRM permissions
  useEffect(() => {
    console.log('[Employees] Permission check:', {
      currentRole,
      isHR: isHR?.(),
      canEditEmployee,
      canDeleteEmployee,
      userData: userData ? { role: userData.role, department: userData.department, companyId: userData.companyId, customPermissions: userData.customPermissions } : null
    });
  }, [currentRole, isHR, canEditEmployee, canDeleteEmployee, userData]);
  
  const [employees, setEmployees] = useState([]); // Local state for paginated employees
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]); // For stats
  const [passports, setPassports] = useState([]);
  const [workPermits, setWorkPermits] = useState([]);
  const [visas, setVisas] = useState([]);
  const [medicals, setMedicals] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const PAGE_SIZE = 50;

  // Fetch ALL employees for dept_head/supervisor (no pagination - show entire department)
  const fetchAllDepartmentEmployees = useCallback(async () => {
    if (!companyId || !userData?.department) return;
    
    setLoading(true);
    try {
      // For dept_head/supervisor, fetch ALL company employees then filter by department
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '!=', 'terminated')
      );

      const snapshot = await getDocs(q);
      let allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter by department (case-insensitive, includes sub-departments)
      const userDept = userData.department.toLowerCase().trim();
      const filteredDocs = allDocs.filter(emp => {
        const empDept = (emp['Department '] || emp.Department || emp.department || '').toLowerCase().trim();
        return empDept === userDept || 
               empDept.startsWith(userDept + ' ') ||
               empDept.startsWith(userDept + '-') ||
               empDept.includes(' ' + userDept + ' ') ||
               empDept.includes('-' + userDept + ' ') ||
               empDept.includes('(' + userDept + ')');
      });

      console.log('[Employees] Fetched all department employees:', filteredDocs.length, 'of', allDocs.length, 'total');
      setEmployees(filteredDocs);
      setHasMore(false); // No pagination for dept_head
    } catch (err) {
      console.error('Error fetching department employees:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, userData]);

  // Fetch employees with pagination (excluding terminated) - for HR roles
  const fetchEmployees = useCallback(async (isInitial = false) => {
    if (!companyId) return;
    
    // For dept_head/supervisor, use the all-department fetch instead
    const userRole = userData?.role;
    if (['dept_head', 'supervisor'].includes(userRole)) {
      if (isInitial) {
        await fetchAllDepartmentEmployees();
      }
      return;
    }
    
    setLoading(true);
    try {
      let q;
      if (isInitial) {
        q = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId),
          where('status', '!=', 'terminated'),
          limit(PAGE_SIZE)
        );
      } else if (lastDoc) {
        q = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId),
          where('status', '!=', 'terminated'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        setLoading(false);
        return;
      }

      const snapshot = await getDocs(q);
      let newDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter by department for dept_head and supervisor roles (case-insensitive)
      const userRole = userData?.role;
      const userDept = userData?.department?.toLowerCase().trim();
      if (['dept_head', 'supervisor'].includes(userRole) && userDept) {
        newDocs = newDocs.filter(emp => {
          const empDept = (emp['Department '] || emp.Department || emp.department || '').toLowerCase().trim();
          return empDept === userDept;
        });
      }

      if (newDocs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (newDocs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setEmployees(prev => isInitial ? newDocs : [...prev, ...newDocs]);
      } else if (isInitial) {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, lastDoc, userData, fetchAllDepartmentEmployees]);

  // Fetch ALL employees for stats ONLY when requested (to save reads) - excluding terminated
  const fetchAllEmployeesForStats = useCallback(async () => {
    if (!companyId) return;
    
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '!=', 'terminated')
      );
      const snapshot = await getDocs(q);
      const allDocs = snapshot.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          status: data.status,
          department: data['Department '] || data.Department || data.department,
          country: data.Nationality || data.country
        };
      });
      setAllEmployees(allDocs);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [companyId]);

  // Calculate approximate stats from loaded employees only
  const getApproxStats = () => {
    const loadedCount = employees.length;
    const activeCount = employees.filter(e => e.status === 'active').length;
    const inactiveCount = loadedCount - activeCount;
    const deptCount = new Set(employees.map(e => e['Department '] || e.Department || e.department).filter(Boolean)).size;
    const countryCount = new Set(employees.map(e => e.Nationality || e.country).filter(Boolean)).size;
    
    return {
      total: loadedCount,
      active: activeCount,
      inactive: inactiveCount,
      departments: deptCount,
      countries: countryCount,
      isApproximate: loadedCount < (allEmployees.length || loadedCount)
    };
  };

  // Fetch related documents for visible employees
  const fetchRelatedDocs = useCallback(async (employeeIds) => {
    if (!companyId || employeeIds.length === 0) return;
    
    try {
      const [passSnap, permitSnap, visaSnap, medSnap] = await Promise.all([
        getDocs(query(collection(db, 'passports'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'workPermits'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'visas'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'medicals'), where('companyId', '==', companyId)))
      ]);

      setPassports(passSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setWorkPermits(permitSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setVisas(visaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMedicals(medSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching related docs:', err);
    }
  }, [companyId]);

  // Initial load - DON'T fetch all stats automatically to save reads
  useEffect(() => {
    setEmployees([]);
    setAllEmployees([]);
    setLastDoc(null);
    setHasMore(true);
    setPassports([]);
    setWorkPermits([]);
    setVisas([]);
    setMedicals([]);
    fetchEmployees(true);
    // Removed automatic fetchAllEmployeesForStats to save quota
  }, [companyId]);

  // Load related docs when employees change
  useEffect(() => {
    const ids = employees.map(e => e.id);
    fetchRelatedDocs(ids);
  }, [employees, fetchRelatedDocs]);

  const handleLoadMore = () => {
    fetchEmployees(false);
  };

  const handleDelete = async () => {
    if (selectedEmployee) {
      try {
        await deleteDoc(doc(db, 'employees', selectedEmployee.id));
        setEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
      } catch (err) {
        console.error('Error deleting:', err);
      }
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    }
  };

  const getEmployeeDocuments = (employeeId) => {
    return {
      passport: passports.find(p => p.employeeId === employeeId),
      workPermit: workPermits.find(w => w.employeeId === employeeId),
      visa: visas.find(v => v.employeeId === employeeId),
      medical: medicals.find(m => m.employeeId === employeeId)
    };
  };

  const getExpiringCount = (docs) => {
    let count = 0;
    if (docs.passport && calculateDaysRemaining(docs.passport.expiryDate) <= 30) count++;
    if (docs.workPermit && calculateDaysRemaining(docs.workPermit.expiryDate) <= 30) count++;
    if (docs.visa && calculateDaysRemaining(docs.visa.expiryDate) <= 30) count++;
    if (docs.medical && calculateDaysRemaining(docs.medical.expiryDate) <= 30) count++;
    return count;
  };

  // Search all employees from Firestore when search term is entered
  const searchAllEmployees = useCallback(async (term) => {
    if (!companyId || !term.trim()) {
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    setLoading(true);
    try {
      // Fetch all employees for this company (without pagination limit)
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '!=', 'terminated')
      );
      const snapshot = await getDocs(q);
      const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter client-side by search term
      const searchLower = term.toLowerCase();
      const matched = allDocs.filter(emp => {
        const name = emp.FullName || emp.name || '';
        const empId = emp.EmpID || emp.employeeId || '';
        const nationality = emp.Nationality || emp.country || '';
        return String(name).toLowerCase().includes(searchLower) ||
               String(empId).toLowerCase().includes(searchLower) ||
               String(nationality).toLowerCase().includes(searchLower);
      });
      
      setEmployees(matched);
      setHasMore(false); // Disable pagination when searching
    } catch (err) {
      console.error('Error searching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      // Search across all employees
      searchAllEmployees(value);
    } else {
      // Reset to paginated view
      setIsSearching(false);
      setHasMore(true);
      setLastDoc(null);
      fetchEmployees(true);
    }
  };

  // Filter employees client-side (apply role-based visibility first)
  const visibleEmployees = filterByVisibility(employees);
  
  // Debug logging for visibility
  useEffect(() => {
    console.log('[Employees] Total employees:', employees.length);
    console.log('[Employees] Visible after role filter:', visibleEmployees.length);
    console.log('[Employees] User dept:', userData?.department, 'Role:', currentRole);
    if (visibleEmployees.length > 0 && visibleEmployees.length < 5) {
      console.log('[Employees] Visible list:', visibleEmployees.map(e => ({ 
        id: e.id, 
        name: e.FullName || e.name, 
        dept: e['Department '] || e.Department || e.department 
      })));
    }
  }, [employees, visibleEmployees, userData, currentRole]);
  
  const filteredEmployees = isSearching ? visibleEmployees : visibleEmployees.filter(emp => {
    const name = emp.FullName || emp.name || '';
    const empId = emp.EmpID || emp.employeeId || '';
    const nationality = emp.Nationality || emp.country || '';
    const dept = emp['Department '] || emp.Department || emp.department || '';
    
    const matchesSearch = !searchTerm || 
      String(name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(empId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(nationality).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDepartment || dept === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departments = [...new Set(employees.map(e => e['Department '] || e.Department || e.department).filter(Boolean))];

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient with Illustration */}
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Good team-amico (1).svg" 
            alt="Team" 
            className="h-full object-contain"
          />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-7">👥 Employees</h2>
          <p className="mt-1 text-sm text-white/80">Manage expatriate employee records</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3 relative z-10">
          <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>
              <Grid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
          {canCreateEmployee && (
            <Link to="/employees/new" className="inline-flex items-center px-5 py-2 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 shadow-lg transition-all hover:scale-105 font-semibold">
              <Plus className="h-5 w-5 mr-2" />
              Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* Filters - Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-400" />
            <input
              type="text"
              placeholder="🔍 Search all employees..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="sm:w-56">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="">🏢 All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats - Colorful Gradient Cards - Responsive: 2 cols on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {(() => {
          const stats = getApproxStats();
          return (
            <>
              <button onClick={() => {setSearchTerm(''); setFilterDepartment('');}} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white transform hover:scale-105 transition-all text-left">
                <p className="text-sm text-blue-100 font-medium">📊 Total</p>
                <p className="text-3xl font-bold mt-1">{stats.total}{stats.isApproximate && <span className="text-sm">+</span>}</p>
              </button>
              <button onClick={() => {setSearchTerm(''); /* Filter active via status */}} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-5 text-white transform hover:scale-105 transition-all text-left">
                <p className="text-sm text-emerald-100 font-medium">✅ Active</p>
                <p className="text-3xl font-bold mt-1">{stats.active}{stats.isApproximate && <span className="text-sm">+</span>}</p>
              </button>
              <button onClick={() => {setSearchTerm(''); /* Filter inactive via status */}} className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg p-5 text-white transform hover:scale-105 transition-all text-left">
                <p className="text-sm text-rose-100 font-medium">⏸️ Inactive</p>
                <p className="text-3xl font-bold mt-1">{stats.inactive}{stats.isApproximate && <span className="text-sm">+</span>}</p>
              </button>
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-5 text-white">
                <p className="text-sm text-amber-100 font-medium">🏢 Departments</p>
                <p className="text-3xl font-bold mt-1">{stats.departments}</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg p-5 text-white">
                <p className="text-sm text-violet-100 font-medium">🌍 Countries</p>
                <p className="text-3xl font-bold mt-1">{stats.countries}</p>
              </div>
              <Link to="/terminations" className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-5 text-white transform hover:scale-105 transition-all cursor-pointer flex flex-col justify-between">
                <p className="text-sm text-red-100 font-medium">🚪 Terminations</p>
                <p className="text-3xl font-bold mt-1">View →</p>
              </Link>
            </>
          );
        })()}
      </div>
      
      {/* Load Accurate Stats Button - saves quota by not auto-fetching */}
      {allEmployees.length === 0 && (
        <div className="flex justify-center">
          <button
            onClick={fetchAllEmployeesForStats}
            className="text-xs text-gray-500 hover:text-indigo-600 underline"
          >
            Load accurate stats (uses {employees.length}+ reads)
          </button>
        </div>
      )}

      {/* Grid View - Modern Cards - Responsive */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredEmployees.map((employee) => {
            const docs = getEmployeeDocuments(employee.id);
            const expiringCount = getExpiringCount(docs);
            
            return (
              <div key={employee.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-20 relative">
                  <div className="absolute -bottom-8 left-6">
                    {employee.photoURL ? (
                      <img
                        src={employee.photoURL}
                        alt={employee.name}
                        className="h-16 w-16 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {(employee.FullName || employee.name || 'N/A').charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  {expiringCount > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {expiringCount} Alert
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-10 pb-6 px-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{employee.FullName || employee.name || 'N/A'}</h3>
                    <p className="text-sm text-gray-500 font-medium">{employee.EmpID || employee.employeeId || 'N/A'}</p>
                  </div>

                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-2">
                      <Building2 className="h-4 w-4 mr-3 text-indigo-500" />
                      <span className="truncate font-medium">{employee.Division || employee.division || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-2">
                      <Briefcase className="h-4 w-4 mr-3 text-purple-500" />
                      <span className="truncate font-medium">{employee['Department '] || employee.Department || employee.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-2">
                      <span className="text-lg mr-2">🌍</span>
                      <span className="font-medium">{employee.Nationality || employee.country || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700 bg-gray-50 rounded-lg p-2">
                      <span className="text-lg mr-2">📅</span>
                      <span className="font-medium">DOJ: {employee.DOJ ? new Date(employee.DOJ).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Document Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {docs.passport && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        calculateDaysRemaining(docs.passport.expiryDate) <= 30 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        🛂 PP: {calculateDaysRemaining(docs.passport.expiryDate) > 0 ? `${calculateDaysRemaining(docs.passport.expiryDate)}d` : 'Exp'}
                      </span>
                    )}
                    {docs.workPermit && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        calculateDaysRemaining(docs.workPermit.expiryDate) <= 30 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        📄 WP: {calculateDaysRemaining(docs.workPermit.expiryDate) > 0 ? `${calculateDaysRemaining(docs.workPermit.expiryDate)}d` : 'Exp'}
                      </span>
                    )}
                    {docs.visa && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        calculateDaysRemaining(docs.visa.expiryDate) <= 30 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}>
                        🎫 V: {calculateDaysRemaining(docs.visa.expiryDate) > 0 ? `${calculateDaysRemaining(docs.visa.expiryDate)}d` : 'Exp'}
                      </span>
                    )}
                    {docs.medical && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        calculateDaysRemaining(docs.medical.expiryDate) <= 30 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-teal-100 text-teal-700 border border-teal-200'
                      }`}>
                        🏥 M: {calculateDaysRemaining(docs.medical.expiryDate) > 0 ? `${calculateDaysRemaining(docs.medical.expiryDate)}d` : 'Exp'}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${
                    employee.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {employee.status === 'active' ? '● Active' : '○ Inactive'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                    <Link to={`/employees/${employee.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center transition-colors">
                      <Eye className="h-4 w-4 mr-1" />
                      View Profile
                    </Link>
                    {(canEditEmployee || canDeleteEmployee) && (
                      <div className="flex space-x-2">
                        {canEditEmployee && (
                          <Link to={`/employees/${employee.id}`} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        )}
                        {canDeleteEmployee && (
                          <button
                            onClick={() => { setSelectedEmployee(employee); setShowDeleteModal(true); }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View - Modern Table with Horizontal Scroll on Mobile */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[640px] sm:min-w-full px-4 sm:px-0">
              <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">👤 Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">🏢 Department</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">📊 Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">📄 Docs</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">⚙️ Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEmployees.map((employee) => {
                  const docs = getEmployeeDocuments(employee.id);
                  const expiringCount = getExpiringCount(docs);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {employee.photoURL ? (
                            <img
                              src={employee.photoURL}
                              alt={employee.FullName || employee.name}
                              className="h-12 w-12 rounded-xl object-cover shadow-md"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-lg">{(employee.FullName || employee.name || 'N/A').charAt(0)}</span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{employee.FullName || employee.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500 font-medium">{employee.EmpID || employee.employeeId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{employee['Department '] || employee.Department || employee.department || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{employee.Division || employee.division || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full ${
                          employee.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {employee.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
                        {expiringCount > 0 && (
                          <span className="ml-2 px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            🔔 {expiringCount} expiring
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {docs.passport && (
                            <div className="p-2 bg-emerald-100 rounded-lg" title="Passport">
                              <FileText className="h-4 w-4 text-emerald-600" />
                            </div>
                          )}
                          {docs.workPermit && (
                            <div className="p-2 bg-blue-100 rounded-lg" title="Work Permit">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {docs.visa && (
                            <div className="p-2 bg-purple-100 rounded-lg" title="Visa">
                              <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                          {docs.medical && (
                            <div className="p-2 bg-teal-100 rounded-lg" title="Medical">
                              <FileText className="h-4 w-4 text-teal-600" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/employees/${employee.id}`} className="text-indigo-600 hover:text-indigo-900 font-bold mr-4 transition-colors">View</Link>
                        {(canEditEmployee || canDeleteEmployee) && (
                          <>
                            {canEditEmployee && (
                              <Link to={`/employees/${employee.id}`} className="text-indigo-500 hover:text-indigo-700 font-bold mr-4 transition-colors">Edit</Link>
                            )}
                            {canDeleteEmployee && (
                              <button onClick={() => { setSelectedEmployee(employee); setShowDeleteModal(true); }} className="text-rose-500 hover:text-rose-700 font-bold transition-colors">Delete</button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Modern */}
      {filteredEmployees.length === 0 && !loading && (
        <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Load More - Modern Button */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 mr-3 border-b-2 border-white rounded-full"></div>
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-5 w-5 mr-2" />
                Load More Employees
              </>
            )}
          </button>
        </div>
      )}

      <div className="text-center text-sm font-medium text-gray-500 bg-white/80 backdrop-blur-sm rounded-xl py-3 px-4 inline-block mx-auto">
        📊 Showing {filteredEmployees.length} of {visibleEmployees.length} employees
      </div>

      {/* Delete Modal - Mobile Responsive */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl transform scale-100 transition-all">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Employee</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{selectedEmployee?.name}</span>?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
