import { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Download,
  BarChart3,
  PieChart,
  Palmtree,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, formatCurrency } from '../utils/helpers';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, subMonths } from 'date-fns';

const LEAVE_TYPE_COLORS = {
  annual: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', color: '#3B82F6' },
  sick: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', color: '#F43F5E' },
  emergency: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', color: '#EF4444' },
  unpaid: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', color: '#6B7280' },
  other: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', color: '#9333EA' }
};

const STATUS_COLORS = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280'
};

export default function LeaveAnalytics() {
  const { currentCompany } = useCompany();
  const [dateRange, setDateRange] = useState('last6months');
  const [viewMode, setViewMode] = useState('overview');

  const { documents: leaves, loading } = useFirestore('leaves');
  const { documents: employees } = useFirestore('employees');

  // Filter leaves by company
  const companyLeaves = useMemo(() => 
    leaves.filter(l => l.companyId === currentCompany?.id),
    [leaves, currentCompany]
  );

  // Date range calculation
  const dateRangeInterval = useMemo(() => {
    const end = new Date();
    let start;
    
    switch (dateRange) {
      case 'last3months':
        start = subMonths(end, 3);
        break;
      case 'last6months':
        start = subMonths(end, 6);
        break;
      case 'last12months':
        start = subMonths(end, 12);
        break;
      case 'thisyear':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      default:
        start = subMonths(end, 6);
    }
    
    return { start, end };
  }, [dateRange]);

  // Filter leaves by date range
  const filteredLeaves = useMemo(() => {
    return companyLeaves.filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return leaveDate >= dateRangeInterval.start && leaveDate <= dateRangeInterval.end;
    });
  }, [companyLeaves, dateRangeInterval]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredLeaves.length;
    const approved = filteredLeaves.filter(l => l.status === 'approved').length;
    const pending = filteredLeaves.filter(l => l.status === 'pending').length;
    const rejected = filteredLeaves.filter(l => l.status === 'rejected').length;
    const totalDays = filteredLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
    
    return { total, approved, pending, rejected, totalDays };
  }, [filteredLeaves]);

  // Leave type breakdown
  const leaveTypeStats = useMemo(() => {
    const types = {};
    filteredLeaves.forEach(leave => {
      const type = leave.leaveType || 'other';
      if (!types[type]) {
        types[type] = { count: 0, days: 0, label: type.charAt(0).toUpperCase() + type.slice(1) };
      }
      types[type].count++;
      types[type].days += (leave.days || 0);
    });
    return Object.entries(types).map(([key, value]) => ({ type: key, ...value }));
  }, [filteredLeaves]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = eachMonthOfInterval({
      start: dateRangeInterval.start,
      end: dateRangeInterval.end
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthLeaves = filteredLeaves.filter(l => {
        const leaveDate = new Date(l.startDate);
        return leaveDate >= monthStart && leaveDate <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy'),
        count: monthLeaves.length,
        days: monthLeaves.reduce((sum, l) => sum + (l.days || 0), 0),
        approved: monthLeaves.filter(l => l.status === 'approved').length,
        pending: monthLeaves.filter(l => l.status === 'pending').length
      };
    });
  }, [filteredLeaves, dateRangeInterval]);

  // Department-wise leave stats
  const departmentStats = useMemo(() => {
    const deptMap = {};
    
    filteredLeaves.forEach(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      const dept = emp?.['Department '] || emp?.Department || emp?.department || 'Unassigned';
      
      if (!deptMap[dept]) {
        deptMap[dept] = { name: dept, count: 0, days: 0, employees: new Set() };
      }
      
      deptMap[dept].count++;
      deptMap[dept].days += (leave.days || 0);
      deptMap[dept].employees.add(leave.employeeId);
    });

    return Object.values(deptMap)
      .map(d => ({ ...d, employeeCount: d.employees.size }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeaves, employees]);

  // Top employees by leave days
  const topLeaveTakers = useMemo(() => {
    const empMap = {};
    
    filteredLeaves.forEach(leave => {
      if (!empMap[leave.employeeId]) {
        const emp = employees.find(e => e.id === leave.employeeId);
        empMap[leave.employeeId] = {
          name: emp?.FullName || emp?.name || 'Unknown',
          department: emp?.['Department '] || emp?.Department || 'N/A',
          totalDays: 0,
          count: 0
        };
      }
      empMap[leave.employeeId].totalDays += (leave.days || 0);
      empMap[leave.employeeId].count++;
    });

    return Object.entries(empMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalDays - a.totalDays)
      .slice(0, 10);
  }, [filteredLeaves, employees]);

  // Simple bar chart component
  const SimpleBarChart = ({ data, dataKey, labelKey, color }) => (
    <div className="space-y-2">
      {data.map((item, index) => {
        const maxValue = Math.max(...data.map(d => d[dataKey]));
        const percentage = maxValue > 0 ? (item[dataKey] / maxValue) * 100 : 0;
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600 truncate">{item[labelKey]}</div>
            <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: color || LEAVE_TYPE_COLORS[item.type]?.color || '#3B82F6'
                }}
              />
            </div>
            <div className="w-12 text-sm font-medium text-gray-900 text-right">{item[dataKey]}</div>
          </div>
        );
      })}
    </div>
  );

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Month', 'Total Leaves', 'Approved', 'Pending', 'Total Days'];
    const rows = monthlyTrend.map(m => [m.month, m.count, m.approved, m.pending, m.days]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🌴 Leave Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Comprehensive leave statistics and trends</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border-gray-300 py-2 pl-3 pr-8 focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="last12months">Last 12 Months</option>
            <option value="thisyear">This Year</option>
          </select>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Leaves</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Palmtree className="h-8 w-8 text-emerald-100" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-100" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-100" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-rose-100" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Days</p>
              <p className="text-3xl font-bold mt-1">{stats.totalDays}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-100" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
            Monthly Leave Trend
          </h3>
          <div className="h-64">
            <SimpleBarChart 
              data={monthlyTrend} 
              dataKey="count" 
              labelKey="month" 
              color="#10B981"
            />
          </div>
        </div>

        {/* Leave Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-blue-500" />
            Leave Type Distribution
          </h3>
          <div className="space-y-3">
            {leaveTypeStats.map((type) => (
              <div key={type.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: LEAVE_TYPE_COLORS[type.type]?.color || '#6B7280' }}
                  />
                  <span className="font-medium text-gray-900">{type.label}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{type.count} leaves</p>
                  <p className="text-sm text-gray-500">{type.days} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department-wise Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-amber-500" />
            Department-wise Leave Usage
          </h3>
          <div className="h-64 overflow-y-auto">
            <SimpleBarChart 
              data={departmentStats} 
              dataKey="count" 
              labelKey="name" 
              color="#F59E0B"
            />
          </div>
        </div>

        {/* Top Leave Takers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-500" />
            Top 10 Leave Takers
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {topLeaveTakers.map((emp, index) => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{emp.totalDays} days</p>
                  <p className="text-xs text-gray-500">{emp.count} leaves</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
