import { useState, useEffect } from 'react';
import { 
  UserX, 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

const TERMINATION_TYPES = [
  { id: 'voluntary', label: 'Voluntary Resignation', color: 'blue' },
  { id: 'involuntary', label: 'Involuntary Termination', color: 'red' },
  { id: 'contract_end', label: 'End of Contract', color: 'amber' },
  { id: 'retirement', label: 'Retirement', color: 'green' },
  { id: 'mutual', label: 'Mutual Agreement', color: 'purple' }
];

const TERMINATION_STATUS = [
  { id: 'pending', label: 'Pending', color: 'yellow' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'completed', label: 'Completed', color: 'green' },
  { id: 'cancelled', label: 'Cancelled', color: 'gray' }
];

const EXIT_CHECKLIST = [
  { id: 'notice_period', label: 'Notice Period Served' },
  { id: 'handover', label: 'Work Handover Completed' },
  { id: 'assets', label: 'Company Assets Returned' },
  { id: 'clearance', label: 'Department Clearance' },
  { id: 'final_pay', label: 'Final Pay Processed' },
  { id: 'exit_interview', label: 'Exit Interview Conducted' },
  { id: 'benefits', label: 'Benefits Terminated' },
  { id: 'access_revoked', label: 'System Access Revoked' }
];

export default function Terminations() {
  const { companyId } = useCompany();
  const { isHR } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTermination, setEditingTermination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    type: 'voluntary',
    status: 'pending',
    startDate: '',
    lastWorkingDate: '',
    reason: '',
    noticePeriodDays: '',
    settlementAmount: '',
    checklist: {},
    notes: '',
    documents: []
  });

  // Fetch terminations
  const { documents: terminations, loading, deleteDocument } = useFirestore('terminations');
  const { documents: employees } = useFirestore('employees');

  const filteredTerminations = terminations.filter(t => {
    const matchesSearch = 
      t.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'active') {
      return matchesSearch && ['pending', 'in_progress'].includes(t.status);
    } else if (activeTab === 'completed') {
      return matchesSearch && t.status === 'completed';
    }
    return matchesSearch;
  });

  const stats = {
    total: terminations.length,
    pending: terminations.filter(t => t.status === 'pending').length,
    inProgress: terminations.filter(t => t.status === 'in_progress').length,
    completed: terminations.filter(t => t.status === 'completed').length,
    thisMonth: terminations.filter(t => {
      const date = new Date(t.createdAt || t.startDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  };

  const handleSave = async () => {
    try {
      if (!formData.employeeName || !formData.lastWorkingDate) {
        toast.error('Please fill required fields');
        return;
      }

      const data = {
        ...formData,
        companyId,
        updatedAt: new Date().toISOString()
      };

      if (editingTermination) {
        await updateDoc(doc(db, 'terminations', editingTermination.id), data);
        toast.success('Termination updated');
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'terminations'), data);
        toast.success('Termination record created');
      }

      setShowModal(false);
      setEditingTermination(null);
      resetForm();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDocument(id);
      toast.success('Deleted');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleEdit = (termination) => {
    setEditingTermination(termination);
    setFormData({
      employeeId: termination.employeeId || '',
      employeeName: termination.employeeName || '',
      type: termination.type || 'voluntary',
      status: termination.status || 'pending',
      startDate: termination.startDate || '',
      lastWorkingDate: termination.lastWorkingDate || '',
      reason: termination.reason || '',
      noticePeriodDays: termination.noticePeriodDays || '',
      settlementAmount: termination.settlementAmount || '',
      checklist: termination.checklist || {},
      notes: termination.notes || '',
      documents: termination.documents || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      type: 'voluntary',
      status: 'pending',
      startDate: '',
      lastWorkingDate: '',
      reason: '',
      noticePeriodDays: '',
      settlementAmount: '',
      checklist: {},
      notes: '',
      documents: []
    });
  };

  const toggleChecklist = (itemId) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [itemId]: !prev.checklist[itemId]
      }
    }));
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Type', 'Status', 'Start Date', 'Last Working Date', 'Reason', 'Settlement'];
    const rows = filteredTerminations.map(t => [
      t.employeeName,
      TERMINATION_TYPES.find(x => x.id === t.type)?.label || t.type,
      TERMINATION_STATUS.find(x => x.id === t.status)?.label || t.status,
      t.startDate,
      t.lastWorkingDate,
      t.reason,
      t.settlementAmount
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      voluntary: 'bg-blue-100 text-blue-800',
      involuntary: 'bg-red-100 text-red-800',
      contract_end: 'bg-amber-100 text-amber-800',
      retirement: 'bg-green-100 text-green-800',
      mutual: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <UserX className="h-8 w-8" />
              Termination Management
            </h1>
            <p className="mt-1 text-white/80">Manage employee exits and offboarding process</p>
          </div>
          {isHR?.() && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Termination
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search terminations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'active' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'completed' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredTerminations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            <UserX className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No termination records found</p>
            <p className="text-sm">Click "New Termination" to add one</p>
          </div>
        ) : (
          filteredTerminations.map((termination) => (
            <div key={termination.id} className="bg-white rounded-xl shadow overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === termination.id ? null : termination.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
                    {termination.employeeName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{termination.employeeName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(termination.type)}`}>
                        {TERMINATION_TYPES.find(t => t.id === termination.type)?.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(termination.status)}`}>
                        {TERMINATION_STATUS.find(s => s.id === termination.status)?.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last Working Day</p>
                    <p className="font-semibold">{termination.lastWorkingDate || 'Not set'}</p>
                  </div>
                  {isHR?.() && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(termination); }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(termination.id); }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {expandedId === termination.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedId === termination.id && (
                <div className="border-t px-4 py-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Reason:</span> {termination.reason || 'N/A'}</p>
                        <p><span className="text-gray-500">Start Date:</span> {termination.startDate || 'N/A'}</p>
                        <p><span className="text-gray-500">Notice Period:</span> {termination.noticePeriodDays ? `${termination.noticePeriodDays} days` : 'N/A'}</p>
                        <p><span className="text-gray-500">Settlement:</span> ${termination.settlementAmount || '0'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Exit Checklist
                      </h4>
                      <div className="space-y-1">
                        {EXIT_CHECKLIST.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center ${termination.checklist?.[item.id] ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}>
                              {termination.checklist?.[item.id] && <CheckCircle className="h-3 w-3" />}
                            </div>
                            <span className={`text-sm ${termination.checklist?.[item.id] ? 'text-green-700 line-through' : 'text-gray-600'}`}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {termination.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Notes:</span> {termination.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">
                {editingTermination ? 'Edit Termination' : 'New Termination'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee Name *</label>
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter employee name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Termination Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {TERMINATION_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {TERMINATION_STATUS.map(status => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Working Date *</label>
                  <input
                    type="date"
                    value={formData.lastWorkingDate}
                    onChange={(e) => setFormData({...formData, lastWorkingDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Process Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={formData.noticePeriodDays}
                    onChange={(e) => setFormData({...formData, noticePeriodDays: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Reason for termination..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Settlement Amount ($)</label>
                <input
                  type="number"
                  value={formData.settlementAmount}
                  onChange={(e) => setFormData({...formData, settlementAmount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Exit Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXIT_CHECKLIST.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm ${
                        formData.checklist[item.id] 
                          ? 'bg-green-50 border-green-300 text-green-700' 
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${
                        formData.checklist[item.id] ? 'bg-green-500 text-white' : 'border-2 border-gray-300'
                      }`}>
                        {formData.checklist[item.id] && <CheckCircle className="h-3 w-3" />}
                      </div>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Save className="h-4 w-4 inline mr-1" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
