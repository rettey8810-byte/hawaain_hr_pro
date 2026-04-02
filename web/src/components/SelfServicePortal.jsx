import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  User, FileText, DollarSign, Calendar, Plane, Clock, Award,
  Bell, Settings, ChevronRight, AlertCircle, CheckCircle,
  TrendingUp, Briefcase, GraduationCap, Heart, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Employee Self-Service Portal
 * 
 * Features:
 * - View payslips
 * - View leave balances
 * - View documents
 * - Update personal information
 * - Request letters/certificates
 * - View company policies and announcements
 * - Performance history
 * - Training records
 */

export default function SelfServicePortal() {
  const { companyId, currentCompany } = useCompany();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employeeData, setEmployeeData] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [companyId, userData?.uid]);

  const fetchData = async () => {
    if (!companyId || !userData?.uid) return;
    try {
      setLoading(true);
      
      // Fetch employee profile
      const employeeDoc = await getDoc(doc(db, 'employees', userData.uid));
      if (employeeDoc.exists()) {
        setEmployeeData({ id: employeeDoc.id, ...employeeDoc.data() });
      }

      // Fetch payslips
      const payslipsQuery = query(
        collection(db, 'payroll'),
        where('companyId', '==', companyId),
        where('employeeId', '==', userData.uid),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );
      const payslipsSnap = await getDocs(payslipsQuery);
      setPayslips(payslipsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch leave records
      const leavesQuery = query(
        collection(db, 'leaves'),
        where('companyId', '==', companyId),
        where('employeeId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      const leavesSnap = await getDocs(leavesQuery);
      setLeaves(leavesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch documents
      const documentsQuery = query(
        collection(db, 'documents'),
        where('companyId', '==', companyId),
        where('employeeId', '==', userData.uid),
        orderBy('expiryDate', 'asc')
      );
      const documentsSnap = await getDocs(documentsQuery);
      setDocuments(documentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch performance reviews
      const reviewsQuery = query(
        collection(db, 'performanceReviews'),
        where('companyId', '==', companyId),
        where('employeeId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      setPerformanceReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('companyId', '==', companyId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const announcementsSnap = await getDocs(announcementsQuery);
      setAnnouncements(announcementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 5));

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load self-service data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate leave balances
  const leaveBalances = {
    annual: { total: 30, used: leaves.filter(l => l.leaveType === 'annual' && l.status === 'approved').reduce((sum, l) => sum + (l.days || 0), 0) },
    sick: { total: 15, used: leaves.filter(l => l.leaveType === 'sick' && l.status === 'approved').reduce((sum, l) => sum + (l.days || 0), 0) },
    emergency: { total: 5, used: leaves.filter(l => l.leaveType === 'emergency' && l.status === 'approved').reduce((sum, l) => sum + (l.days || 0), 0) }
  };

  const getExpiringDocuments = () => {
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    return documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const expiry = new Date(doc.expiryDate);
      return expiry <= ninetyDaysFromNow && expiry >= today;
    });
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-full">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome, {employeeData?.name || userData?.name}</h2>
            <p className="text-blue-100">
              {employeeData?.position} • {employeeData?.department}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('payslips')}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Payslips</p>
              <p className="text-sm text-gray-500">{payslips.length} records</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">My Leaves</p>
              <p className="text-sm text-gray-500">{leaves.length} applications</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Documents</p>
              <p className="text-sm text-gray-500">{documents.length} files</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Performance</p>
              <p className="text-sm text-gray-500">{performanceReviews.length} reviews</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Balances */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Leave Balances
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(leaveBalances).map(([type, balance]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {balance.total - balance.used}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">{type} Leave</p>
                  <p className="text-xs text-gray-400">
                    {balance.used} used / {balance.total} total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payslips */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Recent Payslips
              </h3>
              <button
                onClick={() => setActiveTab('payslips')}
                className="text-blue-600 text-sm hover:underline"
              >
                View All
              </button>
            </div>
            {payslips.length > 0 ? (
              <div className="space-y-3">
                {payslips.slice(0, 3).map((payslip) => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Net Pay: MVR {payslip.netPay?.toLocaleString()}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      <FileText className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No payslips available</p>
            )}
          </div>

          {/* Recent Leave Applications */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-600" />
                Recent Leave Applications
              </h3>
              <button
                onClick={() => setActiveTab('leaves')}
                className="text-blue-600 text-sm hover:underline"
              >
                View All
              </button>
            </div>
            {leaves.length > 0 ? (
              <div className="space-y-3">
                {leaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{leave.leaveType} Leave</p>
                      <p className="text-sm text-gray-500">
                        {leave.startDate} to {leave.endDate} ({leave.days} days)
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No leave applications</p>
            )}
          </div>

          {/* Performance Summary */}
          {performanceReviews.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" />
                  Performance Reviews
                </h3>
                <button
                  onClick={() => setActiveTab('performance')}
                  className="text-blue-600 text-sm hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {performanceReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{review.reviewCycle} Review</p>
                        <p className="text-sm text-gray-500">
                          {review.reviewPeriod?.start} to {review.reviewPeriod?.end}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-blue-600">{review.overallRating || 'N/A'}</span>
                        <span className="text-sm text-gray-400">/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Alerts */}
          {getExpiringDocuments().length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Documents Expiring Soon</h4>
              </div>
              <div className="space-y-2">
                {getExpiringDocuments().map((doc) => (
                  <div key={doc.id} className="text-sm">
                    <p className="font-medium text-yellow-800">{doc.type}</p>
                    <p className="text-yellow-700">Expires: {doc.expiryDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Announcements */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Announcements
            </h3>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-gray-900">{announcement.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {announcement.createdAt?.toDate?.().toLocaleDateString?.() || 'Recently'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No announcements</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="/leave-planner" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">Apply for Leave</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>
              <a href="/expense-claims" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Submit Expense</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>
              <a href="/training" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-700">Training</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Profile</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Employee ID</span>
                <span className="font-medium">{employeeData?.employeeId || userData?.uid?.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department</span>
                <span className="font-medium">{employeeData?.department || userData?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Position</span>
                <span className="font-medium">{employeeData?.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Join Date</span>
                <span className="font-medium">{employeeData?.joinDate || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
