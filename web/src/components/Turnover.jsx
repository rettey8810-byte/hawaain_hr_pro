import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  UserX,
  UserPlus,
  Briefcase,
  ArrowRightLeft,
  Calendar,
  Download,
  PieChart,
  BarChart3,
  Activity,
  Filter,
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  DollarSign,
  Target,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight
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
  Area
} from 'recharts';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const TERMINATION_TYPES = [
  { id: 'voluntary', label: 'Resignation', color: '#3B82F6' },
  { id: 'involuntary', label: 'Termination', color: '#EF4444' },
  { id: 'contract_end', label: 'Contract End', color: '#F59E0B' },
  { id: 'retirement', label: 'Retirement', color: '#10B981' },
  { id: 'mutual', label: 'Mutual Agreement', color: '#8B5CF6' }
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, gradient, href, onClick }) {
  const gradients = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    red: 'from-rose-500 to-red-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-violet-500 to-purple-600',
    cyan: 'from-cyan-500 to-blue-600'
  };

  const content = (
    <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-2xl shadow-lg p-5 text-white transform hover:scale-105 transition-all cursor-pointer`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-white/20 rounded-xl">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {subtitle && (
        <p className="text-sm text-white/70 mt-2">{subtitle}</p>
      )}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-200' : trend === 'down' ? 'text-red-200' : 'text-white/60'}`}>
          {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> : null}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return onClick ? <div onClick={onClick}>{content}</div> : content;
}

