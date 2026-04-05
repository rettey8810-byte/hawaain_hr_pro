import { useState, useEffect } from 'react';
import { 
  Users,
  UserPlus,
  Network,
  ChevronRight, 
  Plus, 
  Loader2, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  Search, 
  Filter 
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import orgStructureService from '../services/orgStructureService';

export default function OrgStructure() {
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: departments, loading: departmentsLoading } = useFirestore('departments');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredDepartments = departments.filter(d => d.companyId === companyId);

  // Build hierarchy from real data
  const hierarchy = filteredDepartments.map(dept => ({
    id: dept.id,
    name: dept.name,
    head: employees.find(e => e.id === dept.headId)?.name || 'Not assigned',
    count: employees.filter(e => e.departmentId === dept.id).length,
    subdepartments: dept.subdepartments || []
  }));

  if (departmentsLoading) {
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
        <p className="text-violet-100 mt-1 relative z-10">View departments and reporting lines</p>
      </div>

      {/* Stats - Real Data */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Departments', value: hierarchy.length, icon: Network, color: 'bg-violet-500' },
          { label: 'Total Employees', value: employees.filter(e => e.companyId === companyId).length, icon: Users, color: 'bg-purple-500' },
          { label: 'Management Level', value: hierarchy.filter(h => h.head !== 'Not assigned').length, icon: UserPlus, color: 'bg-pink-500' },
          { label: 'Avg Span of Control', value: hierarchy.length > 0 ? (employees.filter(e => e.companyId === companyId).length / hierarchy.length).toFixed(1) : 0, icon: Users, color: 'bg-indigo-500' },
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

      <div className="grid grid-cols-3 gap-6">
        {/* Departments - Real Data */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Departments</h3>
          <div className="space-y-3">
            {hierarchy.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Network className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No departments found</p>
                <p className="text-sm">Add departments to build org structure</p>
              </div>
            ) : (
              hierarchy.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    selectedDepartment?.id === dept.id ? 'bg-violet-100 border-violet-300' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-gray-500">Head: {dept.head}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{dept.count}</p>
                      <p className="text-xs text-gray-500">employees</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Org Chart */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Organization Chart</h3>
          <div className="flex justify-center">
            <div className="text-center">
              {/* GM */}
              <div className="bg-violet-600 text-white p-4 rounded-xl inline-block mb-4">
                <UserCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">General Manager</p>
                <p className="text-xs text-violet-200">GM</p>
              </div>
              
              {/* Department Heads - Real Data */}
              <div className="flex justify-center gap-4 flex-wrap">
                {hierarchy.length === 0 ? (
                  <p className="text-gray-500">No departments to display</p>
                ) : (
                  hierarchy.map(dept => (
                    <div key={dept.id} className="bg-purple-100 text-purple-800 p-3 rounded-xl">
                      <p className="font-medium text-sm">{dept.head}</p>
                      <p className="text-xs text-purple-600">{dept.name}</p>
                      <p className="text-xs mt-1">{dept.count} emp</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Selected Department Details */}
          {selectedDepartment && (
            <div className="mt-6 p-4 bg-violet-50 rounded-xl">
              <h4 className="font-medium mb-2">{selectedDepartment.name} Department</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Department Head</p>
                  <p className="font-medium">{selectedDepartment.head}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Employees</p>
                  <p className="font-medium">{selectedDepartment.count}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
