import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useFilteredEmployees } from '../hooks/useFilteredFirestore';
import OfficialLetterGenerator from './OfficialLetterGenerator';
import { 
  TrendingUp, Plus, Search, Filter, FileText, CheckCircle, 
  XCircle, Clock, ChevronDown, ChevronRight, Printer, Eye 
} from 'lucide-react';

/**
 * Promotion & Salary Increase Module
 * 
 * Workflow: HOD → HRM → GM
 * - HOD raises promotion/salary increase request
 * - HRM validates with comments and approves/rejects
 * - GM reviews and approves/rejects
 * - Generates official letter with company letterhead when approved
 */

const WORKFLOW_STAGES = [
  { key: 'hod_review', label: 'HOD Review', role: 'dept_head' },
  { key: 'hrm_review', label: 'HRM Validation', role: 'hrm' },
  { key: 'gm_review', label: 'GM Approval', role: 'gm' }
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending_hod: 'bg-yellow-100 text-yellow-800',
  pending_hrm: 'bg-blue-100 text-blue-800',
  pending_gm: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function PromotionManagement() {
  const { userData, hasAccess } = useAuth();
  const { companyId } = useCompany();
  const { employees } = useFilteredEmployees();
  
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'promotion',
    proposedPosition: '',
    proposedDepartment: '',
    effectiveDate: '',
    basic: '',
    housingAllowance: '',
    transportAllowance: '',
    otherAllowances: '',
    reason: '',
    achievements: '',
    performanceRating: ''
  });

  // Fetch promotions
  useEffect(() => {
    if (!companyId) return;
    
    const q = query(
      collection(db, 'promotions'),
      where('companyId', '==', companyId),
      orderBy('raisedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromotions(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyId]);

  // Filter promotions based on user role
  const filteredPromotions = promotions.filter(promo => {
    // Search filter
    const matchesSearch = 
      (promo.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promo.proposedPosition || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promo.currentDepartment || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || promo.status === filterStatus;
    
    // Role-based visibility
    const userRole = userData?.role;
    const userDept = userData?.department;
    
    if (userRole === 'superadmin' || userRole === 'gm' || userRole === 'hrm') {
      return matchesSearch && matchesStatus;
    }
    
    if (userRole === 'dept_head') {
      // Dept Head sees only their department's requests
      return matchesSearch && matchesStatus && promo.currentDepartment === userDept;
    }
    
    // Staff sees only their own
    return matchesSearch && matchesStatus && promo.employeeId === userData?.uid;
  });

  const canCreatePromotion = () => {
    return hasAccess('promotion', 'create') || userData?.role === 'dept_head';
  };

  const canApproveStage = (promo, stage) => {
    const userRole = userData?.role;
    
    if (promo.status === 'approved' || promo.status === 'rejected') return false;
    
    if (stage === 'hod_review') {
      return userRole === 'dept_head' && promo.currentDepartment === userData?.department;
    }
    if (stage === 'hrm_review') {
      return userRole === 'hrm' && promo.status === 'pending_hrm';
    }
    if (stage === 'gm_review') {
      return (userRole === 'gm' || userRole === 'superadmin') && promo.status === 'pending_gm';
    }
    
    return false;
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    
    // Validate userData is loaded
    if (!userData?.uid) {
      alert('Error: User data not loaded. Please refresh the page and try again.');
      return;
    }
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    const basic = parseFloat(formData.basic) || 0;
    const housing = parseFloat(formData.housingAllowance) || 0;
    const transport = parseFloat(formData.transportAllowance) || 0;
    const other = parseFloat(formData.otherAllowances) || 0;
    const proposedTotal = basic + housing + transport + other;
    
    const currentTotal = employee.salary?.basic + employee.salary?.housingAllowance + 
                        employee.salary?.transportAllowance + employee.salary?.otherAllowances || 0;
    
    const increaseAmount = proposedTotal - currentTotal;
    const increasePercentage = currentTotal > 0 ? ((increaseAmount / currentTotal) * 100).toFixed(2) : 0;

    const newPromotion = {
      // Employee Info
      employeeId: formData.employeeId,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || 'N/A',
      currentDepartment: employee.department,
      currentPosition: employee.position,
      
      // Current Salary
      currentSalary: {
        basic: employee.salary?.basic || 0,
        housingAllowance: employee.salary?.housingAllowance || 0,
        transportAllowance: employee.salary?.transportAllowance || 0,
        otherAllowances: employee.salary?.otherAllowances || 0,
        total: currentTotal
      },
      
      // Proposed Changes
      type: formData.type,
      proposedDepartment: formData.proposedDepartment || employee.department,
      proposedPosition: formData.proposedPosition,
      effectiveDate: formData.effectiveDate,
      
      // Proposed Salary
      proposedSalary: {
        basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        total: proposedTotal,
        increaseAmount,
        increasePercentage
      },
      
      // Justification
      reason: formData.reason,
      achievements: formData.achievements,
      performanceRating: formData.performanceRating,
      
      // Workflow
      workflow: {
        currentStage: 'hod_review',
        stages: WORKFLOW_STAGES.map(stage => ({
          stage: stage.key,
          status: 'pending',
          approverId: null,
          approverName: null,
          approverRole: stage.role,
          date: null,
          comments: null,
          validationNotes: null,
          action: null
        }))
      },
      
      // Status
      status: 'pending_hod',
      
      // Audit
      raisedBy: userData?.uid,
      raisedByName: userData?.name || 'Unknown',
      raisedByRole: userData?.role || 'staff',
      raisedAt: new Date().toISOString(),
      companyId: companyId || 'sunisland-resort-and-spa',
      
      // Document
      letterGenerated: false,
      letterUrl: null,
      letterDate: null,
      signedByEmployee: false,
      employeeSignatureDate: null
    };

    await addDoc(collection(db, 'promotions'), newPromotion);
    setShowCreateModal(false);
    setFormData({
      employeeId: '',
      type: 'promotion',
      proposedPosition: '',
      proposedDepartment: '',
      effectiveDate: '',
      basic: '',
      housingAllowance: '',
      transportAllowance: '',
      otherAllowances: '',
      reason: '',
      achievements: '',
      performanceRating: ''
    });
  };

  const handleApprovalAction = async (promoId, stage, action, comments = '') => {
    const promo = promotions.find(p => p.id === promoId);
    if (!promo) return;

    const updatedStages = [...promo.workflow.stages];
    const stageIndex = updatedStages.findIndex(s => s.stage === stage);
    
    if (stageIndex === -1) return;

    updatedStages[stageIndex] = {
      ...updatedStages[stageIndex],
      status: action === 'approved' ? 'approved' : 'rejected',
      approverId: userData?.uid,
      approverName: userData?.name || 'Unknown',
      approverRole: userData?.role || 'staff',
      date: new Date().toISOString(),
      comments,
      validationNotes: stage === 'hrm_review' ? comments : null,
      action
    };

    let newStatus = promo.status || 'pending';
    let newStage = promo.workflow?.currentStage || 'pending';

    if (action === 'rejected') {
      newStatus = 'rejected';
    } else if (action === 'approved') {
      if (stage === 'hod_review') {
        newStatus = 'pending_hrm';
        newStage = 'hrm_review';
      } else if (stage === 'hrm_review') {
        newStatus = 'pending_gm';
        newStage = 'gm_review';
      } else if (stage === 'gm_review') {
        newStatus = 'approved';
        newStage = 'approved';
      }
    }

    await updateDoc(doc(db, 'promotions', promoId), {
      'workflow.stages': updatedStages,
      'workflow.currentStage': newStage,
      status: newStatus,
      ...(action === 'approved' && stage === 'gm_review' ? {
        letterGenerated: false // Will be generated on view
      } : {})
    });
  };

  const generateLetterData = (promo) => ({
    documentType: 'promotion',
    documentNumber: `PRO-${new Date().getFullYear()}-${promo.id.slice(-4)}`,
    date: new Date().toLocaleDateString(),
    employeeName: promo.employeeName,
    employeeCode: promo.employeeCode,
    department: promo.currentDepartment,
    position: promo.currentPosition,
    currentPosition: promo.currentPosition,
    currentDepartment: promo.currentDepartment,
    currentSalary: promo.currentSalary,
    proposedPosition: promo.proposedPosition,
    proposedDepartment: promo.proposedDepartment,
    proposedSalary: promo.proposedSalary,
    effectiveDate: promo.effectiveDate,
    reason: promo.reason,
    performanceRating: promo.performanceRating,
    status: promo.status,
    workflow: promo.workflow
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promotions & Salary Increases</h2>
          <p className="text-gray-600">Manage employee promotions and salary adjustments</p>
        </div>
        {canCreatePromotion() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Request Promotion
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name, position, or department..."
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
          <option value="pending_hod">Pending HOD</option>
          <option value="pending_hrm">Pending HRM</option>
          <option value="pending_gm">Pending GM</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current → Proposed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary Change</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No promotion requests found
                </td>
              </tr>
            ) : (
              filteredPromotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{promo.employeeName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{promo.employeeCode || promo.employeeId || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize">{promo.type?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-500">{promo.currentPosition}</div>
                      <ChevronRight className="h-4 w-4 text-gray-400 inline" />
                      <div className="font-medium">{promo.proposedPosition}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-500">${promo.currentSalary?.total?.toLocaleString()}</div>
                      <ChevronRight className="h-4 w-4 text-gray-400 inline" />
                      <div className="font-medium text-green-600">
                        ${promo.proposedSalary?.total?.toLocaleString()}
                        <span className="text-xs ml-1">(+{promo.proposedSalary?.increasePercentage}%)</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[promo.status] || 'bg-gray-100'}`}>
                      {promo.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedPromotion(promo); setShowDetailModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {promo.status === 'approved' && (
                        <button
                          onClick={() => { setSelectedPromotion(promo); setShowLetterPreview(true); }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="View Letter"
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Request Promotion/Salary Increase</h3>
            </div>
            <form onSubmit={handleCreatePromotion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => {
                    const emp = employees.find(emp => emp.id === e.target.value);
                    setFormData({
                      ...formData,
                      employeeId: e.target.value,
                      proposedDepartment: emp?.['Department '] || emp?.Department || emp?.department || '',
                      proposedPosition: emp?.Designation || emp?.position || ''
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.FullName || emp.name || 'N/A'} - {emp.Designation || emp.position || 'N/A'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Request Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="promotion">Position Promotion</option>
                  <option value="salary_increase">Salary Increase Only</option>
                  <option value="position_change">Department Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Position</label>
                  <input
                    type="text"
                    value={formData.proposedPosition}
                    onChange={(e) => setFormData({...formData, proposedPosition: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Senior Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Department</label>
                  <select
                    value={formData.proposedDepartment}
                    onChange={(e) => setFormData({...formData, proposedDepartment: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Department...</option>
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="IT">IT</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Proposed Salary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Basic Salary</label>
                    <input
                      type="number"
                      value={formData.basic}
                      onChange={(e) => setFormData({...formData, basic: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Housing Allowance</label>
                    <input
                      type="number"
                      value={formData.housingAllowance}
                      onChange={(e) => setFormData({...formData, housingAllowance: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Transport Allowance</label>
                    <input
                      type="number"
                      value={formData.transportAllowance}
                      onChange={(e) => setFormData({...formData, transportAllowance: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Other Allowances</label>
                    <input
                      type="number"
                      value={formData.otherAllowances}
                      onChange={(e) => setFormData({...formData, otherAllowances: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Justification/Reason *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Explain the reason for this promotion/salary increase..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Employee Achievements</label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="List key achievements supporting this request..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Performance Rating</label>
                <select
                  value={formData.performanceRating}
                  onChange={(e) => setFormData({...formData, performanceRating: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Rating...</option>
                  <option value="exceptional">Exceptional</option>
                  <option value="exceeds_expectations">Exceeds Expectations</option>
                  <option value="meets_expectations">Meets Expectations</option>
                  <option value="needs_improvement">Needs Improvement</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Request
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
      {showDetailModal && selectedPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Promotion Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Employee</div>
                  <div className="font-medium">{selectedPromotion.employeeName}</div>
                  <div className="text-sm text-gray-500">{selectedPromotion.employeeCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Request Type</div>
                  <div className="font-medium capitalize">{selectedPromotion.type?.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Position Change */}
              <div>
                <h4 className="font-medium mb-3">Position Changes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border p-3 rounded">
                    <div className="text-sm text-gray-500">Current</div>
                    <div className="font-medium">{selectedPromotion.currentPosition}</div>
                    <div className="text-sm text-gray-500">{selectedPromotion.currentDepartment}</div>
                  </div>
                  <div className="border p-3 rounded bg-blue-50">
                    <div className="text-sm text-gray-500">Proposed</div>
                    <div className="font-medium">{selectedPromotion.proposedPosition}</div>
                    <div className="text-sm text-gray-500">{selectedPromotion.proposedDepartment}</div>
                  </div>
                </div>
              </div>

              {/* Salary Change */}
              <div>
                <h4 className="font-medium mb-3">Salary Changes</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 border">Component</th>
                      <th className="text-right p-2 border">Current</th>
                      <th className="text-right p-2 border">Proposed</th>
                      <th className="text-right p-2 border">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border">Basic</td>
                      <td className="text-right p-2 border">${selectedPromotion.currentSalary?.basic?.toLocaleString()}</td>
                      <td className="text-right p-2 border">${selectedPromotion.proposedSalary?.basic?.toLocaleString()}</td>
                      <td className="text-right p-2 border text-green-600">
                        +${(selectedPromotion.proposedSalary?.basic - selectedPromotion.currentSalary?.basic)?.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border">Housing</td>
                      <td className="text-right p-2 border">${selectedPromotion.currentSalary?.housingAllowance?.toLocaleString()}</td>
                      <td className="text-right p-2 border">${selectedPromotion.proposedSalary?.housingAllowance?.toLocaleString()}</td>
                      <td className="text-right p-2 border text-green-600">
                        +${(selectedPromotion.proposedSalary?.housingAllowance - selectedPromotion.currentSalary?.housingAllowance)?.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border">Transport</td>
                      <td className="text-right p-2 border">${selectedPromotion.currentSalary?.transportAllowance?.toLocaleString()}</td>
                      <td className="text-right p-2 border">${selectedPromotion.proposedSalary?.transportAllowance?.toLocaleString()}</td>
                      <td className="text-right p-2 border text-green-600">
                        +${(selectedPromotion.proposedSalary?.transportAllowance - selectedPromotion.currentSalary?.transportAllowance)?.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="font-bold bg-gray-50">
                      <td className="p-2 border">Total</td>
                      <td className="text-right p-2 border">${selectedPromotion.currentSalary?.total?.toLocaleString()}</td>
                      <td className="text-right p-2 border">${selectedPromotion.proposedSalary?.total?.toLocaleString()}</td>
                      <td className="text-right p-2 border text-green-600">
                        +${selectedPromotion.proposedSalary?.increaseAmount?.toLocaleString()} ({selectedPromotion.proposedSalary?.increasePercentage}%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Justification */}
              <div>
                <h4 className="font-medium mb-2">Justification</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedPromotion.reason}</p>
                {selectedPromotion.achievements && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-500">Key Achievements:</div>
                    <p className="text-gray-700 mt-1">{selectedPromotion.achievements}</p>
                  </div>
                )}
              </div>

              {/* Approval Workflow */}
              <div>
                <h4 className="font-medium mb-3">Approval Workflow</h4>
                <div className="space-y-3">
                  {selectedPromotion.workflow?.stages?.map((stage, index) => (
                    <div key={stage.stage} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        stage.status === 'approved' ? 'bg-green-100 text-green-600' :
                        stage.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        index === WORKFLOW_STAGES.findIndex(s => s.key === selectedPromotion.workflow.currentStage) 
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
                            {stage.stage === 'hrm_review' && stage.validationNotes && (
                              <div className="text-xs text-blue-600 font-medium mb-1">HRM Validation Notes:</div>
                            )}
                            {stage.comments}
                          </div>
                        )}
                        
                        {/* Approval Actions */}
                        {canApproveStage(selectedPromotion, stage.stage) && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                const comments = prompt('Enter approval comments (optional):');
                                if (comments !== null) {
                                  handleApprovalAction(selectedPromotion.id, stage.stage, 'approved', comments);
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
                                  handleApprovalAction(selectedPromotion.id, stage.stage, 'rejected', comments);
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
              {selectedPromotion.status === 'approved' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLetterPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Printer className="h-4 w-4" />
                    Print Official Letter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Letter Preview */}
      {showLetterPreview && selectedPromotion && (
        <OfficialLetterGenerator
          isOpen={showLetterPreview}
          onClose={() => setShowLetterPreview(false)}
          documentType="promotion"
          documentData={generateLetterData(selectedPromotion)}
        />
      )}
    </div>
  );
}
