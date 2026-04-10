import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useFilteredEmployees } from '../hooks/useFilteredFirestore';
import OfficialLetterGenerator from './OfficialLetterGenerator';
import { 
  DollarSign, Plus, Search, Filter, FileText, CheckCircle, 
  XCircle, Clock, Eye, Printer, Calculator 
} from 'lucide-react';

/**
 * Payroll Approval Module
 * 
 * Workflow: HRM → GM
 * - HRM prepares and submits payroll for approval
 * - GM reviews and approves/rejects
 * - Generates official payroll approval form when approved
 */

const WORKFLOW_STAGES = [
  { key: 'hrm_review', label: 'HRM Review', role: 'hrm' },
  { key: 'gm_review', label: 'GM Approval', role: 'gm' }
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending_hrm: 'bg-blue-100 text-blue-800',
  pending_gm: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  processed: 'bg-emerald-100 text-emerald-800'
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollApproval() {
  const { userData, hasAccess } = useAuth();
  const { companyId } = useCompany();
  const { employees } = useFilteredEmployees();
  
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    payrollMonth: MONTHS[new Date().getMonth()],
    payrollYear: new Date().getFullYear(),
    periodStart: '',
    periodEnd: '',
    basic: '',
    housingAllowance: '',
    transportAllowance: '',
    otherAllowances: '',
    overtime: '0',
    incomeTax: '',
    pension: '',
    healthInsurance: '',
    loanDeductions: '0',
    otherDeductions: '0'
  });

  // Fetch payroll records
  useEffect(() => {
    if (!companyId) return;
    
    const q = query(
      collection(db, 'payrollApprovals'),
      where('companyId', '==', companyId),
      orderBy('raisedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayrolls(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyId]);

  // Filter payrolls
  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = 
      payroll.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.payrollMonth?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payroll.status === filterStatus;
    
    const userRole = userData?.role;
    
    if (userRole === 'superadmin' || userRole === 'gm' || userRole === 'hrm') {
      return matchesSearch && matchesStatus;
    }
    
    // Staff sees only their own
    return matchesSearch && matchesStatus && payroll.employeeId === userData?.uid;
  });

  const canCreatePayroll = () => {
    return hasAccess('payroll', 'create') || userData?.role === 'hrm';
  };

  const canApproveStage = (payroll, stage) => {
    const userRole = userData?.role;
    
    if (payroll.status === 'approved' || payroll.status === 'rejected' || payroll.status === 'processed') return false;
    
    if (stage === 'hrm_review') {
      return userRole === 'hrm' && payroll.status === 'draft';
    }
    if (stage === 'gm_review') {
      return (userRole === 'gm' || userRole === 'superadmin') && payroll.status === 'pending_gm';
    }
    
    return false;
  };

  const calculateTotals = () => {
    const basic = parseFloat(formData.basic) || 0;
    const housing = parseFloat(formData.housingAllowance) || 0;
    const transport = parseFloat(formData.transportAllowance) || 0;
    const otherAllow = parseFloat(formData.otherAllowances) || 0;
    const overtime = parseFloat(formData.overtime) || 0;
    
    const tax = parseFloat(formData.incomeTax) || 0;
    const pension = parseFloat(formData.pension) || 0;
    const health = parseFloat(formData.healthInsurance) || 0;
    const loan = parseFloat(formData.loanDeductions) || 0;
    const otherDed = parseFloat(formData.otherDeductions) || 0;
    
    const totalEarnings = basic + housing + transport + otherAllow + overtime;
    const totalDeductions = tax + pension + health + loan + otherDed;
    const netPay = totalEarnings - totalDeductions;
    
    return { totalEarnings, totalDeductions, netPay };
  };

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && employee.salary) {
      setFormData({
        ...formData,
        employeeId,
        basic: employee.salary.basic || '',
        housingAllowance: employee.salary.housingAllowance || '',
        transportAllowance: employee.salary.transportAllowance || '',
        otherAllowances: employee.salary.otherAllowances || ''
      });
    } else {
      setFormData({...formData, employeeId});
    }
  };

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    
    // Validate userData is loaded
    if (!userData?.uid) {
      alert('Error: User data not loaded. Please refresh the page and try again.');
      return;
    }
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    const totals = calculateTotals();

    const newPayroll = {
      employeeId: formData.employeeId,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || 'N/A',
      department: employee.department,
      position: employee.position,
      
      payrollMonth: formData.payrollMonth,
      payrollYear: parseInt(formData.payrollYear),
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      
      currentSalary: {
        basic: parseFloat(formData.basic) || 0,
        housingAllowance: parseFloat(formData.housingAllowance) || 0,
        transportAllowance: parseFloat(formData.transportAllowance) || 0,
        otherAllowances: parseFloat(formData.otherAllowances) || 0,
        total: (parseFloat(formData.basic) || 0) + 
               (parseFloat(formData.housingAllowance) || 0) + 
               (parseFloat(formData.transportAllowance) || 0) + 
               (parseFloat(formData.otherAllowances) || 0)
      },
      
      earnings: {
        basic: parseFloat(formData.basic) || 0,
        housingAllowance: parseFloat(formData.housingAllowance) || 0,
        transportAllowance: parseFloat(formData.transportAllowance) || 0,
        otherAllowances: parseFloat(formData.otherAllowances) || 0,
        overtime: parseFloat(formData.overtime) || 0,
        totalEarnings: totals.totalEarnings
      },
      
      deductions: {
        incomeTax: parseFloat(formData.incomeTax) || 0,
        pension: parseFloat(formData.pension) || 0,
        healthInsurance: parseFloat(formData.healthInsurance) || 0,
        loanDeductions: parseFloat(formData.loanDeductions) || 0,
        otherDeductions: parseFloat(formData.otherDeductions) || 0,
        totalDeductions: totals.totalDeductions
      },
      
      netPay: totals.netPay,
      
      workflow: {
        currentStage: 'hrm_review',
        stages: WORKFLOW_STAGES.map(stage => ({
          stage: stage.key,
          status: 'pending',
          approverId: null,
          approverName: null,
          approverRole: stage.role,
          date: null,
          comments: null,
          action: null
        }))
      },
      
      status: 'pending_hrm',
      
      raisedBy: userData?.uid,
      raisedByName: userData?.name,
      raisedByRole: userData?.role,
      raisedAt: new Date().toISOString(),
      companyId,
      
      formGenerated: false,
      formUrl: null,
      formDate: null
    };

    await addDoc(collection(db, 'payrollApprovals'), newPayroll);
    setShowCreateModal(false);
    setFormData({
      employeeId: '',
      payrollMonth: MONTHS[new Date().getMonth()],
      payrollYear: new Date().getFullYear(),
      periodStart: '',
      periodEnd: '',
      basic: '',
      housingAllowance: '',
      transportAllowance: '',
      otherAllowances: '',
      overtime: '0',
      incomeTax: '',
      pension: '',
      healthInsurance: '',
      loanDeductions: '0',
      otherDeductions: '0'
    });
  };

  const handleApprovalAction = async (payrollId, stage, action, comments = '') => {
    const payroll = payrolls.find(p => p.id === payrollId);
    if (!payroll) return;

    const updatedStages = [...payroll.workflow.stages];
    const stageIndex = updatedStages.findIndex(s => s.stage === stage);
    
    if (stageIndex === -1) return;

    updatedStages[stageIndex] = {
      ...updatedStages[stageIndex],
      status: action === 'approved' ? 'approved' : 'rejected',
      approverId: userData?.uid,
      approverName: userData?.name,
      approverRole: userData?.role,
      date: new Date().toISOString(),
      comments,
      action
    };

    let newStatus = payroll.status;
    let newStage = payroll.workflow.currentStage;

    if (action === 'rejected') {
      newStatus = 'rejected';
    } else if (action === 'approved') {
      if (stage === 'hrm_review') {
        newStatus = 'pending_gm';
        newStage = 'gm_review';
      } else if (stage === 'gm_review') {
        newStatus = 'approved';
        newStage = 'approved';
      }
    }

    await updateDoc(doc(db, 'payrollApprovals', payrollId), {
      'workflow.stages': updatedStages,
      'workflow.currentStage': newStage,
      status: newStatus
    });
  };

  const handleProcessPayroll = async (payrollId) => {
    await updateDoc(doc(db, 'payrollApprovals', payrollId), {
      status: 'processed',
      processedAt: new Date().toISOString(),
      processedBy: userData?.uid
    });
  };

  const generateLetterData = (payroll) => ({
    documentType: 'payroll',
    documentNumber: `PAY-${payroll.payrollYear}-${payroll.id.slice(-4)}`,
    date: new Date().toLocaleDateString(),
    employeeName: payroll.employeeName,
    employeeCode: payroll.employeeCode,
    department: payroll.department,
    position: payroll.position,
    payrollMonth: payroll.payrollMonth,
    payrollYear: payroll.payrollYear,
    periodStart: payroll.periodStart,
    periodEnd: payroll.periodEnd,
    earnings: payroll.earnings,
    deductions: payroll.deductions,
    netPay: payroll.netPay,
    status: payroll.status,
    workflow: payroll.workflow
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Payroll Approval</h2>
          </div>
          <p className="text-gray-600">Manage employee payroll processing and approvals</p>
        </div>
        {canCreatePayroll() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-5 w-5" />
            New Payroll Entry
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name, month, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending_hrm">Pending HRM</option>
          <option value="pending_gm">Pending GM</option>
          <option value="approved">Approved</option>
          <option value="processed">Processed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Payroll List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Earnings</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredPayrolls.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No payroll records found
                </td>
              </tr>
            ) : (
              filteredPayrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{payroll.employeeName}</div>
                    <div className="text-sm text-gray-500">{payroll.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{payroll.payrollMonth} {payroll.payrollYear}</div>
                    <div className="text-sm text-gray-500">{payroll.periodStart} to {payroll.periodEnd}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-medium text-green-600">${payroll.earnings?.totalEarnings?.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-medium text-red-600">${payroll.deductions?.totalDeductions?.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-lg">${payroll.netPay?.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[payroll.status] || 'bg-gray-100'}`}>
                      {payroll.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedPayroll(payroll); setShowDetailModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(payroll.status === 'approved' || payroll.status === 'processed') && (
                        <button
                          onClick={() => { setSelectedPayroll(payroll); setShowLetterPreview(true); }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="View Form"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b bg-green-50">
              <div className="flex items-center gap-2">
                <Calculator className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold">New Payroll Entry</h3>
              </div>
            </div>
            <form onSubmit={handleCreatePayroll} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Month *</label>
                    <select
                      required
                      value={formData.payrollMonth}
                      onChange={(e) => setFormData({...formData, payrollMonth: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {MONTHS.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year *</label>
                    <input
                      type="number"
                      required
                      value={formData.payrollYear}
                      onChange={(e) => setFormData({...formData, payrollYear: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={formData.periodStart}
                    onChange={(e) => setFormData({...formData, periodStart: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={formData.periodEnd}
                    onChange={(e) => setFormData({...formData, periodEnd: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-green-700">Earnings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Basic Salary *</label>
                    <input
                      type="number"
                      required
                      value={formData.basic}
                      onChange={(e) => setFormData({...formData, basic: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Housing Allowance</label>
                    <input
                      type="number"
                      value={formData.housingAllowance}
                      onChange={(e) => setFormData({...formData, housingAllowance: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Transport Allowance</label>
                    <input
                      type="number"
                      value={formData.transportAllowance}
                      onChange={(e) => setFormData({...formData, transportAllowance: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Other Allowances</label>
                    <input
                      type="number"
                      value={formData.otherAllowances}
                      onChange={(e) => setFormData({...formData, otherAllowances: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Overtime</label>
                    <input
                      type="number"
                      value={formData.overtime}
                      onChange={(e) => setFormData({...formData, overtime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-red-700">Deductions</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Income Tax</label>
                    <input
                      type="number"
                      value={formData.incomeTax}
                      onChange={(e) => setFormData({...formData, incomeTax: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pension</label>
                    <input
                      type="number"
                      value={formData.pension}
                      onChange={(e) => setFormData({...formData, pension: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Health Insurance</label>
                    <input
                      type="number"
                      value={formData.healthInsurance}
                      onChange={(e) => setFormData({...formData, healthInsurance: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan Deductions</label>
                    <input
                      type="number"
                      value={formData.loanDeductions}
                      onChange={(e) => setFormData({...formData, loanDeductions: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Other Deductions</label>
                    <input
                      type="number"
                      value={formData.otherDeductions}
                      onChange={(e) => setFormData({...formData, otherDeductions: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payroll Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                    <div className="text-xl font-bold text-green-600">${calculateTotals().totalEarnings.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Deductions</div>
                    <div className="text-xl font-bold text-red-600">${calculateTotals().totalDeductions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Net Pay</div>
                    <div className="text-2xl font-bold text-blue-600">${calculateTotals().netPay.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit for Approval
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center bg-green-50">
              <h3 className="text-xl font-semibold">Payroll Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Employee</div>
                  <div className="font-medium">{selectedPayroll.employeeName}</div>
                  <div className="text-sm text-gray-500">{selectedPayroll.employeeCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Payroll Period</div>
                  <div className="font-medium">{selectedPayroll.payrollMonth} {selectedPayroll.payrollYear}</div>
                  <div className="text-sm text-gray-500">{selectedPayroll.periodStart} to {selectedPayroll.periodEnd}</div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-medium mb-3 text-green-700">Earnings</h4>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Basic Salary</td>
                      <td className="text-right py-2">${selectedPayroll.earnings?.basic?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Housing Allowance</td>
                      <td className="text-right py-2">${selectedPayroll.earnings?.housingAllowance?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Transport Allowance</td>
                      <td className="text-right py-2">${selectedPayroll.earnings?.transportAllowance?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Other Allowances</td>
                      <td className="text-right py-2">${selectedPayroll.earnings?.otherAllowances?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Overtime</td>
                      <td className="text-right py-2">${selectedPayroll.earnings?.overtime?.toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold text-green-600">
                      <td className="py-2">Total Earnings</td>
                      <td className="text-right py-2">${selectedPayroll.earnings?.totalEarnings?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium mb-3 text-red-700">Deductions</h4>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Income Tax</td>
                      <td className="text-right py-2">${selectedPayroll.deductions?.incomeTax?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Pension</td>
                      <td className="text-right py-2">${selectedPayroll.deductions?.pension?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Health Insurance</td>
                      <td className="text-right py-2">${selectedPayroll.deductions?.healthInsurance?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Loan Deductions</td>
                      <td className="text-right py-2">${selectedPayroll.deductions?.loanDeductions?.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Other Deductions</td>
                      <td className="text-right py-2">${selectedPayroll.deductions?.otherDeductions?.toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold text-red-600">
                      <td className="py-2">Total Deductions</td>
                      <td className="text-right py-2">${selectedPayroll.deductions?.totalDeductions?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-blue-600">NET PAY</div>
                    <div className="text-3xl font-bold text-blue-700">${selectedPayroll.netPay?.toLocaleString()}</div>
                  </div>
                  <DollarSign className="h-12 w-12 text-blue-300" />
                </div>
              </div>

              {/* Approval Workflow */}
              <div>
                <h4 className="font-medium mb-3">Approval Workflow</h4>
                <div className="space-y-3">
                  {selectedPayroll.workflow?.stages?.map((stage, index) => (
                    <div key={stage.stage} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        stage.status === 'approved' ? 'bg-green-100 text-green-600' :
                        stage.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        index === WORKFLOW_STAGES.findIndex(s => s.key === selectedPayroll.workflow.currentStage) 
                          ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {stage.status === 'approved' ? '✓' :
                         stage.status === 'rejected' ? '✗' :
                         index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{WORKFLOW_STAGES.find(s => s.key === stage.stage)?.label}</div>
                        {stage.approverName && (
                          <div className="text-sm text-gray-600">
                            {stage.approverName} ({stage.approverRole})
                          </div>
                        )}
                        {stage.date && (
                          <div className="text-sm text-gray-500">
                            {new Date(stage.date).toLocaleString()}
                          </div>
                        )}
                        {stage.comments && (
                          <div className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                            {stage.comments}
                          </div>
                        )}
                        
                        {canApproveStage(selectedPayroll, stage.stage) && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                const comments = prompt('Enter approval comments (optional):');
                                if (comments !== null) {
                                  handleApprovalAction(selectedPayroll.id, stage.stage, 'approved', comments);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const comments = prompt('Enter rejection reason (required):');
                                if (comments) {
                                  handleApprovalAction(selectedPayroll.id, stage.stage, 'rejected', comments);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedPayroll.status === 'approved' && userData?.role === 'hrm' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleProcessPayroll(selectedPayroll.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Processed
                  </button>
                  <button
                    onClick={() => setShowLetterPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Printer className="h-4 w-4" />
                    Print Form
                  </button>
                </div>
              )}
              
              {selectedPayroll.status === 'processed' && (
                <button
                  onClick={() => setShowLetterPreview(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4" />
                  Print Form
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Letter Preview */}
      {showLetterPreview && selectedPayroll && (
        <OfficialLetterGenerator
          isOpen={showLetterPreview}
          onClose={() => setShowLetterPreview(false)}
          documentType="payroll"
          documentData={generateLetterData(selectedPayroll)}
        />
      )}
    </div>
  );
}
