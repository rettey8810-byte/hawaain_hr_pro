import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';

const RENEWAL_STEPS = [
  { id: 1, name: 'Alert Triggered', icon: AlertCircle },
  { id: 2, name: 'HR Notified', icon: Clock },
  { id: 3, name: 'Renewal Started', icon: Clock },
  { id: 4, name: 'Document Uploaded', icon: Clock },
  { id: 5, name: 'Status Updated', icon: CheckCircle }
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function Renewals() {
  const { documents: renewals, loading, addDocument, updateDocument } = useFirestore('renewals');
  const { documents: employees } = useFirestore('employees');
  const { documents: passports } = useFirestore('passports');
  const { documents: visas } = useFirestore('visas');
  const { documents: workPermits } = useFirestore('workPermits');
  const { documents: medicals } = useFirestore('medicals');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newRenewal, setNewRenewal] = useState({
    employeeId: '',
    documentType: 'passport',
    documentId: '',
    notes: ''
  });

  useEffect(() => {
    // Check for expiring documents and create renewal alerts
    const allDocs = [
      ...passports.map(p => ({ ...p, type: 'passport' })),
      ...visas.map(v => ({ ...v, type: 'visa' })),
      ...workPermits.map(w => ({ ...w, type: 'work-permit' })),
      ...medicals.map(m => ({ ...m, type: 'medical' }))
    ];

    allDocs.forEach(doc => {
      const days = calculateDaysRemaining(doc.expiryDate);
      if (days !== null && days <= 90) {
        const existingRenewal = renewals.find(r => 
          r.documentId === doc.id && r.status !== 'completed'
        );
        
        if (!existingRenewal) {
          // Auto-create renewal for expiring documents
          // This would typically be done by a cloud function
        }
      }
    });
  }, [passports, visas, workPermits, medicals, renewals]);

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp?.name || 'Unknown';
  };

  const getDocumentInfo = (type, id) => {
    let doc;
    switch(type) {
      case 'passport': doc = passports.find(p => p.id === id); break;
      case 'visa': doc = visas.find(v => v.id === id); break;
      case 'work-permit': doc = workPermits.find(w => w.id === id); break;
      case 'medical': doc = medicals.find(m => m.id === id); break;
    }
    return doc;
  };

  const filteredRenewals = renewals.filter(r => {
    const matchesSearch = !searchTerm || 
      getEmployeeName(r.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateRenewal = async (e) => {
    e.preventDefault();
    await addDocument({
      ...newRenewal,
      status: 'pending',
      currentStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: RENEWAL_STEPS.map(step => ({
        ...step,
        completed: step.id === 1,
        completedAt: step.id === 1 ? new Date().toISOString() : null
      }))
    });
    setShowNewModal(false);
    setNewRenewal({ employeeId: '', documentType: 'passport', documentId: '', notes: '' });
  };

  const handleUpdateStep = async (renewal, stepId) => {
    const updatedSteps = renewal.steps.map(step => 
      step.id === stepId ? { ...step, completed: true, completedAt: new Date().toISOString() } : step
    );
    
    const allCompleted = updatedSteps.every(s => s.completed);
    
    await updateDocument(renewal.id, {
      steps: updatedSteps,
      currentStep: stepId,
      status: allCompleted ? 'completed' : stepId >= 3 ? 'in_progress' : 'pending',
      updatedAt: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            Renewal Workflow
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track document renewal processes
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Renewal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {renewals.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {renewals.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {renewals.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-700 font-bold">
                {renewals.length}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">Renewals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search renewals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm border focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 px-3 py-2 text-sm border focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Renewals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRenewals.map((renewal) => {
                const progress = (renewal.steps?.filter(s => s.completed).length / 5) * 100;
                
                return (
                  <tr key={renewal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getEmployeeName(renewal.employeeId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {renewal.documentType?.replace('-', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        STATUS_COLORS[renewal.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {renewal.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(renewal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to="#"
                        onClick={() => {
                          const nextStep = renewal.steps?.find(s => !s.completed);
                          if (nextStep) handleUpdateStep(renewal, nextStep.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {renewal.status !== 'completed' ? 'Update' : 'View'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredRenewals.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No renewals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Renewal Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Renewal</h3>
            <form onSubmit={handleCreateRenewal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <select
                  required
                  value={newRenewal.employeeId}
                  onChange={(e) => setNewRenewal({...newRenewal, employeeId: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                <select
                  value={newRenewal.documentType}
                  onChange={(e) => setNewRenewal({...newRenewal, documentType: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="passport">Passport</option>
                  <option value="visa">Visa</option>
                  <option value="work-permit">Work Permit</option>
                  <option value="medical">Medical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={newRenewal.notes}
                  onChange={(e) => setNewRenewal({...newRenewal, notes: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
