import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2,
  Plane, 
  Ship, 
  Bus,
  User,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_CONFIG = {
  pending: { color: 'amber', label: '⏳ Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { color: 'emerald', label: '✅ Approved', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { color: 'rose', label: '❌ Rejected', bg: 'bg-rose-100', text: 'text-rose-700' },
  cancelled: { color: 'gray', label: '🚫 Cancelled', bg: 'bg-gray-100', text: 'text-gray-700' }
};

const TRANSPORT_STATUS = {
  quotation_received: { label: '📋 Quotation Received', color: 'blue' },
  tickets_purchased: { label: '🎫 Tickets Purchased', color: 'purple' },
  departed: { label: '✈️ Departed', color: 'indigo' },
  arrived: { label: '📍 Arrived', color: 'emerald' }
};

const TRANSPORT_MODE_ICONS = {
  air: Plane,
  sea: Ship,
  land: Bus
};

export default function LeaveDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userData, isHR } = useAuth();
  const { deleteDocument, getDocumentById } = useFirestore('leaves');
  
  const [leave, setLeave] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch leave data
  const fetchLeaveData = useCallback(async () => {
    if (!id) return;
    try {
      const leaveData = await getDocumentById(id);
      if (leaveData) {
        setLeave(leaveData);
        
        // Fetch employee details using employeeId (which is the document ID)
        if (leaveData.employeeId) {
          try {
            const empDocRef = doc(db, 'employees', leaveData.employeeId);
            const empSnap = await getDoc(empDocRef);
            if (empSnap.exists()) {
              setEmployee({ id: empSnap.id, ...empSnap.data() });
            } else {
              // Fallback: try to find by EmpID field if document ID doesn't match
              const empQuery = query(
                collection(db, 'employees'),
                where('EmpID', '==', leaveData.employeeId)
              );
              const empQuerySnap = await getDocs(empQuery);
              if (!empQuerySnap.empty) {
                setEmployee({ id: empQuerySnap.docs[0].id, ...empQuerySnap.docs[0].data() });
              }
            }
          } catch (empErr) {
            console.error('Error fetching employee:', empErr);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leave data:', err);
    } finally {
      setLoading(false);
    }
  }, [id, getDocumentById]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const handleDelete = async () => {
    if (leave) {
      await deleteDocument(leave.id);
      setShowDeleteModal(false);
      navigate('/leave-planner');
    }
  };

  const canDelete = () => {
    if (!leave) return false;
    if (isHR()) return true;
    return leave.employeeId === userData?.employeeId && leave.status === 'pending';
  };

  const canEdit = () => {
    if (!leave) return false;
    if (isHR()) return true;
    return leave.employeeId === userData?.employeeId && leave.status === 'pending';
  };

  const canApprove = () => {
    if (!leave) return false;
    return isHR() && leave.status === 'pending';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Leave Not Found</h3>
          <p className="text-red-600">The leave application you are looking for does not exist.</p>
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

  const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
  const leaveTypeLabel = {
    annual: '🏖️ Annual Leave',
    sick: '🤒 Sick Leave',
    emergency: '🚨 Emergency Leave',
    unpaid: '💰 Unpaid Leave',
    other: '📋 Other'
  }[leave.leaveType] || leave.leaveType;

  const TransportIcon = leave.transportation?.mode ? TRANSPORT_MODE_ICONS[leave.transportation.mode] : Plane;
  const transportStatus = leave.transportation?.status ? TRANSPORT_STATUS[leave.transportation.status] : null;

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
            <h2 className="text-2xl font-bold text-gray-900">📝 Leave Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              View complete leave application information
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {canEdit() && (
            <Link
              to={`/leave-planner/${leave.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
          {canApprove() && (
            <Link
              to={`/leave-planner/${leave.id}/approve`}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Link>
          )}
          {leave.transportation?.required && leave.status === 'approved' && isHR() && (
            <Link
              to={`/leave-planner/${leave.id}/transport`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plane className="h-4 w-4 mr-2" />
              Transport
            </Link>
          )}
          {canDelete() && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-6 mb-6 ${statusConfig.bg} border-2 ${statusConfig.text.replace('text-', 'border-').replace('700', '200')}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 bg-white rounded-xl shadow-sm`}>
              <span className="text-2xl">{statusConfig.label.split(' ')[0]}</span>
            </div>
            <div className="ml-4">
              <p className={`text-lg font-bold ${statusConfig.text}`}>{statusConfig.label}</p>
              <p className="text-sm text-gray-600">
                Applied on {formatDate(leave.requestedOn || leave.appliedAt)}
              </p>
            </div>
          </div>
          {leave.approvedAt && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Processed by</p>
              <p className="font-medium text-gray-900">{leave.approvedBy || leave.approverName}</p>
              <p className="text-xs text-gray-400">{formatDate(leave.approvedOn || leave.approvedAt)}</p>
            </div>
          )}
        </div>
        {leave.approvalComments && (
          <div className="mt-4 p-3 bg-white/50 rounded-xl">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Comments:</span> {leave.approvalComments}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
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
                  className="h-20 w-20 rounded-full object-cover border-2 border-emerald-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold">
                  {employee?.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="ml-4">
                <p className="text-xl font-bold text-gray-900">{employee?.name || leave?.employeeName || 'Unknown Employee'}</p>
                <p className="text-gray-500">{employee?.position || leave?.designation || 'No position'}</p>
                <p className="text-sm text-gray-400">{employee?.department || leave?.department || 'No department'}</p>
                {employee?.employeeCode && (
                  <p className="text-sm text-gray-400">ID: {employee.employeeCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-emerald-500" />
              📅 Leave Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Leave Type</p>
                <p className="font-medium text-gray-900">{leaveTypeLabel}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-medium text-gray-900">{leave.leaveDays || leave.days || '-'} days</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-medium text-gray-900">{formatDate(leave.fromDate || leave.startDate)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                <p className="font-medium text-gray-900">{formatDate(leave.toDate || leave.endDate)}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-rose-500" />
                Destination
              </p>
              <p className="font-medium text-gray-900 text-lg">{leave.destination}</p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-emerald-500" />
              📝 Reason for Leave
            </h3>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-700 leading-relaxed">{leave.reason}</p>
            </div>
          </div>

          {/* Transportation Details (if applicable) */}
          {leave.transportation?.required && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-900 flex items-center">
                  <TransportIcon className="h-5 w-5 mr-2 text-blue-500" />
                  ✈️ Transportation Details
                </h3>
                {transportStatus && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${transportStatus.color === 'blue' ? 'bg-blue-100 text-blue-700' : transportStatus.color === 'purple' ? 'bg-purple-100 text-purple-700' : transportStatus.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {transportStatus.label}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-blue-700">Mode</span>
                  <span className="font-medium capitalize">{leave.transportation.mode}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-blue-700">From</span>
                  <span className="font-medium">{leave.transportation.fromLocation}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-blue-700">To</span>
                  <span className="font-medium">{leave.transportation.toLocation}</span>
                </div>
                {leave.transportation.preferredTime && (
                  <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
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
              
              {leave.status === 'approved' && isHR() && (
                <Link
                  to={`/leave-planner/${leave.id}/transport`}
                  className="mt-4 flex items-center justify-center w-full p-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plane className="h-5 w-5 mr-2" />
                  Manage Transportation Booking
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📞 Contact During Leave</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <Phone className="h-5 w-5 mr-3 text-emerald-500" />
                <span className="text-gray-700">{leave.contactNumber}</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <Mail className="h-5 w-5 mr-3 text-emerald-500" />
                <span className="text-gray-700 text-sm">{leave.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {leave.emergencyContact?.name && (
            <div className="bg-rose-50 rounded-2xl shadow-lg p-6 border border-rose-200">
              <h3 className="text-lg font-bold text-rose-900 mb-4">🚨 Emergency Contact</h3>
              <div className="space-y-3">
                <p className="font-medium text-rose-900">{leave.emergencyContact.name}</p>
                <p className="text-sm text-rose-700">{leave.emergencyContact.relationship}</p>
                <p className="text-sm text-rose-600 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {leave.emergencyContact.phone}
                </p>
              </div>
            </div>
          )}

          {/* Booking Info (if available) */}
          {leave.transportBooking && (
            <div className="bg-indigo-50 rounded-2xl shadow-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-bold text-indigo-900 mb-4">🎫 Booking Information</h3>
              <div className="space-y-3">
                {leave.transportBooking.ticketNumber && (
                  <div className="p-3 bg-white/50 rounded-xl">
                    <p className="text-xs text-indigo-600">Ticket Number</p>
                    <p className="font-medium text-indigo-900">{leave.transportBooking.ticketNumber}</p>
                  </div>
                )}
                {leave.transportBooking.airlineCompany && (
                  <div className="p-3 bg-white/50 rounded-xl">
                    <p className="text-xs text-indigo-600">Carrier</p>
                    <p className="font-medium text-indigo-900">{leave.transportBooking.airlineCompany}</p>
                  </div>
                )}
                {leave.transportBooking.purchaseAmount && (
                  <div className="p-3 bg-white/50 rounded-xl">
                    <p className="text-xs text-indigo-600">Amount</p>
                    <p className="font-medium text-indigo-900">${leave.transportBooking.purchaseAmount}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Leave Request</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to delete this leave request? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
