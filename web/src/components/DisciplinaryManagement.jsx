import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useFilteredEmployees } from '../hooks/useFilteredFirestore';
import OfficialLetterGenerator from './OfficialLetterGenerator';
import { 
  AlertTriangle, Plus, Search, Filter, FileText, CheckCircle, 
  XCircle, Clock, Eye, Printer, Shield 
} from 'lucide-react';

/**
 * Disciplinary Action Module
 * 
 * Workflow: HOD → HRM → GM
 * - HOD raises disciplinary action
 * - HRM validates with comments and approves/rejects
 * - GM reviews and approves/rejects
 * - Generates official disciplinary letter when approved
 * - Employee must acknowledge receipt
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
  approved: 'bg-red-100 text-red-800',
  rejected: 'bg-green-100 text-green-800'
};

const VIOLATION_TYPES = [
  { value: 'misconduct', label: 'General Misconduct' },
  { value: 'attendance', label: 'Attendance Violation' },
  { value: 'performance', label: 'Performance Issue' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'insubordination', label: 'Insubordination' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'theft', label: 'Theft/Fraud' },
  { value: 'safety', label: 'Safety Violation' },
  { value: 'other', label: 'Other' }
];

const DISCIPLINARY_ACTIONS = [
  { value: 'verbal_warning', label: 'Verbal Warning', severity: 'minor' },
  { value: 'written_warning', label: 'Written Warning', severity: 'minor' },
  { value: 'final_warning', label: 'Final Written Warning', severity: 'major' },
  { value: 'suspension', label: 'Suspension Without Pay', severity: 'major' },
  { value: 'demotion', label: 'Demotion', severity: 'serious' },
  { value: 'termination', label: 'Termination', severity: 'serious' }
];

export default function DisciplinaryManagement() {
  const { userData, hasAccess } = useAuth();
  const { companyId } = useCompany();
  const { employees } = useFilteredEmployees();
  
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    incidentDate: '',
    incidentLocation: '',
    incidentDescription: '',
    violationType: '',
    policyViolated: '',
    witnesses: '',
    severity: 'minor',
    proposedAction: 'verbal_warning',
    suspensionDays: 0,
    actionEffectiveDate: '',
    improvementPlan: '',
    previousWarnings: 0
  });

  // Fetch disciplinary actions
  useEffect(() => {
    if (!companyId) return;
    
    const q = query(
      collection(db, 'disciplinaryActions'),
      where('companyId', '==', companyId),
      orderBy('reportedDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActions(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyId]);

  // Filter actions based on user role
  const filteredActions = actions.filter(action => {
    const matchesSearch = 
      action.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.violationType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || action.status === filterStatus;
    
    const userRole = userData?.role;
    const userDept = userData?.department;
    
    if (userRole === 'superadmin' || userRole === 'gm' || userRole === 'hrm') {
      return matchesSearch && matchesStatus;
    }
    
    if (userRole === 'dept_head') {
      return matchesSearch && matchesStatus && action.department === userDept;
    }
    
    return matchesSearch && matchesStatus && action.employeeId === userData?.uid;
  });

  const canCreateAction = () => {
    return hasAccess('disciplinary', 'create') || userData?.role === 'dept_head';
  };

  const canApproveStage = (action, stage) => {
    const userRole = userData?.role;
    
    if (action.status === 'approved' || action.status === 'rejected') return false;
    
    if (stage === 'hod_review') {
      return userRole === 'dept_head' && action.department === userData?.department;
    }
    if (stage === 'hrm_review') {
      return userRole === 'hrm' && action.status === 'pending_hrm';
    }
    if (stage === 'gm_review') {
      return (userRole === 'gm' || userRole === 'superadmin') && action.status === 'pending_gm';
    }
    
    return false;
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    
    // Validate userData is loaded
    if (!userData?.uid) {
      alert('Error: User data not loaded. Please refresh the page and try again.');
      return;
    }
    
    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    const newAction = {
      employeeId: formData.employeeId,
      employeeName: employee.FullName || employee.name || 'N/A',
      employeeCode: employee.EmpID || employee.employeeCode || 'N/A',
      department: employee['Department '] || employee.Department || employee.department || 'N/A',
      position: employee.Designation || employee.position || 'N/A',
      
      incidentDate: formData.incidentDate,
      reportedDate: new Date().toISOString(),
      incidentLocation: formData.incidentLocation,
      incidentDescription: formData.incidentDescription,
      
      violationType: formData.violationType,
      policyViolated: formData.policyViolated,
      witnesses: formData.witnesses,
      severity: formData.severity,
      
      previousWarnings: parseInt(formData.previousWarnings) || 0,
      
      proposedAction: formData.proposedAction,
      suspensionDays: formData.proposedAction === 'suspension' ? parseInt(formData.suspensionDays) || 0 : 0,
      actionEffectiveDate: formData.actionEffectiveDate,
      improvementPlan: formData.improvementPlan,
      
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
      
      status: 'pending_hod',
      
      raisedBy: userData?.uid,
      raisedByName: userData?.name || 'Unknown',
      raisedByRole: userData?.role || 'staff',
      raisedAt: new Date().toISOString(),
      companyId: companyId || 'sunisland-resort-and-spa',
      
      letterGenerated: false,
      letterUrl: null,
      letterDate: null,
      signedByEmployee: false,
      signedByGM: false,
      signedByHRM: false,
      employeeAcknowledged: false,
      employeeAcknowledgmentDate: null,
      employeeComments: null
    };

    await addDoc(collection(db, 'disciplinaryActions'), newAction);
    setShowCreateModal(false);
    setFormData({
      employeeId: '',
      incidentDate: '',
      incidentLocation: '',
      incidentDescription: '',
      violationType: '',
      policyViolated: '',
      witnesses: '',
      severity: 'minor',
      proposedAction: 'verbal_warning',
      suspensionDays: 0,
      actionEffectiveDate: '',
      improvementPlan: '',
      previousWarnings: 0
    });
  };

  const handleApprovalAction = async (actionId, stage, action, comments = '') => {
    const actionItem = actions.find(a => a.id === actionId);
    if (!actionItem) return;

    const updatedStages = [...actionItem.workflow.stages];
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

    let newStatus = actionItem.status || 'pending';
    let newStage = actionItem.workflow?.currentStage || 'pending';

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

    await updateDoc(doc(db, 'disciplinaryActions', actionId), {
      'workflow.stages': updatedStages,
      'workflow.currentStage': newStage,
      status: newStatus
    });
  };

  const handleEmployeeAcknowledgment = async (actionId, acknowledged, comments = '') => {
    await updateDoc(doc(db, 'disciplinaryActions', actionId), {
      employeeAcknowledged: acknowledged,
      employeeAcknowledgmentDate: acknowledged ? new Date().toISOString() : null,
      employeeComments: comments
    });
  };

  const generateLetterData = (action) => ({
    documentType: 'disciplinary',
    documentNumber: `DIS-${new Date().getFullYear()}-${action.id.slice(-4)}`,
    date: new Date().toLocaleDateString(),
    employeeName: action.employeeName,
    employeeCode: action.employeeCode,
    department: action.department,
    position: action.position,
    incidentDate: action.incidentDate,
    incidentLocation: action.incidentLocation,
    violationType: VIOLATION_TYPES.find(v => v.value === action.violationType)?.label,
    severity: action.severity,
    incidentDescription: action.incidentDescription,
    policyViolated: action.policyViolated,
    proposedAction: DISCIPLINARY_ACTIONS.find(a => a.value === action.proposedAction)?.label,
    suspensionDays: action.suspensionDays,
    actionEffectiveDate: action.actionEffectiveDate,
    improvementPlan: action.improvementPlan,
    previousWarnings: action.previousWarnings,
    status: action.status,
    workflow: action.workflow
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'serious': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Disciplinary Actions</h2>
          </div>
          <p className="text-gray-600">Manage employee disciplinary records and warnings</p>
        </div>
        {canCreateAction() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="h-5 w-5" />
            New Disciplinary Action
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name, violation type, or department..."
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

      {/* Actions List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredActions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No disciplinary actions found
                </td>
              </tr>
            ) : (
              filteredActions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{action.employeeName}</div>
                    <div className="text-sm text-gray-500">{action.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{VIOLATION_TYPES.find(v => v.value === action.violationType)?.label}</div>
                    <div className="text-sm text-gray-500">{action.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(action.severity)}`}>
                      {action.severity?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-red-600">
                      {DISCIPLINARY_ACTIONS.find(a => a.value === action.proposedAction)?.label}
                    </span>
                    {action.suspensionDays > 0 && (
                      <div className="text-sm text-gray-500">{action.suspensionDays} days</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[action.status] || 'bg-gray-100'}`}>
                      {action.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    {action.employeeAcknowledged && (
                      <div className="text-xs text-green-600 mt-1">✓ Acknowledged</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedAction(action); setShowDetailModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {action.status === 'approved' && (
                        <button
                          onClick={() => { setSelectedAction(action); setShowLetterPreview(true); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
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
            <div className="p-6 border-b bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-xl font-semibold">New Disciplinary Action</h3>
              </div>
              <p className="text-red-600 text-sm mt-1">This action will be recorded in the employee's permanent file.</p>
            </div>
            <form onSubmit={handleCreateAction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.FullName || emp.name || 'N/A'} - {emp.Designation || emp.position || 'N/A'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Incident Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({...formData, incidentDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.incidentLocation}
                    onChange={(e) => setFormData({...formData, incidentLocation: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Where did the incident occur?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Violation Type *</label>
                <select
                  required
                  value={formData.violationType}
                  onChange={(e) => setFormData({...formData, violationType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Violation Type...</option>
                  {VIOLATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Incident Description *</label>
                <textarea
                  required
                  value={formData.incidentDescription}
                  onChange={(e) => setFormData({...formData, incidentDescription: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="4"
                  placeholder="Provide detailed description of the incident..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Policy Violated</label>
                <input
                  type="text"
                  value={formData.policyViolated}
                  onChange={(e) => setFormData({...formData, policyViolated: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Code of Conduct Section 4.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Witnesses (if any)</label>
                <input
                  type="text"
                  value={formData.witnesses}
                  onChange={(e) => setFormData({...formData, witnesses: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Names of witnesses"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Severity Level *</label>
                  <select
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="serious">Serious</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Previous Warnings</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.previousWarnings}
                    onChange={(e) => setFormData({...formData, previousWarnings: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-red-600">Proposed Disciplinary Action</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Action Type *</label>
                    <select
                      required
                      value={formData.proposedAction}
                      onChange={(e) => setFormData({...formData, proposedAction: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {DISCIPLINARY_ACTIONS.map(action => (
                        <option key={action.value} value={action.value}>{action.label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.proposedAction === 'suspension' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Suspension Days *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.suspensionDays}
                        onChange={(e) => setFormData({...formData, suspensionDays: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.actionEffectiveDate}
                    onChange={(e) => setFormData({...formData, actionEffectiveDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Required Improvements *</label>
                  <textarea
                    required
                    value={formData.improvementPlan}
                    onChange={(e) => setFormData({...formData, improvementPlan: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    placeholder="What improvements are expected from the employee?"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Submit Disciplinary Action
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
      {showDetailModal && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-xl font-semibold">Disciplinary Action Details</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-red-100 rounded"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Employee</div>
                  <div className="font-medium">{selectedAction.employeeName || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{selectedAction.employeeCode || selectedAction.employeeId || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Department/Position</div>
                  <div className="font-medium">{selectedAction.department || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{selectedAction.position || 'N/A'}</div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Incident Details
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Date of Incident</div>
                    <div className="font-medium">{selectedAction.incidentDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-medium">{selectedAction.incidentLocation}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Violation Type</div>
                    <div className="font-medium">{VIOLATION_TYPES.find(v => v.value === selectedAction.violationType)?.label}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Severity</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedAction.severity)}`}>
                      {selectedAction.severity?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Description</div>
                  <p className="mt-1 text-gray-700 bg-white p-3 rounded border">{selectedAction.incidentDescription}</p>
                </div>
                {selectedAction.policyViolated && (
                  <div>
                    <div className="text-sm text-gray-500">Policy Violated</div>
                    <div className="font-medium">{selectedAction.policyViolated}</div>
                  </div>
                )}
              </div>

              {/* Proposed Action */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-red-700">Disciplinary Action</h4>
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {DISCIPLINARY_ACTIONS.find(a => a.value === selectedAction.proposedAction)?.label}
                </div>
                {selectedAction.suspensionDays > 0 && (
                  <div className="text-lg">
                    Duration: <strong>{selectedAction.suspensionDays} days</strong>
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-sm text-gray-600">Effective Date</div>
                  <div className="font-medium">{selectedAction.actionEffectiveDate}</div>
                </div>
                <div className="mt-3">
                  <div className="text-sm text-gray-600">Previous Warnings</div>
                  <div className="font-medium">{selectedAction.previousWarnings}</div>
                </div>
              </div>

              {/* Improvement Plan */}
              <div>
                <h4 className="font-medium mb-2">Required Improvements</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedAction.improvementPlan}</p>
              </div>

              {/* Approval Workflow */}
              <div>
                <h4 className="font-medium mb-3">Approval Workflow</h4>
                <div className="space-y-3">
                  {selectedAction.workflow?.stages?.map((stage, index) => (
                    <div key={stage.stage} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        stage.status === 'approved' ? 'bg-green-100 text-green-600' :
                        stage.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        index === WORKFLOW_STAGES.findIndex(s => s.key === selectedAction.workflow.currentStage) 
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
                              <div className="text-xs text-blue-600 font-medium mb-1">HRM Validation:</div>
                            )}
                            {stage.comments}
                          </div>
                        )}
                        
                        {canApproveStage(selectedAction, stage.stage) && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                const comments = prompt('Enter approval comments (optional):');
                                if (comments !== null) {
                                  handleApprovalAction(selectedAction.id, stage.stage, 'approved', comments);
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
                                  handleApprovalAction(selectedAction.id, stage.stage, 'rejected', comments);
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

              {/* Employee Acknowledgment */}
              {selectedAction.status === 'approved' && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Employee Acknowledgment</h4>
                  {selectedAction.employeeAcknowledged ? (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Acknowledged by Employee</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Date: {new Date(selectedAction.employeeAcknowledgmentDate).toLocaleString()}
                      </div>
                      {selectedAction.employeeComments && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Employee Comments:</span>
                          <p className="mt-1">{selectedAction.employeeComments}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-3">Employee has not yet acknowledged this disciplinary action.</p>
                      {selectedAction.employeeId === userData?.uid && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const comments = prompt('Enter any comments (optional):') || '';
                              handleEmployeeAcknowledgment(selectedAction.id, true, comments);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Acknowledge Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedAction.status === 'approved' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLetterPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
      {showLetterPreview && selectedAction && (
        <OfficialLetterGenerator
          isOpen={showLetterPreview}
          onClose={() => setShowLetterPreview(false)}
          documentType="disciplinary"
          documentData={generateLetterData(selectedAction)}
        />
      )}
    </div>
  );
}
