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
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showPrintView, setShowPrintView] = useState(false);
  const [printLeave, setPrintLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [leaveBalances, setLeaveBalances] = useState({});
  
  // Edit Balance Modal State
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [balanceForm, setBalanceForm] = useState({
    annual: 0,
    offDay: 0,
    medical: 0,
    family: 0,
    operation: 'add', // 'add' or 'remove'
    days: 0,
    reason: ''
  });

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
    try {
      const unsub = getAllDocuments();
      return () => {
        if (typeof unsub === 'function') {
          unsub();
        }
      };
    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
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
    
    // Only show active leaves (pending and approved) by default
    // Filter out rejected and cancelled leaves unless explicitly viewing those statuses
    if (statusFilter === 'all') {
      filtered = filtered.filter(l => l.status === 'pending' || l.status === 'approved');
    }
    
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
    
    // Filter by leave type
    if (leaveTypeFilter !== 'all') {
      filtered = filtered.filter(l => (l.leaveType || 'other') === leaveTypeFilter);
    }
    
    // Non-HR users can only see their own leaves
    if (!isHR() && userData?.employeeId) {
      filtered = filtered.filter(l => l.employeeId === userData.employeeId);
    }
    
    setFilteredLeaves(filtered);
  }, [leaves, searchTerm, statusFilter, leaveTypeFilter, employees, isHR, userData]);

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

  // Handle edit balance
  const handleEditBalance = (emp) => {
    setSelectedEmployee(emp);
    setBalanceForm({
      annual: 0,
      offDay: 0,
      medical: 0,
      family: 0,
      operation: 'add',
      days: 0,
      reason: ''
    });
    setShowEditBalanceModal(true);
  };

  // Save balance adjustment
  const handleSaveBalance = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      // Create a leave record for the adjustment
      const adjustmentData = {
        employeeId: selectedEmployee.id,
        leaveType: balanceForm.leaveType || 'annual',
        days: balanceForm.operation === 'add' ? parseInt(balanceForm.days) : -parseInt(balanceForm.days),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: `Balance Adjustment: ${balanceForm.reason}`,
        status: 'approved',
        companyId,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAdjustment: true
      };

      await addDoc(collection(db, 'leaves'), adjustmentData);
      toast.success(`Balance ${balanceForm.operation === 'add' ? 'added' : 'deducted'} successfully`);
      setShowEditBalanceModal(false);
    } catch (error) {
      toast.error('Failed to adjust balance: ' + error.message);
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

  // Calculate stats from ALL leaves, not filtered leaves
  const stats = useMemo(() => {
    const base = { total: leaves.length };
    const types = [
      'annual', 'unpaid', 'off_day', 'ph', 'family_responsibility',
      'medical', 'special', 'on_duty', 'sick', 'hajju', 'emergency', 'other'
    ];
    types.forEach(t => {
      base[t] = leaves.filter(l => (l.leaveType || 'other') === t).length;
    });
    return base;
  }, [leaves]);

  if (loading || employeesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'balances':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Leave Balances</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Annual: 30/yr</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Off Days: 4/mo</span>
                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Medical: 10/yr</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Family: 10/yr</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Sick: 15/yr</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">PH: 15/yr</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">Employee</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-emerald-600 uppercase">Annual<br/><span className="text-gray-400 font-normal">Ent/Used/Left</span></th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-blue-600 uppercase">Off<br/><span className="text-gray-400 font-normal">Ent/Used/Left</span></th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-rose-600 uppercase">Medical<br/><span className="text-gray-400 font-normal">Ent/Used/Left</span></th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-amber-600 uppercase">Family<br/><span className="text-gray-400 font-normal">Ent/Used/Left</span></th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-purple-600 uppercase">Sick<br/><span className="text-gray-400 font-normal">Ent/Used/Left</span></th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-pink-600 uppercase">Emerg</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-cyan-600 uppercase">Unpaid</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-indigo-600 uppercase">PH</th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map(emp => {
                    const hireDate = new Date(emp.JoinDate || emp.joinDate || emp.HireDate || emp.hireDate || '2025-01-01');
                    const now = new Date();
                    const yearsOfService = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24 * 365.25));
                    const monthsOfService = Math.floor((now - hireDate) / (1000 * 60 * 60 * 24 * 30.44));
                    
                    // Get leaves for this employee
                    const empLeaves = leaves.filter(l => 
                      l.employeeId === emp.id && 
                      l.status === 'approved'
                    );
                    
                    // Calculate used leaves
                    const annualUsed = empLeaves.filter(l => l.leaveType === 'annual').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const offDayUsed = empLeaves.filter(l => l.leaveType === 'off_day').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const medicalUsed = empLeaves.filter(l => l.leaveType === 'medical').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const familyUsed = empLeaves.filter(l => l.leaveType === 'family_responsibility').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const sickUsed = empLeaves.filter(l => l.leaveType === 'sick').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const emergencyUsed = empLeaves.filter(l => l.leaveType === 'emergency').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const unpaidUsed = empLeaves.filter(l => l.leaveType === 'unpaid').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    const phUsed = empLeaves.filter(l => l.leaveType === 'ph').reduce((sum, l) => sum + (parseInt(l.days) || 0), 0);
                    
                    // Simple fixed entitlements
                    const annualEntitled = yearsOfService >= 1 ? 30 : 0;
                    const offDayEntitled = Math.min(48, monthsOfService * 4);
                    const medicalEntitled = 10;
                    const familyEntitled = 10;
                    const sickEntitled = 15;
                    
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 sticky left-0 bg-white z-10">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                              {(emp.FullName || emp.name || 'U').charAt(0)}
                            </div>
                            <div className="ml-2 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{emp.FullName || emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.EmpID || emp.id} • {yearsOfService}y {monthsOfService % 12}m</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-emerald-600">{Math.max(0, annualEntitled - annualUsed)}</span>
                          <span className="text-xs text-gray-400 block">{annualEntitled}/{annualUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-blue-600">{Math.max(0, offDayEntitled - offDayUsed)}</span>
                          <span className="text-xs text-gray-400 block">{offDayEntitled}/{offDayUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-rose-600">{Math.max(0, medicalEntitled - medicalUsed)}</span>
                          <span className="text-xs text-gray-400 block">{medicalEntitled}/{medicalUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-amber-600">{Math.max(0, familyEntitled - familyUsed)}</span>
                          <span className="text-xs text-gray-400 block">{familyEntitled}/{familyUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-purple-600">{Math.max(0, sickEntitled - sickUsed)}</span>
                          <span className="text-xs text-gray-400 block">{sickEntitled}/{sickUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-pink-600">{emergencyUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-cyan-600">{unpaidUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm font-bold text-indigo-600">{phUsed}</span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleEditBalance(emp)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                          >
                            Adjust
                          </button>
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
                {leaveTypeFilter !== 'all' && (
                  <button
                    onClick={() => setLeaveTypeFilter('all')}
                    className="flex items-center px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear Filter
                  </button>
                )}
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 bg-white rounded-xl shadow hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export {leaveTypeFilter !== 'all' ? `(${filteredLeaves.length})` : ''}
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
                <div className="min-w-[1100px] sm:min-w-full px-4 sm:px-0">
                  <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-32 max-w-[140px]">👤 Employee</th>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-24">🆔 Emp ID</th>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-32">🏢 Department</th>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-32">📅 Leave Period</th>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-20">📊 Days</th>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-32">🌴 Type</th>
                      <th className="px-3 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-28">📊 Status</th>
                      <th className="px-3 py-4 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider sticky top-0 w-20">⚙️</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredLeaves.map((leave) => {
                      const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                      const emp = employees.find(e => e.id === leave.employeeId);
                      
                      return (
                        <tr key={leave.id} className="hover:bg-emerald-50/50 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap">
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
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                            {emp?.EmpID || emp?.employeeId || 'N/A'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">
                              <p className="font-medium">{emp?.Department || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{emp?.Section || ''}</p>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                              <div>
                                <p className="font-medium">{formatDate(leave.startDate)}</p>
                                <p className="text-xs text-gray-500">to {formatDate(leave.endDate)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                            {leave.days} days
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {leave.leaveType === 'annual' && '🏖️ Annual Leave'}
                              {leave.leaveType === 'sick' && '🤒 Sick Leave'}
                              {leave.leaveType === 'emergency' && '🚨 Emergency Leave'}
                              {leave.leaveType === 'unpaid' && '💰 No Pay'}
                              {leave.leaveType === 'off_day' && '🛌 Off Day'}
                              {leave.leaveType === 'ph' && '🎉 PH'}
                              {leave.leaveType === 'family_responsibility' && '👪 Family Responsibility'}
                              {leave.leaveType === 'medical' && '🏥 Medical Leave'}
                              {leave.leaveType === 'special' && '✨ Special Leave'}
                              {leave.leaveType === 'on_duty' && '🧑‍💼 On Duty'}
                              {leave.leaveType === 'hajju' && '🕋 Hajju Leave'}
                              {(leave.leaveType === 'other' || !leave.leaveType) && '📋 Other'}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="text-5xl mb-3">🌴</div>
                          <p className="text-gray-500 font-medium mb-2">No leave records found</p>
                          <p className="text-sm text-gray-400">Apply for leave to get started</p>
                          <button
                            onClick={() => navigate('/leave-planner/apply')}
                            className="inline-flex items-center mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Apply Now
                          </button>
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
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none">
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
          <button
            onClick={() => navigate('/leave-planner/apply')}
            className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Stats Summary - Colorful Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { key: 'total', label: 'Total Leaves', icon: Luggage, emoji: null, colors: 'from-blue-500 to-indigo-600' },
          { key: 'annual', label: 'Annual', icon: null, emoji: '🏖️', colors: 'from-emerald-400 to-green-500' },
          { key: 'sick', label: 'Sick', icon: null, emoji: '🤒', colors: 'from-rose-400 to-red-500' },
          { key: 'unpaid', label: 'NoPay', icon: null, emoji: '💰', colors: 'from-gray-400 to-slate-500' },
          { key: 'off_day', label: 'Off Day', icon: null, emoji: '🛌', colors: 'from-slate-400 to-gray-500' },
          { key: 'ph', label: 'PH', icon: null, emoji: '🎉', colors: 'from-fuchsia-500 to-pink-600' },
          { key: 'family_responsibility', label: 'Family Care', icon: null, emoji: '👪', colors: 'from-amber-400 to-orange-500' },
          { key: 'medical', label: 'Medical', icon: null, emoji: '🏥', colors: 'from-emerald-500 to-teal-600' },
          { key: 'special', label: 'Special', icon: null, emoji: '✨', colors: 'from-purple-500 to-violet-600' },
          { key: 'on_duty', label: 'OnDuty', icon: null, emoji: '🧑‍💼', colors: 'from-cyan-400 to-blue-500' },
          { key: 'hajju', label: 'Hajju', icon: null, emoji: '🕋', colors: 'from-indigo-500 to-purple-600' },
          { key: 'emergency', label: 'Emergency', icon: null, emoji: '🚨', colors: 'from-red-500 to-rose-600' },
          { key: 'other', label: 'Other', icon: null, emoji: '📋', colors: 'from-gray-400 to-slate-500' },
        ].map((s) => (
          <div 
            key={s.key} 
            onClick={() => setLeaveTypeFilter(leaveTypeFilter === s.key ? 'all' : s.key)}
            className={`bg-gradient-to-br ${s.colors} rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all cursor-pointer ${leaveTypeFilter === s.key ? 'ring-4 ring-yellow-400 scale-105' : ''}`}
          >
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                {s.icon ? <s.icon className="h-5 w-5 text-white" /> : <span className="text-lg">{s.emoji}</span>}
              </div>
              <div>
                <p className="text-xs text-white/80 font-medium">{s.label}</p>
                <p className="text-2xl font-bold">{stats[s.key] || 0}</p>
              </div>
            </div>
          </div>
        ))}
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
          <Link
            to="/leave-planner/public-holidays"
            className="flex items-center gap-2 px-6 py-4 font-medium text-gray-600 hover:text-gray-900"
          >
            <Calendar className="h-4 w-4" />
            Public Holidays
          </Link>
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

      {/* Edit Balance Modal */}
      {showEditBalanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Adjust Leave Balance</h3>
              <button onClick={() => setShowEditBalanceModal(false)}>
                <XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Employee: <strong>{selectedEmployee.FullName || selectedEmployee.name}</strong>
            </p>
            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={balanceForm.leaveType || 'annual'}
                  onChange={(e) => setBalanceForm({...balanceForm, leaveType: e.target.value})}
                  className="block w-full rounded-lg border-gray-300 border px-3 py-2"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="off_day">Off Day</option>
                  <option value="medical">Medical</option>
                  <option value="family_responsibility">Family Care</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceForm({...balanceForm, operation: 'add'})}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      balanceForm.operation === 'add' 
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' 
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                  >
                    + Add Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceForm({...balanceForm, operation: 'remove'})}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      balanceForm.operation === 'remove' 
                        ? 'bg-rose-100 text-rose-700 border-2 border-rose-500' 
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                  >
                    - Remove Days
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={balanceForm.days}
                  onChange={(e) => setBalanceForm({...balanceForm, days: parseInt(e.target.value) || 0})}
                  className="block w-full rounded-lg border-gray-300 border px-3 py-2"
                  placeholder="Enter days"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={balanceForm.reason}
                  onChange={(e) => setBalanceForm({...balanceForm, reason: e.target.value})}
                  className="block w-full rounded-lg border-gray-300 border px-3 py-2"
                  rows="2"
                  placeholder="Enter reason for adjustment"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBalanceModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    balanceForm.operation === 'add' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {balanceForm.operation === 'add' ? 'Add Days' : 'Remove Days'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
