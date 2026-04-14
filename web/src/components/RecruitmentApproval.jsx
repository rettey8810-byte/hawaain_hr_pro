import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import OfficialLetterGenerator from './OfficialLetterGenerator';
import { 
  Users, Plus, Search, Filter, FileText, CheckCircle, 
  XCircle, Eye, Printer, UserPlus 
} from 'lucide-react';

/**
 * Recruitment Approval Module
 * 
 * Workflow: HOD → HRM → GM
 * - HOD raises recruitment requisition
 * - HRM validates (budget, position requirements) and approves/rejects
 * - GM reviews and approves/rejects
 * - Generates official recruitment form when approved
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
  rejected: 'bg-red-100 text-red-800',
  filled: 'bg-emerald-100 text-emerald-800'
};

const POSITION_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' }
];

const HIRING_REASONS = [
  { value: 'new_position', label: 'New Position' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'expansion', label: 'Business Expansion' },
  { value: 'promotion_backfill', label: 'Promotion Backfill' },
  { value: 'temporary', label: 'Temporary/Cover' }
];

const URGENCY_LEVELS = [
  { value: 'immediate', label: 'Immediate (Within 1 week)' },
  { value: 'within_month', label: 'Within 1 month' },
  { value: 'planned', label: 'Planned (1-3 months)' }
];

export default function RecruitmentApproval() {
  const { user, userData, hasAccess } = useAuth();
  const { companyId } = useCompany();
  
  const [requisitions, setRequisitions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    department: '',
    position: '',
    positionLevel: 'entry',
    numberOfPositions: 1,
    jobDescription: '',
    qualifications: '',
    experienceRequired: '',
    skillsRequired: '',
    salaryMin: '',
    salaryMax: '',
    reasonForHiring: '',
    replacementFor: '',
    urgency: 'within_month',
    proposedStartDate: '',
    budgetApproved: false,
    budgetCode: '',
    justification: ''
  });

  // Fetch requisitions and employees
  useEffect(() => {
    if (!companyId) return;
    
    // Fetch requisitions
    const q = query(
      collection(db, 'recruitmentApprovals'),
      where('companyId', '==', companyId),
      orderBy('raisedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequisitions(data);
      setLoading(false);
    });

    // Fetch employees for department dropdown
    const employeesQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId)
    );
    
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(data);
    });

    // Fetch divisions for budget codes
    const divisionsQuery = query(
      collection(db, 'divisions'),
      where('companyId', '==', companyId)
    );

    const unsubscribeDivisions = onSnapshot(divisionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDivisions(data);
    });
    
    return () => {
      unsubscribe();
      unsubscribeEmployees();
      unsubscribeDivisions();
    };
  }, [companyId]);

  // Get unique departments from employee data
  const departments = [...new Set(employees.map(e => e['Department '] || e.Department || e.department).filter(Boolean))];

  // Get budget code for a department from divisions
  const getBudgetCodeForDepartment = (deptName) => {
    const division = divisions.find(d => d.name === deptName);
    return division?.budgetCode || '';
  };

  // Filter requisitions
  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = 
      req.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.raisedByName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    
    const userRole = userData?.role;
    const userDept = userData?.department;
    
    if (userRole === 'superadmin' || userRole === 'gm' || userRole === 'hrm') {
      return matchesSearch && matchesStatus;
    }
    
    if (userRole === 'dept_head') {
      return matchesSearch && matchesStatus && req.department === userDept;
    }
    
    return matchesSearch && matchesStatus && req.raisedBy === user?.uid;
  });

  const canCreateRequisition = () => {
    return hasAccess('recruitment', 'create') || userData?.role === 'dept_head';
  };

  const canApproveStage = (req, stage) => {
    const userRole = userData?.role;
    
    if (req.status === 'approved' || req.status === 'rejected' || req.status === 'filled') return false;
    
    if (stage === 'hod_review') {
      return userRole === 'dept_head' && req.department === userData?.department && req.status === 'pending_hod';
    }
    if (stage === 'hrm_review') {
      return userRole === 'hrm' && req.status === 'pending_hrm';
    }
    if (stage === 'gm_review') {
      return (userRole === 'gm' || userRole === 'superadmin') && req.status === 'pending_gm';
    }
    
    return false;
  };

  const handleCreateRequisition = async (e) => {
    e.preventDefault();

    // Validate user is loaded
    if (!user?.uid || !userData) {
      alert('Error: User data not loaded. Please refresh the page and try again.');
      return;
    }

    const newRequisition = {
      department: formData.department,
      position: formData.position,
      positionLevel: formData.positionLevel,
      numberOfPositions: parseInt(formData.numberOfPositions) || 1,
      
      jobDescription: formData.jobDescription,
      qualifications: formData.qualifications,
      experienceRequired: formData.experienceRequired,
      skillsRequired: formData.skillsRequired,
      
      salaryRange: {
        min: parseFloat(formData.salaryMin) || 0,
        max: parseFloat(formData.salaryMax) || 0,
        currency: 'USD'
      },
      
      reasonForHiring: formData.reasonForHiring,
      replacementFor: formData.replacementFor || null,
      urgency: formData.urgency,
      proposedStartDate: formData.proposedStartDate,
      
      budgetApproved: formData.budgetApproved,
      budgetCode: formData.budgetCode || null,
      justification: formData.justification,
      
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
          budgetValidation: null,
          action: null
        }))
      },
      
      status: 'pending_hod',
      
      raisedBy: user?.uid,
      raisedByName: userData?.name,
      raisedByRole: userData?.role,
      raisedAt: new Date().toISOString(),
      companyId,
      
      formGenerated: false,
      formUrl: null,
      formDate: null,
      
      // Hiring progress
      hiringProgress: {
        status: 'open',
        applications: 0,
        interviews: 0,
        shortlisted: 0,
        hired: 0,
        hiredDate: null,
        hiredEmployeeId: null
      }
    };

    await addDoc(collection(db, 'recruitmentApprovals'), newRequisition);
    setShowCreateModal(false);
    setFormData({
      department: '',
      position: '',
      positionLevel: 'entry',
      numberOfPositions: 1,
      jobDescription: '',
      qualifications: '',
      experienceRequired: '',
      skillsRequired: '',
      salaryMin: '',
      salaryMax: '',
      reasonForHiring: '',
      replacementFor: '',
      urgency: 'within_month',
      proposedStartDate: '',
      budgetApproved: false,
      budgetCode: '',
      justification: ''
    });
  };

  const handleApprovalAction = async (reqId, stage, action, comments = '') => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req) return;

    const updatedStages = [...req.workflow.stages];
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
      budgetValidation: stage === 'hrm_review' ? comments : null,
      action
    };

    let newStatus = req.status;
    let newStage = req.workflow.currentStage;

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

    await updateDoc(doc(db, 'recruitmentApprovals', reqId), {
      'workflow.stages': updatedStages,
      'workflow.currentStage': newStage,
      status: newStatus
    });
  };

  const handleMarkFilled = async (reqId, employeeId = null) => {
    await updateDoc(doc(db, 'recruitmentApprovals', reqId), {
      status: 'filled',
      'hiringProgress.status': 'filled',
      'hiringProgress.hiredDate': new Date().toISOString(),
      'hiringProgress.hiredEmployeeId': employeeId
    });
  };

  const generateLetterData = (req) => ({
    documentType: 'recruitment',
    documentNumber: `REC-${new Date().getFullYear()}-${req.id.slice(-4)}`,
    date: new Date().toLocaleDateString(),
    department: req.department,
    position: req.position,
    positionLevel: POSITION_LEVELS.find(l => l.value === req.positionLevel)?.label,
    numberOfPositions: req.numberOfPositions,
    jobDescription: req.jobDescription,
    qualifications: req.qualifications,
    experienceRequired: req.experienceRequired,
    skillsRequired: req.skillsRequired,
    salaryRange: req.salaryRange,
    reasonForHiring: HIRING_REASONS.find(r => r.value === req.reasonForHiring)?.label,
    replacementFor: req.replacementFor,
    urgency: URGENCY_LEVELS.find(u => u.value === req.urgency)?.label,
    proposedStartDate: req.proposedStartDate,
    budgetApproved: req.budgetApproved,
    budgetCode: req.budgetCode,
    justification: req.justification,
    status: req.status,
    workflow: req.workflow
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recruitment Approval</h2>
          </div>
          <p className="text-gray-600">Manage recruitment requisitions and approvals</p>
        </div>
        {canCreateRequisition() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Requisition
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by position, department, or requester..."
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
          <option value="filled">Filled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Requisitions List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[1000px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredRequisitions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No recruitment requisitions found
                </td>
              </tr>
            ) : (
              filteredRequisitions.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{req.position}</div>
                    <div className="text-sm text-gray-500">
                      ${req.salaryRange?.min?.toLocaleString()} - ${req.salaryRange?.max?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">{req.department}</td>
                  <td className="px-6 py-4">
                    {POSITION_LEVELS.find(l => l.value === req.positionLevel)?.label}
                  </td>
                  <td className="px-6 py-4">{req.numberOfPositions}</td>
                  <td className="px-6 py-4">
                    {HIRING_REASONS.find(r => r.value === req.reasonForHiring)?.label}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100'}`}>
                      {req.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedRequisition(req); setShowDetailModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(req.status === 'approved' || req.status === 'filled') && (
                        <button
                          onClick={() => { setSelectedRequisition(req); setShowLetterPreview(true); }}
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
            <div className="p-6 border-b bg-blue-50">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold">New Recruitment Requisition</h3>
              </div>
            </div>
            <form onSubmit={handleCreateRequisition} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => {
                      const dept = e.target.value;
                      const budgetCode = getBudgetCodeForDepartment(dept);
                      setFormData({...formData, department: dept, budgetCode});
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Position Level *</label>
                  <select
                    required
                    value={formData.positionLevel}
                    onChange={(e) => setFormData({...formData, positionLevel: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {POSITION_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Positions *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.numberOfPositions}
                    onChange={(e) => setFormData({...formData, numberOfPositions: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Description *</label>
                <textarea
                  required
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Describe the role, responsibilities, and key deliverables..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Required Qualifications *</label>
                  <textarea
                    required
                    value={formData.qualifications}
                    onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="Education, certifications, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience Required *</label>
                  <input
                    type="text"
                    required
                    value={formData.experienceRequired}
                    onChange={(e) => setFormData({...formData, experienceRequired: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 3-5 years"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Skills Required</label>
                <textarea
                  value={formData.skillsRequired}
                  onChange={(e) => setFormData({...formData, skillsRequired: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Technical skills, soft skills, etc."
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-green-700">Salary Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Salary</label>
                    <input
                      type="number"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({...formData, salaryMin: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Salary</label>
                    <input
                      type="number"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({...formData, salaryMax: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Hiring Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason for Hiring *</label>
                    <select
                      required
                      value={formData.reasonForHiring}
                      onChange={(e) => setFormData({...formData, reasonForHiring: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Reason...</option>
                      {HIRING_REASONS.map(reason => (
                        <option key={reason.value} value={reason.value}>{reason.label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.reasonForHiring === 'replacement' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Replacing (Employee Name)</label>
                      <input
                        type="text"
                        value={formData.replacementFor}
                        onChange={(e) => setFormData({...formData, replacementFor: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Name of departing employee"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Urgency *</label>
                    <select
                      required
                      value={formData.urgency}
                      onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {URGENCY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Proposed Start Date</label>
                    <input
                      type="date"
                      value={formData.proposedStartDate}
                      onChange={(e) => setFormData({...formData, proposedStartDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Budget Information</h4>
                <div className="flex items-start gap-4 flex-wrap">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.budgetApproved}
                      onChange={(e) => setFormData({...formData, budgetApproved: e.target.checked})}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Budget Approved</span>
                  </label>
                  {formData.budgetApproved && (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={formData.budgetCode}
                        onChange={(e) => setFormData({...formData, budgetCode: e.target.value})}
                        className="px-3 py-1 border rounded"
                        placeholder="Budget Code"
                      />
                      <span className="text-xs text-gray-500">
                        Budget code is auto-populated from Company Structure. If empty, add it in Settings → Company Structure → Department.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Justification</label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Additional justification for this hiring..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Requisition
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
      {showDetailModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center bg-blue-50">
              <h3 className="text-xl font-semibold">Recruitment Requisition Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Position Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedRequisition.position}</h4>
                    <p className="text-gray-600">{selectedRequisition.department}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {POSITION_LEVELS.find(l => l.value === selectedRequisition.positionLevel)?.label}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Positions:</span>
                    <span className="ml-2 font-medium">{selectedRequisition.numberOfPositions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Salary Range:</span>
                    <span className="ml-2 font-medium">
                      ${selectedRequisition.salaryRange?.min?.toLocaleString()} - ${selectedRequisition.salaryRange?.max?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Urgency:</span>
                    <span className="ml-2 font-medium">
                      {URGENCY_LEVELS.find(u => u.value === selectedRequisition.urgency)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div>
                <h4 className="font-medium mb-3">Job Details</h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Job Description</div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedRequisition.jobDescription}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Qualifications Required</div>
                      <p className="text-gray-700 text-sm">{selectedRequisition.qualifications}</p>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Experience Required</div>
                      <p className="text-gray-700 text-sm">{selectedRequisition.experienceRequired}</p>
                    </div>
                  </div>
                  {selectedRequisition.skillsRequired && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Skills Required</div>
                      <p className="text-gray-700 text-sm">{selectedRequisition.skillsRequired}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hiring Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Hiring Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Reason for Hiring:</span>
                    <p className="font-medium">
                      {HIRING_REASONS.find(r => r.value === selectedRequisition.reasonForHiring)?.label}
                    </p>
                  </div>
                  {selectedRequisition.replacementFor && (
                    <div>
                      <span className="text-gray-500">Replacing:</span>
                      <p className="font-medium">{selectedRequisition.replacementFor}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Proposed Start Date:</span>
                    <p className="font-medium">{selectedRequisition.proposedStartDate || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Budget Status:</span>
                    <p className="font-medium">
                      {selectedRequisition.budgetApproved ? (
                        <span className="text-green-600">Approved {selectedRequisition.budgetCode && `(${selectedRequisition.budgetCode})`}</span>
                      ) : (
                        <span className="text-yellow-600">Pending Approval</span>
                      )}
                    </p>
                  </div>
                </div>
                {selectedRequisition.justification && (
                  <div className="mt-3">
                    <span className="text-gray-500 text-sm">Justification:</span>
                    <p className="text-gray-700 text-sm mt-1">{selectedRequisition.justification}</p>
                  </div>
                )}
              </div>

              {/* Approval Workflow */}
              <div>
                <h4 className="font-medium mb-3">Approval Workflow</h4>
                <div className="space-y-3">
                  {selectedRequisition.workflow?.stages?.map((stage, index) => (
                    <div key={stage.stage} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        stage.status === 'approved' ? 'bg-green-100 text-green-600' :
                        stage.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        index === WORKFLOW_STAGES.findIndex(s => s.key === selectedRequisition.workflow.currentStage) 
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
                            {stage.stage === 'hrm_review' && stage.budgetValidation && (
                              <div className="text-xs text-blue-600 font-medium mb-1">Budget Validation:</div>
                            )}
                            {stage.comments}
                          </div>
                        )}
                        
                        {canApproveStage(selectedRequisition, stage.stage) && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                const comments = prompt('Enter approval comments (optional):');
                                if (comments !== null) {
                                  handleApprovalAction(selectedRequisition.id, stage.stage, 'approved', comments);
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
                                  handleApprovalAction(selectedRequisition.id, stage.stage, 'rejected', comments);
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

              {/* Hiring Progress (if approved) */}
              {selectedRequisition.status === 'approved' && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Hiring Progress</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedRequisition.hiringProgress?.applications || 0}
                      </div>
                      <div className="text-sm text-gray-600">Applications</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedRequisition.hiringProgress?.interviews || 0}
                      </div>
                      <div className="text-sm text-gray-600">Interviews</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedRequisition.hiringProgress?.shortlisted || 0}
                      </div>
                      <div className="text-sm text-gray-600">Shortlisted</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedRequisition.hiringProgress?.hired || 0}/{selectedRequisition.numberOfPositions}
                      </div>
                      <div className="text-sm text-gray-600">Hired</div>
                    </div>
                  </div>
                  
                  {selectedRequisition.hiringProgress?.hired < selectedRequisition.numberOfPositions && (
                    <button
                      onClick={() => handleMarkFilled(selectedRequisition.id)}
                      className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Mark as Filled
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              {(selectedRequisition.status === 'approved' || selectedRequisition.status === 'filled') && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLetterPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Printer className="h-4 w-4" />
                    Print Form
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Letter Preview */}
      {showLetterPreview && selectedRequisition && (
        <OfficialLetterGenerator
          isOpen={showLetterPreview}
          onClose={() => setShowLetterPreview(false)}
          documentType="recruitment"
          documentData={generateLetterData(selectedRequisition)}
        />
      )}
    </div>
  );
}
