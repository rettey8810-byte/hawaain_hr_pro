import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  FileText,
  Briefcase,
  Plane,
  HeartPulse,
  Users,
  TrendingUp,
  ArrowRight,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  HardHat,
  Building2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
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
import { useExpiryAlerts } from '../hooks/useExpiryAlerts';
import { useCompany } from '../contexts/CompanyContext';

function StatCard({ title, value, icon: Icon, gradient, subtitle, href }) {
  const gradientClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    yellow: 'from-amber-500 to-orange-600',
    red: 'from-rose-500 to-pink-600',
    purple: 'from-violet-500 to-purple-600',
    cyan: 'from-cyan-500 to-blue-600',
    orange: 'from-orange-500 to-red-600'
  };

  return (
    <Link to={href} className="group bg-white overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-xl p-4 bg-gradient-to-br ${gradientClasses[gradient]} text-white shadow-lg`}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {subtitle && (
          <div className="mt-4 text-sm font-medium text-gray-400">{subtitle}</div>
        )}
      </div>
    </Link>
  );
}

function AlertItem({ title, count, type, icon: Icon, href }) {
  const typeClasses = {
    expired: 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-200',
    expiring30: 'bg-gradient-to-br from-orange-400 to-amber-500 text-white border-orange-200',
    expiring60: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-yellow-200',
    expiring90: 'bg-gradient-to-br from-sky-400 to-blue-500 text-white border-blue-200'
  };

  return (
    <Link to={href} className={`flex items-center p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${typeClasses[type]}`}>
      <div className="p-2 bg-white/20 rounded-lg">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-sm text-white/80">{count} documents</p>
      </div>
      <ArrowRight className="h-5 w-5 text-white/60" />
    </Link>
  );
}

