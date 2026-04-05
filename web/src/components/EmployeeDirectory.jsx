import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, Search, Phone, Mail, Briefcase, MapPin, 
  ChevronDown, ChevronRight, Building2, Network,
  Filter, Download, Grid, List, UserCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Org Chart / Employee Directory Module
 * 
 * Features:
 * - Visual organization hierarchy
 * - Department-wise employee listing
 * - Search by name, position, skills
 * - Contact information and reporting lines
 * - Multiple view modes (Tree, List, Grid)
 */

const VIEW_MODES = {
  tree: { label: 'Org Chart', icon: Network },
  list: { label: 'List View', icon: List },
  grid: { label: 'Grid View', icon: Grid }
};

export default function EmployeeDirectory() {
  const { companyId, currentCompany } = useCompany();
  const { userData } = useAuth();
  const [viewMode, setViewMode] = useState('tree');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId)
      );
      const employeesSnap = await getDocs(employeesQuery);
      const employeesData = employeesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);

      // Extract unique departments
      const deptSet = new Set(employeesData.map(e => e['Department '] || e.Department || e.department).filter(Boolean));
      setDepartments(Array.from(deptSet).sort());

      // Auto-expand all nodes initially
      setExpandedNodes(new Set(employeesData.map(e => e.id)));

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (employeeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      const name = emp.FullName || emp.name || '';
      const position = emp.Designation || emp.position || '';
      const email = emp.PersonalEmailID || emp.EmailID || emp.email || '';
      const empId = emp.EmpID || emp.employeeId || '';
      const dept = emp['Department '] || emp.Department || emp.department || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = filterDepartment === 'all' || dept === filterDepartment;
      
      return matchesSearch && matchesDept;
    });
  };

  const getDepartmentHead = (department) => {
    return employees.find(e => {
      const dept = e['Department '] || e.Department || e.department || '';
      const pos = e.Designation || e.position || '';
      return dept === department && 
        (pos.toLowerCase().includes('head') || pos.toLowerCase().includes('manager'));
    });
  };

  const getDirectReports = (managerId) => {
    return employees.filter(e => e.Superior === managerId || e.reportsTo === managerId);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Employee ID', 'Department', 'Position', 'Email', 'Phone', 'Status'];
    const rows = getFilteredEmployees().map(emp => [
      emp.FullName || emp.name,
      emp.EmpID || emp.employeeId,
      emp['Department '] || emp.Department || emp.department,
      emp.Designation || emp.position,
      emp.PersonalEmailID || emp.EmailID || emp.email,
      emp.PhoneNo || emp.phone,
      emp.status || 'active'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_directory_${companyId}.csv`;
    a.click();
  };

  // Tree View Component
  const TreeNode = ({ employee, level = 0 }) => {
    const reports = getDirectReports(employee.id);
    const isExpanded = expandedNodes.has(employee.id);
    const hasReports = reports.length > 0;

    return (
      <div className="ml-4">
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            selectedEmployee?.id === employee.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => setSelectedEmployee(employee)}
        >
          {hasReports && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(employee.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {!hasReports && <div className="w-4" />}
          
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-gray-900">{employee.FullName || employee.name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{employee.Designation || employee.position || 'N/A'}</p>
          </div>
          
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            (employee.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {employee.status || 'active'}
          </span>
        </div>
        
        {hasReports && isExpanded && (
          <div className="mt-1">
            {reports.map(report => (
              <TreeNode key={report.id} employee={report} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get top-level employees (no manager or GM/CEO level)
  const getTopLevelEmployees = () => {
    return employees.filter(e => 
      !e.reportsTo || 
      e.position?.toLowerCase().includes('gm') ||
      e.position?.toLowerCase().includes('ceo') ||
      e.position?.toLowerCase().includes('director')
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredEmployees = getFilteredEmployees();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Employee Directory</h2>
          </div>
          <p className="text-gray-600 mt-1">Organization structure and employee information</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {Object.entries(VIEW_MODES).map(([mode, { label, icon: Icon }]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tree View */}
          {viewMode === 'tree' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Organization Chart
              </h3>
              <div className="space-y-2">
                {getTopLevelEmployees().length > 0 ? (
                  getTopLevelEmployees().map(employee => (
                    <TreeNode key={employee.id} employee={employee} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No organizational hierarchy found. Employees need to have a "reportsTo" field to build the org chart.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{employee.FullName || employee.name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{employee.PersonalEmailID || employee.EmailID || employee.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.EmpID || employee.employeeId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee['Department '] || employee.Department || employee.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.Designation || employee.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.PhoneNo || employee.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          (employee.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <div 
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{employee.FullName || employee.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{employee.Designation || employee.position || 'N/A'}</p>
                      <p className="text-sm text-gray-400">{employee['Department '] || employee.Department || employee.department || 'N/A'}</p>
                      
                      <div className="mt-3 space-y-1">
                        {(employee.PersonalEmailID || employee.EmailID || employee.email) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.PersonalEmailID || employee.EmailID || employee.email}
                          </p>
                        )}
                        {(employee.PhoneNo || employee.phone) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {employee.PhoneNo || employee.phone}
                          </p>
                        )}
                      </div>
                      
                      <span className={`mt-3 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        (employee.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status || 'active'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredEmployees.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No employees found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Details */}
          {selectedEmployee ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{selectedEmployee.FullName || selectedEmployee.name || 'N/A'}</h3>
                  <p className="text-gray-500">{selectedEmployee.Designation || selectedEmployee.position || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{selectedEmployee['Department '] || selectedEmployee.Department || selectedEmployee.department || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{selectedEmployee.EmpID || selectedEmployee.employeeId || 'No ID'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${selectedEmployee.PersonalEmailID || selectedEmployee.EmailID || selectedEmployee.email || ''}`} className="text-blue-600 hover:underline">
                    {selectedEmployee.PersonalEmailID || selectedEmployee.EmailID || selectedEmployee.email || '-'}
                  </a>
                </div>
                {(selectedEmployee.PhoneNo || selectedEmployee.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${selectedEmployee.PhoneNo || selectedEmployee.phone}`} className="text-blue-600 hover:underline">
                      {selectedEmployee.PhoneNo || selectedEmployee.phone}
                    </a>
                  </div>
                )}
                {(selectedEmployee.PresentCity || selectedEmployee.location) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{selectedEmployee.PresentCity || selectedEmployee.location}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  (selectedEmployee.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedEmployee.status || 'active'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border text-center">
              <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select an employee to view details</p>
            </div>
          )}

          {/* Department Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Departments
            </h3>
            <div className="space-y-2">
              {departments.map(dept => {
                const count = employees.filter(e => e.department === dept && e.status === 'active').length;
                return (
                  <div 
                    key={dept} 
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => setFilterDepartment(dept)}
                  >
                    <span className="text-gray-700">{dept}</span>
                    <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {employees.filter(e => e.status === 'active').length}
                </p>
                <p className="text-xs text-blue-800">Active</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {employees.filter(e => e.status !== 'active').length}
                </p>
                <p className="text-xs text-gray-800">Inactive</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{departments.length}</p>
                <p className="text-xs text-green-800">Departments</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(employees.map(e => e.position)).size}
                </p>
                <p className="text-xs text-purple-800">Positions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
