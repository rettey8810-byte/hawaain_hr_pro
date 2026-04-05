import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Plane, 
  Ship, 
  Bus,
  User,
  FileText,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Briefcase,
  Search,
  ChevronDown,
  WifiOff
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const LEAVE_TYPES = [
  { value: 'annual', label: '🏖️ Annual Leave', color: 'bg-blue-100 text-blue-700' },
  { value: 'sick', label: '🤒 Sick Leave', color: 'bg-rose-100 text-rose-700' },
  { value: 'emergency', label: '🚨 Emergency Leave', color: 'bg-red-100 text-red-700' },
  { value: 'unpaid', label: '💰 Unpaid Leave', color: 'bg-gray-100 text-gray-700' },
  { value: 'other', label: '📋 Other', color: 'bg-purple-100 text-purple-700' }
];

const TRANSPORT_MODES = [
  { value: 'air', label: '✈️ Air (Flight)', icon: Plane },
  { value: 'sea', label: '🚢 Sea (Ship)', icon: Ship },
  { value: 'land', label: '🚌 Land (Bus/Car)', icon: Bus }
];

export default function LeaveApplication() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, userData, isHR } = useAuth();
  const { addDocument, updateDocument, getDocumentById } = useFirestore('leaves');
  const { isOnline, saveDraft, getDraft, clearDraft, addPendingSubmission } = useOffline();
  const [lastSaved, setLastSaved] = useState(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(id ? true : false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    employeeId: isHR() ? '' : userData?.employeeId || '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    days: 0,
    destination: '',
    reason: '',
    contactNumber: '',
    contactEmail: '',
    transportation: {
      required: false,
      mode: 'air',
      fromLocation: '',
      toLocation: '',
      preferredTime: '',
      specialRequests: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    status: 'pending'
  });

  // Employee search dropdown state
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const employeeDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchTerm) return employees;
    return employees.filter(emp => 
      (emp.FullName || emp.name || '')?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      (emp.EmpID || emp.employeeCode || '')?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );
  }, [employees, employeeSearchTerm]);

  // Get selected employee name
  const selectedEmployeeName = useMemo(() => {
    const emp = employees.find(e => e.id === formData.employeeId);
    return emp ? `${emp.FullName || emp.name || 'N/A'} - ${emp.EmpID || emp.employeeCode || emp.id.slice(-6)}` : '';
  }, [employees, formData.employeeId]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!id) { // Only auto-save for new applications
      const interval = setInterval(() => {
        if (formData.startDate || formData.destination || formData.reason) {
          saveDraft('leave_application', formData);
          setLastSaved(new Date());
        }
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [formData, id, saveDraft]);

  // Load draft on mount (for new applications only)
  useEffect(() => {
    if (!id) {
      const draft = getDraft('leave_application');
      if (draft?.data) {
        setFormData(prev => ({ ...prev, ...draft.data }));
        setLastSaved(new Date(draft.timestamp));
      }
    }
  }, [id, getDraft]);

  // Show offline banner when quota exceeded
  useEffect(() => {
    setShowOfflineBanner(!isOnline);
  }, [isOnline]);

  // Fetch employees for HR selection
  const fetchEmployees = useCallback(async () => {
    if (!userData?.companyId) return;
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', userData.companyId),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, [userData?.companyId]);

  // Fetch existing leave data if editing
  const fetchLeaveData = useCallback(async () => {
    if (!id) return;
    try {
      const leaveData = await getDocumentById(id);
      if (leaveData) {
        setFormData({
          ...leaveData,
          transportation: leaveData.transportation || {
            required: false,
            mode: 'air',
            fromLocation: '',
            toLocation: '',
            preferredTime: '',
            specialRequests: ''
          },
          emergencyContact: leaveData.emergencyContact || {
            name: '',
            relationship: '',
            phone: ''
          }
        });
      }
    } catch (err) {
      console.error('Error fetching leave data:', err);
      setError('Failed to load leave data');
    } finally {
      setFetchingData(false);
    }
  }, [id, getDocumentById]);

  useEffect(() => {
    if (isHR()) {
      fetchEmployees();
    }
    if (id) {
      fetchLeaveData();
    }
  }, [isHR, id, fetchEmployees, fetchLeaveData]);

  // Calculate days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, days: diffDays }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleTransportChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      transportation: { ...prev.transportation, [field]: value }
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value }
    }));
  };

  const validateForm = () => {
    if (isHR() && !formData.employeeId) return 'Please select an employee';
    if (!formData.startDate) return 'Please select start date';
    if (!formData.endDate) return 'Please select end date';
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return 'End date must be after start date';
    }
    if (!formData.destination.trim()) return 'Please enter destination';
    if (!formData.reason.trim()) return 'Please enter reason for leave';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if user is logged in
    console.log('Auth state:', { userExists: !!user, userUid: user?.uid, userDataExists: !!userData });
    if (!user?.uid) {
      setError('You must be logged in to submit a leave application. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean up undefined values from formData
      const cleanFormData = JSON.parse(JSON.stringify(formData));
      
      const leaveData = {
        ...cleanFormData,
        companyId: userData?.companyId || '',
        appliedBy: user.uid,
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (id) {
        await updateDocument(id, leaveData);
        setSuccess('Leave application updated successfully!');
        clearDraft('leave_application');
      } else {
        await addDocument(leaveData);
        setSuccess('Leave application submitted successfully!');
        clearDraft('leave_application');
      }

      setTimeout(() => {
        navigate('/leave-planner');
      }, 1500);
    } catch (err) {
      console.error('Error saving leave:', err);
      setError('Failed to save leave application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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
            <h2 className="text-2xl font-bold text-gray-900">
              {id ? '✏️ Edit Leave Application' : '📝 Apply for Leave'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {id ? 'Update your leave application details' : 'Submit a new leave request'}
            </p>
          </div>
        </div>
      </div>

      {/* Offline/Quota Warning */}
      {showOfflineBanner && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center text-amber-800">
          <WifiOff className="h-5 w-5 mr-3" />
          <div className="flex-1">
            <p className="font-medium">⚠️ Firebase Quota Exceeded or Offline</p>
            <p className="text-sm text-amber-700">
              Your form is being auto-saved locally. You can submit when connection is restored.
              {lastSaved && <span> Last saved: {lastSaved.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              saveDraft('leave_application', formData);
              setLastSaved(new Date());
            }}
            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg text-sm font-medium"
          >
            Save Now
          </button>
        </div>
      )}

      {/* Auto-save indicator */}
      {!showOfflineBanner && lastSaved && !id && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center text-blue-700 text-sm">
          <Save className="h-4 w-4 mr-2" />
          Draft saved at {lastSaved.toLocaleTimeString()}
          <button
            type="button"
            onClick={() => {
              clearDraft('leave_application');
              setLastSaved(null);
            }}
            className="ml-auto text-blue-600 hover:text-blue-800 text-xs underline"
          >
            Clear Draft
          </button>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection - HR Only */}
        {isHR() && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-emerald-500" />
              👤 Select Employee
            </h3>
            <div className="relative" ref={employeeDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee <span className="text-red-500">*</span>
              </label>
              
              {/* Searchable Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.employeeId ? selectedEmployeeName : employeeSearchTerm}
                  onChange={(e) => {
                    if (!formData.employeeId) {
                      setEmployeeSearchTerm(e.target.value);
                      setShowEmployeeDropdown(true);
                    } else {
                      // Clear selection and start new search
                      handleInputChange('employeeId', '');
                      setEmployeeSearchTerm(e.target.value);
                      setShowEmployeeDropdown(true);
                    }
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  placeholder="🔍 Type to search employees..."
                  className="block w-full rounded-xl border-gray-300 pl-12 pr-12 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                  required
                />
                <ChevronDown 
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform ${showEmployeeDropdown ? 'rotate-180' : ''}`} 
                />
              </div>

              {/* Dropdown */}
              {showEmployeeDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                      No employees found
                    </div>
                  ) : (
                    <>
                      <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                      </div>
                      {filteredEmployees.map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('employeeId', emp.id);
                            setEmployeeSearchTerm('');
                            setShowEmployeeDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center ${
                            formData.employeeId === emp.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                            {(emp.FullName || emp.name || '?')?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{emp.FullName || emp.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">
                              {emp.EmpID || emp.employeeCode || emp.id.slice(-6)} • {emp['Department '] || emp.Department || emp.department || 'No department'} • {emp.Designation || emp.position || 'No position'}
                            </p>
                          </div>
                          {formData.employeeId === emp.id && (
                            <CheckCircle className="h-5 w-5 text-emerald-500 ml-2" />
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Selected Employee Badge */}
              {formData.employeeId && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm mr-2">
                    {(employees.find(e => e.id === formData.employeeId)?.FullName || employees.find(e => e.id === formData.employeeId)?.name || '?')?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-emerald-800">
                    Selected: {selectedEmployeeName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('employeeId', '');
                      setEmployeeSearchTerm('');
                    }}
                    className="ml-auto text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leave Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-500" />
            📅 Leave Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {LEAVE_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('leaveType', type.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.leaveType === type.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                  required
                />
              </div>
              {formData.days > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center text-emerald-700">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-medium">Total Days: {formData.days} days</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="Enter destination city/country..."
                className="block w-full rounded-xl border-gray-300 pl-12 pr-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
              placeholder="Please provide details about your leave request..."
              className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              required
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-emerald-500" />
            📞 Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Your phone number during leave..."
                className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="Your email during leave..."
                className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-rose-500" />
            🚨 Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                placeholder="Emergency contact name..."
                className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                placeholder="e.g., Spouse, Parent..."
                className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                placeholder="Emergency contact phone..."
                className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>
          </div>
        </div>

        {/* Transportation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Plane className="h-5 w-5 mr-2 text-blue-500" />
              ✈️ Transportation Required?
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.transportation.required}
                onChange={(e) => handleTransportChange('required', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.transportation.required ? 'Yes, arrange transport' : 'No transport needed'}
              </span>
            </label>
          </div>

          {formData.transportation.required && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              {/* Transport Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mode of Transport <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {TRANSPORT_MODES.map(mode => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => handleTransportChange('mode', mode.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formData.transportation.mode === mode.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <span className="font-medium">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.transportation.fromLocation}
                    onChange={(e) => handleTransportChange('fromLocation', e.target.value)}
                    placeholder="Departure city/airport..."
                    className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                    required={formData.transportation.required}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.transportation.toLocation}
                    onChange={(e) => handleTransportChange('toLocation', e.target.value)}
                    placeholder="Destination city/airport..."
                    className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                    required={formData.transportation.required}
                  />
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Departure Time
                </label>
                <input
                  type="text"
                  value={formData.transportation.preferredTime}
                  onChange={(e) => handleTransportChange('preferredTime', e.target.value)}
                  placeholder="e.g., Morning, Afternoon, Evening, or specific time..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  value={formData.transportation.specialRequests}
                  onChange={(e) => handleTransportChange('specialRequests', e.target.value)}
                  rows={2}
                  placeholder="Any special requirements for travel (e.g., seat preference, meal requirements, etc.)..."
                  className="block w-full rounded-xl border-gray-300 pl-4 py-3 text-base focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/leave-planner')}
            className="px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5 inline mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-base font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 inline mr-2" />
                {id ? 'Update Application' : 'Submit Application'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
