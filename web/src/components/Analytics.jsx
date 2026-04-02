import { useState } from 'react';
import { BarChart3, TrendingUp, Users, PieChart, Download, Calendar, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import analyticsService from '../services/analyticsService';

export default function Analytics() {
  const [dateRange, setDateRange] = useState('last-30-days');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: employees, loading: employeesLoading } = useFirestore('employees');
  const { documents: turnoverRecords, loading: turnoverLoading } = useFirestore('turnover');

  // Filter by company
  const filteredEmployees = employees.filter(e => e.companyId === companyId);
  const filteredTurnover = turnoverRecords.filter(t => t.companyId === companyId);

  // Calculate stats from real data
  const headcountData = {
    total: filteredEmployees.length,
    newHires: filteredEmployees.filter(e => {
      const joinDate = new Date(e.joinDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinDate >= thirtyDaysAgo;
    }).length,
    active: filteredEmployees.filter(e => e.status === 'active').length,
    growth: filteredEmployees.length > 0 
      ? ((filteredEmployees.filter(e => {
          const joinDate = new Date(e.joinDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return joinDate >= thirtyDaysAgo;
        }).length / filteredEmployees.length) * 100).toFixed(1)
      : 0
  };

  const turnoverRate = filteredEmployees.length > 0
    ? ((filteredTurnover.length / filteredEmployees.length) * 100).toFixed(1)
    : 0;

  const genderData = [
    { name: 'Male', value: filteredEmployees.filter(e => e.gender === 'male').length },
    { name: 'Female', value: filteredEmployees.filter(e => e.gender === 'female').length },
    { name: 'Other', value: filteredEmployees.filter(e => e.gender === 'other').length }
  ];

  const safeGenderData = Array.isArray(genderData) ? genderData : [];

  const COLORS = ['#3B82F6', '#EC4899', '#10B981'];
  const safeColors = Array.isArray(COLORS) && COLORS.length > 0 ? COLORS : ['#3B82F6'];

  const turnoverData = filteredTurnover.map(t => ({
    month: new Date(t.date).toLocaleString('default', { month: 'short' }),
    resignations: t.type === 'voluntary' ? 1 : 0,
    terminations: t.type === 'involuntary' ? 1 : 0
  }));

  if (employeesLoading || turnoverLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Bar chart-amico.svg" 
            alt="Analytics" 
            className="h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              HR Analytics Dashboard
            </h1>
            <p className="text-slate-300 mt-1">Insights and metrics for data-driven decisions</p>
          </div>
          <button className="bg-white text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Headcount</p>
          <p className="text-2xl font-bold">{headcountData.total}</p>
          <p className="text-sm text-green-600">+{headcountData.newHires} new hires</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Turnover Rate</p>
          <p className="text-2xl font-bold">{turnoverRate}%</p>
          <p className="text-sm text-gray-500">{filteredTurnover.filter(t => t.type === 'voluntary').length} voluntary, {filteredTurnover.filter(t => t.type === 'involuntary').length} involuntary</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Gender Distribution</p>
          <p className="text-2xl font-bold">{safeGenderData[0]?.value}/{safeGenderData[1]?.value}/{safeGenderData[2]?.value}</p>
          <p className="text-sm text-gray-500">Male/Female/Other</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Department Headcount */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Headcount by Department</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
              <BarChart data={filteredEmployees.map(e => ({ name: e.department, value: 1 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Gender Distribution</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
              <RePieChart>
                <Pie
                  data={safeGenderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {safeGenderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={safeColors[index % safeColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {safeGenderData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: safeColors[index % safeColors.length] }} />
                <span className="text-sm">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Turnover Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">Turnover Trend</h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
            <LineChart data={turnoverData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="resignations" stroke="#EF4444" name="Resignations" />
              <Line type="monotone" dataKey="terminations" stroke="#F59E0B" name="Terminations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
