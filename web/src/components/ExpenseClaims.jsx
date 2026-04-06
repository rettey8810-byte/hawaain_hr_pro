import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Receipt, DollarSign, FileText, CheckCircle, XCircle, Clock, AlertCircle,
  Plus, Search, Download, Printer, Eye, ChevronDown, ChevronUp,
  Calendar, User, Briefcase, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Expense Claims & Reimbursement Module
 * 
 * Features:
 * - Submit expense claims with receipt uploads
 * - Multi-level approval workflow (HOD → Finance → GM)
 * - Reimbursement status tracking
 * - Integration with payroll for deductions/additions
 * - Expense categories and budgets
 */

const EXPENSE_CATEGORIES = [
  { id: 'travel', name: 'Travel & Transportation', icon: 'Plane' },
  { id: 'meals', name: 'Meals & Entertainment', icon: 'Utensils' },
  { id: 'office', name: 'Office Supplies', icon: 'Paperclip' },
  { id: 'training', name: 'Training & Development', icon: 'GraduationCap' },
  { id: 'medical', name: 'Medical Expenses', icon: 'Stethoscope' },
  { id: 'communication', name: 'Communication', icon: 'Phone' },
  { id: 'accommodation', name: 'Accommodation', icon: 'Hotel' },
  { id: 'fuel', name: 'Fuel & Mileage', icon: 'Fuel' },
  { id: 'misc', name: 'Miscellaneous', icon: 'MoreHorizontal' }
];

const EXPENSE_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  hod_approved: { label: 'HOD Approved', color: 'bg-purple-100 text-purple-800' },
  finance_approved: { label: 'Finance Approved', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  reimbursed: { label: 'Reimbursed', color: 'bg-teal-100 text-teal-800' }
};

const APPROVAL_WORKFLOW = ['submitted', 'hod_approved', 'finance_approved', 'approved', 'reimbursed'];

