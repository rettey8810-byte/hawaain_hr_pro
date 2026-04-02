import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Download, Filter, Calendar, Users, Building2, TrendingUp, PieChart as PieIcon, Activity, FileText } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];

export default function LeaveReports({ leaves, employees }) {
  const [dateRange, setDateRange] = useState('year'); // year, quarter, month, custom
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportType, setReportType] = useState('summary'); // summary, utilization, trends, department
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 11), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(e => e.department).filter(Boolean));
    return ['all', ...Array.from(deptSet)];
  }, [employees]);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = leaves;
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(leave => {
        const employee = employees.find(e => e.id === leave.employeeId);
        return employee?.department === selectedDepartment;
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    filtered = filtered.filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return leaveDate >= start && leaveDate <= end;
    });

    return filtered;
  }, [leaves, employees, selectedDepartment, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const approved = filteredData.filter(l => l.status === 'approved').length;
    const pending = filteredData.filter(l => l.status === 'pending').length;
    const rejected = filteredData.filter(l => l.status === 'rejected').length;
    const totalDays = filteredData.reduce((sum, l) => sum + (l.days || 0), 0);

    return { total, approved, pending, rejected, totalDays };
  }, [filteredData]);

  // Leave type distribution
  const leaveTypeData = useMemo(() => {
    const typeCount = {};
    filteredData.forEach(leave => {
      typeCount[leave.leaveType] = (typeCount[leave.leaveType] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const months = eachMonthOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    });

    return months.map(month => {
      const monthStr = format(month, 'MMM yyyy');
      const monthLeaves = filteredData.filter(l => {
        const leaveMonth = new Date(l.startDate);
        return leaveMonth.getMonth() === month.getMonth() && 
               leaveMonth.getFullYear() === month.getFullYear();
      });

      return {
        month: monthStr,
        total: monthLeaves.length,
        approved: monthLeaves.filter(l => l.status === 'approved').length,
        pending: monthLeaves.filter(l => l.status === 'pending').length,
        rejected: monthLeaves.filter(l => l.status === 'rejected').length,
        days: monthLeaves.reduce((sum, l) => sum + (l.days || 0), 0),
      };
    });
  }, [filteredData, startDate, endDate]);

  // Department breakdown
  const departmentData = useMemo(() => {
    const deptStats = {};
    filteredData.forEach(leave => {
      const employee = employees.find(e => e.id === leave.employeeId);
      const dept = employee?.department || 'No Department';
      if (!deptStats[dept]) {
        deptStats[dept] = { total: 0, approved: 0, days: 0 };
      }
      deptStats[dept].total++;
      if (leave.status === 'approved') deptStats[dept].approved++;
      deptStats[dept].days += (leave.days || 0);
    });

    return Object.entries(deptStats).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [filteredData, employees]);

  // Top leave takers
  const topLeaveTakers = useMemo(() => {
    const employeeStats = {};
    filteredData.forEach(leave => {
      if (!employeeStats[leave.employeeId]) {
        const emp = employees.find(e => e.id === leave.employeeId);
        employeeStats[leave.employeeId] = { 
          name: emp?.name || 'Unknown', 
          department: emp?.department || 'N/A',
          total: 0, 
          days: 0 
        };
      }
      employeeStats[leave.employeeId].total++;
      employeeStats[leave.employeeId].days += (leave.days || 0);
    });

    return Object.values(employeeStats)
      .sort((a, b) => b.days - a.days)
      .slice(0, 10);
  }, [filteredData, employees]);

  const exportToCSV = () => {
    const headers = ['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Destination'];
    const rows = filteredData.map(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      return [
        emp?.name || 'Unknown',
        emp?.department || 'N/A',
        leave.leaveType,
        leave.startDate,
        leave.endDate,
        leave.days,
        leave.status,
        leave.destination || 'N/A',
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    // In production, use a library like xlsx
    exportToCSV(); // Fallback to CSV for now
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Leave Reports & Analytics</h1>
              <p className="text-white/80">Comprehensive leave utilization insights</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          >
            <option value="year">This Year</option>
            <option value="quarter">This Quarter</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          >
            <option value="all">All Departments</option>
            {departments.filter(d => d !== 'all').map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-rose-100 rounded-xl">
              <Activity className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Days</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.totalDays}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 bg-white rounded-xl shadow-lg p-2">
        {[
          { id: 'summary', label: 'Summary', icon: PieIcon },
          { id: 'trends', label: 'Monthly Trends', icon: Activity },
          { id: 'department', label: 'Department Analysis', icon: Building2 },
          { id: 'employees', label: 'Top Leave Takers', icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setReportType(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              reportType === id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportType === 'summary' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaveTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leaveTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
              <div className="space-y-4">
                {[
                  { label: 'Approved', value: stats.approved, color: 'bg-green-500' },
                  { label: 'Pending', value: stats.pending, color: 'bg-amber-500' },
                  { label: 'Rejected', value: stats.rejected, color: 'bg-rose-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-32 font-medium text-gray-700">{label}</div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${(value / stats.total) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {reportType === 'trends' && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Leave Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="approved" stroke="#10B981" name="Approved" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" name="Pending" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" name="Rejected" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportType === 'department' && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total Leaves" />
                <Bar dataKey="approved" fill="#10B981" name="Approved" />
                <Bar dataKey="days" fill="#8B5CF6" name="Total Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {reportType === 'employees' && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Leave Takers</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Applications</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topLeaveTakers.map((emp, idx) => (
                    <tr key={emp.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-500">#{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{emp.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{emp.total}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">{emp.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
