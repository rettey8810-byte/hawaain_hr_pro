import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Building2, 
  CheckCircle, AlertCircle, TrendingUp, UserMinus, UserCheck 
} from 'lucide-react';

/**
 * Position Quota Module
 * 
 * Features:
 * - HRM/GM can set position quotas for each department
 * - Track filled vs remaining positions
 * - Real-time quota usage based on active employees
 * - Alerts when approaching or exceeding quota limits
 * - Department-wise and position-wise quota management
 */

export default function PositionQuota() {
  const { user, userData, hasAccess } = useAuth();
  const { companyId } = useCompany();
  
  const [quotas, setQuotas] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    department: '',
    position: '',
    totalQuota: 1,
    description: '',
    minSalary: '',
    maxSalary: '',
    employmentType: 'full_time',
    status: 'active'
  });

  // Fetch quotas and employees
  useEffect(() => {
    if (!companyId) return;
    
    // Fetch quotas
    const quotasQuery = query(
      collection(db, 'positionQuotas'),
      where('companyId', '==', companyId),
      orderBy('department'),
      orderBy('position')
    );
    
    const unsubscribeQuotas = onSnapshot(quotasQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotas(data);
    });

    // Fetch employees to calculate usage
    const employeesQuery = query(
      collection(db, 'employees'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );
    
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(data);
      setLoading(false);
    });
    
    return () => {
      unsubscribeQuotas();
      unsubscribeEmployees();
    };
  }, [companyId]);

  const canManageQuotas = () => {
    return hasAccess('employees', 'edit') || userData?.role === 'hrm' || userData?.role === 'gm';
  };

  // Calculate quota usage
  const getQuotaUsage = (quota) => {
    const filled = employees.filter(emp => 
      (emp['Department '] || emp.Department || emp.department) === quota.department && 
      (emp.Designation || emp.position) === quota.position &&
      emp.status === 'active'
    ).length;
    
    return {
      filled,
      remaining: quota.totalQuota - filled,
      percentage: (filled / quota.totalQuota) * 100
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateQuota = async (e) => {
    e.preventDefault();
    
    try {
      const quotaData = {
        ...formData,
        totalQuota: parseInt(formData.totalQuota) || 1,
        minSalary: parseFloat(formData.minSalary) || 0,
        maxSalary: parseFloat(formData.maxSalary) || 0,
        companyId,
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'positionQuotas'), quotaData);
      
      setShowCreateModal(false);
      setFormData({
        department: '',
        position: '',
        totalQuota: 1,
        description: '',
        minSalary: '',
        maxSalary: '',
        employmentType: 'full_time',
        status: 'active'
      });
      setMessage({ type: 'success', text: 'Position quota created successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Create error:', error);
      setMessage({ type: 'error', text: 'Failed to create quota. Please try again.' });
    }
  };

  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    if (!selectedQuota) return;
    
    try {
      const updateData = {
        ...formData,
        totalQuota: parseInt(formData.totalQuota) || 1,
        minSalary: parseFloat(formData.minSalary) || 0,
        maxSalary: parseFloat(formData.maxSalary) || 0,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.uid
      };

      await updateDoc(doc(db, 'positionQuotas', selectedQuota.id), updateData);
      
      setShowEditModal(false);
      setSelectedQuota(null);
      setMessage({ type: 'success', text: 'Quota updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Failed to update quota. Please try again.' });
    }
  };

  const handleDeleteQuota = async () => {
    if (!selectedQuota) return;
    
    try {
      await deleteDoc(doc(db, 'positionQuotas', selectedQuota.id));
      setShowDeleteModal(false);
      setSelectedQuota(null);
      setMessage({ type: 'success', text: 'Quota deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete quota. Please try again.' });
    }
  };

  const openEditModal = (quota) => {
    setSelectedQuota(quota);
    setFormData({
      department: quota.department || '',
      position: quota.position || '',
      totalQuota: quota.totalQuota || 1,
      description: quota.description || '',
      minSalary: quota.minSalary || '',
      maxSalary: quota.maxSalary || '',
      employmentType: quota.employmentType || 'full_time',
      status: quota.status || 'active'
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (quota) => {
    setSelectedQuota(quota);
    setShowDeleteModal(true);
  };

  const filteredQuotas = quotas.filter(quota => {
    const matchesSearch = 
      quota.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept === 'all' || quota.department === filterDept;
    
    return matchesSearch && matchesDept;
  });

  // Get unique departments from employee data
  const departments = [...new Set(employees.map(e => e['Department '] || e.Department || e.department).filter(Boolean))];

  // Summary statistics
  const getSummaryStats = () => {
    let totalPositions = 0;
    let totalFilled = 0;
    let totalVacant = 0;
    let overQuota = 0;

    quotas.forEach(quota => {
      const usage = getQuotaUsage(quota);
      totalPositions += quota.totalQuota;
      totalFilled += usage.filled;
      totalVacant += Math.max(0, usage.remaining);
      if (usage.filled > quota.totalQuota) overQuota++;
    });

    return { totalPositions, totalFilled, totalVacant, overQuota };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Position Quotas</h2>
          </div>
          <p className="text-gray-600 mt-1">Manage department position quotas and track utilization</p>
        </div>
        {canManageQuotas() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Quota
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Positions</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalPositions}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Filled Positions</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalFilled}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vacant Positions</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalVacant}</p>
            </div>
            <UserMinus className="h-8 w-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Over Quota</p>
              <p className="text-2xl font-bold text-red-600">{stats.overQuota}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by position or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Quotas Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quota</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Filled</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {canManageQuotas() && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={canManageQuotas() ? 8 : 7} className="px-6 py-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : filteredQuotas.length === 0 ? (
              <tr>
                <td colSpan={canManageQuotas() ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
                  No quotas found. {canManageQuotas() && 'Click "Add Quota" to create one.'}
                </td>
              </tr>
            ) : (
              filteredQuotas.map((quota) => {
                const usage = getQuotaUsage(quota);
                const isOverQuota = usage.filled > quota.totalQuota;
                const isNearQuota = usage.percentage >= 80 && !isOverQuota;
                
                return (
                  <tr key={quota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{quota.position}</div>
                      <div className="text-sm text-gray-500">{quota.employmentType?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">{quota.department}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium">{quota.totalQuota}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-medium ${isOverQuota ? 'text-red-600' : 'text-green-600'}`}>
                        {usage.filled}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isOverQuota ? 'bg-red-100 text-red-800' :
                        isNearQuota ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {usage.remaining > 0 ? usage.remaining : 'Over Limit'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        ${quota.minSalary?.toLocaleString()} - ${quota.maxSalary?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        quota.status === 'active' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quota.status}
                      </span>
                    </td>
                    {canManageQuotas() && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(quota)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(quota)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Create Position Quota</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuota} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department *</label>
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
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
                  name="position"
                  required
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Quota *</label>
                <input
                  type="number"
                  name="totalQuota"
                  required
                  min="1"
                  value={formData.totalQuota}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Salary</label>
                  <input
                    type="number"
                    name="minSalary"
                    value={formData.minSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Salary</label>
                  <input
                    type="number"
                    name="maxSalary"
                    value={formData.maxSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Brief description of position responsibilities..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Quota
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Edit Position Quota</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateQuota} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department *</label>
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Position Title *</label>
                <input
                  type="text"
                  name="position"
                  required
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Quota *</label>
                <input
                  type="number"
                  name="totalQuota"
                  required
                  min="1"
                  value={formData.totalQuota}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="frozen">Frozen</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Salary</label>
                  <input
                    type="number"
                    name="minSalary"
                    value={formData.minSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Salary</label>
                  <input
                    type="number"
                    name="maxSalary"
                    value={formData.maxSalary}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Quota
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Quota</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the quota for <strong>{selectedQuota?.position}</strong> in {selectedQuota?.department}? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteQuota}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedQuota(null); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
