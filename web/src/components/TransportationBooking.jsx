import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plane, 
  Ship, 
  Bus,
  DollarSign,
  Ticket,
  CheckCircle,
  Send,
  Clock,
  MapPin,
  User,
  Calendar,
  FileText,
  AlertCircle,
  Upload,
  Download,
  ExternalLink
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const TRANSPORT_STATUS = {
  quotation_received: { label: '📋 Quotation Received', color: 'blue', next: 'tickets_purchased' },
  tickets_purchased: { label: '🎫 Tickets Purchased', color: 'purple', next: 'departed' },
  departed: { label: '✈️ Departed', color: 'indigo', next: 'arrived' },
  arrived: { label: '📍 Arrived', color: 'emerald', next: null }
};

const TRANSPORT_MODES = {
  air: { label: '✈️ Air (Flight)', icon: Plane },
  sea: { label: '🚢 Sea (Ship)', icon: Ship },
  land: { label: '🚌 Land (Bus/Car)', icon: Bus }
};

export default function TransportationBooking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userData, isHR } = useAuth();
  const { updateDocument, getDocumentById } = useFirestore('leaves');
  
  const [leave, setLeave] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [transportData, setTransportData] = useState({
    // Quotation
    quotationReceived: false,
    quotationAmount: '',
    quotationDate: '',
    quotationProvider: '',
    quotationNotes: '',
    quotationDocument: null,
    
    // Tickets
    ticketsPurchased: false,
    ticketNumber: '',
    purchaseDate: '',
    purchaseAmount: '',
    airlineCompany: '',
    ticketDocument: null,
    
    // Departure
    departed: false,
    departureDate: '',
    departureTime: '',
    departureTerminal: '',
    gateNumber: '',
    
    // Arrival
    arrived: false,
    arrivalDate: '',
    arrivalTime: '',
    arrivalTerminal: '',
    
    // Current Status
    status: 'quotation_received'
  });

  // Fetch leave data
  const fetchLeaveData = useCallback(async () => {
    if (!id) return;
    try {
      const leaveData = await getDocumentById(id);
      if (leaveData) {
        setLeave(leaveData);
        
        // Set existing transport data if available
        if (leaveData.transportBooking) {
          setTransportData(prev => ({
            ...prev,
            ...leaveData.transportBooking
          }));
        }
        
        // Fetch employee details
        if (leaveData.employeeId) {
          // Extract EmpID from format "sunisland-resort-and-spa_XXXXX" or "villa-park_XXXXX"
          let searchEmpId = leaveData.employeeId;
          if (typeof leaveData.employeeId === 'string' && leaveData.employeeId.includes('_')) {
            const parts = leaveData.employeeId.split('_');
            searchEmpId = parts[parts.length - 1];
          }
          
          const empQuery = query(
            collection(db, 'employees'),
            where('EmpID', '==', searchEmpId)
          );
          const empSnap = await getDocs(empQuery);
          if (!empSnap.empty) {
            setEmployee({ id: empSnap.docs[0].id, ...empSnap.docs[0].data() });
          }
        }
      } else {
        setError('Leave application not found');
      }
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }, [id, getDocumentById]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const handleInputChange = (field, value) => {
    setTransportData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleUpdateStatus = async (newStatus) => {
    setSubmitting(true);
    setError('');

    try {
      const updateData = {
        'transportation.status': newStatus,
        transportBooking: {
          ...transportData,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: userData?.uid
        },
        updatedAt: new Date().toISOString()
      };

      // Update specific fields based on status
      if (newStatus === 'quotation_received') {
        updateData.transportBooking.quotationReceived = true;
        updateData.transportBooking.quotationDate = new Date().toISOString();
      } else if (newStatus === 'tickets_purchased') {
        updateData.transportBooking.ticketsPurchased = true;
        updateData.transportBooking.purchaseDate = new Date().toISOString();
      } else if (newStatus === 'departed') {
        updateData.transportBooking.departed = true;
        updateData.transportBooking.departureDate = new Date().toISOString();
      } else if (newStatus === 'arrived') {
        updateData.transportBooking.arrived = true;
        updateData.transportBooking.arrivalDate = new Date().toISOString();
      }

      await updateDocument(id, updateData);
      
      setTransportData(prev => ({ ...prev, status: newStatus }));
      setSuccess(`Status updated to: ${TRANSPORT_STATUS[newStatus].label}`);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating transport:', err);
      setError('Failed to update transportation status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await updateDocument(id, {
        transportBooking: {
          ...transportData,
          updatedAt: new Date().toISOString(),
          updatedBy: userData?.uid
        },
        updatedAt: new Date().toISOString()
      });
      
      setSuccess('Transportation details saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving transport details:', err);
      setError('Failed to save transportation details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700 mb-2">Error</h3>
          <p className="text-red-600">{error || 'Leave application not found'}</p>
          <button
            onClick={() => navigate('/leave-planner')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Only HR can manage transport
  if (!isHR()) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-amber-700 mb-2">Access Denied</h3>
          <p className="text-amber-600">Only HR managers can manage transportation bookings.</p>
          <button
            onClick={() => navigate('/leave-planner')}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const TransportIcon = TRANSPORT_MODES[leave.transportation?.mode]?.icon || Plane;
  const currentStatus = TRANSPORT_STATUS[transportData.status];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/leave-planner')}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">✈️ Transportation Booking</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage travel arrangements for leave
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-700">
          <CheckCircle className="h-5 w-5 mr-3" />
          {success}
        </div>
      )}

      {/* Trip Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-xl mr-4">
              <TransportIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{employee?.name || 'Unknown'}</h3>
              <p className="text-white/80">
                {leave.transportation?.fromLocation} → {leave.transportation?.toLocation}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">Travel Date</p>
            <p className="text-lg font-bold">{formatDate(leave.startDate)}</p>
          </div>
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Booking Progress</h3>
        <div className="flex items-center justify-between">
          {Object.entries(TRANSPORT_STATUS).map(([key, status], index) => {
            const isActive = transportData.status === key;
            const isCompleted = Object.keys(TRANSPORT_STATUS).indexOf(transportData.status) > index;
            
            return (
              <div key={key} className="flex items-center">
                <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    isActive ? `bg-${status.color}-500 text-white` :
                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center max-w-24 ${
                    isActive ? `text-${status.color}-600` :
                    isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {status.label}
                  </span>
                </div>
                {index < Object.keys(TRANSPORT_STATUS).length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Update Status Button */}
        {currentStatus?.next && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => handleUpdateStatus(currentStatus.next)}
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  Mark as {TRANSPORT_STATUS[currentStatus.next].label}
                </>
              )}
            </button>
          </div>
        )}

        {transportData.status === 'arrived' && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-700 font-bold">Journey Complete!</p>
            <p className="text-emerald-600 text-sm">Employee has arrived at destination.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Quotation & Tickets */}
        <div className="space-y-6">
          {/* Quotation Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
              💰 Quotation Details
            </h3>
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quotation Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={transportData.quotationAmount}
                    onChange={(e) => handleInputChange('quotationAmount', e.target.value)}
                    placeholder="Enter amount..."
                    className="block w-full rounded-xl border-gray-300 pl-12 pr-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider/Agency
                </label>
                <input
                  type="text"
                  value={transportData.quotationProvider}
                  onChange={(e) => handleInputChange('quotationProvider', e.target.value)}
                  placeholder="e.g., Emirates Airlines, Travel Agency..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quotation Notes
                </label>
                <textarea
                  value={transportData.quotationNotes}
                  onChange={(e) => handleInputChange('quotationNotes', e.target.value)}
                  rows={2}
                  placeholder="Any notes about the quotation..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quotation Document
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <Upload className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Upload quotation PDF</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Ticket Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Ticket className="h-5 w-5 mr-2 text-purple-500" />
              🎫 Ticket Details
            </h3>
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket/Booking Number
                </label>
                <input
                  type="text"
                  value={transportData.ticketNumber}
                  onChange={(e) => handleInputChange('ticketNumber', e.target.value)}
                  placeholder="e.g., EK123456789..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-purple-500 focus:ring-purple-500 sm:text-sm border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Airline/Transport Company
                </label>
                <input
                  type="text"
                  value={transportData.airlineCompany}
                  onChange={(e) => handleInputChange('airlineCompany', e.target.value)}
                  placeholder="e.g., Emirates, Qatar Airways..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-purple-500 focus:ring-purple-500 sm:text-sm border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={transportData.purchaseAmount}
                    onChange={(e) => handleInputChange('purchaseAmount', e.target.value)}
                    placeholder="Final purchase amount..."
                    className="block w-full rounded-xl border-gray-300 pl-12 pr-4 py-3 text-base focus:border-purple-500 focus:ring-purple-500 sm:text-sm border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Document
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
                  >
                    <Upload className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Upload ticket PDF</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Travel Details */}
        <div className="space-y-6">
          {/* Departure Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Send className="h-5 w-5 mr-2 text-indigo-500" />
              🛫 Departure Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={transportData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                    className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={transportData.departureTime}
                    onChange={(e) => handleInputChange('departureTime', e.target.value)}
                    className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terminal/Station
                </label>
                <input
                  type="text"
                  value={transportData.departureTerminal}
                  onChange={(e) => handleInputChange('departureTerminal', e.target.value)}
                  placeholder="e.g., Terminal 3, Dubai International..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gate/Platform Number
                </label>
                <input
                  type="text"
                  value={transportData.gateNumber}
                  onChange={(e) => handleInputChange('gateNumber', e.target.value)}
                  placeholder="e.g., Gate A12..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
                />
              </div>
            </div>
          </div>

          {/* Arrival Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-emerald-500" />
              🛬 Arrival Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={transportData.arrivalDate}
                    onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                    className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={transportData.arrivalTime}
                    onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                    className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival Terminal/Station
                </label>
                <input
                  type="text"
                  value={transportData.arrivalTerminal}
                  onChange={(e) => handleInputChange('arrivalTerminal', e.target.value)}
                  placeholder="e.g., Terminal 1, Male International..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveDetails}
            disabled={submitting}
            className="w-full px-6 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 inline mr-2" />
                Save All Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
