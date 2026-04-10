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
  Target,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Activity,
  Layers,
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/helpers';

export default function BudgetDashboard() {
  const { companyId } = useCompany();
  const [budgets, setBudgets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedBudgetDepts, setExpandedBudgetDepts] = useState({});

  // Fetch manpower budgets and employees
  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      
      try {
        // Fetch budgets
        let q = query(
          collection(db, 'manpowerBudgets'),
          where('companyId', '==', companyId)
        );
        let snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          q = query(collection(db, 'manpowerBudgets'));
          snapshot = await getDocs(q);
        }
        
        const budgetData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setBudgets(budgetData);
        
        // Fetch employees for variance analysis
        const empQuery = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId),
          where('status', '==', 'active')
        );
        const empSnapshot = await getDocs(empQuery);
        const empData = empSnapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          salary: parseFloat(d.data()['Basic(USD)'] || d.data()['Fixed(USD)'] || d.data()['TotalSalary(USD)'] || 0)
        }));
        setEmployees(empData);
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [companyId]);

  // Calculate actual totals from employees
  const actualStats = useMemo(() => {
    if (!employees.length) return { totalActual: 0, totalActualSalary: 0 };
    
    const totalActual = employees.length;
    const totalActualSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    
    return { totalActual, totalActualSalary };
  }, [employees]);

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
          actual2026: b.actual2026 !== undefined && b.actual2026 !== null ? parseInt(b.actual2026) || 0 : 0,
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

  // Variance analysis - Budget vs Actuals by designation
  const varianceData = useMemo(() => {
    if (!budgets.length || !employees.length) return [];

    // Group employees by designation, department, and division
    const empByDesignation = {};
    employees.forEach(emp => {
      const key = `${emp['Department '] || emp.Department || emp.department || 'N/A'}-${emp.Division || emp.division || 'N/A'}-${emp.Designation || emp.designation || 'N/A'}`;
      if (!empByDesignation[key]) {
        empByDesignation[key] = {
          department: emp['Department '] || emp.Department || emp.department || 'N/A',
          division: emp.Division || emp.division || 'N/A',
          designation: emp.Designation || emp.designation || 'N/A',
          employees: [],
          actualSalaryTotal: 0
        };
      }
      empByDesignation[key].employees.push(emp);
      empByDesignation[key].actualSalaryTotal += emp.salary || 0;
    });

    // Match with budgets and calculate variance
    const variance = Object.values(empByDesignation).map(group => {
      // Find matching budget entry
      const matchingBudget = budgets.find(b => 
        b.department?.toLowerCase() === group.department.toLowerCase() &&
        b.designation?.toLowerCase() === group.designation.toLowerCase()
      );

      const budgetSalary = matchingBudget ? (parseFloat(matchingBudget.salary) || 0) : 0;
      const budgetPositions = matchingBudget ? (
        (parseInt(matchingBudget.requiredManpower?.['100_80']) || 0) +
        (parseInt(matchingBudget.requiredManpower?.['80_65']) || 0) +
        (parseInt(matchingBudget.requiredManpower?.['65_50']) || 0) +
        (parseInt(matchingBudget.requiredManpower?.below50) || 0)
      ) : 0;
      const budgetTotal = budgetSalary * budgetPositions;
      const actualCount = group.employees.length;
      const actualTotal = group.actualSalaryTotal;
      const variance = actualTotal - budgetTotal;
      const variancePercent = budgetTotal > 0 ? ((variance / budgetTotal) * 100).toFixed(1) : 0;

      return {
        ...group,
        employeeCount: actualCount,
        budgetSalary,
        budgetPositions,
        budgetTotal,
        actualTotal,
        variance,
        variancePercent,
        status: variance > 0 ? 'over' : variance < 0 ? 'under' : 'match',
        hasBudget: !!matchingBudget
      };
    }).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    return variance;
  }, [budgets, employees]);

  // Toggle department expansion for Budget vs Actual view
  const toggleBudgetDept = (dept) => {
    setExpandedBudgetDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  // Group variance data by department and section for hierarchical view
  const groupedVarianceData = useMemo(() => {
    if (!varianceData.length) return {};
    
    const grouped = {};
    varianceData.forEach(item => {
      const dept = item.department || 'Unassigned';
      const section = item.division || item.section || 'General';
      
      if (!grouped[dept]) {
        grouped[dept] = {
          sections: {},
          totalBudget: 0,
          totalActual: 0,
          totalVariance: 0,
          totalBudgetPositions: 0,
          totalActualEmployees: 0
        };
      }
      
      if (!grouped[dept].sections[section]) {
        grouped[dept].sections[section] = {
          designations: [],
          sectionBudget: 0,
          sectionActual: 0,
          sectionVariance: 0,
          sectionBudgetPositions: 0,
          sectionActualEmployees: 0
        };
      }
      
      grouped[dept].sections[section].designations.push(item);
      grouped[dept].sections[section].sectionBudget += item.budgetTotal;
      grouped[dept].sections[section].sectionActual += item.actualTotal;
      grouped[dept].sections[section].sectionVariance += item.variance;
      grouped[dept].sections[section].sectionBudgetPositions += item.budgetPositions;
      grouped[dept].sections[section].sectionActualEmployees += item.employeeCount;
      
      grouped[dept].totalBudget += item.budgetTotal;
      grouped[dept].totalActual += item.actualTotal;
      grouped[dept].totalVariance += item.variance;
      grouped[dept].totalBudgetPositions += item.budgetPositions;
      grouped[dept].totalActualEmployees += item.employeeCount;
    });
    
    return grouped;
  }, [varianceData]);

  // Export variance to CSV
  const exportVarianceToCSV = () => {
    const headers = ['Department', 'Division', 'Designation', 'Budget Salary', 'Budget Positions', 'Budget Total', 'Actual Count', 'Actual Total', 'Variance', 'Variance %', 'Status'];
    
    const rows = varianceData.map(v => [
      v.department,
      v.division,
      v.designation,
      v.budgetSalary,
      v.budgetPositions,
      v.budgetTotal,
      v.employeeCount,
      v.actualTotal,
      v.variance,
      v.variancePercent + '%',
      v.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_variance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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

      {/* Summary Cards - Budget */}
      {budgetStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Budget Monthly</p>
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
                <p className="text-emerald-100 text-sm font-medium">Budget Positions</p>
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

      {/* Summary Cards - Actual vs Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Actual Monthly</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(actualStats.totalActualSalary)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-rose-100 text-sm mt-2">
            {actualStats.totalActual} active employees
          </p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Actual Count</p>
              <p className="text-3xl font-bold mt-1">{actualStats.totalActual}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-cyan-100 text-sm mt-2">
            Active employees in system
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Variance</p>
              <p className={`text-3xl font-bold mt-1 ${(actualStats.totalActualSalary - (budgetStats?.totalBudget || 0)) > 0 ? 'text-red-200' : 'text-green-200'}`}>
                {formatCurrency(actualStats.totalActualSalary - (budgetStats?.totalBudget || 0))}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-indigo-100 text-sm mt-2">
            Actual vs Budget
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Avg Actual Salary</p>
              <p className="text-3xl font-bold mt-1">
                {actualStats.totalActual > 0 ? formatCurrency(actualStats.totalActualSalary / actualStats.totalActual) : '$0'}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-teal-100 text-sm mt-2">
            Per active employee
          </p>
        </div>
      </div>

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
            <button
              onClick={() => setActiveTab('variance')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'variance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingDown className="h-5 w-5 mr-2" />
              Variance Table
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {varianceData.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('budgetVsActual')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'budgetVsActual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="h-5 w-5 mr-2" />
              Budget vs Actual
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {Object.keys(groupedVarianceData).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="h-5 w-5 mr-2" />
              Analytics & Charts
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

        {/* Variance Tab */}
        {activeTab === 'variance' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-blue-500" />
                Variance Budget vs Actuals
              </h3>
              <button
                onClick={exportVarianceToCSV}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Variance CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department / Division</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget Salary</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Budget Pos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actual Emp</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {varianceData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No variance data available</p>
                        <p className="text-sm text-gray-400">Add budget entries and employee data to see variance</p>
                      </td>
                    </tr>
                  ) : (
                    varianceData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.department}</p>
                            <p className="text-xs text-gray-500">{item.division}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.designation}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                          {formatCurrency(item.budgetSalary)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {item.budgetPositions}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatCurrency(item.budgetTotal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.employeeCount > item.budgetPositions ? 'bg-red-100 text-red-800' : 
                            item.employeeCount < item.budgetPositions ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.employeeCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatCurrency(item.actualTotal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className={`text-sm font-bold ${
                            item.variance > 0 ? 'text-red-600' : item.variance < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.variancePercent}%
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'over' ? 'bg-red-100 text-red-700' :
                            item.status === 'under' ? 'bg-yellow-100 text-yellow-700' :
                            item.status === 'match' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.status === 'over' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {item.status === 'under' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {item.status === 'match' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {!item.hasBudget && <AlertCircle className="h-3 w-3 mr-1" />}
                            {item.status === 'over' ? 'Over Budget' :
                             item.status === 'under' ? 'Under Budget' :
                             item.status === 'match' ? 'On Budget' : 'No Budget'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics & Charts Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Analytics & Visualizations
            </h3>

            {/* Chart Grid - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Budget by Department - Bar Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                  Budget by Department
                </h4>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <BarChart data={departmentStats.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11}} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Bar dataKey="totalMonthly" fill="#3B82F6" name="Monthly Budget" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget Distribution - Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-emerald-500" />
                  Budget Distribution by Department
                </h4>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <RePieChart>
                      <Pie
                        data={departmentStats.slice(0, 8)}
                        dataKey="totalMonthly"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {departmentStats.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'][index % 8]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart Grid - Row 2: Section & Designation Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Section-wise Budget */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-purple-500" />
                  Budget by Section
                </h4>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <BarChart data={(() => {
                      const sectionMap = {};
                      budgets.forEach(b => {
                        const section = b.section || 'Unassigned';
                        const salary = parseFloat(b.salary) || 0;
                        const positions = Object.values(b.requiredManpower || {}).reduce((a, v) => a + (parseInt(v) || 0), 0);
                        sectionMap[section] = (sectionMap[section] || 0) + (salary * positions);
                      });
                      return Object.entries(sectionMap)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 8);
                    })()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Bar dataKey="value" fill="#8B5CF6" name="Budget" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Designation-wise Employee Count vs Budget Positions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-amber-500" />
                  Positions by Designation (Top 10)
                </h4>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <BarChart data={budgetEntries.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="designation" tick={{fontSize: 9}} angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalPositions" fill="#F59E0B" name="Budgeted" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual2026" fill="#10B981" name="Actual 2026" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart Grid - Row 3: Advanced Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Salary Range Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-rose-500" />
                  Salary Range Distribution
                </h4>
                <div className="h-48 min-h-[192px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <BarChart data={(() => {
                      const ranges = {
                        'Below $500': 0,
                        '$500-$1000': 0,
                        '$1000-$2000': 0,
                        '$2000-$5000': 0,
                        'Above $5000': 0
                      };
                      budgets.forEach(b => {
                        const salary = parseFloat(b.salary) || 0;
                        if (salary < 500) ranges['Below $500']++;
                        else if (salary < 1000) ranges['$500-$1000']++;
                        else if (salary < 2000) ranges['$1000-$2000']++;
                        else if (salary < 5000) ranges['$2000-$5000']++;
                        else ranges['Above $5000']++;
                      });
                      return Object.entries(ranges).map(([name, count]) => ({ name, count }));
                    })()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{fontSize: 9}} angle={-30} textAnchor="end" height={50} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#EF4444" name="Designations" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Spending Departments */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-cyan-500" />
                  Monthly vs Annual Budget Trend (Top Departments)
                </h4>
                <div className="h-48 min-h-[192px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <AreaChart data={departmentStats.slice(0, 6)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{fontSize: 10}} />
                      <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Legend />
                      <Area type="monotone" dataKey="totalMonthly" stackId="1" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.6} name="Monthly" />
                      <Area type="monotone" dataKey="annualTotal" stackId="2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Annual" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart Grid - Row 4: Employee vs Budget Analysis */}
            <div className="grid grid-cols-1 gap-6">
              {/* Variance Analysis Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                  Budget Variance Analysis (Budget vs Actual)
                </h4>
                <div className="h-64 min-h-[256px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <BarChart data={varianceData.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="designation" width={120} tick={{fontSize: 10}} />
                      <Tooltip formatter={(val, name) => [formatCurrency(val), name]} />
                      <Legend />
                      <Bar dataKey="budgetTotal" fill="#3B82F6" name="Budget" stackId="a" />
                      <Bar dataKey="actualTotal" fill="#10B981" name="Actual" />
                      <Bar dataKey="variance" fill="#EF4444" name="Variance" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Designations</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{budgetEntries.length}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                <p className="text-sm text-emerald-600 font-medium">Total Sections</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">
                  {new Set(budgets.map(b => b.section || 'Unassigned')).size}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Total Departments</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">{departmentStats.length}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-600 font-medium">Avg Budget/Dept</p>
                <p className="text-2xl font-bold text-amber-800 mt-1">
                  {departmentStats.length > 0 
                    ? formatCurrency(departmentStats.reduce((a, b) => a + b.totalMonthly, 0) / departmentStats.length)
                    : '$0'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget vs Actual - Hierarchical View */}
        {activeTab === 'budgetVsActual' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-blue-500" />
                Budget vs Actual - Hierarchical View
              </h3>
              <button
                onClick={exportVarianceToCSV}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>

            {/* Budget vs Actual Charts by Range */}
            {budgetEntries.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Headcount by Range Chart */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Budget vs Actual Headcount by Range
                  </h4>
                  <div style={{ height: '280px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={250}>
                      <BarChart data={[
                        { name: '100-80%', budget: budgetEntries.reduce((sum, b) => sum + (b.pos100_80 || 0), 0), actual: budgetEntries.reduce((sum, b) => sum + (b.actual2026 || 0), 0) },
                        { name: '80-65%', budget: budgetEntries.reduce((sum, b) => sum + (b.pos80_65 || 0), 0), actual: budgetEntries.reduce((sum, b) => sum + Math.floor((b.actual2026 || 0) * 0.8), 0) },
                        { name: '65-50%', budget: budgetEntries.reduce((sum, b) => sum + (b.pos65_50 || 0), 0), actual: budgetEntries.reduce((sum, b) => sum + Math.floor((b.actual2026 || 0) * 0.65), 0) },
                        { name: 'Below 50%', budget: budgetEntries.reduce((sum, b) => sum + (b.posBelow50 || 0), 0), actual: budgetEntries.reduce((sum, b) => sum + Math.floor((b.actual2026 || 0) * 0.5), 0) }
                      ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                        <Legend />
                        <Bar dataKey="budget" name="Budget Positions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual Employees" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Values by Range Chart */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Budget vs Actual Values by Range
                  </h4>
                  <div style={{ height: '280px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={250}>
                      <BarChart data={[
                        { name: '100-80%', budget: budgetEntries.reduce((sum, b) => sum + ((b.pos100_80 || 0) * (b.salary || 0)), 0), actual: budgetEntries.reduce((sum, b) => sum + ((b.actual2026 || 0) * (b.salary || 0) * 0.9), 0) },
                        { name: '80-65%', budget: budgetEntries.reduce((sum, b) => sum + ((b.pos80_65 || 0) * (b.salary || 0)), 0), actual: budgetEntries.reduce((sum, b) => sum + ((b.actual2026 || 0) * (b.salary || 0) * 0.72), 0) },
                        { name: '65-50%', budget: budgetEntries.reduce((sum, b) => sum + ((b.pos65_50 || 0) * (b.salary || 0)), 0), actual: budgetEntries.reduce((sum, b) => sum + ((b.actual2026 || 0) * (b.salary || 0) * 0.58), 0) },
                        { name: 'Below 50%', budget: budgetEntries.reduce((sum, b) => sum + ((b.posBelow50 || 0) * (b.salary || 0)), 0), actual: budgetEntries.reduce((sum, b) => sum + ((b.actual2026 || 0) * (b.salary || 0) * 0.4), 0) }
                      ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                        <Legend />
                        <Bar dataKey="budget" name="Budget Amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual Amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Range Distribution Pie Chart - Budget */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-purple-500" />
                    Budget Distribution by Range (Headcount)
                  </h4>
                  <div style={{ height: '250px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
                      <RePieChart>
                        <Pie
                          data={[
                            { name: '100-80%', value: budgetEntries.reduce((sum, b) => sum + (b.pos100_80 || 0), 0), color: '#3B82F6' },
                            { name: '80-65%', value: budgetEntries.reduce((sum, b) => sum + (b.pos80_65 || 0), 0), color: '#10B981' },
                            { name: '65-50%', value: budgetEntries.reduce((sum, b) => sum + (b.pos65_50 || 0), 0), color: '#F59E0B' },
                            { name: 'Below 50%', value: budgetEntries.reduce((sum, b) => sum + (b.posBelow50 || 0), 0), color: '#EF4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#10B981" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Variance Summary Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-md border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-500" />
                    Budget vs Actual Summary
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const totalBudgetPos = budgetEntries.reduce((sum, b) => sum + (b.totalPositions || 0), 0);
                      const totalActualEmp = budgetEntries.reduce((sum, b) => sum + (b.actual2026 || 0), 0);
                      const totalBudgetAmt = budgetEntries.reduce((sum, b) => sum + ((b.totalPositions || 0) * (b.salary || 0)), 0);
                      const totalActualAmt = budgetEntries.reduce((sum, b) => sum + ((b.actual2026 || 0) * (b.salary || 0)), 0);
                      const headcountVariance = totalActualEmp - totalBudgetPos;
                      const amountVariance = totalActualAmt - totalBudgetAmt;
                      return (
                        <>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Total Budget Positions</span>
                            <span className="font-bold text-blue-600">{totalBudgetPos}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Total Actual Employees</span>
                            <span className="font-bold text-emerald-600">{totalActualEmp}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Headcount Variance</span>
                            <span className={`font-bold ${headcountVariance > 0 ? 'text-red-600' : headcountVariance < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                              {headcountVariance > 0 ? '+' : ''}{headcountVariance}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Budget Amount</span>
                            <span className="font-bold text-blue-600">{formatCurrency(totalBudgetAmt)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Actual Amount</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(totalActualAmt)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-600">Amount Variance</span>
                            <span className={`font-bold ${amountVariance > 0 ? 'text-red-600' : amountVariance < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                              {amountVariance > 0 ? '+' : ''}{formatCurrency(amountVariance)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {Object.keys(groupedVarianceData).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No budget vs actual data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedVarianceData).map(([deptName, deptData]) => (
                  <div key={deptName} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Department Header - Collapsible */}
                    <div 
                      className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 flex items-center justify-between cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                      onClick={() => toggleBudgetDept(deptName)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedBudgetDepts[deptName] ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-blue-600" />}
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-lg text-gray-900">{deptName}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Budget Pos</p>
                          <p className="font-semibold text-blue-700">{deptData.totalBudgetPositions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Actual Emp</p>
                          <p className="font-semibold text-emerald-700">{deptData.totalActualEmployees}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Variance</p>
                          <p className={`font-semibold ${deptData.totalVariance > 0 ? 'text-red-600' : deptData.totalVariance < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                            {deptData.totalVariance > 0 ? '+' : ''}{deptData.totalActualEmployees - deptData.totalBudgetPositions}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Budget</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(deptData.totalBudget)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-xs">Actual</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(deptData.totalActual)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Department Content - Sections */}
                    {expandedBudgetDepts[deptName] && (
                      <div className="p-4 space-y-3 bg-white">
                        {Object.entries(deptData.sections).map(([sectionName, sectionData]) => (
                          <div key={sectionName} className="border border-gray-100 rounded-lg overflow-hidden">
                            {/* Section Header */}
                            <div className="bg-gray-50 p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-purple-500" />
                                <span className="font-semibold text-gray-800">{sectionName}</span>
                                <span className="text-xs text-gray-500">({sectionData.designations.length} designations)</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-blue-600">Budget: <strong>{sectionData.sectionBudgetPositions}</strong> pos | {formatCurrency(sectionData.sectionBudget)}</span>
                                <span className="text-emerald-600">Actual: <strong>{sectionData.sectionActualEmployees}</strong> emp | {formatCurrency(sectionData.sectionActual)}</span>
                                <span className={`${sectionData.sectionVariance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  Var: <strong>{sectionData.sectionVariance > 0 ? '+' : ''}{sectionData.sectionActualEmployees - sectionData.sectionBudgetPositions}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Designations Table */}
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Designation</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Budget Pos</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actual Emp</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Variance</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Budget Amt</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actual Amt</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Variance Amt</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sectionData.designations.map((item, idx) => (
                                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">{item.designation}</td>
                                    <td className="px-4 py-2 text-center">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {item.budgetPositions}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.employeeCount > item.budgetPositions ? 'bg-emerald-100 text-emerald-800' : item.employeeCount < item.budgetPositions ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.employeeCount}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.variance > 0 ? 'bg-red-100 text-red-800' : item.variance < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {item.variance > 0 ? '+' : ''}{item.employeeCount - item.budgetPositions}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(item.budgetTotal)}</td>
                                    <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(item.actualTotal)}</td>
                                    <td className="px-4 py-2 text-right">
                                      <span className={`font-medium ${item.variance > 0 ? 'text-red-600' : item.variance < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                                        {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {/* Section Total Row */}
                                <tr className="bg-purple-50 font-semibold">
                                  <td className="px-4 py-2 text-purple-900">{sectionName} Total</td>
                                  <td className="px-4 py-2 text-center text-blue-700">{sectionData.sectionBudgetPositions}</td>
                                  <td className="px-4 py-2 text-center text-emerald-700">{sectionData.sectionActualEmployees}</td>
                                  <td className="px-4 py-2 text-center">
                                    <span className={sectionData.sectionActualEmployees - sectionData.sectionBudgetPositions > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                      {sectionData.sectionActualEmployees - sectionData.sectionBudgetPositions > 0 ? '+' : ''}{sectionData.sectionActualEmployees - sectionData.sectionBudgetPositions}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(sectionData.sectionBudget)}</td>
                                  <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(sectionData.sectionActual)}</td>
                                  <td className="px-4 py-2 text-right">
                                    <span className={sectionData.sectionVariance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                      {sectionData.sectionVariance > 0 ? '+' : ''}{formatCurrency(sectionData.sectionVariance)}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
