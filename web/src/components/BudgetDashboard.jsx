import { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Users, 
  Building2,
  TrendingUp,
  Download,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Calculator
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/helpers';

export default function BudgetDashboard() {
  const { companyId } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch employees with salary data
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return;
      
      try {
        const q = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const empData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setEmployees(empData);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, [companyId]);

  // Calculate salary statistics
  const salaryStats = useMemo(() => {
    if (!employees.length) return null;

    const employeesWithSalary = employees.filter(e => {
      const salary = parseFloat(e.Basic || e.basicSalary || e.salary || 0);
      return salary > 0;
    });

    const totalBasic = employeesWithSalary.reduce((sum, e) => 
      sum + parseFloat(e.Basic || e.basicSalary || e.salary || 0), 0
    );

    const totalAllowances = employeesWithSalary.reduce((sum, e) => {
      const food = parseFloat(e.Food || e.foodAllowance || 0);
      const transport = parseFloat(e.Transport || e.transportAllowance || 0);
      const phone = parseFloat(e.Phone || e.phoneAllowance || 0);
      const other = parseFloat(e.Other || e.otherAllowances || 0);
      return sum + food + transport + phone + other;
    }, 0);

    const totalMonthly = totalBasic + totalAllowances;
    const totalAnnual = totalMonthly * 12;

    const salaries = employeesWithSalary.map(e => 
      parseFloat(e.Basic || e.basicSalary || e.salary || 0)
    );

    const avgSalary = salaries.length ? totalBasic / salaries.length : 0;
    const maxSalary = salaries.length ? Math.max(...salaries) : 0;
    const minSalary = salaries.length ? Math.min(...salaries) : 0;

    return {
      totalEmployees: employees.length,
      employeesWithSalary: employeesWithSalary.length,
      totalBasic,
      totalAllowances,
      totalMonthly,
      totalAnnual,
      avgSalary,
      maxSalary,
      minSalary
    };
  }, [employees]);

  // Department-wise breakdown
  const departmentStats = useMemo(() => {
    if (!employees.length) return [];

    const deptMap = {};

    employees.forEach(emp => {
      const dept = emp['Department '] || emp.Department || emp.department || 'Unassigned';
      const basic = parseFloat(emp.Basic || emp.basicSalary || emp.salary || 0);
      const food = parseFloat(emp.Food || emp.foodAllowance || 0);
      const transport = parseFloat(emp.Transport || emp.transportAllowance || 0);
      const phone = parseFloat(emp.Phone || emp.phoneAllowance || 0);
      const other = parseFloat(emp.Other || emp.otherAllowances || 0);
      const total = basic + food + transport + phone + other;

      if (!deptMap[dept]) {
        deptMap[dept] = {
          name: dept,
          employeeCount: 0,
          totalBasic: 0,
          totalAllowances: 0,
          totalMonthly: 0,
          salaries: []
        };
      }

      deptMap[dept].employeeCount++;
      deptMap[dept].totalBasic += basic;
      deptMap[dept].totalAllowances += (food + transport + phone + other);
      deptMap[dept].totalMonthly += total;
      if (basic > 0) deptMap[dept].salaries.push(basic);
    });

    return Object.values(deptMap).map(dept => ({
      ...dept,
      avgSalary: dept.salaries.length ? dept.totalBasic / dept.salaries.length : 0,
      annualTotal: dept.totalMonthly * 12
    })).sort((a, b) => b.totalMonthly - a.totalMonthly);
  }, [employees]);

  // Individual salary list
  const individualSalaries = useMemo(() => {
    return employees
      .filter(e => parseFloat(e.Basic || e.basicSalary || e.salary || 0) > 0)
      .map(e => {
        const basic = parseFloat(e.Basic || e.basicSalary || e.salary || 0);
        const food = parseFloat(e.Food || e.foodAllowance || 0);
        const transport = parseFloat(e.Transport || e.transportAllowance || 0);
        const phone = parseFloat(e.Phone || emp.phoneAllowance || 0);
        const other = parseFloat(e.Other || e.otherAllowances || 0);
        
        return {
          id: e.id,
          name: e.FullName || e.name || 'Unknown',
          empId: e.EmpID || e.employeeId || 'N/A',
          department: e['Department '] || e.Department || e.department || 'N/A',
          designation: e.Designation || e.designation || 'N/A',
          basic,
          food,
          transport,
          phone,
          other,
          total: basic + food + transport + phone + other
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [employees]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Basic Salary', 'Food', 'Transport', 'Phone', 'Other', 'Total Monthly'];
    
    const rows = individualSalaries.map(emp => [
      emp.empId,
      emp.name,
      emp.department,
      emp.designation,
      emp.basic,
      emp.food,
      emp.transport,
      emp.phone,
      emp.other,
      emp.total
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💰 Budget Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Department-wise salary breakdown and budget analytics</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {salaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Monthly Budget</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(salaryStats.totalMonthly)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              Annual: {formatCurrency(salaryStats.totalAnnual)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Employees</p>
                <p className="text-3xl font-bold mt-1">{salaryStats.totalEmployees}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-emerald-100 text-sm mt-2">
              With Salary: {salaryStats.employeesWithSalary}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Average Salary</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(salaryStats.avgSalary)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-purple-100 text-sm mt-2">
              Range: {formatCurrency(salaryStats.minSalary)} - {formatCurrency(salaryStats.maxSalary)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Allowances</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(salaryStats.totalAllowances)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-amber-100 text-sm mt-2">
              Monthly average per employee
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Department Overview
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'individual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-5 w-5 mr-2" />
              Individual Salaries
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {individualSalaries.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Department Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-500" />
              Department-wise Budget Breakdown
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Salary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentStats.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No department data available</p>
                      </td>
                    </tr>
                  ) : (
                    departmentStats.map((dept, index) => (
                      <tr key={dept.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900">{dept.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dept.employeeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(dept.totalBasic)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(dept.totalAllowances)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(dept.totalMonthly)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(dept.annualTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(dept.avgSalary)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Individual Salaries Tab */}
        {activeTab === 'individual' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Individual Salary Details
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {individualSalaries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No salary data available</p>
                      </td>
                    </tr>
                  ) : (
                    individualSalaries.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.empId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {emp.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {emp.designation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(emp.basic)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(emp.food + emp.transport + emp.phone + emp.other)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(emp.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
