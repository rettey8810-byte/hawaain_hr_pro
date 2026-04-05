import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Phone, 
  Calendar, 
  MapPin,
  UserCircle,
  Briefcase,
  X,
  Edit2,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const STAFF_TYPES = [
  { value: 'villa_park', label: 'Villa Park Staff', icon: Building2 },
  { value: '3rd_party', label: '3rd Party Staff', icon: Briefcase },
  { value: 'sister_property', label: 'Sister Property Staff', icon: Building2 },
  { value: 'visitor', label: 'Visitor', icon: UserCircle },
  { value: 'contractor', label: 'Contractor', icon: Briefcase },
  { value: 'consultant', label: 'Consultant', icon: UserCircle }
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  checked_in: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800'
};

export default function ExternalStaff() {
  const { currentCompany, getCompanyDisplayName, companyId } = useCompany();
  const { userData } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    type: 'villa_park',
    contactNumber: '',
    propertyName: '',
    roomNumber: '',
    arrivalDate: '',
    departureDate: '',
    email: '',
    companyName: '',
    notes: ''
  });

  // Fetch external staff from Firestore
  useEffect(() => {
    if (!companyId) return;
    
    const q = query(
      collection(db, 'externalStaff'),
      where('companyId', '==', companyId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Calculate status based on dates
        computedStatus: calculateStatus(doc.data())
      }));
      setStaff(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [companyId]);

  const calculateStatus = (data) => {
    const today = new Date();
    const arrival = new Date(data.arrivalDate);
    const departure = new Date(data.departureDate);
    
    if (today < arrival) return 'upcoming';
    if (today > departure) return 'checked_out';
    return 'checked_in';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      companyId,
      createdBy: userData?.uid,
      updatedAt: serverTimestamp()
    };
    
    if (editingStaff) {
      await updateDoc(doc(db, 'externalStaff', editingStaff.id), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'externalStaff'), data);
    }
    
    setShowModal(false);
    setEditingStaff(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteDoc(doc(db, 'externalStaff', id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      type: 'villa_park',
      contactNumber: '',
      propertyName: '',
      roomNumber: '',
      arrivalDate: '',
      departureDate: '',
      email: '',
      companyName: '',
      notes: ''
    });
  };

  const openEditModal = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name || '',
      designation: staffMember.designation || '',
      type: staffMember.type || 'villa_park',
      contactNumber: staffMember.contactNumber || '',
      propertyName: staffMember.propertyName || '',
      roomNumber: staffMember.roomNumber || '',
      arrivalDate: staffMember.arrivalDate || '',
      departureDate: staffMember.departureDate || '',
      email: staffMember.email || '',
      companyName: staffMember.companyName || '',
      notes: staffMember.notes || ''
    });
    setShowModal(true);
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactNumber?.includes(searchTerm) ||
      s.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || s.type === filterType;
    const matchesStatus = filterStatus === 'all' || s.computedStatus === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: staff.length,
    checkedIn: staff.filter(s => s.computedStatus === 'checked_in').length,
    checkedOut: staff.filter(s => s.computedStatus === 'checked_out').length,
    upcoming: staff.filter(s => s.computedStatus === 'upcoming').length
  };

  const getTypeIcon = (type) => {
    const typeConfig = STAFF_TYPES.find(t => t.value === type);
    const Icon = typeConfig?.icon || UserCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (type) => {
    return STAFF_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getCompanyDisplayName()}</h1>
              <p className="text-gray-600">External Staff & Visitor Management</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setEditingStaff(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Currently Checked In</p>
              <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
            </div>
            <Building2 className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Checked Out</p>
              <p className="text-2xl font-bold text-gray-600">{stats.checkedOut}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact, property, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            {STAFF_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredStaff.length} of {staff.length} entries
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name/Designation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Property/Room</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.designation}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(s.type)}
                      <span className="text-sm text-gray-900">{getTypeLabel(s.type)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{s.contactNumber}</div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{s.propertyName}</div>
                    <div className="text-xs text-gray-500">Room: {s.roomNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">{s.companyName || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      <span className="text-green-600">{s.arrivalDate}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      to <span className="text-red-600">{s.departureDate}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[s.computedStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {s.computedStatus === 'checked_in' ? 'Checked In' : 
                       s.computedStatus === 'checked_out' ? 'Checked Out' : 
                       s.computedStatus === 'upcoming' ? 'Upcoming' : s.computedStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStaff.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No entries found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {editingStaff ? 'Edit Entry' : 'Add External Staff / Visitor'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Manager, Technician"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {STAFF_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name</label>
                  <input
                    type="text"
                    value={formData.propertyName}
                    onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Property/Villa name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Room Number</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Room/Villa number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company/Organization</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="External company name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
                  {editingStaff ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
