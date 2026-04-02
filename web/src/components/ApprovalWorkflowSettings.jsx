import { useState } from 'react';
import { 
  Settings, 
  UserCheck, 
  Users, 
  UserCog, 
  Building2, 
  Save, 
  Plus, 
  Trash2, 
  ArrowRight,
  CheckCircle,
  GripVertical
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';

const roleOptions = [
  { id: 'supervisor', label: 'Direct Supervisor', icon: UserCheck, description: 'Immediate manager' },
  { id: 'department_head', label: 'Department Head', icon: Users, description: 'Department manager' },
  { id: 'hr_manager', label: 'HR Manager', icon: UserCog, description: 'HR department' },
  { id: 'finance_manager', label: 'Finance Manager', icon: Building2, description: 'Finance approval' },
  { id: 'gm', label: 'General Manager', icon: Building2, description: 'Final authorization' },
];

const conditionOptions = [
  { id: 'all', label: 'All Requests', description: 'Every leave request' },
  { id: 'sick', label: 'Sick Leave Only', description: 'Medical/sick leave requests' },
  { id: 'annual', label: 'Annual Leave Only', description: 'Vacation/annual leave' },
  { id: 'emergency', label: 'Emergency Leave', description: 'Urgent/emergency requests' },
  { id: 'more_than_3_days', label: '> 3 Days', description: 'Requests longer than 3 days' },
  { id: 'more_than_7_days', label: '> 7 Days', description: 'Requests longer than 7 days' },
];

export default function ApprovalWorkflowSettings() {
  const { companyId } = useCompany();
  const { documents: workflows, addDocument, updateDocument, deleteDocument } = useFirestore('approvalWorkflows');
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition: 'all',
    steps: [{ role: 'supervisor', order: 1 }],
    isActive: true
  });

  const companyWorkflows = workflows.filter(w => w.companyId === companyId);

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { role: 'supervisor', order: prev.steps.length + 1 }]
    }));
  };

  const handleRemoveStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }))
    }));
  };

  const handleStepChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleMoveStep = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newSteps = [...formData.steps];
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
      setFormData(prev => ({ ...prev, steps: newSteps.map((s, i) => ({ ...s, order: i + 1 })) }));
    } else if (direction === 'down' && index < formData.steps.length - 1) {
      const newSteps = [...formData.steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      setFormData(prev => ({ ...prev, steps: newSteps.map((s, i) => ({ ...s, order: i + 1 })) }));
    }
  };

  const handleSave = async () => {
    const workflowData = {
      ...formData,
      companyId,
      updatedAt: new Date().toISOString()
    };

    if (selectedWorkflow) {
      await updateDocument(selectedWorkflow.id, workflowData);
    } else {
      await addDocument({
        ...workflowData,
        createdAt: new Date().toISOString()
      });
    }

    setIsEditing(false);
    setSelectedWorkflow(null);
    setFormData({
      name: '',
      description: '',
      condition: 'all',
      steps: [{ role: 'supervisor', order: 1 }],
      isActive: true
    });
  };

  const handleEdit = (workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      condition: workflow.condition || 'all',
      steps: workflow.steps || [{ role: 'supervisor', order: 1 }],
      isActive: workflow.isActive !== false
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setSelectedWorkflow(null);
    setFormData({
      name: '',
      description: '',
      condition: 'all',
      steps: [{ role: 'supervisor', order: 1 }],
      isActive: true
    });
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Approval Workflow Settings
            </h1>
            <p className="text-indigo-100 mt-1">Configure multi-level approval chains for leave requests</p>
          </div>
          <button
            onClick={handleNew}
            className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Workflow
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">
            {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
          </h2>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="e.g., Standard Leave Approval"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apply Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              >
                {conditionOptions.map(cond => (
                  <option key={cond.id} value={cond.id}>{cond.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              rows={2}
              placeholder="Brief description of this workflow..."
            />
          </div>

          {/* Approval Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Approval Steps</label>
              <button
                onClick={handleAddStep}
                className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:text-indigo-800"
              >
                <Plus className="h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {formData.steps.map((step, index) => {
                const role = roleOptions.find(r => r.id === step.role);
                const Icon = role?.icon || UserCheck;
                
                return (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === formData.steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <select
                        value={step.role}
                        onChange={(e) => handleStepChange(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none"
                      >
                        {roleOptions.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">{role?.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-gray-400" />
                      {formData.steps.length > 1 && (
                        <button
                          onClick={() => handleRemoveStep(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flow Preview */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
              <h4 className="text-sm font-medium text-indigo-900 mb-3">Approval Flow Preview</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {formData.steps.map((step, index) => {
                  const role = roleOptions.find(r => r.id === step.role);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-indigo-700 shadow-sm">
                        {role?.label}
                      </div>
                      {index < formData.steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-indigo-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim() || formData.steps.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              <Save className="h-5 w-5" />
              Save Workflow
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companyWorkflows.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white rounded-2xl">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No Workflows Configured</h3>
              <p className="text-gray-500 mt-1">Create your first approval workflow to get started</p>
            </div>
          ) : (
            companyWorkflows.map(workflow => (
              <div key={workflow.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-500">{workflow.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workflow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Condition: {conditionOptions.find(c => c.id === workflow.condition)?.label || 'All'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {workflow.steps?.map((step, index) => {
                      const role = roleOptions.find(r => r.id === step.role);
                      return (
                        <div key={index} className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm">
                            {role?.label}
                          </span>
                          {index < workflow.steps.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(workflow)}
                    className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDocument(workflow.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
