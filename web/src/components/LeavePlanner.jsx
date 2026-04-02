import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plane,
  Ship,
  Bus,
  MapPin,
  Calendar,
  User,
  Filter,
  MoreHorizontal,
  ArrowRight,
  FileText,
  Luggage,
  LayoutGrid,
  Printer,
  Download
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import LeaveCalendar from './LeaveCalendar';
import LeavePrintView from './LeavePrintView';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_CONFIG = {
  pending: { color: 'amber', label: '⏳ Pending', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { color: 'emerald', label: '✅ Approved', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { color: 'rose', label: '❌ Rejected', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-rose-200' },
  cancelled: { color: 'gray', label: '🚫 Cancelled', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
};

const TRANSPORT_STATUS = {
  quotation_received: { color: 'blue', label: '📋 Quotation Received', bg: 'bg-blue-100', text: 'text-blue-700' },
  tickets_purchased: { color: 'purple', label: '🎫 Tickets Purchased', bg: 'bg-purple-100', text: 'text-purple-700' },
  departed: { color: 'indigo', label: '✈️ Departed', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  arrived: { color: 'emerald', label: '📍 Arrived', bg: 'bg-emerald-100', text: 'text-emerald-700' }
};

const TRANSPORT_MODE_ICONS = {
  air: Plane,
  sea: Ship,
  land: Bus
};

export default function LeavePlanner() {
  const navigate = useNavigate();
  const { user, userData, isHR } = useAuth();
  const { documents: leaves, loading, deleteDocument, getAllDocuments } = useFirestore('leaves');
  
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar'
  const [showPrintView, setShowPrintView] = useState(false);
  const [printLeave, setPrintLeave] = useState(null);
  const toast = useToast();

  // Fetch ALL employees for name lookup
  const fetchAllEmployees = useCallback(async () => {
    if (!userData?.companyId) return;
    setEmployeesLoading(true);
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', userData.companyId)
      );
      const snap = await getDocs(q);
      const empList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side by name
      empList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setEmployees(empList);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [userData?.companyId]);

  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  useEffect(() => {
    const unsub = getAllDocuments();
    return () => unsub?.();
  }, [getAllDocuments]);

  useEffect(() => {
    let filtered = leaves;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(l => {
        const employee = employees.find(e => e.id === l.employeeId);
        return (
          employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    
    // Non-HR users can only see their own leaves
    if (!isHR() && userData?.employeeId) {
      filtered = filtered.filter(l => l.employeeId === userData.employeeId);
    }
    
    setFilteredLeaves(filtered);
  }, [leaves, searchTerm, statusFilter, employees, isHR, userData]);

  const handleDelete = async () => {
    if (selectedLeave) {
      await deleteDocument(selectedLeave.id);
      setShowDeleteModal(false);
      setSelectedLeave(null);
    }
  };

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp?.name || 'Unknown';
  };

  const getEmployeePhoto = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp?.photoURL;
  };

  const canDelete = (leave) => {
    if (isHR()) return true;
    return leave.employeeId === userData?.employeeId && leave.status === 'pending';
  };

  const canEdit = (leave) => {
    if (isHR()) return true;
    return leave.employeeId === userData?.employeeId && leave.status === 'pending';
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Destination', 'Status', 'Transportation'];
    const rows = filteredLeaves.map(leave => [
      getEmployeeName(leave.employeeId),
      leave.leaveType,
      leave.startDate,
      leave.endDate,
      leave.days,
      leave.destination,
      leave.status,
      leave.transportation?.required ? `${leave.transportation.mode} (${leave.transportation.fromLocation} → ${leave.transportation.toLocation})` : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leaves_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exported to CSV successfully!');
  };

  // Print leave
  const handlePrint = (leave) => {
    setPrintLeave(leave);
    setShowPrintView(true);
  };

  if (loading || employeesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const stats = {
    total: filteredLeaves.length,
    pending: filteredLeaves.filter(l => l.status === 'pending').length,
    approved: filteredLeaves.filter(l => l.status === 'approved').length,
    withTransport: filteredLeaves.filter(l => l.transportation?.required).length
  };

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient with Illustration */}
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Palm tree-cuate.svg" 
            alt="Leave" 
            className="h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">
            🌴 Leave Planner
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Manage employee leave applications and travel arrangements
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
          <Link
            to="/leave-planner/my-leaves"
            className="inline-flex items-center rounded-xl bg-white/20 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-white/30 transition-all"
          >
            <FileText className="h-5 w-5 mr-2" />
            My Leaves
          </Link>
          <Link
            to="/leave-planner/apply"
            className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Apply for Leave
          </Link>
        </div>
      </div>

      {/* Stats Summary - Colorful Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <Luggage className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Total Leaves</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">With Transport</p>
              <p className="text-2xl font-bold">{stats.withTransport}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter - Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-400" />
            <input
              type="text"
              placeholder="🔍 Search by employee, destination, or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
                <option value="cancelled">🚫 Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle & Export Buttons */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex bg-white rounded-xl shadow p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              viewMode === 'list' 
                ? 'bg-emerald-500 text-white shadow' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              viewMode === 'calendar' 
                ? 'bg-emerald-500 text-white shadow' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </button>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-white rounded-xl shadow hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'calendar' ? (
        <LeaveCalendar 
          leaves={filteredLeaves} 
          employees={employees}
          onLeaveClick={(leave) => navigate(`/leave-planner/${leave.id}`)}
        />
      ) : (
        <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[1000px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">👤 Employee</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">📅 Leave Period</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">🌴 Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">📍 Destination</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">📊 Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">✈️ Transport</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">⚙️ Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredLeaves.map((leave) => {
                const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                const transportStatus = leave.transportation?.status ? TRANSPORT_STATUS[leave.transportation.status] : null;
                const TransportIcon = leave.transportation?.mode ? TRANSPORT_MODE_ICONS[leave.transportation.mode] : Plane;
                
                return (
                  <tr key={leave.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getEmployeePhoto(leave.employeeId) ? (
                          <img 
                            src={getEmployeePhoto(leave.employeeId)} 
                            alt="" 
                            className="h-10 w-10 rounded-full object-cover border-2 border-emerald-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                            {getEmployeeName(leave.employeeId).charAt(0)}
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">{getEmployeeName(leave.employeeId)}</p>
                          <p className="text-xs text-gray-500">{leave.days} days</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                        <div>
                          <p className="font-medium">{formatDate(leave.startDate)}</p>
                          <p className="text-xs text-gray-500">to {formatDate(leave.endDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {leave.leaveType === 'annual' && '🏖️ Annual'}
                        {leave.leaveType === 'sick' && '🤒 Sick'}
                        {leave.leaveType === 'emergency' && '🚨 Emergency'}
                        {leave.leaveType === 'unpaid' && '💰 Unpaid'}
                        {leave.leaveType === 'other' && '📋 Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="h-4 w-4 mr-2 text-rose-500" />
                        {leave.destination || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leave.transportation?.required ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm text-gray-700">
                            <TransportIcon className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="capitalize">{leave.transportation.mode}</span>
                          </div>
                          {transportStatus && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${transportStatus.bg} ${transportStatus.text} w-fit`}>
                              {transportStatus.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/leave-planner/${leave.id}`}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {canEdit(leave) && (
                          <Link
                            to={`/leave-planner/${leave.id}/edit`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        )}
                        {leave.status === 'pending' && isHR() && (
                          <Link
                            to={`/leave-planner/${leave.id}/approve`}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve/Reject"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Link>
                        )}
                        {leave.transportation?.required && leave.status === 'approved' && isHR() && (
                          <Link
                            to={`/leave-planner/${leave.id}/transport`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manage Transport"
                          >
                            <Plane className="h-4 w-4" />
                          </Link>
                        )}
                        {canDelete(leave) && (
                          <button
                            onClick={() => { setSelectedLeave(leave); setShowDeleteModal(true); }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrint(leave)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-5xl mb-3">🌴</div>
                    <p className="text-gray-500 font-medium mb-2">No leave records found</p>
                    <p className="text-sm text-gray-400">Apply for leave to get started</p>
                    <Link
                      to="/leave-planner/apply"
                      className="inline-flex items-center mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Apply Now
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Delete Modal - Mobile Responsive */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Leave Request</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to delete this leave request?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedLeave(null); }}
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
      {showPrintView && printLeave && (
        <LeavePrintView 
          leave={printLeave} 
          employee={employees.find(e => e.id === printLeave.employeeId)}
          onClose={() => setShowPrintView(false)} 
        />
      )}
    </div>
  );
}
