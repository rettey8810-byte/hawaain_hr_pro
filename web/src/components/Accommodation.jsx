import { useState, useMemo } from 'react';
import {
  Home, BedDouble, Wrench, DoorOpen, Plus, Search, X, Edit2, Trash2, CheckCircle,
  Users, Bath, Maximize, Building2, MapPin, Filter, Download, Eye, ArrowRight,
  AlertTriangle, Calendar, Clock, User, Save, ChevronLeft, ChevronRight, MoreVertical,
  Droplets, Zap, Wind, UtensilsCrossed, Wifi, Tv, Waves, Snowflake, DollarSign
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

// Room Modal Component
const RoomModal = ({ isOpen, onClose, room, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    building: '',
    wing: '',
    roomType: 'standard',
    capacity: 2,
    beds: 2,
    bathrooms: 1,
    squareMeters: '',
    amenities: [],
    status: 'available',
    monthlyRent: '',
    description: '',
    ...room
  });

  const amenitiesList = [
    { id: 'ac', label: 'Air Conditioning', icon: Snowflake },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
    { id: 'laundry', label: 'Laundry', icon: Waves },
    { id: 'hot_water', label: 'Hot Water', icon: Droplets },
    { id: 'generator', label: 'Backup Power', icon: Zap },
    { id: 'fan', label: 'Ceiling Fan', icon: Wind },
  ];

  const toggleAmenity = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-blue-600" />
            {room?.id ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Room Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room Number *</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 101, A-203"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Building</label>
              <input
                type="text"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Building A"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Floor *</label>
              <select
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Floor</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(f => (
                  <option key={f} value={f}>{f === 0 ? 'Ground Floor' : `Floor ${f}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wing/Block</label>
              <input
                type="text"
                value={formData.wing}
                onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., East Wing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Type</label>
              <select
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="shared">Shared/Dormitory</option>
                <option value="studio">Studio</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>

          {/* Capacity & Facilities */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Capacity (people)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beds</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.beds}
                onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bathrooms</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Area (m²)</label>
              <input
                type="number"
                value={formData.squareMeters}
                onChange={(e) => setFormData({ ...formData, squareMeters: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 25"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium mb-2">Amenities</label>
            <div className="grid grid-cols-4 gap-2">
              {amenitiesList.map(amenity => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {amenity.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Rent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent (USD)</label>
              <input
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Additional room details..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              {room?.id ? 'Update Room' : 'Create Room'}
            </button>
            {room?.id && (
              <button
                type="button"
                onClick={() => onDelete(room.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Room Assignment Modal
const AssignmentModal = ({ isOpen, onClose, assignment, rooms, employees, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    roomId: '',
    employeeId: '',
    checkInDate: '',
    expectedCheckOut: '',
    deposit: '',
    rentShare: '',
    notes: '',
    ...assignment
  });

  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const assignedEmployees = assignment?.assignedEmployees || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-green-600" />
            {assignment?.id ? 'Edit Assignment' : 'Assign Room'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Room *</label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Choose a room</option>
              {rooms
                .filter(r => r.status === 'available' || r.id === formData.roomId)
                .map(room => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} - {room.building} (Capacity: {room.capacity})
                  </option>
                ))}
            </select>
          </div>

          {selectedRoom && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p><strong>Room Details:</strong></p>
              <p>Floor {selectedRoom.floor}, {selectedRoom.beds} beds, {selectedRoom.bathrooms} bathrooms</p>
              <p className="text-gray-600">Rent: ${selectedRoom.monthlyRent || 0}/month</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Assign Employee *</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select Employee</option>
              {employees
                .filter(e => e.status === 'active')
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.FullName || emp.name} - {emp.Designation || emp.position}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Check-in Date *</label>
              <input
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Check-out</label>
              <input
                type="date"
                value={formData.expectedCheckOut}
                onChange={(e) => setFormData({ ...formData, expectedCheckOut: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deposit (USD)</label>
              <input
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rent Share (USD)</label>
              <input
                type="number"
                value={formData.rentShare}
                onChange={(e) => setFormData({ ...formData, rentShare: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Any special notes..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              {assignment?.id ? 'Update Assignment' : 'Assign Room'}
            </button>
            {assignment?.id && (
              <button
                type="button"
                onClick={() => onDelete(assignment.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Remove
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Maintenance Modal
const MaintenanceModal = ({ isOpen, onClose, request, rooms, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    roomId: '',
    type: 'repair',
    priority: 'medium',
    description: '',
    estimatedCost: '',
    assignedTo: '',
    status: 'pending',
    scheduledDate: '',
    ...request
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-600" />
            {request?.id ? 'Edit Maintenance' : 'New Maintenance Request'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Room *</label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select Room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} - {room.building}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="repair">Repair</option>
                <option value="cleaning">Deep Cleaning</option>
                <option value="inspection">Inspection</option>
                <option value="renovation">Renovation</option>
                <option value="pest_control">Pest Control</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC/AC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Describe the maintenance issue..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Cost (USD)</label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Staff or vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
              {request?.id ? 'Update Request' : 'Create Request'}
            </button>
            {request?.id && (
              <button
                type="button"
                onClick={() => onDelete(request.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Accommodation Component
export default function Accommodation() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBuilding, setFilterBuilding] = useState('all');

  const { companyId } = useCompany();
  const { user, userData } = useAuth();

  const { documents: rooms, loading: roomsLoading } = useFirestore('rooms');
  const { documents: assignments, loading: assignmentsLoading } = useFirestore('roomAssignments');
  const { documents: maintenance, loading: maintenanceLoading } = useFirestore('maintenance');
  const { documents: employees, loading: employeesLoading } = useFirestore('employees');

  const companyRooms = useMemo(() => {
    return rooms.filter(r => r.companyId === companyId);
  }, [rooms, companyId]);

  const companyAssignments = useMemo(() => {
    return assignments.filter(a => a.companyId === companyId);
  }, [assignments, companyId]);

  const companyMaintenance = useMemo(() => {
    return maintenance.filter(m => m.companyId === companyId);
  }, [maintenance, companyId]);

  const filteredRooms = useMemo(() => {
    return companyRooms
      .filter(r => {
        if (searchTerm) {
          return r.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 r.building?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      })
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => filterBuilding === 'all' || r.building === filterBuilding)
      .sort((a, b) => {
        // Sort by building then room number
        if (a.building !== b.building) return a.building?.localeCompare(b.building);
        return a.roomNumber?.localeCompare(b.roomNumber);
      });
  }, [companyRooms, searchTerm, filterStatus, filterBuilding]);

  const buildings = useMemo(() => {
    return [...new Set(companyRooms.map(r => r.building).filter(Boolean))];
  }, [companyRooms]);

  const stats = {
    totalRooms: companyRooms.length,
    available: companyRooms.filter(r => r.status === 'available').length,
    occupied: companyRooms.filter(r => r.status === 'occupied').length,
    maintenance: companyRooms.filter(r => r.status === 'maintenance').length,
    totalOccupancy: companyAssignments.filter(a => !a.checkOutDate).length,
    pendingMaintenance: companyMaintenance.filter(m => m.status === 'pending').length,
    monthlyRevenue: companyAssignments.reduce((sum, a) => sum + (parseFloat(a.rentShare) || 0), 0)
  };

  const handleSaveRoom = async (roomData) => {
    try {
      const data = {
        ...roomData,
        companyId,
        createdBy: user?.uid,
        createdAt: roomData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedRoom?.id) {
        await updateDoc(doc(db, 'rooms', selectedRoom.id), data);
        toast.success('Room updated successfully');
      } else {
        await addDoc(collection(db, 'rooms'), data);
        toast.success('Room created successfully');
      }

      setShowRoomModal(false);
      setSelectedRoom(null);
    } catch (error) {
      toast.error('Failed to save room: ' + error.message);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Are you sure you want to delete this room? This will also remove all assignments.')) return;
    try {
      await deleteDoc(doc(db, 'rooms', id));
      toast.success('Room deleted');
      setShowRoomModal(false);
      setSelectedRoom(null);
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const handleSaveAssignment = async (assignmentData) => {
    try {
      const data = {
        ...assignmentData,
        companyId,
        createdBy: user?.uid,
        createdAt: assignmentData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedAssignment?.id) {
        await updateDoc(doc(db, 'roomAssignments', selectedAssignment.id), data);
        toast.success('Assignment updated');
      } else {
        await addDoc(collection(db, 'roomAssignments'), data);
        // Update room status to occupied
        const roomRef = doc(db, 'rooms', assignmentData.roomId);
        await updateDoc(roomRef, { status: 'occupied' });
        toast.success('Room assigned successfully');
      }

      setShowAssignmentModal(false);
      setSelectedAssignment(null);
    } catch (error) {
      toast.error('Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm('Remove this room assignment?')) return;
    try {
      const assignment = companyAssignments.find(a => a.id === id);
      await deleteDoc(doc(db, 'roomAssignments', id));
      
      // Update room status back to available
      if (assignment?.roomId) {
        const roomRef = doc(db, 'rooms', assignment.roomId);
        await updateDoc(roomRef, { status: 'available' });
      }
      
      toast.success('Assignment removed');
      setShowAssignmentModal(false);
      setSelectedAssignment(null);
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleSaveMaintenance = async (maintenanceData) => {
    try {
      const data = {
        ...maintenanceData,
        companyId,
        createdBy: user?.uid,
        createdAt: maintenanceData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedMaintenance?.id) {
        await updateDoc(doc(db, 'maintenance', selectedMaintenance.id), data);
        toast.success('Maintenance request updated');
      } else {
        await addDoc(collection(db, 'maintenance'), data);
        // Update room status to maintenance
        const roomRef = doc(db, 'rooms', maintenanceData.roomId);
        await updateDoc(roomRef, { status: 'maintenance' });
        toast.success('Maintenance request created');
      }

      setShowMaintenanceModal(false);
      setSelectedMaintenance(null);
    } catch (error) {
      toast.error('Failed to save maintenance request');
    }
  };

  const handleDeleteMaintenance = async (id) => {
    if (!confirm('Delete this maintenance request?')) return;
    try {
      await deleteDoc(doc(db, 'maintenance', id));
      toast.success('Request deleted');
      setShowMaintenanceModal(false);
      setSelectedMaintenance(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleVacateRoom = async (assignment) => {
    if (!confirm('Mark this room as vacated?')) return;
    try {
      // Update assignment with check-out date
      await updateDoc(doc(db, 'roomAssignments', assignment.id), {
        checkOutDate: new Date().toISOString(),
        status: 'vacated',
        updatedAt: new Date().toISOString()
      });
      
      // Update room status
      const roomRef = doc(db, 'rooms', assignment.roomId);
      await updateDoc(roomRef, { 
        status: 'cleaning',
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Room vacated successfully');
    } catch (error) {
      toast.error('Failed to vacate room');
    }
  };

  if (roomsLoading || assignmentsLoading || maintenanceLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading accommodation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <Home className="h-full w-full text-white" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Staff Accommodation
          </h1>
          <p className="text-blue-100 mt-1">Manage rooms, assignments, and maintenance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Rooms', value: stats.totalRooms, icon: BedDouble, color: 'bg-blue-500' },
          { label: 'Available', value: stats.available, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Occupied', value: stats.occupied, icon: Users, color: 'bg-purple-500' },
          { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'bg-orange-500' },
          { label: 'Current Occupants', value: stats.totalOccupancy, icon: User, color: 'bg-pink-500' },
          { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b">
          {[
            { id: 'rooms', label: 'Room List', icon: BedDouble },
            { id: 'assignments', label: 'Room Assignments', icon: DoorOpen },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-6">
        {/* Room List Tab */}
        {activeTab === 'rooms' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="reserved">Reserved</option>
                </select>
                {buildings.length > 0 && (
                  <select
                    value={filterBuilding}
                    onChange={(e) => setFilterBuilding(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Buildings</option>
                    {buildings.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}
              </div>
              <button
                onClick={() => { setSelectedRoom(null); setShowRoomModal(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Room
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {filteredRooms.map(room => {
                const roomAssignments = companyAssignments.filter(a => a.roomId === room.id && !a.checkOutDate);
                const occupancy = roomAssignments.length;
                const occupancyPercent = (occupancy / room.capacity) * 100;

                return (
                  <div key={room.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Room {room.roomNumber}</h3>
                        <p className="text-sm text-gray-500">{room.building}, Floor {room.floor}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.status === 'available' ? 'bg-green-100 text-green-700' :
                        room.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                        room.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {room.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        {occupancy}/{room.capacity}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <BedDouble className="w-4 h-4" />
                        {room.beds}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Bath className="w-4 h-4" />
                        {room.bathrooms}
                      </div>
                    </div>

                    {room.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {room.amenities.slice(0, 4).map(amenity => (
                          <span key={amenity} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 4 && (
                          <span className="text-xs text-gray-500">+{room.amenities.length - 4}</span>
                        )}
                      </div>
                    )}

                    {room.monthlyRent && (
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        ${room.monthlyRent}/month
                      </p>
                    )}

                    {/* Occupancy Bar */}
                    <div className="mb-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyPercent >= 100 ? 'bg-red-500' :
                            occupancyPercent >= 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedRoom(room); setShowRoomModal(true); }}
                        className="flex-1 text-sm text-blue-600 hover:bg-blue-50 py-1.5 rounded"
                      >
                        Edit
                      </button>
                      {room.status === 'available' && (
                        <button
                          onClick={() => { setSelectedAssignment({ roomId: room.id }); setShowAssignmentModal(true); }}
                          className="flex-1 text-sm text-green-600 hover:bg-green-50 py-1.5 rounded"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <BedDouble className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No rooms found</p>
                <p className="text-sm">Add rooms to manage staff accommodation</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Current Room Assignments</h3>
              <button
                onClick={() => { setSelectedAssignment(null); setShowAssignmentModal(true); }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Assignment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">Room</th>
                    <th className="text-left py-3 px-4">Check-in</th>
                    <th className="text-left py-3 px-4">Rent</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {companyAssignments
                    .filter(a => !a.checkOutDate)
                    .map(assignment => {
                      const emp = employees.find(e => e.id === assignment.employeeId);
                      const room = companyRooms.find(r => r.id === assignment.roomId);
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                                {(emp?.FullName || emp?.name || '?').charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{emp?.FullName || emp?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">{emp?.Designation || emp?.position}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">Room {room?.roomNumber}</p>
                            <p className="text-sm text-gray-500">{room?.building}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p>{new Date(assignment.checkInDate).toLocaleDateString()}</p>
                            {assignment.expectedCheckOut && (
                              <p className="text-sm text-gray-500">
                                Until {new Date(assignment.expectedCheckOut).toLocaleDateString()}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">${assignment.rentShare || 0}/month</p>
                            {assignment.deposit > 0 && (
                              <p className="text-sm text-gray-500">Deposit: ${assignment.deposit}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedAssignment(assignment); setShowAssignmentModal(true); }}
                                className="p-2 text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleVacateRoom(assignment)}
                                className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded"
                              >
                                Vacate
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {companyAssignments.filter(a => !a.checkOutDate).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <DoorOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active assignments</p>
                <p className="text-sm">Assign rooms to staff members</p>
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Maintenance Requests</h3>
              <button
                onClick={() => { setSelectedMaintenance(null); setShowMaintenanceModal(true); }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>
            </div>

            <div className="space-y-3">
              {companyMaintenance
                .sort((a, b) => {
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map(request => {
                  const room = companyRooms.find(r => r.id === request.roomId);
                  return (
                    <div key={request.id} className={`rounded-xl p-4 border ${
                      request.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                      request.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                      request.status === 'completed' ? 'bg-green-50 border-green-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            request.priority === 'urgent' ? 'bg-red-100' :
                            request.priority === 'high' ? 'bg-orange-100' :
                            'bg-blue-100'
                          }`}>
                            <Wrench className={`w-5 h-5 ${
                              request.priority === 'urgent' ? 'text-red-600' :
                              request.priority === 'high' ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{request.type?.replace('_', ' ')}</p>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                request.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                                request.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                                request.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {request.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>Room {room?.roomNumber}</span>
                              <span>{room?.building}</span>
                              {request.scheduledDate && (
                                <span>Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            request.status === 'completed' ? 'bg-green-100 text-green-700' :
                            request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            request.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {request.status?.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => { setSelectedMaintenance(request); setShowMaintenanceModal(true); }}
                            className="p-2 text-gray-400 hover:text-orange-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {companyMaintenance.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No maintenance requests</p>
                <p className="text-sm">Create requests for repairs and maintenance</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <RoomModal
        isOpen={showRoomModal}
        onClose={() => { setShowRoomModal(false); setSelectedRoom(null); }}
        room={selectedRoom}
        onSave={handleSaveRoom}
        onDelete={handleDeleteRoom}
      />

      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => { setShowAssignmentModal(false); setSelectedAssignment(null); }}
        assignment={selectedAssignment}
        rooms={companyRooms.filter(r => r.status === 'available' || r.id === selectedAssignment?.roomId)}
        employees={employees.filter(e => e.companyId === companyId && e.status === 'active')}
        onSave={handleSaveAssignment}
        onDelete={handleDeleteAssignment}
      />

      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => { setShowMaintenanceModal(false); setSelectedMaintenance(null); }}
        request={selectedMaintenance}
        rooms={companyRooms}
        onSave={handleSaveMaintenance}
        onDelete={handleDeleteMaintenance}
      />
    </div>
  );
}
