import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User,
  Calendar,
  MapPin,
  Plane,
  Clock,
  FileText,
  AlertCircle,
  Send,
  Briefcase,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_CONFIG = {
  pending: { color: 'amber', label: '⏳ Pending' },
  approved: { color: 'emerald', label: '✅ Approved' },
  rejected: { color: 'rose', label: '❌ Rejected' },
  cancelled: { color: 'gray', label: '🚫 Cancelled' }
};

const TRANSPORT_MODES = {
  air: { label: '✈️ Air (Flight)', icon: Plane },
  sea: { label: '🚢 Sea (Ship)', icon: Plane },
  land: { label: '🚌 Land (Bus/Car)', icon: Plane }
};

export default function LeaveApproval() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, userData, isHR } = useAuth();
  const { updateDocument, getDocumentById } = useFirestore('leaves');
  
  const [leave, setLeave] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    comments: '',
    approverName: userData?.displayName || userData?.email || 'HR Manager'
  });

  // Fetch leave data
  const fetchLeaveData = useCallback(async () => {
    if (!id) return;
    try {
      const leaveData = await getDocumentById(id);
      if (leaveData) {
        setLeave(leaveData);
        
        // Fetch employee details
        if (leaveData.employeeId) {
          const empQuery = query(
            collection(db, 'employees'),
            where('__name__', '==', leaveData.employeeId)
          );
          const empSnap = await getDocs(empQuery);
          if (!empSnap.empty) {
            setEmployee({ id: empSnap.docs[0].id, ...empSnap.docs[0].data() });
          }
        }
      } else {
        setError('Leave application not found');
      }
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }, [id, getDocumentById]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const updateData = {
        status: approvalData.status,
        approvalComments: approvalData.comments,
        approverId: user?.uid || 'unknown',
        approverName: approvalData.approverName,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // If rejected and has transport, update transport status too
      if (approvalData.status === 'rejected' && leave?.transportation?.required) {
        updateData['transportation.status'] = 'cancelled';
      }

      await updateDocument(id, updateData);
      
      setSuccess(`Leave application ${approvalData.status === 'approved' ? '✅ approved' : '❌ rejected'} successfully!`);
      
      setTimeout(() => {
        navigate('/leave-planner');
      }, 2000);
    } catch (err) {
      console.error('Error updating leave:', err);
      setError('Failed to process approval. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Error</h3>
          <p className="text-red-600">{error || 'Leave application not found'}</p>
          <button
            onClick={() => navigate('/leave-planner')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If not HR or leave is not pending, redirect
  if (!isHR() || leave.status !== 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-700 mb-2">Access Denied</h3>
          <p className="text-amber-600">
            {leave.status !== 'pending' 
              ? 'This leave application has already been processed.'
              : 'Only HR managers can approve leave applications.'}
          </p>
          <button
            onClick={() => navigate('/leave-planner')}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
  const leaveTypeLabel = {
    annual: '🏖️ Annual Leave',
    sick: '🤒 Sick Leave',
    emergency: '🚨 Emergency Leave',
    unpaid: '💰 Unpaid Leave',
    other: '📋 Other'
  }[leave.leaveType] || leave.leaveType;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/leave-planner')}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">✅ Approve Leave</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and approve/reject leave application
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-700">
          <CheckCircle className="h-5 w-5 mr-3" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Leave Details */}
        <div className="space-y-6">
          {/* Employee Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-emerald-500" />
              👤 Employee Information
            </h3>
            <div className="flex items-center">
              {employee?.photoURL ? (
                <img 
                  src={employee.photoURL} 
                  alt="" 
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                  {employee?.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="ml-4">
                <p className="text-lg font-bold text-gray-900">{employee?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{employee?.position || 'No position'}</p>
                <p className="text-sm text-gray-400">{employee?.department || 'No department'}</p>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-emerald-500" />
              📅 Leave Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Leave Type</span>
                <span className="font-medium">{leaveTypeLabel}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{leave.days} days</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Start Date</span>
                <span className="font-medium">{formatDate(leave.startDate)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">End Date</span>
                <span className="font-medium">{formatDate(leave.endDate)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Destination</span>
                <span className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-rose-500" />
                  {leave.destination}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-emerald-500" />
              📞 Contact During Leave
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-gray-400" />
                <span>{leave.contactNumber}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-3 text-gray-400" />
                <span>{leave.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-emerald-500" />
              📝 Reason for Leave
            </h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
              {leave.reason}
            </p>
          </div>
        </div>

        {/* Right Column - Approval Form */}
        <div className="space-y-6">
          {/* Transportation Info (if applicable) */}
          {leave.transportation?.required && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                <Plane className="h-5 w-5 mr-2 text-blue-500" />
                ✈️ Transportation Required
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Mode</span>
                  <span className="font-medium capitalize">{leave.transportation.mode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">From</span>
                  <span className="font-medium">{leave.transportation.fromLocation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">To</span>
                  <span className="font-medium">{leave.transportation.toLocation}</span>
                </div>
                {leave.transportation.preferredTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Preferred Time</span>
                    <span className="font-medium">{leave.transportation.preferredTime}</span>
                  </div>
                )}
              </div>
              {leave.transportation.specialRequests && (
                <div className="mt-4 p-3 bg-white/50 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Special Requests:</span> {leave.transportation.specialRequests}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Approval Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
              ✅ Approval Decision
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setApprovalData(prev => ({ ...prev, status: 'approved' }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      approvalData.status === 'approved'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${approvalData.status === 'approved' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <span className={`font-medium ${approvalData.status === 'approved' ? 'text-emerald-700' : 'text-gray-700'}`}>
                      ✅ Approve
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalData(prev => ({ ...prev, status: 'rejected' }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      approvalData.status === 'rejected'
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    <XCircle className={`h-8 w-8 mx-auto mb-2 ${approvalData.status === 'rejected' ? 'text-rose-500' : 'text-gray-400'}`} />
                    <span className={`font-medium ${approvalData.status === 'rejected' ? 'text-rose-700' : 'text-gray-700'}`}>
                      ❌ Reject
                    </span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  placeholder={`Enter your comments for ${approvalData.status === 'approved' ? 'approval' : 'rejection'}...`}
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                />
              </div>

              {/* Approver Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={approvalData.approverName}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, approverName: e.target.value }))}
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full px-6 py-4 text-base font-bold text-white rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  approvalData.status === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 inline mr-2" />
                    {approvalData.status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