export default function Turnover() {
  const { companyId } = useCompany();
  const { documents: employees } = useFirestore('employees');
  const { documents: terminations } = useFirestore('terminations');
  const { documents: recruitment } = useFirestore('recruitmentApprovals');
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('year'); // year, quarter, month
  const [expandedDepts, setExpandedDepts] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter by company
  const companyEmployees = employees.filter(e => e.companyId === companyId);
  const companyTerminations = terminations.filter(t => t.companyId === companyId);
  const companyRecruitment = recruitment.filter(r => r.companyId === companyId);

  // Calculate turnover metrics
  const turnoverMetrics = useMemo(() => {
    const activeEmployees = companyEmployees.filter(e => e.status !== 'terminated').length;
    const terminatedCount = companyTerminations.filter(t => t.status === 'completed').length;
    const turnoverRate = activeEmployees > 0 ? ((terminatedCount / activeEmployees) * 100).toFixed(1) : 0;
    
    // By type
    const byType = {};
    TERMINATION_TYPES.forEach(type => {
      byType[type.id] = companyTerminations.filter(t => t.status === 'completed' && t.type === type.id).length;
    });

    // Monthly data
    const currentYear = new Date().getFullYear();
    const monthlyData = MONTHS.map((month, idx) => {
      const monthStart = new Date(currentYear, idx, 1);
      const monthEnd = new Date(currentYear, idx + 1, 0);
      
      const terminationsInMonth = companyTerminations.filter(t => {
        if (t.status !== 'completed') return false;
        const date = new Date(t.lastWorkingDate || t.completedAt || t.updatedAt);
        return date >= monthStart && date <= monthEnd;
      }).length;

      const hiresInMonth = companyRecruitment.filter(r => {
        const date = new Date(r.hiringProgress?.hiredDate || r.updatedAt);
        return date >= monthStart && date <= monthEnd && r.hiringProgress?.status === 'filled';
      }).length;

      return {
        month,
        terminations: terminationsInMonth,
        hires: hiresInMonth,
        netChange: hiresInMonth - terminationsInMonth
      };
    });

    return {
      activeEmployees,
      terminatedCount,
      turnoverRate,
      byType,
      monthlyData
    };
  }, [companyEmployees, companyTerminations, companyRecruitment]);

  // Hiring metrics
  const hiringMetrics = useMemo(() => {
    const totalRequisitions = companyRecruitment.length;
    const filled = companyRecruitment.filter(r => r.hiringProgress?.status === 'filled').length;
    const open = companyRecruitment.filter(r => r.status === 'approved' && r.hiringProgress?.status !== 'filled').length;
    const pending = companyRecruitment.filter(r => r.status === 'pending').length;
    
    // By hiring reason
    const byReason = {
      new_position: companyRecruitment.filter(r => r.reasonForHiring === 'new_position').length,
      replacement: companyRecruitment.filter(r => r.reasonForHiring === 'replacement').length,
      expansion: companyRecruitment.filter(r => r.reasonForHiring === 'expansion').length
    };

    return {
      totalRequisitions,
      filled,
      open,
      pending,
      fillRate: totalRequisitions > 0 ? ((filled / totalRequisitions) * 100).toFixed(1) : 0,
      byReason
    };
  }, [companyRecruitment]);

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    const depts = {};
    
    // Initialize with current employees
    companyEmployees.forEach(e => {
      const dept = e.department || 'Unassigned';
      if (!depts[dept]) {
        depts[dept] = { 
          name: dept, 
          current: 0, 
          terminated: 0, 
          hired: 0,
          turnoverRate: 0 
        };
      }
      if (e.status !== 'terminated') {
        depts[dept].current++;
      }
    });

    // Add terminations
    companyTerminations.filter(t => t.status === 'completed').forEach(t => {
      const dept = t.department || 'Unassigned';
      if (!depts[dept]) {
        depts[dept] = { name: dept, current: 0, terminated: 0, hired: 0, turnoverRate: 0 };
      }
      depts[dept].terminated++;
    });

    // Add hires from recruitment
    companyRecruitment.filter(r => r.hiringProgress?.status === 'filled').forEach(r => {
      const dept = r.department || 'Unassigned';
      if (!depts[dept]) {
        depts[dept] = { name: dept, current: 0, terminated: 0, hired: 0, turnoverRate: 0 };
      }
      depts[dept].hired++;
    });

    // Calculate turnover rates
    Object.values(depts).forEach(d => {
      const total = d.current + d.terminated;
      d.turnoverRate = total > 0 ? ((d.terminated / total) * 100).toFixed(1) : 0;
    });

    return Object.values(depts).sort((a, b) => b.terminated - a.terminated);
  }, [companyEmployees, companyTerminations, companyRecruitment]);

  const toggleDept = (dept) => {
    setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const exportToCSV = () => {
    const headers = ['Department', 'Current Employees', 'Terminations', 'New Hires', 'Turnover Rate %'];
    const rows = deptBreakdown.map(d => [
      d.name,
      d.current,
      d.terminated,
      d.hired,
      d.turnoverRate
    ]);
    
    const escapeCSV = (field) => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turnover_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Turnover report exported!');
  };

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <RotateCcw className="h-8 w-8" />
            Turnover Dashboard
          </h2>
          <p className="mt-2 text-white/80">
            Employee turnover, hiring trends, and workforce analytics
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="year" className="text-gray-800">This Year</option>
            <option value="quarter" className="text-gray-800">This Quarter</option>
            <option value="month" className="text-gray-800">This Month</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Turnover Rate"
          value={`${turnoverMetrics.turnoverRate}%`}
          subtitle={`${turnoverMetrics.terminatedCount} terminations / ${turnoverMetrics.activeEmployees} active`}
          icon={TrendingUp}
          gradient="red"
          href="/terminations"
        />
        <StatCard
          title="Active Employees"
          value={turnoverMetrics.activeEmployees}
          subtitle="Current workforce"
          icon={Users}
          gradient="blue"
          href="/employees"
        />
        <StatCard
          title="New Hires"
          value={hiringMetrics.filled}
          subtitle={`${hiringMetrics.open} positions open`}
          icon={UserPlus}
          gradient="green"
          href="/recruitment"
        />
        <StatCard
          title="Fill Rate"
          value={`${hiringMetrics.fillRate}%`}
          subtitle={`${hiringMetrics.filled} / ${hiringMetrics.totalRequisitions} requisitions`}
          icon={Target}
          gradient="purple"
          href="/recruitment/approval"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Turnover vs Hiring Trend */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Monthly Turnover vs Hiring Trend
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={250}>
                <AreaChart data={turnoverMetrics.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTerminations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                  <Legend />
                  <Area type="monotone" dataKey="terminations" name="Terminations" stroke="#EF4444" fillOpacity={1} fill="url(#colorTerminations)" />
                  <Area type="monotone" dataKey="hires" name="New Hires" stroke="#10B981" fillOpacity={1} fill="url(#colorHires)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Termination Types Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Termination Types
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={250}>
                <RePieChart>
                  <Pie
                    data={TERMINATION_TYPES.map(type => ({
                      name: type.label,
                      value: turnoverMetrics.byType[type.id] || 0,
                      color: type.color
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {TERMINATION_TYPES.map((type, index) => (
                      <Cell key={`cell-${index}`} fill={type.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Reasons */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-600" />
            Hiring Reasons
          </h3>
          <div style={{ height: '280px', width: '100%' }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
                <BarChart data={[
                  { name: 'New Position', value: hiringMetrics.byReason.new_position, color: '#3B82F6' },
                  { name: 'Replacement', value: hiringMetrics.byReason.replacement, color: '#EF4444' },
                  { name: 'Expansion', value: hiringMetrics.byReason.expansion, color: '#10B981' }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    {[
                      { fill: '#3B82F6' },
                      { fill: '#EF4444' },
                      { fill: '#10B981' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Net Workforce Change */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
            Net Workforce Change
          </h3>
          <div style={{ height: '280px', width: '100%' }}>
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={220}>
                <BarChart data={turnoverMetrics.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                  <Legend />
                  <Bar dataKey="netChange" name="Net Change" radius={[4, 4, 0, 0]}>
                    {turnoverMetrics.monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.netChange >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Department Turnover Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Current</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Terminations</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">New Hires</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Turnover Rate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Net Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deptBreakdown.map((dept) => (
                <tr key={dept.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dept.current}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {dept.terminated}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {dept.hired}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      parseFloat(dept.turnoverRate) > 20 ? 'bg-red-100 text-red-800' : 
                      parseFloat(dept.turnoverRate) > 10 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {dept.turnoverRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-medium ${dept.hired - dept.terminated >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dept.hired - dept.terminated > 0 ? '+' : ''}{dept.hired - dept.terminated}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/terminations" className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="p-3 bg-red-100 rounded-lg">
            <UserX className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Manage Terminations</p>
            <p className="text-sm text-gray-500">View and process terminations</p>
          </div>
          <ArrowRightLeft className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
        
        <Link to="/recruitment" className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="p-3 bg-green-100 rounded-lg">
            <UserPlus className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Recruitment Pipeline</p>
            <p className="text-sm text-gray-500">Track candidates and hires</p>
          </div>
          <ArrowRightLeft className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
        
        <Link to="/recruitment/approval" className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Hiring Requisitions</p>
            <p className="text-sm text-gray-500">{hiringMetrics.pending} pending approvals</p>
          </div>
          <ArrowRightLeft className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
      </div>
    </div>
  );
}
