import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Building2, 
  CheckCircle, AlertCircle, Calendar, Phone, 
  Home, Briefcase, HardHat, UserPlus, MapPin
} from 'lucide-react';

/**
 * Visitors and Staff Module
 * 
 * Manages non-employee personnel across properties:
 * - Villa park staff
 * - Construction staff
 * - 3rd party staff (contractors/vendors)
 * - Sister property staff
 * - Visitors
 * 
 * Features:
 * - CRUD operations for all personnel types
 * - Company-scoped data isolation
 * - Arrival/Departure date tracking
 * - Property and room assignment
 */

const PERSONNEL_TYPES = [
  { value: 'villa_park', label: 'Villa Park Staff', icon: Home, color: 'bg-blue-100 text-blue-800' },
  { value: 'construction', label: 'Construction Staff', icon: HardHat, color: 'bg-orange-100 text-orange-800' },
  { value: 'third_party', label: '3rd Party Staff', icon: Briefcase, color: 'bg-purple-100 text-purple-800' },
  { value: 'sister_property', label: 'Sister Property Staff', icon: Building2, color: 'bg-green-100 text-green-800' },
  { value: 'visitor', label: 'Visitor', icon: UserPlus, color: 'bg-yellow-100 text-yellow-800' }
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800'
};

export default function VisitorsAndStaff() {
  const { user, userData, hasAccess } = useAuth();
  const { companyId } = useCompany();
  
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    type: 'visitor',
    contactNumber: '',
    propertyName: '',
    roomNumber: '',
    arrivalDate: '',
    departureDate: '',
    status: 'active',
    notes: ''
  });

  // Fetch personnel data
  useEffect(() => {
    if (!companyId) return;
    
    const personnelQuery = query(
      collection(db, 'visitorsAndStaff'),
      where('companyId', '==', companyId),
      orderBy('arrivalDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(personnelQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPersonnel(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyId]);

  const canManage = () => {
    return hasAccess('employees', 'edit') || 
           userData?.role === 'hrm' || 
           userData?.role === 'gm' ||
           userData?.role === 'admin';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        companyId,
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'visitorsAndStaff'), data);
      
      setShowCreateModal(false);
      resetForm();
      setMessage({ type: 'success', text: 'Person added successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Create error:', error);
      setMessage({ type: 'error', text: 'Failed to add person. Please try again.' });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return;
    
    try {
      const updateData = {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      };

      await updateDoc(doc(db, 'visitorsAndStaff', selectedPerson.id), updateData);
      
      setShowEditModal(false);
      setSelectedPerson(null);
      setMessage({ type: 'success', text: 'Updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Failed to update. Please try again.' });
    }
  };

  const handleDelete = async () => {
    if (!selectedPerson) return;
    
    try {
      await deleteDoc(doc(db, 'visitorsAndStaff', selectedPerson.id));
      setShowDeleteModal(false);
      setSelectedPerson(null);
      setMessage({ type: 'success', text: 'Deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete. Please try again.' });
    }
  };

  const handleCheckOut = async (personId) => {
    try {
      await updateDoc(doc(db, 'visitorsAndStaff', personId), {
        status: 'checked_out',
        actualDepartureDate: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      setMessage({ type: 'success', text: 'Checked out successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Checkout error:', error);
      setMessage({ type: 'error', text: 'Failed to check out. Please try again.' });
    }
  };

  const openEditModal = (person) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name || '',
      designation: person.designation || '',
      type: person.type || 'visitor',
      contactNumber: person.contactNumber || '',
      propertyName: person.propertyName || '',
      roomNumber: person.roomNumber || '',
      arrivalDate: person.arrivalDate || '',
      departureDate: person.departureDate || '',
      status: person.status || 'active',
      notes: person.notes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (person) => {
    setSelectedPerson(person);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      type: 'visitor',
      contactNumber: '',
      propertyName: '',
      roomNumber: '',
      arrivalDate: '',
      departureDate: '',
      status: 'active',
      notes: ''
    });
  };

  // Filter personnel
  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = 
      person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.contactNumber?.includes(searchTerm);
    
    const matchesType = filterType === 'all' || person.type === filterType;
    const matchesStatus = filterStatus === 'all' || person.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats
  const getSummaryStats = () => {
    const now = new Date().toISOString().split('T')[0];
    return {
      total: personnel.length,
      active: personnel.filter(p => p.status === 'active').length,
      checkedOut: personnel.filter(p => p.status === 'checked_out').length,
      overdue: personnel.filter(p => p.status === 'active' && p.departureDate && p.departureDate < now).length
    };
  };

  const stats = getSummaryStats();

  const getPersonTypeLabel = (type) => {
    return PERSONNEL_TYPES.find(t => t.value === type)?.label || type;
  };

  const getPersonTypeIcon = (type) => {
    const typeConfig = PERSONNEL_TYPES.find(t => t.value === type);
    return typeConfig?.icon || UserPlus;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Visitors & Staff</h2>
          </div>
          <p className="text-gray-600 mt-1">Manage villa staff, construction workers, contractors, and visitors</p>
        </div>
        {canManage() && (
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Person
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
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Currently Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Checked Out</p>
              <p className="text-2xl font-bold text-gray-600">{stats.checkedOut}</p>
            </div>
            <X className="h-8 w-8 text-gray-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
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
            placeholder="Search by name, designation, property, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Types</option>
          {PERSONNEL_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="checked_out">Checked Out</option>
        </select>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[1000px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property/Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival - Departure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canManage() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={canManage() ? 7 : 6} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={canManage() ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                      No records found. {canManage() && 'Click "Add Person" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((person) => {
                    const TypeIcon = getPersonTypeIcon(person.type);
                    const isOverdue = person.status === 'active' && person.departureDate && person.departureDate < new Date().toISOString().split('T')[0];
                    
                    return (
                      <tr key={person.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${PERSONNEL_TYPES.find(t => t.value === person.type)?.color || 'bg-gray-100'}`}>
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{person.name}</div>
                              <div className="text-sm text-gray-500">{person.designation || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${PERSONNEL_TYPES.find(t => t.value === person.type)?.color || 'bg-gray-100'}`}>
                            {getPersonTypeLabel(person.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {person.propertyName || 'N/A'}
                          </div>
                          {person.roomNumber && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              Room {person.roomNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {person.contactNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {person.arrivalDate || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            → {person.departureDate || 'N/A'}
                            {isOverdue && <span className="ml-2 text-red-600 font-medium">(Overdue)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[person.status] || 'bg-gray-100'}`}>
                            {person.status === 'checked_out' ? 'Checked Out' : person.status}
                          </span>
                        </td>
                        {canManage() && (
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {person.status === 'active' && (
                                <button
                                  onClick={() => handleCheckOut(person.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                                  title="Check Out"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(person)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(person)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Add Person</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {PERSONNEL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Manager, Worker, Guest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name</label>
                  <input
                    type="text"
                    name="propertyName"
                    value={formData.propertyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Villa Park A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    name="arrivalDate"
                    required
                    value={formData.arrivalDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Departure *</label>
                  <input
                    type="date"
                    name="departureDate"
                    required
                    value={formData.departureDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                  placeholder="Additional information..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Person
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
              <h3 className="text-xl font-semibold">Edit Person</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {PERSONNEL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name</label>
                  <input
                    type="text"
                    name="propertyName"
                    value={formData.propertyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    name="arrivalDate"
                    required
                    value={formData.arrivalDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Departure *</label>
                  <input
                    type="date"
                    name="departureDate"
                    required
                    value={formData.departureDate}
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
                  <option value="active">Active</option>
                  <option value="checked_out">Checked Out</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
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
              <h3 className="text-lg font-semibold mb-2">Delete Record</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedPerson?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedPerson(null); }}
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
