import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, UserPlus, UserMinus,
  DollarSign, Calendar, Clock, Award, Briefcase, AlertCircle,
  Download, Filter, ChevronDown, PieChart, Activity, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * HR Analytics Dashboard
 * 
 * Features:
 * - Employee turnover rates
 * - Department-wise headcount trends
 * - Recruitment pipeline metrics
 * - Leave pattern analysis
 * - Salary cost analysis by department
 * - Performance distribution
 * - Attendance analytics
 */

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function HRAnalytics() {
  const { companyId, currentCompany } = useCompany();
  const { userData, hasAccess } = useAuth();
  const [timeRange, setTimeRange] = useState('6months');
  const [analyticsData, setAnalyticsData] = useState({
    headcount: 0,
    newHires: 0,
    terminations: 0,
    turnoverRate: 0,
    avgTenure: 0,
    departmentStats: [],
    leaveStats: [],
    salaryStats: [],
    recruitmentStats: {},
    performanceDistribution: [],
    attendanceStats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [companyId, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '1month': startDate.setMonth(endDate.getMonth() - 1); break;
        case '3months': startDate.setMonth(endDate.getMonth() - 3); break;
        case '6months': startDate.setMonth(endDate.getMonth() - 6); break;
        case '1year': startDate.setFullYear(endDate.getFullYear() - 1); break;
        default: startDate.setMonth(endDate.getMonth() - 6);
      }

      // Fetch all employees
      const employeesQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId)
      );
      const employeesSnap = await getDocs(employeesQuery);
      const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Active employees
      const activeEmployees = employees.filter(e => e.status === 'active');
      const headcount = activeEmployees.length;

      // New hires in period
      const newHires = employees.filter(e => {
        if (!e.joinDate) return false;
        const joinDate = new Date(e.joinDate);
        return joinDate >= startDate && joinDate <= endDate && e.status === 'active';
      }).length;

      // Terminations in period
      const terminations = employees.filter(e => {
        if (e.status !== 'terminated') return false;
        const termDate = e.terminationDate ? new Date(e.terminationDate) : null;
        return termDate && termDate >= startDate && termDate <= endDate;
      }).length;

      // Turnover rate
      const avgHeadcount = headcount + (terminations / 2);
      const turnoverRate = avgHeadcount > 0 ? ((terminations / avgHeadcount) * 100).toFixed(1) : 0;

      // Average tenure
      const avgTenure = activeEmployees.reduce((sum, e) => {
        if (!e.joinDate) return sum;
        const joinDate = new Date(e.joinDate);
        const months = (endDate - joinDate) / (1000 * 60 * 60 * 24 * 30.44);
        return sum + months;
      }, 0) / (activeEmployees.length || 1);

      // Department statistics
      const departmentStats = {};
      activeEmployees.forEach(e => {
        const dept = e.Department || e.department || 'Unassigned';
        if (!departmentStats[dept]) {
          departmentStats[dept] = { count: 0, salary: 0 };
        }
        departmentStats[dept].count++;
        departmentStats[dept].salary += (e.salary?.basic || 0);
      });

      // Fetch leaves
      const leavesQuery = query(
        collection(db, 'leaves'),
        where('companyId', '==', companyId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const leavesSnap = await getDocs(leavesQuery);
      const leaves = leavesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Leave statistics by type
      const leaveStats = {};
      leaves.forEach(l => {
        if (!leaveStats[l.leaveType]) {
          leaveStats[l.leaveType] = { count: 0, days: 0 };
        }
        leaveStats[l.leaveType].count++;
        leaveStats[l.leaveType].days += (l.days || 0);
      });

      // Fetch attendance
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('companyId', '==', companyId),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0])
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendance = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Attendance statistics
      const attendanceStats = {
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        onLeave: attendance.filter(a => a.status === 'on_leave').length,
        totalDays: attendance.length
      };

      // Fetch performance reviews
      const reviewsQuery = query(
        collection(db, 'performanceReviews'),
        where('companyId', '==', companyId),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      const reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Performance distribution
      const performanceDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        const rating = Math.round(r.overallRating || 0);
        if (performanceDistribution[rating] !== undefined) {
          performanceDistribution[rating]++;
        }
      });

      // Fetch recruitment data
      const recruitmentQuery = query(
        collection(db, 'recruitment'),
        where('companyId', '==', companyId),
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );
      const recruitmentSnap = await getDocs(recruitmentQuery);
      const recruitment = recruitmentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const recruitmentStats = {
        total: recruitment.length,
        open: recruitment.filter(r => r.status === 'open').length,
        filled: recruitment.filter(r => r.status === 'filled').length,
        closed: recruitment.filter(r => r.status === 'closed').length,
        avgTimeToFill: 0 // Would calculate from actual data
      };

      setAnalyticsData({
        headcount,
        newHires,
        terminations,
        turnoverRate,
        avgTenure: Math.round(avgTenure),
        departmentStats: Object.entries(departmentStats).map(([name, data]) => ({
          name,
          ...data
        })),
        leaveStats: Object.entries(leaveStats).map(([type, data]) => ({
          type,
          ...data
        })),
        salaryStats: Object.entries(departmentStats).map(([name, data]) => ({
          name,
          total: data.salary,
          avg: data.count > 0 ? data.salary / data.count : 0
        })),
        recruitmentStats,
        performanceDistribution: Object.entries(performanceDistribution).map(([rating, count]) => ({
          rating: parseInt(rating),
          count
        })),
        attendanceStats
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = `Metric,Value
Total Headcount,${analyticsData.headcount}
New Hires,${analyticsData.newHires}
Terminations,${analyticsData.terminations}
Turnover Rate,${analyticsData.turnoverRate}%
Average Tenure,${analyticsData.avgTenure} months

Department,Count,Total Salary
${analyticsData.departmentStats.map(d => `${d.name},${d.count},${d.salary}`).join('\n')}
`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr_analytics_${timeRange}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">HR Analytics Dashboard</h2>
          </div>
          <p className="text-gray-600 mt-1">Comprehensive HR metrics and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Headcount</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.headcount}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{analyticsData.newHires} new hires
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Turnover Rate</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.turnoverRate}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {analyticsData.terminations} terminations
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <UserMinus className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Tenure</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.avgTenure}</p>
              <p className="text-sm text-gray-500 mt-1">months</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Positions</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.recruitmentStats.open || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analyticsData.recruitmentStats.filled || 0} filled
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {analyticsData.departmentStats.map((dept, index) => (
              <div key={dept.name} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                    <span className="text-sm text-gray-500">{dept.count} ({Math.round((dept.count / analyticsData.headcount) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(dept.count / analyticsData.headcount) * 100}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salary by Department */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Salary Cost by Department
          </h3>
          <div className="space-y-4">
            {analyticsData.salaryStats
              .sort((a, b) => b.total - a.total)
              .map((dept, index) => (
              <div key={dept.name} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{dept.name}</span>
                  <span className="text-green-600 font-semibold">
                    MVR {dept.total.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Avg: MVR {Math.round(dept.avg).toLocaleString()} per employee
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Leave Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {analyticsData.leaveStats.map((leave) => (
              <div key={leave.type} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{leave.type} Leave</p>
                <p className="text-2xl font-bold text-gray-900">{leave.count}</p>
                <p className="text-sm text-blue-600">{leave.days} days total</p>
              </div>
            ))}
            {analyticsData.leaveStats.length === 0 && (
              <p className="text-gray-500 col-span-2 text-center py-4">No leave data for selected period</p>
            )}
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Attendance Overview
          </h3>
          {analyticsData.attendanceStats.totalDays > 0 ? (
            <div className="space-y-3">
              {[
                { label: 'Present', value: analyticsData.attendanceStats.present, color: 'bg-green-500' },
                { label: 'Absent', value: analyticsData.attendanceStats.absent, color: 'bg-red-500' },
                { label: 'Late', value: analyticsData.attendanceStats.late, color: 'bg-orange-500' },
                { label: 'On Leave', value: analyticsData.attendanceStats.onLeave, color: 'bg-blue-500' }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 w-20">{item.label}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ 
                          width: `${(item.value / analyticsData.attendanceStats.totalDays) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No attendance data for selected period</p>
          )}
        </div>

        {/* Performance Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Performance Rating Distribution
          </h3>
          <div className="space-y-3">
            {analyticsData.performanceDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">{item.rating} Stars</span>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-purple-500 transition-all duration-500"
                      style={{ 
                        width: `${(item.count / (analyticsData.performanceDistribution.reduce((a, b) => a + b.count, 0) || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-8">{item.count}</span>
              </div>
            ))}
            {analyticsData.performanceDistribution.reduce((a, b) => a + b.count, 0) === 0 && (
              <p className="text-gray-500 text-center py-4">No performance reviews for selected period</p>
            )}
          </div>
        </div>

        {/* Recruitment Pipeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Recruitment Pipeline
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-600">{analyticsData.recruitmentStats.total || 0}</p>
              <p className="text-sm text-blue-800">Total Requisitions</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-600">{analyticsData.recruitmentStats.filled || 0}</p>
              <p className="text-sm text-green-800">Positions Filled</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-orange-600">{analyticsData.recruitmentStats.open || 0}</p>
              <p className="text-sm text-orange-800">Open Positions</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg text-center">
              <p className="text-3xl font-bold text-gray-600">{analyticsData.recruitmentStats.closed || 0}</p>
              <p className="text-sm text-gray-800">Closed/Cancelled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
