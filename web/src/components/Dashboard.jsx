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
  UserX,
  Download
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
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { useExpiryAlerts } from '../hooks/useExpiryAlerts';

function StatCard({ title, value, icon: Icon, gradient, subtitle, href }) {
  const gradientClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    yellow: 'from-amber-500 to-orange-600',
    red: 'from-rose-500 to-pink-600',
    purple: 'from-violet-500 to-purple-600',
    cyan: 'from-cyan-500 to-blue-600'
  };

  return (
    <Link to={href} className="group block bg-white overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 cursor-pointer">
      <div className="p-6 pointer-events-none">
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
  const { companyId } = useCompany();
  const { userData, filterByVisibility } = useAuth();
  const { documents: employees } = useFirestore('employees');
  const { documents: leaves } = useFirestore('leaves');
  const { documents: terminations } = useFirestore('terminations');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to calculate days remaining from employee fields
  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter by company and role visibility, exclude terminated employees
  const visibleEmployees = filterByVisibility ? filterByVisibility(employees) : employees;
  const companyEmployeesAll = visibleEmployees.filter(e => e.companyId === companyId);
  const companyEmployees = companyEmployeesAll.filter(e => e.status !== 'terminated');
  const activeEmployeesCount = companyEmployees.length;
  const terminatedEmployeesCount = companyEmployeesAll.filter(e => e.status === 'terminated').length;
  const companyLeaves = leaves.filter(l => l.companyId === companyId);
  
  // Calculate termination stats for current company
  const companyTerminations = terminations.filter(t => t.companyId === companyId);
  const activeTerminations = companyTerminations.filter(t => ['pending', 'in_progress'].includes(t.status)).length;
  const completedTerminations = companyTerminations.filter(t => t.status === 'completed').length;

  // Calculate department distribution
  const departmentData = companyEmployees.reduce((acc, emp) => {
    const dept = emp.Department || emp.department || 'Unassigned';
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

  // CSV Export function for all staff details - COMPREHENSIVE
  const exportStaffToCSV = () => {
    const headers = [
      // Employee Basic Info
      'Employee ID', 'Full Name', 'Department', 'Designation', 'Section', 'Employee Code',
      'Email', 'Phone', 'Mobile', 'Status', 'Hire Date', 'Join Date', 'Nationality',
      'Date of Birth', 'Gender', 'Address', 'Emergency Contact Name', 'Emergency Contact Phone',
      // Passport Details
      'Passport Number', 'Passport Issue Date', 'Passport Expiry Date', 'Passport Days Remaining',
      'Passport Country', 'Passport Status',
      // Visa Details
      'Visa Number', 'Visa Type', 'Visa Entry Type', 'Visa Issue Date', 'Visa Expiry Date',
      'Visa Days Remaining', 'Visa Status', 'Sponsor',
      // Work Permit Details
      'Work Permit Number', 'Work Permit Issue Date', 'Work Permit Expiry Date',
      'Work Permit Days Remaining', 'Permit Employer', 'Permit Position', 'Work Permit Status',
      // Medical Details
      'Medical Test Date', 'Medical Result', 'Medical Expiry Date', 'Medical Days Remaining',
      'Medical Insurance Number', 'Blood Group', 'Allergies', 'Dietary Restrictions',
      // Bank & Salary
      'Bank Name', 'Account Number', 'IBAN', 'Branch',
      'Basic Salary', 'Housing Allowance', 'Transport Allowance', 'Other Allowances', 'Total Salary',
      // Accommodation
      'Room Number', 'Building', 'Floor', 'Room Type', 'Bed Count', 'Check In Date',
      'Room Status', 'Room Amenities'
    ];
    
    const escapeCSV = (field) => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Helper to calculate days remaining
    const calculateDaysRemaining = (expiryDate) => {
      if (!expiryDate) return '';
      const expiry = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };
    
    const rows = companyEmployees.map(emp => {
      // Find related documents
      const passport = passports.find(p => p.employeeId === emp.id);
      const permit = workPermits.find(w => w.employeeId === emp.id);
      const visa = visas.find(v => v.employeeId === emp.id);
      const medical = medicals.find(m => m.employeeId === emp.id);
      
      // Find accommodation
      const assignment = roomAssignments.find(a => a.employeeId === emp.id && !a.checkOutDate);
      const room = assignment ? rooms.find(r => r.id === assignment.roomId) : null;
      
      // Passport fields
      const passportExpiry = passport?.DateofExpiry || passport?.expiryDate || '';
      const passportDays = calculateDaysRemaining(passportExpiry);
      
      // Visa fields
      const visaExpiry = visa?.DateofExpiry || visa?.expiryDate || '';
      const visaDays = calculateDaysRemaining(visaExpiry);
      
      // Work Permit fields
      const permitExpiry = permit?.ExpiryDate || permit?.expiryDate || '';
      const permitDays = calculateDaysRemaining(permitExpiry);
      
      // Medical fields
      const medicalExpiry = medical?.expiryDate || medical?.medicalExpiry || '';
      const medicalDays = calculateDaysRemaining(medicalExpiry);
      
      return [
        // Employee Basic Info
        emp.id,
        emp.FullName || emp.name || '',
        emp.Department || emp.department || 'Unassigned',
        emp.Designation || emp.designation || '',
        emp.Section || emp.section || '',
        emp.EmpID || emp.employeeCode || '',
        emp.Email || emp.email || '',
        emp.Phone || emp.phone || '',
        emp.Mobile || emp.mobile || '',
        emp.status || 'active',
        emp.HireDate || emp.hireDate || emp.JoinDate || emp.joinDate || '',
        emp.JoinDate || emp.joinDate || '',
        emp.Nationality || emp.nationality || '',
        emp.DateOfBirth || emp.dateOfBirth || emp.DOB || '',
        emp.Gender || emp.gender || '',
        emp.Address || emp.address || '',
        emp.EmergencyContactName || emp.emergencyContactName || '',
        emp.EmergencyContactPhone || emp.emergencyContactPhone || '',
        // Passport
        passport?.Passportno || passport?.passportNo || '',
        passport?.DateofIssue || passport?.issueDate || '',
        passportExpiry,
        passportDays,
        passport?.Country || passport?.country || '',
        passportDays === '' ? '' : passportDays < 0 ? 'Expired' : passportDays <= 30 ? 'Expiring Soon' : 'Valid',
        // Visa
        visa?.VisaNumber || visa?.visaNumber || '',
        visa?.VisaType || visa?.visaType || '',
        visa?.EntryType || visa?.entryType || '',
        visa?.DateofIssue || visa?.issueDate || '',
        visaExpiry,
        visaDays,
        visaDays === '' ? '' : visaDays < 0 ? 'Expired' : visaDays <= 30 ? 'Expiring Soon' : 'Valid',
        visa?.Sponsor || visa?.sponsor || '',
        // Work Permit
        permit?.WorkPermitNumber || permit?.permitNumber || '',
        permit?.DateofIssue || permit?.issueDate || '',
        permitExpiry,
        permitDays,
        permitDays === '' ? '' : permitDays < 0 ? 'Expired' : permitDays <= 30 ? 'Expiring Soon' : 'Valid',
        permit?.Employer || permit?.employer || '',
        permit?.Position || permit?.position || permit?.designation || '',
        permit?.Status || permit?.status || '',
        // Medical
        medical?.medicalTestDate || medical?.testDate || '',
        medical?.medicalResult || medical?.result || '',
        medicalExpiry,
        medicalDays,
        medicalDays === '' ? '' : medicalDays < 0 ? 'Expired' : medicalDays <= 30 ? 'Expiring Soon' : 'Valid',
        emp.MedicalInsurance || emp.medicalInsurance || medical?.insuranceNumber || '',
        emp.BloodGroup || emp.bloodGroup || medical?.bloodGroup || '',
        emp.Allergies || emp.allergies || '',
        emp.DietaryRestrictions || emp.dietaryRestrictions || '',
        // Bank & Salary
        emp.BankName || emp.bankName || '',
        emp.AccountNumber || emp.accountNumber || '',
        emp.IBAN || emp.iban || '',
        emp.Branch || emp.branch || '',
        emp.BasicUSD || emp.basicSalary || emp.salary?.basic || '',
        emp.HousingUSD || emp.housingAllowance || emp.salary?.housing || '',
        emp.TransportUSD || emp.transportAllowance || emp.salary?.transport || '',
        emp.OtherAllowances || emp.otherAllowances || emp.salary?.other || '',
        emp.TotalSalaryUSD || emp.totalSalary || emp.salary?.total || '',
        // Accommodation
        room?.roomNumber || '',
        room?.building || '',
        room?.floor || '',
        room?.roomType || '',
        room?.beds || room?.capacity || '',
        assignment?.checkInDate || '',
        assignment ? 'Occupied' : 'No Room',
        room?.amenities ? room.amenities.join('; ') : ''
      ].map(escapeCSV);
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff_complete_details_${companyId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Calculate document stats from employee fields
  const getDocumentStats = (fieldName) => {
    const docs = companyEmployees.filter(emp => emp[fieldName]);
    const withDates = docs.map(emp => ({
      ...emp,
      daysRemaining: calculateDaysRemaining(emp[fieldName])
    }));
    
    return {
      total: docs.length,
      expired: withDates.filter(d => d.daysRemaining !== null && d.daysRemaining <= 0).length,
      expiring30: withDates.filter(d => d.daysRemaining !== null && d.daysRemaining > 0 && d.daysRemaining <= 30).length,
      expiring60: withDates.filter(d => d.daysRemaining !== null && d.daysRemaining > 30 && d.daysRemaining <= 60).length,
      expiring90: withDates.filter(d => d.daysRemaining !== null && d.daysRemaining > 60 && d.daysRemaining <= 90).length,
      getTotalExpiring() { return this.expiring30 + this.expiring60 + this.expiring90; }
    };
  };

  const passportStats = getDocumentStats('PPExpiry');
  const visaStats = getDocumentStats('VisaExpiry');
  const permitStats = getDocumentStats('WPExpiry');
  const medicalStats = getDocumentStats('MedExpiry');

  const totalAlerts = 
    passportStats.getTotalExpiring() + 
    visaStats.getTotalExpiring() + 
    permitStats.getTotalExpiring() + 
    medicalStats.getTotalExpiring();

  const expiredCount = 
    passportStats.expired + 
    visaStats.expired + 
    permitStats.expired + 
    medicalStats.expired;

  const expiring30Count = 
    passportStats.expiring30 + 
    visaStats.expiring30 + 
    permitStats.expiring30 + 
    medicalStats.expiring30;

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
            📊 Dashboard
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Overview of your HR and expatriate management system
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportStaffToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          <Download className="h-4 w-4" />
          Export All Staff (CSV)
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={activeEmployeesCount}
          icon={Users}
          gradient="blue"
          subtitle={`${terminatedEmployeesCount > 0 ? terminatedEmployeesCount + ' terminated excluded' : 'Active workforce'}`}
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
      </div>

      {/* Document Type Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Passports"
          value={passportStats.total}
          icon={FileText}
          gradient="purple"
          subtitle={`${passportStats.getTotalExpiring()} expiring soon`}
          href="/passports"
        />
        <StatCard
          title="Work Permits"
          value={permitStats.total}
          icon={Briefcase}
          gradient="cyan"
          subtitle={`${permitStats.getTotalExpiring()} expiring soon`}
          href="/work-permits"
        />
        <StatCard
          title="Visas"
          value={visaStats.total}
          icon={Plane}
          gradient="purple"
          subtitle={`${visaStats.getTotalExpiring()} expiring soon`}
          href="/visas"
        />
        <StatCard
          title="Medical Records"
          value={medicalStats.total}
          icon={HeartPulse}
          gradient="red"
          subtitle={`${medicalStats.getTotalExpiring()} expiring soon`}
          href="/medical"
        />
        <StatCard
          title="Terminations"
          value={completedTerminations + terminatedEmployeesCount}
          icon={UserX}
          gradient="red"
          subtitle={`${activeTerminations} in progress, ${terminatedEmployeesCount} past staff`}
          href="/terminations"
        />
      </div>

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
