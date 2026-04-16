import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Network,
  ChevronDown,
  ChevronRight,
  Loader2,
  Building2,
  Crown,
  UserCircle,
  Briefcase,
  Layers,
  Search,
  Filter,
  GitBranch,
  List,
  TreePine
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';

// Tree Node Component
function TreeNode({ employee, level = 0, isLast = false, children = [] }) {
  const hasChildren = children && children.length > 0;

  return (
    <div className="relative">
      {/* Connection Line - Vertical */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 w-px bg-gray-300"
          style={{
            height: isLast ? '24px' : '100%',
            left: `${level * 32 - 16}px`
          }}
        />
      )}

      {/* Connection Line - Horizontal */}
      {level > 0 && (
        <div
          className="absolute top-6 h-px bg-gray-300"
          style={{
            width: '16px',
            left: `${level * 32 - 16}px`
          }}
        />
      )}

      {/* Node Card */}
      <div
        className="flex items-center gap-3 py-2"
        style={{ paddingLeft: `${level * 32}px` }}
      >
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {employee.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{employee.name}</p>
            <p className="text-sm text-gray-500">{employee.designation}</p>
            {employee.email && (
              <p className="text-xs text-gray-400">{employee.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <div className="relative">
          {children.map((child, index) => (
            <TreeNode
              key={child.id}
              employee={child}
              level={level + 1}
              isLast={index === children.length - 1}
              children={child.children}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Position hierarchy levels (higher = more senior)
const POSITION_LEVELS = {
  'General Manager': 10,
  'Director': 9,
  'Manager': 8,
  'Assistant Manager': 7,
  'Supervisor': 6,
  'Coordinator': 5,
  'Senior': 4,
  'Officer': 3,
  'Executive': 2,
  'Assistant': 1,
  'Default': 0
};

function getPositionLevel(designation) {
  if (!designation) return POSITION_LEVELS['Default'];
  const desig = designation.toLowerCase();

  for (const [position, level] of Object.entries(POSITION_LEVELS)) {
    if (desig.includes(position.toLowerCase())) return level;
  }
  return POSITION_LEVELS['Default'];
}

function getLevelName(level) {
  for (const [name, lvl] of Object.entries(POSITION_LEVELS)) {
    if (lvl === level) return name;
  }
  return 'Staff';
}

export default function OrgStructure() {
  const [selectedDept, setSelectedDept] = useState(null);
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'tree', or 'hierarchy'
  const { companyId } = useCompany();
  const { userData } = useAuth();

  const { documents: employees, loading } = useFirestore('employees');

  // Check user role for department filtering
  const userRole = userData?.role;
  const userDept = userData?.department;
  const isAdmin = userRole === 'superadmin' || userRole === 'gm' || userRole === 'hrm' || userRole === 'hr';

  // Filter employees by company and search
  const companyEmployees = useMemo(() => {
    return employees.filter(e => {
      if (e.companyId !== companyId) return false;
      
      // Filter by user department for non-admins
      const empDept = e['Department '] || e.Department || e.department;
      if (!isAdmin && userDept && empDept !== userDept) return false;
      
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        (e.FullName || e.name || '').toLowerCase().includes(search) ||
        (e.Designation || e.position || '').toLowerCase().includes(search) ||
        (e['Department '] || e.Department || '').toLowerCase().includes(search)
      );
    });
  }, [employees, companyId, searchTerm, isAdmin, userDept]);

  // Group by department and then by level
  const orgStructure = useMemo(() => {
    const deptMap = new Map();

    companyEmployees.forEach(emp => {
      const dept = emp['Department '] || emp.Department || 'Unassigned';
      const designation = emp.Designation || emp.position || 'Staff';
      const level = getPositionLevel(designation);

      if (!deptMap.has(dept)) {
        deptMap.set(dept, new Map());
      }

      const levelMap = deptMap.get(dept);
      if (!levelMap.has(level)) {
        levelMap.set(level, []);
      }

      levelMap.get(level).push({
        id: emp.id,
        name: emp.FullName || emp.name,
        designation,
        email: emp.Email || emp.email,
        level
      });
    });

    // Convert to sorted array
    return Array.from(deptMap.entries())
      .map(([deptName, levelMap]) => ({
        name: deptName,
        totalCount: companyEmployees.filter(e =>
          (e['Department '] || e.Department || 'Unassigned') === deptName
        ).length,
        levels: Array.from(levelMap.entries())
          .sort((a, b) => b[0] - a[0]) // Higher level first
          .map(([level, employees]) => ({
            level,
            levelName: getLevelName(level),
            employees: employees.sort((a, b) => a.name.localeCompare(b.name))
          }))
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companyEmployees]);

  const toggleDept = (deptName) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptName)) {
        newSet.delete(deptName);
      } else {
        newSet.add(deptName);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading organization data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img
            src="/storyset/Company-cuate.svg"
            alt="Org Structure"
            className="h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 relative z-10">
          <Network className="h-8 w-8" />
          Organization Structure
        </h1>
        <p className="text-violet-100 mt-1 relative z-10">
          View by Department and Hierarchy Level
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Departments', value: orgStructure.length, icon: Building2, color: 'bg-violet-500' },
          { label: 'Total Employees', value: companyEmployees.length, icon: Users, color: 'bg-purple-500' },
          { label: 'Management', value: companyEmployees.filter(e => getPositionLevel(e.Designation) >= 6).length, icon: Crown, color: 'bg-pink-500' },
          { label: 'Avg per Dept', value: orgStructure.length > 0 ? Math.round(companyEmployees.length / orgStructure.length) : 0, icon: Layers, color: 'bg-indigo-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and View Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, position, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-gray-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
          <div className="h-6 w-px bg-gray-300 mx-2" />
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              Tree
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Network className="h-4 w-4" />
              Chart
            </button>
            <button
              onClick={() => setViewMode('leadership')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'leadership'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="h-4 w-4" />
              Leadership
            </button>
          </div>
        </div>
      </div>

      {/* Organization Structure - List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {orgStructure.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Network className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No employees found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm ? 'Try a different search term' : 'Add employees to build org structure'}
              </p>
            </div>
          ) : (
            orgStructure.map((dept) => (
              <div key={dept.name} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Department Header */}
                <button
                  onClick={() => toggleDept(dept.name)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedDepts.has(dept.name) ? (
                      <ChevronDown className="h-5 w-5 text-violet-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-violet-600" />
                    )}
                    <Building2 className="h-5 w-5 text-violet-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">
                        {dept.levels.length} level{dept.levels.length !== 1 ? 's' : ''} • {dept.totalCount} employee{dept.totalCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dept.levels.slice(0, 3).map((level) => (
                      <span
                        key={level.level}
                        className="px-2 py-1 bg-white rounded text-xs font-medium text-violet-700 shadow-sm"
                      >
                        {level.levelName}
                      </span>
                    ))}
                    {dept.levels.length > 3 && (
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-500 shadow-sm">
                        +{dept.levels.length - 3} more
                      </span>
                    )}
                  </div>
                </button>

                {/* Department Levels */}
                {expandedDepts.has(dept.name) && (
                  <div className="p-4 space-y-6">
                    {dept.levels.map((level) => (
                      <div key={level.level} className="border-l-4 border-violet-300 pl-4">
                        {/* Level Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <Crown className="h-4 w-4 text-violet-500" />
                          <h4 className="font-medium text-violet-900">{level.levelName}</h4>
                          <span className="text-sm text-gray-500">({level.employees.length})</span>
                        </div>

                        {/* Employees in this level */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {level.employees.map((emp) => (
                            <div
                              key={emp.id}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-violet-50 transition-colors"
                            >
                              <div className="h-10 w-10 rounded-full bg-violet-200 flex items-center justify-center">
                                <UserCircle className="h-6 w-6 text-violet-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                                <p className="text-sm text-gray-500 truncate">{emp.designation}</p>
                                {emp.email && (
                                  <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Organization Structure - Tree View */}
      {viewMode === 'tree' && (
        <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
          {orgStructure.length === 0 ? (
            <div className="p-12 text-center">
              <TreePine className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No employees found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {orgStructure.map((dept) => (
                <div key={dept.name}>
                  {/* Department Root */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">{dept.totalCount} employees</p>
                    </div>
                  </div>

                  {/* Tree Structure */}
                  <div className="pl-6 border-l-2 border-gray-200 ml-6">
                    {dept.levels.map((level, levelIndex) => (
                      <div key={level.level} className="mb-4">
                        {/* Level Label */}
                        <div className="flex items-center gap-2 mb-2 -ml-6">
                          <div className="w-4 h-px bg-gray-300" />
                          <span className="text-sm font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded">
                            {level.levelName}
                          </span>
                        </div>

                        {/* Employees at this level */}
                        <div className="space-y-2">
                          {level.employees.map((emp, empIndex) => (
                            <TreeNode
                              key={emp.id}
                              employee={emp}
                              level={0}
                              isLast={empIndex === level.employees.length - 1 && levelIndex === dept.levels.length - 1}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Organization Structure - Hierarchy Chart View */}
      {viewMode === 'hierarchy' && (
        <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
          {orgStructure.length === 0 ? (
            <div className="p-12 text-center">
              <Network className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No employees found</p>
            </div>
          ) : (
            <div className="min-w-max flex flex-col items-center">
              {/* Company Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Organization Structure</h2>
              </div>

              {orgStructure.map((dept) => {
                const topLevel = dept.levels.find(l => l.level >= 9);
                const managerLevel = dept.levels.find(l => l.level === 8 || l.level === 7);
                const supervisorLevel = dept.levels.find(l => l.level === 6 || l.level === 5);
                const staffLevel = dept.levels.find(l => l.level <= 4);

                const ceo = topLevel?.employees?.[0];
                const managers = managerLevel?.employees || [];
                const tls = supervisorLevel?.employees || [];
                const workers = staffLevel?.employees || [];

                // Node component
                const Node = ({ emp, type }) => {
                  const styles = {
                    ceo: { circle: 'w-24 h-24 text-2xl from-pink-400 to-pink-600 border-pink-300', badge: 'bg-pink-500', label: 'CEO' },
                    manager: { circle: 'w-20 h-20 text-xl from-orange-400 to-orange-600 border-orange-300', badge: 'bg-orange-500', label: 'MANAGER' },
                    tl: { circle: 'w-16 h-16 text-lg from-emerald-400 to-emerald-600 border-emerald-300', badge: 'bg-emerald-500', label: 'TL' },
                    worker: { circle: 'w-14 h-14 text-base from-blue-400 to-blue-600 border-blue-300', badge: 'bg-blue-500', label: emp.designation?.toUpperCase()?.slice(0, 8) || 'WORKER' }
                  };
                  const s = styles[type];

                  return (
                    <div className="flex flex-col items-center mx-2">
                      <div className={`${s.circle} rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg border-4`}>
                        {emp.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className={`mt-1 ${s.badge} text-white px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap`}>
                        {s.label}
                      </div>
                      <p className="text-[10px] font-medium text-gray-700 mt-1 text-center max-w-[80px] leading-tight">
                        {emp.name}
                      </p>
                    </div>
                  );
                };

                return (
                  <div key={dept.name} className="mb-12 flex flex-col items-center">
                    {/* Department Badge */}
                    <div className="mb-6 bg-violet-100 text-violet-800 px-4 py-1 rounded-full text-sm font-semibold">
                      {dept.name}
                    </div>

                    {/* Tree Layout */}
                    <div className="flex flex-col items-center">
                      {/* CEO Level */}
                      {ceo && (
                        <div className="mb-6">
                          <Node emp={ceo} type="ceo" />
                        </div>
                      )}

                      {/* Connector to Managers */}
                      {managers.length > 0 && ceo && (
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-px h-6 bg-gray-400" />
                          <div className="flex">
                            <div className="w-32 h-px bg-gray-400" />
                            <div className="w-32 h-px bg-gray-400" />
                          </div>
                        </div>
                      )}

                      {/* Managers Level */}
                      {managers.length > 0 && (
                        <div className="flex justify-center gap-16 mb-6">
                          {managers.map((m, i) => (
                            <div key={m.id} className="flex flex-col items-center relative">
                              <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-400 -translate-x-1/2" />
                              <Node emp={m} type="manager" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Connector to TLs */}
                      {tls.length > 0 && managers.length > 0 && (
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-px h-4 bg-gray-400" />
                          <div className="flex gap-16">
                            {managers.map((_, i) => (
                              <div key={i} className="flex">
                                <div className="w-20 h-px bg-gray-400" />
                                <div className="w-20 h-px bg-gray-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TLs Level */}
                      {tls.length > 0 && (
                        <div className="flex justify-center gap-8 mb-6">
                          {tls.map((tl, i) => (
                            <div key={tl.id} className="flex flex-col items-center relative">
                              <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-400 -translate-x-1/2" />
                              <Node emp={tl} type="tl" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Connector to Workers */}
                      {workers.length > 0 && tls.length > 0 && (
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-px h-4 bg-gray-300" />
                          <div className="flex gap-8">
                            {tls.map((_, i) => (
                              <div key={i} className="w-16 h-px bg-gray-300" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Workers Level */}
                      {workers.length > 0 && (
                        <div className="flex justify-center gap-6 flex-wrap max-w-4xl">
                          {workers.map((w, i) => (
                            <div key={w.id} className="flex flex-col items-center relative">
                              <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-300 -translate-x-1/2" />
                              <Node emp={w} type="worker" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Leadership View - GM and Department Heads */}
      {viewMode === 'leadership' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          {orgStructure.length === 0 ? (
            <div className="p-12 text-center">
              <Crown className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No leadership data found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* GM Section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <Crown className="h-6 w-6 text-amber-600" />
                  General Manager
                </h3>
                <div className="flex flex-wrap gap-4">
                  {companyEmployees
                    .filter(e => {
                      const desig = (e.Designation || e.position || '').toLowerCase();
                      return desig.includes('gm') || desig.includes('general manager') || desig.includes('director') || desig.includes('ceo');
                    })
                    .map(emp => (
                      <div key={emp.id} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-amber-200">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                          {(emp.FullName || emp.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{emp.FullName || emp.name}</p>
                          <p className="text-sm text-amber-700 font-medium">{emp.Designation || emp.position}</p>
                          <p className="text-xs text-gray-500">{emp['Department '] || emp.Department || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Department Heads Section */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-violet-800 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-violet-600" />
                  Department Heads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyEmployees
                    .filter(e => {
                      const desig = (e.Designation || e.position || '').toLowerCase();
                      return desig.includes('head') || desig.includes('hod') || desig.includes('manager') || desig.includes('supervisor');
                    })
                    .sort((a, b) => (a['Department '] || a.Department || '').localeCompare(b['Department '] || b.Department || ''))
                    .map(emp => (
                      <div key={emp.id} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-violet-200">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                          {(emp.FullName || emp.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{emp.FullName || emp.name}</p>
                          <p className="text-sm text-violet-700 font-medium">{emp.Designation || emp.position}</p>
                          <p className="text-xs text-gray-500">{emp['Department '] || emp.Department || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-100 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-amber-800">
                    {companyEmployees.filter(e => {
                      const desig = (e.Designation || e.position || '').toLowerCase();
                      return desig.includes('gm') || desig.includes('general manager') || desig.includes('director') || desig.includes('ceo');
                    }).length}
                  </p>
                  <p className="text-sm text-amber-700 font-medium">Executives</p>
                </div>
                <div className="bg-violet-100 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-violet-800">
                    {companyEmployees.filter(e => {
                      const desig = (e.Designation || e.position || '').toLowerCase();
                      return desig.includes('head') || desig.includes('hod') || desig.includes('manager') || desig.includes('supervisor');
                    }).length}
                  </p>
                  <p className="text-sm text-violet-700 font-medium">Department Heads</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
