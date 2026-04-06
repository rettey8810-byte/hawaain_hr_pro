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
  Calculator,
  Target
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/helpers';

export default function BudgetDashboard() {
  const { companyId } = useCompany();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch manpower budgets
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!companyId) return;
      
      try {
        let q = query(
          collection(db, 'manpowerBudgets'),
          where('companyId', '==', companyId)
        );
        let snapshot = await getDocs(q);
        
        // Fallback: if no documents with companyId, fetch all
        if (snapshot.empty) {
          console.log('No budgets with companyId, fetching all...');
          q = query(collection(db, 'manpowerBudgets'));
          snapshot = await getDocs(q);
        }
        
        const budgetData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('Fetched budgets:', budgetData.length, budgetData);
        setBudgets(budgetData);
      } catch (err) {
        console.error('Error fetching budgets:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBudgets();
  }, [companyId]);

  // Calculate budget statistics
  const budgetStats = useMemo(() => {
    if (!budgets.length) return null;

    let totalPositions = 0;
    let totalBudget = 0;

    budgets.forEach(budget => {
      const salary = parseFloat(budget.salary) || 0;
      const required = budget.requiredManpower || {};
      
      const positions = 
        (parseInt(required['100_80']) || 0) +
        (parseInt(required['80_65']) || 0) +
        (parseInt(required['65_50']) || 0) +
        (parseInt(required['below50']) || 0);
      
      totalPositions += positions;
      totalBudget += positions * salary;
    });

    const annualBudget = totalBudget * 12;

    return {
      totalEntries: budgets.length,
      totalPositions,
      totalBudget,
      annualBudget,
      avgSalaryPerPosition: totalPositions > 0 ? totalBudget / totalPositions : 0
    };
  }, [budgets]);

  // Department-wise breakdown from manpower budgets
  const departmentStats = useMemo(() => {
    if (!budgets.length) return [];

    const deptMap = {};

    budgets.forEach(budget => {
      const dept = budget.department || 'Unassigned';
      const salary = parseFloat(budget.salary) || 0;
      const required = budget.requiredManpower || {};
      
      const positions = 
        (parseInt(required['100_80']) || 0) +
        (parseInt(required['80_65']) || 0) +
        (parseInt(required['65_50']) || 0) +
        (parseInt(required['below50']) || 0);
      
      const monthlyTotal = positions * salary;

      if (!deptMap[dept]) {
        deptMap[dept] = {
          name: dept,
          designationCount: 0,
          totalPositions: 0,
          totalMonthly: 0,
          salaries: []
        };
      }

      deptMap[dept].designationCount++;
      deptMap[dept].totalPositions += positions;
      deptMap[dept].totalMonthly += monthlyTotal;
      if (salary > 0) deptMap[dept].salaries.push(salary);
    });

    return Object.values(deptMap).map(dept => ({
      ...dept,
      avgSalary: dept.salaries.length ? dept.salaries.reduce((a, b) => a + b, 0) / dept.salaries.length : 0,
      annualTotal: dept.totalMonthly * 12
    })).sort((a, b) => b.totalMonthly - a.totalMonthly);
  }, [budgets]);

  // Individual budget entries list
  const budgetEntries = useMemo(() => {
    return budgets
      .map(b => {
        const salary = parseFloat(b.salary) || 0;
        const required = b.requiredManpower || {};
        
        const pos100_80 = parseInt(required['100_80']) || 0;
        const pos80_65 = parseInt(required['80_65']) || 0;
        const pos65_50 = parseInt(required['65_50']) || 0;
        const posBelow50 = parseInt(required['below50']) || 0;
        const totalPositions = pos100_80 + pos80_65 + pos65_50 + posBelow50;
        const monthlyTotal = totalPositions * salary;
        
        return {
          id: b.id,
          department: b.department || 'N/A',
          section: b.section || 'N/A',
          designation: b.designation || 'N/A',
          salary,
          actual2026: b.actual2026 || '0',
          pos100_80,
          pos80_65,
          pos65_50,
          posBelow50,
          totalPositions,
          monthlyTotal,
          annualTotal: monthlyTotal * 12
        };
      })
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  }, [budgets]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Department', 'Section', 'Designation', 'Salary (USD)', 'Actual 2026', '100-80%', '80-65%', '65-50%', 'Below 50%', 'Total Positions', 'Monthly Budget', 'Annual Budget'];
    
    const rows = budgetEntries.map(b => [
      b.department,
      b.section,
      b.designation,
      b.salary,
      b.actual2026,
      b.pos100_80,
      b.pos80_65,
      b.pos65_50,
      b.posBelow50,
      b.totalPositions,
      b.monthlyTotal,
      b.annualTotal
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manpower_budget_report_${new Date().toISOString().split('T')[0]}.csv`;
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
      {budgetStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Monthly Budget</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(budgetStats.totalBudget)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              Annual: {formatCurrency(budgetStats.annualBudget)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Positions</p>
                <p className="text-3xl font-bold mt-1">{budgetStats.totalPositions}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-emerald-100 text-sm mt-2">
              Across {budgetStats.totalEntries} designations
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Salary/Position</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(budgetStats.avgSalaryPerPosition)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-purple-100 text-sm mt-2">
              Based on {budgetStats.totalEntries} entries
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Departments</p>
                <p className="text-3xl font-bold mt-1">{departmentStats.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-amber-100 text-sm mt-2">
              With budget allocations
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
              onClick={() => setActiveTab('entries')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'entries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="h-5 w-5 mr-2" />
              Budget Entries
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {budgetEntries.length}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Positions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Salary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentStats.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No budget data available</p>
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
                            {dept.designationCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {dept.totalPositions}
                          </span>
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

        {/* Budget Entries Tab */}
        {activeTab === 'entries' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              Individual Budget Entries
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department / Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positions (100-80%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positions (80-65%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positions (65-50%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positions (Below 50%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Positions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Budget</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgetEntries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No budget entries available</p>
                      </td>
                    </tr>
                  ) : (
                    budgetEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900">{entry.designation}</p>
                            <p className="text-xs text-gray-500">{entry.department} • {entry.section}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(entry.salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.actual2026}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {entry.pos100_80 || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {entry.pos80_65 || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {entry.pos65_50 || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {entry.posBelow50 || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {entry.totalPositions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                          {formatCurrency(entry.monthlyTotal)}
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