export default function Dashboard() {
  const { companyId, currentCompany, getCompanyDisplayName, isConstructionCompany, isExternalCompany } = useCompany();
  
  // Fetch different data based on company type
  const { documents: employees } = useFirestore('employees');
  const { documents: constructionWorkers } = useFirestore('constructionWorkers');
  const { documents: externalStaff } = useFirestore('externalStaff');
  
  const { documents: passports } = useFirestore('passports');
  const { documents: visas } = useFirestore('visas');
  const { documents: workPermits } = useFirestore('workPermits');
  const { documents: medicals } = useFirestore('medicals');
  const { documents: leaves } = useFirestore('leaves');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the correct workforce data based on company type
  const getWorkforceData = () => {
    if (isConstructionCompany()) {
      return constructionWorkers.filter(w => w.companyId === companyId);
    } else if (isExternalCompany()) {
      return externalStaff.filter(s => s.companyId === companyId);
    } else {
      return employees.filter(e => e.companyId === companyId || !e.companyId); // Fallback for old data
    }
  };

  const companyEmployees = getWorkforceData();
  const companyLeaves = leaves.filter(l => l.companyId === companyId);

  // Calculate department distribution
  const departmentData = companyEmployees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departmentChartData = Object.entries(departmentData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];

  // Calculate monthly headcount trend (mock data for now - would come from historical data)
  const headcountTrend = [
    { month: 'Jan', count: Math.max(0, companyEmployees.length - 5) },
    { month: 'Feb', count: Math.max(0, companyEmployees.length - 4) },
    { month: 'Mar', count: Math.max(0, companyEmployees.length - 3) },
    { month: 'Apr', count: Math.max(0, companyEmployees.length - 2) },
    { month: 'May', count: Math.max(0, companyEmployees.length - 1) },
    { month: 'Jun', count: companyEmployees.length },
  ];

  // Calculate leave stats
  const leaveStats = {
    approved: companyLeaves.filter(l => l.status === 'approved').length,
    pending: companyLeaves.filter(l => l.status === 'pending').length,
    rejected: companyLeaves.filter(l => l.status === 'rejected').length,
  };

  const leaveChartData = [
    { name: 'Approved', value: leaveStats.approved, color: '#10B981' },
    { name: 'Pending', value: leaveStats.pending, color: '#F59E0B' },
    { name: 'Rejected', value: leaveStats.rejected, color: '#EF4444' },
  ];

  // Calculate trends
  const currentMonthLeaves = companyLeaves.filter(l => {
    const leaveMonth = new Date(l.createdAt).getMonth();
    const currentMonth = new Date().getMonth();
    return leaveMonth === currentMonth;
  }).length;

  const lastMonthLeaves = companyLeaves.filter(l => {
    const leaveMonth = new Date(l.createdAt).getMonth();
    const lastMonth = new Date().getMonth() - 1;
    return leaveMonth === lastMonth;
  }).length;

  const leaveTrend = currentMonthLeaves > lastMonthLeaves ? 'up' : currentMonthLeaves < lastMonthLeaves ? 'down' : 'same';
  const leaveTrendValue = lastMonthLeaves > 0 ? Math.round(((currentMonthLeaves - lastMonthLeaves) / lastMonthLeaves) * 100) : 0;

  const passportAlerts = useExpiryAlerts(passports);
  const visaAlerts = useExpiryAlerts(visas);
  const permitAlerts = useExpiryAlerts(workPermits);
  const medicalAlerts = useExpiryAlerts(medicals);

  const totalAlerts = 
    passportAlerts.getTotalExpiring() + 
    visaAlerts.getTotalExpiring() + 
    permitAlerts.getTotalExpiring() + 
    medicalAlerts.getTotalExpiring();

  const expiredCount = 
    passportAlerts.alerts.expired.length + 
    visaAlerts.alerts.expired.length + 
    permitAlerts.alerts.expired.length + 
    medicalAlerts.alerts.expired.length;

  const expiring30Count = 
    passportAlerts.alerts.expiring30.length + 
    visaAlerts.alerts.expiring30.length + 
    permitAlerts.alerts.expiring30.length + 
    medicalAlerts.alerts.expiring30.length;

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient with Illustration */}
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Team work-amico (1).svg" 
            alt="Team" 
            className="h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">
            📊 {getCompanyDisplayName()} Dashboard
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Overview of your HR and expatriate management system
          </p>
          {isConstructionCompany() && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-500/30 rounded-full text-sm">
              <HardHat className="h-4 w-4" />
              Construction Workforce View
            </div>
          )}
          {isExternalCompany() && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-500/30 rounded-full text-sm">
              <Users className="h-4 w-4" />
              External Staff & Visitor Management
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isConstructionCompany() ? (
          <>
            <StatCard
              title="Construction Workers"
              value={companyEmployees.length}
              icon={HardHat}
              gradient="orange"
              subtitle="Villa Construction Workforce"
              href="/construction-workforce"
            />
            <StatCard
              title="Work Permits"
              value={companyEmployees.filter(w => w.wpDays > 0).length}
              icon={Briefcase}
              gradient="cyan"
              subtitle="Active Work Permits"
              href="/construction-workforce"
            />
            <StatCard
              title="Expiring Soon"
              value={companyEmployees.filter(w => w.status === 'expiring30').length}
              icon={AlertTriangle}
              gradient="yellow"
              subtitle="Within 30 days"
              href="/construction-workforce"
            />
            <StatCard
              title="Expired"
              value={companyEmployees.filter(w => w.status === 'expired').length}
              icon={Clock}
              gradient="red"
              subtitle="Requires immediate action"
              href="/construction-workforce"
            />
          </>
        ) : isExternalCompany() ? (
          <>
            <StatCard
              title="External Staff"
              value={companyEmployees.length}
              icon={Users}
              gradient="blue"
              subtitle="Total Staff & Visitors"
              href="/external-staff"
            />
            <StatCard
              title="Checked In"
              value={companyEmployees.filter(s => s.status === 'checked-in').length}
              icon={Building2}
              gradient="green"
              subtitle="Currently on Property"
              href="/external-staff"
            />
            <StatCard
              title="Visitors"
              value={companyEmployees.filter(s => s.type === 'visitor').length}
              icon={Users}
              gradient="purple"
              subtitle="Visitor Count"
              href="/external-staff"
            />
            <StatCard
              title="3rd Party"
              value={companyEmployees.filter(s => s.type === '3rd-party').length}
              icon={Briefcase}
              gradient="cyan"
              subtitle="Contractor Staff"
              href="/external-staff"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Employees"
              value={companyEmployees.length}
              icon={Users}
              gradient="blue"
              subtitle="Active workforce"
              href="/employees"
            />
            <StatCard
              title="Expiring Soon"
              value={expiring30Count}
              icon={AlertTriangle}
              gradient="yellow"
              subtitle="Within 30 days"
              href="/notifications"
            />
            <StatCard
              title="Expired Documents"
              value={expiredCount}
              icon={Clock}
              gradient="red"
              subtitle="Requires immediate action"
              href="/notifications"
            />
            <StatCard
              title="Valid Documents"
              value={totalAlerts > 0 ? 'Review' : 'All Clear'}
              icon={CheckCircle}
              gradient="green"
              subtitle={`${totalAlerts} alerts total`}
              href="/notifications"
            />
          </>
        )}
      </div>

      {/* Document Type Stats - Only for Sun Island/Resort companies */}
      {!isConstructionCompany() && !isExternalCompany() && (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Passports"
          value={passports.length}
          icon={FileText}
          gradient="purple"
          subtitle={`${passportAlerts.getTotalExpiring()} expiring`}
          href="/passports"
        />
        <StatCard
          title="Work Permits"
          value={workPermits.length}
          icon={Briefcase}
          gradient="cyan"
          subtitle={`${permitAlerts.getTotalExpiring()} expiring`}
          href="/work-permits"
        />
        <StatCard
          title="Visas"
          value={visas.length}
          icon={Plane}
          gradient="purple"
          subtitle={`${visaAlerts.getTotalExpiring()} expiring`}
          href="/visas"
        />
        <StatCard
          title="Medical Records"
          value={medicals.length}
          icon={HeartPulse}
          gradient="red"
          subtitle={`${medicalAlerts.getTotalExpiring()} expiring`}
          href="/medical"
        />
      </div>
      )}

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount Trend */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Headcount Trend
            </h3>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+{companyEmployees.length > 0 ? ((companyEmployees.length - headcountTrend[0].count) / headcountTrend[0].count * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
          <div style={{ height: '192px', width: '100%' }}>
            {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
              <AreaChart data={headcountTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4F46E5" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Department Distribution
          </h3>
          <div style={{ height: '192px', width: '100%' }}>
            {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
              <RePieChart>
                <Pie
                  data={departmentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {departmentChartData.slice(0, 4).map((dept, index) => (
              <div key={dept.name} className="flex items-center gap-1 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Statistics */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Leave Overview
            </h3>
            <div className={`flex items-center gap-1 text-sm ${leaveTrend === 'up' ? 'text-green-600' : leaveTrend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
              {leaveTrend === 'up' ? <TrendingUp className="h-4 w-4" /> : leaveTrend === 'down' ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              <span>{leaveTrendValue > 0 ? `+${leaveTrendValue}%` : `${leaveTrendValue}%`}</span>
            </div>
          </div>
          <div style={{ height: '192px', width: '100%' }}>
            {mounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180}>
              <BarChart data={leaveChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={70} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {leaveChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {totalAlerts > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg mr-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              Document Expiry Alerts
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {expiredCount > 0 && (
                <AlertItem
                  title="Expired"
                  count={expiredCount}
                  type="expired"
                  icon={Clock}
                  href="/notifications"
                />
              )}
              {expiring30Count > 0 && (
                <AlertItem
                  title="Expiring in 30 days"
                  count={expiring30Count}
                  type="expiring30"
                  icon={AlertTriangle}
                  href="/notifications"
                />
              )}
              {(passportAlerts.alerts.expiring60.length + visaAlerts.alerts.expiring60.length + 
                permitAlerts.alerts.expiring60.length + medicalAlerts.alerts.expiring60.length) > 0 && (
                <AlertItem
                  title="Expiring in 60 days"
                  count={passportAlerts.alerts.expiring60.length + visaAlerts.alerts.expiring60.length + 
                         permitAlerts.alerts.expiring60.length + medicalAlerts.alerts.expiring60.length}
                  type="expiring60"
                  icon={Clock}
                  href="/notifications"
                />
              )}
              {(passportAlerts.alerts.expiring90.length + visaAlerts.alerts.expiring90.length + 
                permitAlerts.alerts.expiring90.length + medicalAlerts.alerts.expiring90.length) > 0 && (
                <AlertItem
                  title="Expiring in 90 days"
                  count={passportAlerts.alerts.expiring90.length + visaAlerts.alerts.expiring90.length + 
                         permitAlerts.alerts.expiring90.length + medicalAlerts.alerts.expiring90.length}
                  type="expiring90"
                  icon={TrendingUp}
                  href="/notifications"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
