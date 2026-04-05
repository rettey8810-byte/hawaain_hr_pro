import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Building2, 
  CheckCircle, AlertCircle, Calendar, Phone, Upload,
  Download, HardHat, FileSpreadsheet, Filter, RefreshCw
} from 'lucide-react';
import constructionData from '../../Construction_Work_Force.json';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'expired_wp', label: 'Expired WP', color: 'bg-red-100 text-red-800' },
  { value: 'expired_visa', label: 'Expired Visa', color: 'bg-red-100 text-red-800' },
  { value: 'expired_medical', label: 'Expired Medical', color: 'bg-orange-100 text-orange-800' },
  { value: 'expired_insurance', label: 'Expired Insurance', color: 'bg-orange-100 text-orange-800' },
  { value: 'checked_out', label: 'Checked Out', color: 'bg-gray-100 text-gray-800' }
];

export default function ConstructionWorkforce() {
  const { user, userData, hasAccess } = useAuth();
  const { currentCompany, companyId } = useCompany();
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  const [formData, setFormData] = useState({
    Name: '',
    Designation: '',
    Department: '',
    Section: '',
    Nationality: '',
    PassportNo: '',
    WP: '',
    WPExpiry: '',
    FeeExpiry: '',
    MedicalExpiry: '',
    InsuranceExpiry: '',
    VIsaExpiry: '',
    status: 'active',
    notes: ''
  });

  // Fetch construction workers
  useEffect(() => {
    if (!companyId) return;
    
    setLoading(true);
    
    const q = query(
      collection(db, 'constructionWorkforce'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkers(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching construction workers:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyId]);

  // Calculate status based on expiry dates
  const calculateStatus = (worker) => {
    const today = new Date();
    const wpExpiry = worker.WPExpiry ? new Date(worker.WPExpiry) : null;
    const visaExpiry = worker.VIsaExpiry ? new Date(worker.VIsaExpiry) : null;
    const medicalExpiry = worker.MedicalExpiry ? new Date(worker.MedicalExpiry) : null;
    const insuranceExpiry = worker.InsuranceExpiry ? new Date(worker.InsuranceExpiry) : null;

    if (wpExpiry && wpExpiry < today) return 'expired_wp';
    if (visaExpiry && visaExpiry < today) return 'expired_visa';
    if (medicalExpiry && medicalExpiry < today) return 'expired_medical';
    if (insuranceExpiry && insuranceExpiry < today) return 'expired_insurance';
    return worker.status || 'active';
  };

  // Get expiring soon count (within 30 days)
  const getExpiringSoon = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.setDate(today.getDate() + 30));
    
    return workers.filter(w => {
      const wpExpiry = w.WPExpiry ? new Date(w.WPExpiry) : null;
      const visaExpiry = w.VIsaExpiry ? new Date(w.VIsaExpiry) : null;
      const medicalExpiry = w.MedicalExpiry ? new Date(w.MedicalExpiry) : null;
      const insuranceExpiry = w.InsuranceExpiry ? new Date(w.InsuranceExpiry) : null;
      
      return (wpExpiry && wpExpiry <= thirtyDaysFromNow && wpExpiry > new Date()) ||
             (visaExpiry && visaExpiry <= thirtyDaysFromNow && visaExpiry > new Date()) ||
             (medicalExpiry && medicalExpiry <= thirtyDaysFromNow && medicalExpiry > new Date()) ||
             (insuranceExpiry && insuranceExpiry <= thirtyDaysFromNow && insuranceExpiry > new Date());
    }).length;
  };

  const handleImportFromJSON = async () => {
    try {
      setImportProgress({ current: 0, total: constructionData.length });
      
      for (let i = 0; i < constructionData.length; i++) {
        const worker = constructionData[i];
        const workerData = {
          ...worker,
          source: 'json_import',
          importedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdBy: user?.uid,
          status: 'active'
        };
        
        await addDoc(collection(db, 'constructionWorkforce'), workerData);
        setImportProgress({ current: i + 1, total: constructionData.length });
      }
      
      setShowImportModal(false);
      setMessage({ type: 'success', text: `Successfully imported ${constructionData.length} workers!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: 'Failed to import workers. Please try again.' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateWorker = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return;
    
    try {
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.uid
      };

      await updateDoc(doc(db, 'constructionWorkforce', selectedWorker.id), updateData);
      
      setShowEditModal(false);
      setSelectedWorker(null);
      setMessage({ type: 'success', text: 'Worker updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Failed to update worker. Please try again.' });
    }
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;
    
    try {
      await deleteDoc(doc(db, 'constructionWorkforce', selectedWorker.id));
      setShowDeleteModal(false);
      setSelectedWorker(null);
      setMessage({ type: 'success', text: 'Worker deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete worker. Please try again.' });
    }
  };

  const openEditModal = (worker) => {
    setSelectedWorker(worker);
    setFormData({
      Name: worker.Name || '',
      Designation: worker.Designation || '',
      Department: worker.Department || '',
      Section: worker.Section || '',
      Nationality: worker.Nationality || '',
      PassportNo: worker['Passport No'] || worker.PassportNo || '',
      WP: worker.WP || '',
      WPExpiry: worker.WPExpiry || '',
      FeeExpiry: worker.FeeExpiry || '',
      MedicalExpiry: worker.MedicalExpiry || '',
      InsuranceExpiry: worker.InsuranceExpiry || '',
      VIsaExpiry: worker.VIsaExpiry || '',
      status: worker.status || 'active',
      notes: worker.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (worker) => {
    setSelectedWorker(worker);
    setShowDeleteModal(true);
  };

  // Get unique departments
  const departments = [...new Set(workers.map(w => w.Department).filter(Boolean))];

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = 
      w.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.Designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.WP?.includes(searchTerm) ||
      w['Passport No']?.includes(searchTerm);
    
    const currentStatus = calculateStatus(w);
    const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;
    const matchesDept = filterDepartment === 'all' || w.Department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Summary statistics
  const getSummaryStats = () => {
    const total = workers.length;
    const active = workers.filter(w => calculateStatus(w) === 'active').length;
    const expired = workers.filter(w => {
      const status = calculateStatus(w);
      return status.includes('expired');
    }).length;
    const expiringSoon = getExpiringSoon();
    
    return { total, active, expired, expiringSoon };
  };

  const stats = getSummaryStats();

  const canManageWorkers = () => {
    return hasAccess('employees', 'edit') || userData?.role === 'hrm' || userData?.role === 'gm' || userData?.role === 'superadmin';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="h-8 w-8 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Construction Workforce</h2>
          </div>
          <p className="text-gray-600 mt-1">Manage construction workers and track document expiries</p>
        </div>
        <div className="flex gap-2">
          {workers.length === 0 && canManageWorkers() && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="h-5 w-5" />
              Import from JSON
            </button>
          )}
          {canManageWorkers() && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-5 w-5" />
              Re-import Data
            </button>
          )}
        </div>
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
              <p className="text-sm text-gray-500">Total Workers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expired Documents</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring Soon (30d)</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, designation, WP or passport..."
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
          {STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[1200px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passport</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WP Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medical</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insurance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canManageWorkers() && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={canManageWorkers() ? 11 : 10} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={canManageWorkers() ? 11 : 10} className="px-6 py-4 text-center text-gray-500">
                      {workers.length === 0 ? (
                        <div>
                          <p className="mb-2">No construction workers found.</p>
                          {canManageWorkers() && (
                            <button
                              onClick={() => setShowImportModal(true)}
                              className="text-blue-600 hover:underline"
                            >
                              Import from Construction_Work_Force.json
                            </button>
                          )}
                        </div>
                      ) : (
                        'No workers found matching your criteria.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const status = calculateStatus(worker);
                    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
                    
                    const isExpired = (date) => {
                      if (!date) return false;
                      return new Date(date) < new Date();
                    };
                    
                    const isExpiringSoon = (date) => {
                      if (!date) return false;
                      const expiry = new Date(date);
                      const thirtyDays = new Date();
                      thirtyDays.setDate(thirtyDays.getDate() + 30);
                      return expiry <= thirtyDays && expiry > new Date();
                    };
                    
                    return (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{worker.Name}</div>
                          <div className="text-sm text-gray-500">{worker.Nationality}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{worker.Department || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{worker.Designation || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{worker['Passport No'] || worker.PassportNo || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{worker.WP || '-'}</td>
                        <td className="px-4 py-3">
                          <div className={`text-sm ${isExpired(worker.WPExpiry) ? 'text-red-600 font-semibold' : isExpiringSoon(worker.WPExpiry) ? 'text-orange-600' : 'text-gray-600'}`}>
                            {worker.WPExpiry ? new Date(worker.WPExpiry).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm ${isExpired(worker.VIsaExpiry) ? 'text-red-600 font-semibold' : isExpiringSoon(worker.VIsaExpiry) ? 'text-orange-600' : 'text-gray-600'}`}>
                            {worker.VIsaExpiry ? new Date(worker.VIsaExpiry).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm ${isExpired(worker.MedicalExpiry) ? 'text-red-600 font-semibold' : isExpiringSoon(worker.MedicalExpiry) ? 'text-orange-600' : 'text-gray-600'}`}>
                            {worker.MedicalExpiry ? new Date(worker.MedicalExpiry).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm ${isExpired(worker.InsuranceExpiry) ? 'text-red-600 font-semibold' : isExpiringSoon(worker.InsuranceExpiry) ? 'text-orange-600' : 'text-gray-600'}`}>
                            {worker.InsuranceExpiry ? new Date(worker.InsuranceExpiry).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        {canManageWorkers() && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(worker)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(worker)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import Construction Workers</h3>
              <p className="text-gray-600 mb-4">
                This will import {constructionData.length} workers from <code>Construction_Work_Force.json</code> into the Firestore database.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Existing data will not be duplicated. Make sure to clear existing data first if you want a fresh import.
              </p>
              
              {importProgress.total > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Importing {importProgress.current} of {importProgress.total} workers...
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleImportFromJSON}
                  disabled={importProgress.total > 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {importProgress.total > 0 ? 'Importing...' : 'Start Import'}
                </button>
                <button
                  onClick={() => { setShowImportModal(false); setImportProgress({ current: 0, total: 0 }); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Edit Worker</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateWorker} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    name="Name"
                    value={formData.Name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    name="Designation"
                    value={formData.Designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    name="Department"
                    value={formData.Department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <input
                    type="text"
                    name="Section"
                    value={formData.Section}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Passport Number</label>
                  <input
                    type="text"
                    name="PassportNo"
                    value={formData.PassportNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Work Permit (WP)</label>
                  <input
                    type="text"
                    name="WP"
                    value={formData.WP}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">WP Expiry</label>
                  <input
                    type="date"
                    name="WPExpiry"
                    value={formData.WPExpiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Visa Expiry</label>
                  <input
                    type="date"
                    name="VIsaExpiry"
                    value={formData.VIsaExpiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medical Expiry</label>
                  <input
                    type="date"
                    name="MedicalExpiry"
                    value={formData.MedicalExpiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    name="InsuranceExpiry"
                    value={formData.InsuranceExpiry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
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
                  Update Worker
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
              <h3 className="text-lg font-semibold mb-2">Delete Worker</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedWorker?.Name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteWorker}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedWorker(null); }}
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
