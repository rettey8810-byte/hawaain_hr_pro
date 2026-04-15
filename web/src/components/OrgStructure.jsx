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
  TreePine,
  Network
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';

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

  const { documents: employees, loading } = useFirestore('employees');

  // Filter employees by company and search
  const companyEmployees = useMemo(() => {
    return employees.filter(e => {
      if (e.companyId !== companyId) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        (e.FullName || e.name || '').toLowerCase().includes(search) ||
        (e.Designation || e.position || '').toLowerCase().includes(search) ||
        (e['Department '] || e.Department || '').toLowerCase().includes(search)
      );
    });
  }, [employees, companyId, searchTerm]);

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
        <div className="bg-white rounded-xl shadow-sm p-8 overflow-x-auto">
          {orgStructure.length === 0 ? (
            <div className="p-12 text-center">
              <Network className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No employees found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center min-w-max">
              {orgStructure.map((dept) => {
                // Build hierarchy levels for this department
                const gmLevel = dept.levels.find(l => l.level === 10 || l.levelName.includes('General Manager'));
                const directorLevel = dept.levels.find(l => l.level === 9 || l.levelName.includes('Director'));
                const managerLevel = dept.levels.find(l => l.level === 8 || l.levelName.includes('Manager'));
                const asstMgrLevel = dept.levels.find(l => l.level === 7 || l.levelName.includes('Assistant Manager'));
                const supervisorLevel = dept.levels.find(l => l.level === 6 || l.levelName.includes('Supervisor'));
                const otherLevels = dept.levels.filter(l => l.level <= 5);

                return (
                  <div key={dept.name} className="mb-12 w-full">
                    {/* Department Title */}
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-gray-800 bg-violet-100 inline-block px-6 py-2 rounded-full">
                        {dept.name}
                      </h3>
                    </div>

                    {/* Level 1: GM/Director */}
                    <div className="flex justify-center mb-8">
                      {(gmLevel?.employees || directorLevel?.employees || [])?.slice(0, 1).map((emp) => (
                        <div key={emp.id} className="text-center">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto border-4 border-violet-200">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="mt-2 bg-violet-600 text-white px-3 py-1 rounded-lg text-sm font-medium inline-block">
                            {emp.designation}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 font-medium">{emp.name}</p>
                        </div>
                      ))}
                    </div>

                    {/* Connector Line Down */}
                    <div className="flex justify-center mb-4">
                      <div className="w-px h-8 bg-gray-300" />
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="w-1/2 h-px bg-gray-300" />
                    </div>

                    {/* Level 2: Managers */}
                    <div className="flex justify-center gap-16 mb-8">
                      {(managerLevel?.employees || asstMgrLevel?.employees || [])?.slice(0, 2).map((emp, idx) => (
                        <div key={emp.id} className="text-center relative">
                          {/* Vertical connector */}
                          <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-300 -translate-x-1/2" />
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold shadow-lg mx-auto border-4 border-orange-200">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="mt-2 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium inline-block">
                            {emp.designation}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 font-medium">{emp.name}</p>
                        </div>
                      ))}
                    </div>

                    {/* Connector Lines Down to Supervisors */}
                    <div className="flex justify-center mb-4">
                      <div className="w-3/4 h-px bg-gray-300" />
                    </div>

                    {/* Level 3: Supervisors/Coordinators */}
                    <div className="flex justify-center gap-12 mb-8">
                      {(supervisorLevel?.employees || [])?.slice(0, 4).map((emp) => (
                        <div key={emp.id} className="text-center relative">
                          <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-300 -translate-x-1/2" />
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-lg mx-auto border-4 border-green-200">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="mt-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium inline-block">
                            {emp.designation}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{emp.name}</p>
                        </div>
                      ))}
                    </div>

                    {/* Connector Lines Down to Staff */}
                    {otherLevels.length > 0 && (
                      <>
                        <div className="flex justify-center mb-4">
                          <div className="w-full max-w-4xl h-px bg-gray-200" />
                        </div>

                        {/* Level 4: Staff */}
                        <div className="flex justify-center flex-wrap gap-6">
                          {otherLevels.flatMap(l => l.employees).slice(0, 8).map((emp) => (
                            <div key={emp.id} className="text-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow mx-auto border-2 border-blue-200">
                                {emp.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 max-w-[80px] truncate">{emp.name}</p>
                            </div>
                          ))}
                          {dept.totalCount > 15 && (
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold mx-auto">
                                +{dept.totalCount - 15}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">more</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
