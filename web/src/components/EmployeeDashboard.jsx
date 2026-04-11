import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Briefcase,
  FileText,
  User,
  Plane,
  HeartPulse,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  LayoutDashboard,
  Sun,
  Moon,
  Umbrella,
  Home,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';

// Leave Balance Card Component
function LeaveBalanceCard({ title, icon: Icon, total, used, remaining, color, unit = 'days' }) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    cyan: { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' }
  };
  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border ${colors.border} hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${colors.light} rounded-xl`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
        <span className={`text-xs font-semibold ${colors.text} px-2 py-1 rounded-full ${colors.light}`}>
          {Math.round(percentage)}% Used
        </span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{remaining}</span>
        <span className="text-sm text-gray-500">{unit} remaining</span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total: {total}</span>
          <span className="text-gray-500">Used: {used}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`${colors.bg} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Quick Action Button
function QuickAction({ icon: Icon, label, href, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
  };

  return (
    <Link 
      to={href}
      className={`flex items-center gap-3 p-4 rounded-xl border ${colorClasses[color]} transition-all duration-200 hover:scale-105`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
      <ArrowRight className="h-4 w-4 ml-auto" />
    </Link>
  );
}

// Leave History Item
function LeaveHistoryItem({ leave, type }) {
  const typeConfig = {
    annual: { icon: Sun, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Annual Leave' },
    sick: { icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Sick Leave' },
    off_day: { icon: Moon, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Off Day' },
    emergency: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Emergency' },
    medical: { icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Medical' },
    family_responsibility: { icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Family Care' },
    ph: { icon: Sun, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Public Holiday' },
    unpaid: { icon: Umbrella, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Unpaid' }
  };

  const config = typeConfig[type] || typeConfig.annual;
  const Icon = config.icon;

  const statusConfig = {
    approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    rejected: { color: 'bg-rose-100 text-rose-700', label: 'Rejected' }
  };
  const status = statusConfig[leave.status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
      <div className={`p-3 ${config.bg} rounded-xl`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{config.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.days} days)
        </p>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { currentCompany } = useCompany();
  
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalances, setLeaveBalances] = useState({
    annual: { total: 0, used: 0, remaining: 0 },
    offDay: { total: 0, used: 0, remaining: 0 },
    medical: { total: 0, used: 0, remaining: 0 },
    family: { total: 0, used: 0, remaining: 0 },
    sick: { total: 0, used: 0, remaining: 0 },
    ph: { total: 0, used: 0, remaining: 0 },
    emergency: { total: 0, used: 0, remaining: 0 },
    unpaid: { total: Infinity, used: 0, remaining: Infinity }
  });

  // Fetch employee data and leaves
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.employeeId && !userData?.uid && !userData?.email) {
        console.log('No user identifiers available:', userData);
        return;
      }
      
      console.log('Fetching employee data for:', {
        employeeId: userData?.employeeId,
        uid: userData?.uid,
        email: userData?.email,
        username: userData?.username,
        name: userData?.name
      });
      
      setLoading(true);
      try {
        let empData = null;
        let employeeId = userData?.employeeId;

        // Try to find by employeeId first
        if (employeeId) {
          console.log('Trying to find by employeeId:', employeeId);
          const empQuery = query(
            collection(db, 'employees'),
            where('__name__', '==', employeeId)
          );
          const empSnap = await getDocs(empQuery);
          console.log('employeeId search result:', empSnap.empty ? 'empty' : 'found');
          if (!empSnap.empty) {
            empData = { id: empSnap.docs[0].id, ...empSnap.docs[0].data() };
            console.log('Found employee by ID:', empData.id);
          }
        }

        // If not found, try by email (case insensitive)
        if (!empData && userData?.email) {
          const emailLower = userData.email.toLowerCase();
          console.log('Trying to find by email:', emailLower);
          const emailQuery = query(
            collection(db, 'employees'),
            where('Email', '==', userData.email)
          );
          const emailSnap = await getDocs(emailQuery);
          console.log('Email search result:', emailSnap.empty ? 'empty' : 'found');
          if (!emailSnap.empty) {
            empData = { id: emailSnap.docs[0].id, ...emailSnap.docs[0].data() };
            employeeId = empData.id;
            console.log('Found employee by email:', empData.id);
          }
        }

        // If still not found, try by EmpID matching username
        if (!empData && userData?.username) {
          // Extract employee code from username (e.g., mohammad25489 -> 25489)
          const empCode = userData.username.replace(/[^0-9]/g, '');
          console.log('Trying to find by EmpID from username:', empCode);
          if (empCode) {
            const codeQuery = query(
              collection(db, 'employees'),
              where('EmpID', '==', empCode)
            );
            const codeSnap = await getDocs(codeQuery);
            console.log('EmpID search result:', codeSnap.empty ? 'empty' : 'found');
            if (!codeSnap.empty) {
              empData = { id: codeSnap.docs[0].id, ...codeSnap.docs[0].data() };
              employeeId = empData.id;
              console.log('Found employee by EmpID:', empData.id);
            }
          }
        }

        // Last resort: try by FullName matching userData.name
        if (!empData && userData?.name) {
          console.log('Trying to find by FullName:', userData.name);
          const nameQuery = query(
            collection(db, 'employees'),
            where('FullName', '==', userData.name)
          );
          const nameSnap = await getDocs(nameQuery);
          console.log('FullName search result:', nameSnap.empty ? 'empty' : 'found');
          if (!nameSnap.empty) {
            empData = { id: nameSnap.docs[0].id, ...nameSnap.docs[0].data() };
            employeeId = empData.id;
            console.log('Found employee by FullName:', empData.id);
          }
        }

        // Final fallback: fetch all employees and match by employee code in FullName
        if (!empData && userData?.username) {
          const empCode = userData.username.replace(/[^0-9]/g, '');
          console.log('Final fallback: searching all employees for code:', empCode);
          if (empCode) {
            const allQuery = query(collection(db, 'employees'));
            const allSnap = await getDocs(allQuery);
            console.log('Total employees in database:', allSnap.size);
            
            // Find employee whose FullName contains the code
            const matchedEmp = allSnap.docs.find(doc => {
              const data = doc.data();
              const fullName = (data.FullName || data.Name || '').toLowerCase();
              const empId = (data.EmpID || data.empId || '').toString();
              const codeMatch = fullName.includes(empCode) || empId === empCode;
              if (codeMatch) {
                console.log('Potential match:', doc.id, fullName, empId);
              }
              return codeMatch;
            });
            
            if (matchedEmp) {
              empData = { id: matchedEmp.id, ...matchedEmp.data() };
              employeeId = empData.id;
              console.log('Found employee by code in FullName:', empData.id, empData.FullName);
            }
          }
        }

        if (empData) {
          console.log('Setting employee data:', empData);
          setEmployee(empData);
        } else {
          console.log('Employee not found with any search method');
        }

        // Fetch employee leaves using found employeeId
        if (employeeId) {
          console.log('Fetching leaves for employeeId:', employeeId);
          const leavesQuery = query(
            collection(db, 'leaves'),
            where('employeeId', '==', employeeId),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          const leavesSnap = await getDocs(leavesQuery);
          const leavesData = leavesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log('Leaves found:', leavesData.length);
          setLeaves(leavesData);

          // Calculate leave balances based on hire date
          if (empData) {
            calculateLeaveBalances(empData, leavesData);
          }
        }
      } catch (err) {
        console.error('Error fetching employee data:', err);
        console.error('Error stack:', err.stack);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData]);

  // Calculate leave balances with accrual rules
  const calculateLeaveBalances = (emp, empLeaves) => {
    if (!emp) return; // Guard against null employee data
    const hireDate = new Date(emp.JoinDate || emp.HireDate || emp.joinDate || emp.hireDate || emp['Date of Join'] || '2025-01-01');
    const today = new Date();
    
    // Calculate years of service
    const yearsOfService = (today - hireDate) / (1000 * 60 * 60 * 24 * 365.25);
    const monthsOfService = yearsOfService * 12;
    const weeksOfService = (today - hireDate) / (1000 * 60 * 60 * 24 * 7);
    
    // Approved leaves only
    const approvedLeaves = empLeaves.filter(l => l.status === 'approved');
    
    // Calculate used leaves by type
    const annualUsed = approvedLeaves
      .filter(l => l.leaveType === 'annual')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const offDayUsed = approvedLeaves
      .filter(l => l.leaveType === 'off_day')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const medicalUsed = approvedLeaves
      .filter(l => l.leaveType === 'medical')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const familyUsed = approvedLeaves
      .filter(l => l.leaveType === 'family_responsibility')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const sickUsed = approvedLeaves
      .filter(l => l.leaveType === 'sick')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const phUsed = approvedLeaves
      .filter(l => l.leaveType === 'ph')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const emergencyUsed = approvedLeaves
      .filter(l => l.leaveType === 'emergency')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    const unpaidUsed = approvedLeaves
      .filter(l => l.leaveType === 'unpaid')
      .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
    
    // ANNUAL LEAVE ACCRUAL:
    // - First year: No annual leave (0 days)
    // - After 1 year: 30 days per year
    // - Accrues weekly: 30/52 = ~0.58 days per week
    let annualTotal = 0;
    let annualRemaining = 0;
    if (yearsOfService >= 1) {
      const weeksAfterFirstYear = (yearsOfService - 1) * 52;
      const currentYearWeeks = Math.min(weeksAfterFirstYear % 52 + (today.getDay() / 7), 52);
      annualTotal = Math.round((30 / 52) * currentYearWeeks * 10) / 10; // Accrued so far this year
      annualRemaining = Math.max(0, annualTotal - annualUsed);
    }
    
    // OFF DAY ACCRUAL:
    // - 4 days per month
    // - Accrues weekly: 4/4.33 = ~0.92 days per week (approx 1 day per week)
    const offDayTotal = Math.min(48, Math.round(weeksOfService * 0.92)); // Max 48 days
    const offDayRemaining = Math.max(0, offDayTotal - offDayUsed);
    
    // MEDICAL: Fixed 10 days per year
    const medicalTotal = 10;
    const medicalRemaining = Math.max(0, medicalTotal - medicalUsed);
    
    // FAMILY CARE: Fixed 10 days per year
    const familyTotal = 10;
    const familyRemaining = Math.max(0, familyTotal - familyUsed);
    
    // Other leave types with fixed or unlimited entitlements
    const sickTotal = 0; // As needed, requires medical certificate
    const phTotal = 0; // Based on public holiday calendar
    const emergencyTotal = 3; // 3 days per year for emergencies
    
    setLeaveBalances({
      annual: { total: annualTotal, used: annualUsed, remaining: annualRemaining },
      offDay: { total: offDayTotal, used: offDayUsed, remaining: offDayRemaining },
      medical: { total: medicalTotal, used: medicalUsed, remaining: medicalRemaining },
      family: { total: familyTotal, used: familyUsed, remaining: familyRemaining },
      sick: { total: sickTotal, used: sickUsed, remaining: sickTotal - sickUsed },
      ph: { total: phTotal, used: phUsed, remaining: phTotal - phUsed },
      emergency: { total: emergencyTotal, used: emergencyUsed, remaining: Math.max(0, emergencyTotal - emergencyUsed) },
      unpaid: { total: Infinity, used: unpaidUsed, remaining: Infinity }
    });
  };

  // Pending approvals count
  const pendingLeaves = useMemo(() => 
    leaves.filter(l => l.status === 'pending').length,
    [leaves]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold">
          <Home className="h-5 w-5" />
          <span>Dashboard Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/leave-planner" className="text-gray-600 hover:text-gray-900 text-sm">
            My Leaves
          </Link>
          <Link to="/payslips" className="text-gray-600 hover:text-gray-900 text-sm">
            Payslips
          </Link>
          <Link to="/profile" className="text-gray-600 hover:text-gray-900 text-sm">
            Profile
          </Link>
        </div>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome, {employee?.FullName || employee?.name || userData?.displayName || 'Employee'}
            </h1>
            <p className="text-emerald-100">
              {employee?.Designation || employee?.designation || 'Staff'} • {currentCompany?.name || 'Villa Park'}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-xl">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-emerald-100">Employee ID</p>
            <p className="font-semibold">{employee?.EmpID || employee?.id?.slice(-5) || 'N/A'}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-emerald-100">Department</p>
            <p className="font-semibold">{employee?.Department || employee?.department || 'N/A'}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-emerald-100">Join Date</p>
            <p className="font-semibold">
              {formatDate(employee?.['Date of Join'] || employee?.JoinDate || employee?.HireDate || employee?.joinDate || employee?.hireDate || employee?.StartDate)}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-sm text-emerald-100">Pending Requests</p>
            <p className="font-semibold">{pendingLeaves} Leave{pendingLeaves !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction 
          icon={Plane} 
          label="Apply for Leave" 
          href="/leave-planner/apply" 
          color="emerald" 
        />
        <QuickAction 
          icon={Calendar} 
          label="My Leaves" 
          href="/leave-planner" 
          color="blue" 
        />
        <QuickAction 
          icon={FileText} 
          label="My Payslips" 
          href="/payslips" 
          color="amber" 
        />
        <QuickAction 
          icon={Clock} 
          label="Attendance" 
          href="/attendance" 
          color="purple" 
        />
        <QuickAction 
          icon={User} 
          label="My Profile" 
          href="/profile" 
          color="cyan" 
        />
        <QuickAction 
          icon={Home} 
          label="Documents" 
          href="/my-documents" 
          color="rose" 
        />
      </div>

      {/* Leave Balance Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-emerald-600" />
          My Leave Balances
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Auto-accrues weekly)
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LeaveBalanceCard
            title="Annual Leave"
            icon={Sun}
            total={leaveBalances.annual.total}
            used={leaveBalances.annual.used}
            remaining={Math.round(leaveBalances.annual.remaining * 10) / 10}
            color="emerald"
          />
          <LeaveBalanceCard
            title="Off Days"
            icon={Moon}
            total={leaveBalances.offDay.total}
            used={leaveBalances.offDay.used}
            remaining={leaveBalances.offDay.remaining}
            color="blue"
          />
          <LeaveBalanceCard
            title="Medical Leave"
            icon={HeartPulse}
            total={leaveBalances.medical.total}
            used={leaveBalances.medical.used}
            remaining={leaveBalances.medical.remaining}
            color="rose"
          />
          <LeaveBalanceCard
            title="Family Care"
            icon={Users}
            total={leaveBalances.family.total}
            used={leaveBalances.family.used}
            remaining={leaveBalances.family.remaining}
            color="amber"
          />
          <LeaveBalanceCard
            title="Sick Leave"
            icon={HeartPulse}
            total={leaveBalances.sick.total}
            used={leaveBalances.sick.used}
            remaining={leaveBalances.sick.remaining}
            color="purple"
          />
          <LeaveBalanceCard
            title="Public Holidays"
            icon={Sun}
            total={leaveBalances.ph.total}
            used={leaveBalances.ph.used}
            remaining={leaveBalances.ph.remaining}
            color="orange"
          />
          <LeaveBalanceCard
            title="Emergency"
            icon={AlertCircle}
            total={leaveBalances.emergency.total}
            used={leaveBalances.emergency.used}
            remaining={leaveBalances.emergency.remaining}
            color="red"
          />
          <LeaveBalanceCard
            title="Unpaid Leave"
            icon={Umbrella}
            total={leaveBalances.unpaid.total === Infinity ? '∞' : leaveBalances.unpaid.total}
            used={leaveBalances.unpaid.used}
            remaining="∞"
            color="gray"
          />
        </div>
        
        {/* Leave Accrual Info */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Leave Accrual Rules</p>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• <strong>Annual:</strong> 30 days/year after 1 year. Accrues ~0.58 days/week.</li>
                <li>• <strong>Off Days:</strong> 4 days/month (max 48 days). Accrues ~0.92 days/week.</li>
                <li>• <strong>Medical:</strong> 10 days/year (fixed).</li>
                <li>• <strong>Family Care:</strong> 10 days/year (fixed).</li>
                <li>• <strong>Sick:</strong> As needed (medical certificate required).</li>
                <li>• <strong>PH:</strong> Based on public holiday calendar.</li>
                <li>• <strong>Emergency:</strong> 3 days/year (special circumstances).</li>
                <li>• <strong>Unpaid:</strong> Unlimited (subject to approval).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leave History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Recent Leave History
          </h2>
          <Link 
            to="/leave-planner" 
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {leaves.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No leave history yet</p>
            <Link 
              to="/leave-planner/apply" 
              className="text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block"
            >
              Apply for your first leave
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.slice(0, 5).map(leave => (
              <LeaveHistoryItem 
                key={leave.id} 
                leave={leave} 
                type={leave.leaveType || 'annual'} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Expiry Alerts */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-bold text-amber-900">Important Reminders</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-medium text-gray-900">Passport & Visa</p>
            <p className="text-sm text-gray-600 mt-1">
              Keep your documents up to date. Check expiry dates regularly.
            </p>
            <Link 
              to="/documents" 
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2 inline-block"
            >
              View Documents →
            </Link>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="font-medium text-gray-900">Work Permit</p>
            <p className="text-sm text-gray-600 mt-1">
              Ensure your work permit is valid. Contact HR for renewals.
            </p>
            <Link 
              to="/documents" 
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2 inline-block"
            >
              View Documents →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
