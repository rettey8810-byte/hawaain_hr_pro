import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Download,
  Upload,
  Palmtree,
  FileSpreadsheet,
  AlertCircle,
  Users,
  CheckSquare,
  XSquare
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import LeaveCalendar from './LeaveCalendar';
import LeavePrintView from './LeavePrintView';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

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

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  // Excel's epoch is December 30, 1899
  const excelEpoch = new Date(1899, 11, 30);
  const days = Math.floor(serial);
  const fraction = serial - days;
  const milliseconds = days * 24 * 60 * 60 * 1000 + fraction * 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + milliseconds);
}

export default function LeavePlanner() {
  const navigate = useNavigate();
  const { user, userData, isHR } = useAuth();
  const { currentCompany, companyId } = useCompany();
  const { documents: leaves, loading, deleteDocument, getAllDocuments } = useFirestore('leaves');
  
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showPrintView, setShowPrintView] = useState(false);
  const [printLeave, setPrintLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [leaveBalances, setLeaveBalances] = useState({});

  // Fetch ALL employees for name lookup
  const fetchAllEmployees = useCallback(async () => {
    if (!companyId) return;
    setEmployeesLoading(true);
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId)
      );
      const snap = await getDocs(q);
      const empList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      empList.sort((a, b) => (a.FullName || a.name || '').localeCompare(b.FullName || b.name || ''));
      setEmployees(empList);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  useEffect(() => {
    const unsub = getAllDocuments();
    return () => unsub?.();
  }, [getAllDocuments]);

  // Calculate leave balances per employee
  useEffect(() => {
    const balances = {};
    employees.forEach(emp => {
      const empLeaves = leaves.filter(l => l.employeeId === emp.id && l.status === 'approved');
      const annualUsed = empLeaves
        .filter(l => l.leaveType === 'annual')
        .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
      const sickUsed = empLeaves
        .filter(l => l.leaveType === 'sick')
        .reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
      
      balances[emp.id] = {
        annual: { total: 30, used: annualUsed, remaining: 30 - annualUsed },
        sick: { total: 15, used: sickUsed, remaining: 15 - sickUsed }
      };
    });
    setLeaveBalances(balances);
  }, [leaves, employees]);

  useEffect(() => {
    let filtered = leaves;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(l => {
        const employee = employees.find(e => e.id === l.employeeId);
        return (
          (employee?.FullName || employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.leaveType || '').toLowerCase().includes(searchTerm.toLowerCase())
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
    return emp?.FullName || emp?.name || 'Unknown';
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

  // Approve leave
  const handleApprove = async (leaveId) => {
    try {
      await updateDoc(doc(db, 'leaves', leaveId), {
        status: 'approved',
        approvedBy: user?.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Leave approved successfully');
    } catch (error) {
      toast.error('Failed to approve leave: ' + error.message);
    }
  };

  // Reject leave
  const handleReject = async (leaveId) => {
    try {
      await updateDoc(doc(db, 'leaves', leaveId), {
        status: 'rejected',
        rejectedBy: user?.uid,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Leave rejected');
    } catch (error) {
      toast.error('Failed to reject leave: ' + error.message);
    }
  };

  // Import from Leave_Status.json
  const handleImportFromJSON = async (jsonData) => {
    try {
      console.log('Starting leave import with', jsonData.length, 'records');
      toast.loading('Importing leave data...', { id: 'import' });
      
      let leavesCreated = 0;
      let skipped = 0;
      
      for (const record of jsonData) {
        // Skip header row
        if (record['Emp ID'] === 'Emp ID' || !record['Emp ID']) {
          skipped++;
          continue;
        }
        
        const empId = String(record['Emp ID']).trim();
        const employee = employees.find(e => 
          String(e.EmpID) === empId || String(e.id) === empId
        );
        
        if (!employee) {
          console.warn(`Employee not found: ${empId} - ${record['Name']}`);
          skipped++;
          continue;
        }
        
        // Parse dates from Excel format
        const fromDate = record['From Date'] ? excelDateToJSDate(parseFloat(record['From Date'])) : null;
        const toDate = record['To Date'] ? excelDateToJSDate(parseFloat(record['To Date'])) : null;
        
        if (!fromDate || !toDate) {
          console.warn('Invalid dates for record:', record);
          skipped++;
          continue;
        }
        
        // Calculate days
        const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Map leave type
        let leaveType = 'other';
        const typeStr = (record['Leave Type'] || '').toLowerCase();
        if (typeStr.includes('annual')) leaveType = 'annual';
        else if (typeStr.includes('sick')) leaveType = 'sick';
        else if (typeStr.includes('emergency')) leaveType = 'emergency';
        else if (typeStr.includes('unpaid')) leaveType = 'unpaid';
        
        // Check if leave already exists
        const existingLeave = leaves.find(l => 
          l.employeeId === employee.id && 
          l.startDate === fromDate.toISOString().split('T')[0]
        );
        
        if (existingLeave) {
          console.log('Leave already exists, skipping');
          skipped++;
          continue;
        }
        
        // Determine status based on approvals
        let status = 'pending';
        if (record['Approved By.2'] === 'SYSTEM') {
          status = 'approved';
        }
        
        // Create leave data
        const leaveData = {
          employeeId: employee.id,
          leaveType,
          startDate: fromDate.toISOString().split('T')[0],
          endDate: toDate.toISOString().split('T')[0],
          days,
          destination: 'Not specified',
          reason: record['Reason'] || record['Leave Details'] || '',
          status,
          transportation: { required: false },
          companyId,
          createdBy: user?.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'imported',
          refNo: record['Ref. No'] || ''
        };
        
        await addDoc(collection(db, 'leaves'), leaveData);
        leavesCreated++;
        console.log('Leave created for employee:', employee.id, employee.FullName || employee.name);
      }
      
      console.log(`Import complete: ${leavesCreated} leaves, ${skipped} skipped`);
      toast.success(`Imported ${leavesCreated} leaves (${skipped} skipped)`, { id: 'import' });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed: ' + error.message, { id: 'import' });
    }
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

  // Tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'balances':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Leave Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-700 uppercase">Employee</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-emerald-700 uppercase">Annual (Total/Used/Remaining)</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-emerald-700 uppercase">Sick (Total/Used/Remaining)</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-emerald-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map(emp => {
                    const balance = leaveBalances[emp.id] || { annual: { total: 30, used: 0, remaining: 30 }, sick: { total: 15, used: 0, remaining: 15 } };
                    return (
                      <tr key={emp.id} className="hover:bg-emerald-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                              {(emp.FullName || emp.name || 'U').charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-bold text-gray-900">{emp.FullName || emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.EmpID || emp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-medium text-gray-600">{balance.annual.total}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-sm font-medium text-rose-600">{balance.annual.used}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-sm font-bold text-emerald-600">{balance.annual.remaining}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-[200px] mx-auto">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((balance.annual.used / balance.annual.total) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-medium text-gray-600">{balance.sick.total}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-sm font-medium text-rose-600">{balance.sick.used}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-sm font-bold text-emerald-600">{balance.sick.remaining}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-[200px] mx-auto">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((balance.sick.used / balance.sick.total) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {balance.annual.remaining < 5 ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                              Low Balance
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'import':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Leave Data</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Upload your Leave_Status.json file to import leave records from Excel. 
                The system will match employees by Emp ID and create leave entries.
              </p>
              
              <label className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-lg">
                <Upload className="h-5 w-5 mr-2" />
                Select JSON File
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    console.log('File selected:', e.target.files);
                    const file = e.target.files[0];
                    if (file) {
                      console.log('Reading file:', file.name);
                      toast.loading('Reading file...', { id: 'file-read' });
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          console.log('File content length:', event.target.result.length);
                          const jsonData = JSON.parse(event.target.result);
                          console.log('Parsed JSON records:', jsonData.length);
                          toast.dismiss('file-read');
                          handleImportFromJSON(jsonData);
                        } catch (err) {
                          console.error('JSON parse error:', err);
                          toast.dismiss('file-read');
                          toast.error('Invalid JSON file: ' + err.message);
                        }
                      };
                      reader.onerror = (err) => {
                        console.error('File read error:', err);
                        toast.dismiss('file-read');
                        toast.error('Failed to read file');
                      };
                      reader.readAsText(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              
              <div className="mt-8 text-left max-w-2xl mx-auto">
                <h4 className="font-semibold text-gray-900 mb-3">Expected JSON Format:</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-xs text-gray-700 overflow-x-auto">
{`[
  {
    "Emp ID": "53947",
    "Name": "IBRAHIM DHIVAAN MUFEED",
    "Leave Type": "Annual",
    "From Date": "46244",
    "To Date": "46279",
    "Leave Days": "30",
    "Reason": "Annual leave",
    "Ref. No": "LR-26-00006453"
  }
]`}
                </pre>
              </div>
            </div>
          </div>
        );
      
      default: // 'list'
        return (
          <>
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">🏢 Department</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">� Leave Period</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">🌴 Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">📊 Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0">⚙️ Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredLeaves.map((leave) => {
                      const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                      const emp = employees.find(e => e.id === leave.employeeId);
                      
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
                                <p className="text-xs text-gray-500">{emp?.Designation || 'No designation'}</p>
                                <p className="text-xs text-gray-400">{leave.days} days</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              <p className="font-medium">{emp?.Department || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{emp?.Section || ''}</p>
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
                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1">
                              <button
                                onClick={() => navigate(`/leave-planner/${leave.id}`)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              {/* Always show edit for HR, or for owner if pending */}
                              {(isHR() || (leave.employeeId === userData?.employeeId && leave.status === 'pending')) && (
                                <button
                                  onClick={() => navigate(`/leave-planner/${leave.id}/edit`)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              
                              {/* Approve/Reject for pending leaves - HR only */}
                              {leave.status === 'pending' && isHR() && (
                                <>
                                  <button
                                    onClick={() => handleApprove(leave.id)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(leave.id)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              
                              {/* Delete - HR can delete any, owner can delete own pending */}
                              {(isHR() || (leave.employeeId === userData?.employeeId && leave.status === 'pending')) && (
                                <button
                                  onClick={() => { setSelectedLeave(leave); setShowDeleteModal(true); }}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
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
          </>
        );
    }
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

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b">
          {[
            { id: 'list', label: 'Leave List', icon: LayoutGrid },
            { id: 'balances', label: 'Leave Balances', icon: FileSpreadsheet },
            { id: 'import', label: 'Import Data', icon: Upload },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-6">
        {renderTabContent()}
      </div>

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