export default function ExpenseClaims() {
  const { companyId, currentCompany } = useCompany();
  const { userData, hasAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('my_claims');
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingApproval: 0,
    approvedAmount: 0,
    totalAmount: 0
  });

  const [formData, setFormData] = useState({
    employeeId: userData?.uid || '',
    category: '',
    amount: 0,
    currency: 'MVR',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: '',
    projectCode: '',
    clientName: '',
    status: 'draft',
    approvals: [],
    comments: []
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      );
      const employeesSnap = await getDocs(employeesQuery);
      const employeesData = employeesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);

      // Build expenses query based on user role
      let expensesQuery;
      if (userData?.role === 'superadmin' || userData?.role === 'gm' || userData?.role === 'hrm') {
        expensesQuery = query(
          collection(db, 'expenseClaims'),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
      } else if (userData?.role === 'dept_head') {
        // Show claims from their department
        expensesQuery = query(
          collection(db, 'expenseClaims'),
          where('companyId', '==', companyId),
          where('department', '==', userData?.department),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Show only own claims
        expensesQuery = query(
          collection(db, 'expenseClaims'),
          where('companyId', '==', companyId),
          where('employeeId', '==', userData?.uid),
          orderBy('createdAt', 'desc')
        );
      }
      
      const expensesSnap = await getDocs(expensesQuery);
      const expensesData = expensesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(expensesData);

      // Calculate stats
      const pending = expensesData.filter(e => 
        ['submitted', 'hod_approved', 'finance_approved'].includes(e.status)
      ).length;
      const approvedAmount = expensesData
        .filter(e => e.status === 'reimbursed')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalAmount = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      setStats({
        totalClaims: expensesData.length,
        pendingApproval: pending,
        approvedAmount,
        totalAmount
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      const employee = employees.find(e => e.id === formData.employeeId);
      const expenseData = {
        ...formData,
        employeeName: employee?.FullName || employee?.name || userData?.name || 'N/A',
        department: employee?.['Department '] || employee?.Department || employee?.department || userData?.department || 'N/A',
        position: employee?.Designation || employee?.position || userData?.position,
        submittedAt: formData.status !== 'draft' ? Timestamp.now() : null,
        companyId,
        createdBy: userData.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'expenseClaims'), expenseData);
      toast.success(formData.status === 'draft' ? 'Draft saved' : 'Expense claim submitted');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim');
    }
  };

  const handleApproval = async (expenseId, action, comments = '') => {
    try {
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) return;

      let newStatus = expense.status;
      let approvalEntry = {
        approverId: userData.uid,
        approverName: userData.name,
        approverRole: userData.role,
        action,
        comments,
        timestamp: Timestamp.now()
      };

      // Determine next status based on role and action
      if (action === 'reject') {
        newStatus = 'rejected';
      } else if (action === 'approve') {
        if (userData?.role === 'dept_head') {
          newStatus = 'hod_approved';
        } else if (userData?.role === 'finance' || userData?.role === 'hrm') {
          newStatus = 'finance_approved';
        } else if (userData?.role === 'gm' || userData?.role === 'superadmin') {
          newStatus = 'approved';
        }
      } else if (action === 'reimburse') {
        newStatus = 'reimbursed';
        approvalEntry.reimbursedAt = Timestamp.now();
      }

      await updateDoc(doc(db, 'expenseClaims', expenseId), {
        status: newStatus,
        approvals: [...(expense.approvals || []), approvalEntry],
        updatedAt: Timestamp.now()
      });

      toast.success(`Expense claim ${action}ed successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error('Failed to update claim');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: userData?.uid || '',
      category: '',
      amount: 0,
      currency: 'MVR',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receiptUrl: '',
      projectCode: '',
      clientName: '',
      status: 'draft',
      approvals: [],
      comments: []
    });
  };

  const canApprove = (expense) => {
    if (expense.status === 'reimbursed' || expense.status === 'rejected') return false;
    
    const currentStep = APPROVAL_WORKFLOW.indexOf(expense.status);
    
    // HOD can approve submitted claims from their department
    if (userData?.role === 'dept_head' && expense.status === 'submitted') {
      return expense.department === userData?.department;
    }
    
    // Finance/HRM can approve HOD approved claims
    if ((userData?.role === 'hrm') && expense.status === 'hod_approved') {
      return true;
    }
    
    // GM can approve finance approved claims
    if ((userData?.role === 'gm' || userData?.role === 'superadmin') && 
        (expense.status === 'finance_approved' || expense.status === 'hod_approved')) {
      return true;
    }
    
    // Finance can mark as reimbursed
    if ((userData?.role === 'hrm' || userData?.role === 'gm') && expense.status === 'approved') {
      return true;
    }
    
    return false;
  };

  const formatCurrency = (amount, currency = 'MVR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredExpenses = expenses.filter(expense => {
    const empName = expense.employeeName || '';
    const desc = expense.description || '';
    const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

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
            <Receipt className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Expense Claims</h2>
          </div>
          <p className="text-gray-600 mt-1">Submit and manage expense reimbursements</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Claim
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClaims}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reimbursed</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.approvedAmount)}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my_claims')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'my_claims' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              My Claims
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Claims
            </button>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(EXPENSE_STATUS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {expense.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{expense.employeeName || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{expense.department || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.name || expense.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                  {expense.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    EXPENSE_STATUS[expense.status]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {EXPENSE_STATUS[expense.status]?.label || expense.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedExpense(expense)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {canApprove(expense) && (
                    <>
                      <button
                        onClick={() => handleApproval(expense.id, 'approve')}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleApproval(expense.id, 'reject')}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>
        {filteredExpenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No expense claims found matching your criteria.
          </div>
        )}
      </div>

      {/* Submit Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Submit Expense Claim</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitClaim} className="p-6 space-y-4">
              {/* Employee Selection - for managers/HR submitting on behalf of employees */}
              {(userData?.role === 'superadmin' || userData?.role === 'gm' || userData?.role === 'hrm' || userData?.role === 'dept_head') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.FullName || emp.name} ({emp['Department '] || emp.Department || emp.department || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MVR">MVR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Describe the expense..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Code (Optional)</label>
                <input
                  type="text"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({...formData, projectCode: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setFormData({...formData, status: 'draft'})}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  onClick={() => setFormData({...formData, status: 'submitted'})}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
