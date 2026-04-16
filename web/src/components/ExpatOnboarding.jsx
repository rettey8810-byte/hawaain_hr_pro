import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { 
  FileText, CheckCircle, XCircle, Plane, Home, UserCheck, 
  Calendar, CreditCard, Ticket, MapPin, Building, Upload,
  ChevronRight, ChevronDown, Clock, AlertTriangle, Save,
  UserPlus, Briefcase, ArrowRightLeft
} from 'lucide-react';

// Required documents for expats
const REQUIRED_DOCUMENTS = [
  { id: 'passport_copy', name: 'Passport Copy', required: true },
  { id: 'photo', name: 'Passport Size Photo (2)', required: true },
  { id: 'cv', name: 'Updated CV', required: true },
  { id: 'experience_cert', name: 'Experience Certificates', required: true },
  { id: 'education_cert', name: 'Education Certificates', required: true },
  { id: 'medical_report', name: 'Medical Report', required: true },
  { id: 'police_clearance', name: 'Police Clearance', required: true },
  { id: 'birth_certificate', name: 'Birth Certificate', required: false },
  { id: 'marriage_certificate', name: 'Marriage Certificate (if applicable)', required: false },
];

// Onboarding stages
const ONBOARDING_STAGES = [
  { id: 'offer_accepted', label: 'Offer Accepted', icon: CheckCircle, color: 'green' },
  { id: 'documents_pending', label: 'Documents Required', icon: FileText, color: 'yellow' },
  { id: 'documents_received', label: 'Documents Received', icon: CheckCircle, color: 'blue' },
  { id: 'visa_application', label: 'Visa Application', icon: FileText, color: 'purple' },
  { id: 'visa_payment', label: 'Visa Payment', icon: CreditCard, color: 'orange' },
  { id: 'entry_pass', label: 'Entry Pass', icon: Ticket, color: 'cyan' },
  { id: 'tickets_booked', label: 'Tickets Booked', icon: Plane, color: 'indigo' },
  { id: 'accommodation_assigned', label: 'Accommodation', icon: Home, color: 'pink' },
  { id: 'arrival', label: 'Arrived', icon: MapPin, color: 'emerald' },
  { id: 'registered', label: 'Registered', icon: UserCheck, color: 'teal' },
  { id: 'handed_over', label: 'Handed to Dept', icon: Building, color: 'blue' },
  { id: 'employee_created', label: 'Employee Created', icon: UserPlus, color: 'green' },
];

export default function ExpatOnboarding({ candidate, onClose, onComplete }) {
  const { companyId } = useCompany();
  const { userData } = useAuth();
  
  const [activeStage, setActiveStage] = useState(candidate?.onboardingStage || 'offer_accepted');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState(candidate?.documents || {});
  const [visaDetails, setVisaDetails] = useState(candidate?.visaDetails || {
    applied: false,
    applicationDate: '',
    visaType: 'work',
    status: 'pending',
    referenceNumber: ''
  });
  const [visaPayment, setVisaPayment] = useState(candidate?.visaPayment || {
    paid: false,
    amount: '',
    paymentDate: '',
    receiptNumber: ''
  });
  const [entryPass, setEntryPass] = useState(candidate?.entryPass || {
    issued: false,
    passNumber: '',
    issueDate: '',
    validUntil: ''
  });
  const [tickets, setTickets] = useState(candidate?.tickets || {
    destinationToMale: { booked: false, flightNumber: '', departureDate: '', arrivalDate: '', mode: 'air' },
    maleToVillaPark: { booked: false, flightNumber: '', departureDate: '', arrivalDate: '', mode: 'sea' }
  });
  const [accommodation, setAccommodation] = useState(candidate?.accommodation || {
    assigned: false,
    roomId: '',
    roomNumber: '',
    building: ''
  });
  const [arrival, setArrival] = useState(candidate?.arrival || {
    arrived: false,
    arrivalDate: '',
    arrivalTime: '',
    receivedBy: ''
  });
  const [registration, setRegistration] = useState(candidate?.registration || {
    registered: false,
    registrationDate: '',
    documentsSubmitted: [],
    employeeIdAssigned: ''
  });
  const [handover, setHandover] = useState(candidate?.handover || {
    handedOver: false,
    handoverDate: '',
    departmentHead: '',
    notes: ''
  });
  const [showAllRooms, setShowAllRooms] = useState(false);

  const { documents: rooms } = useFirestore('rooms');
  const { documents: employees } = useFirestore('employees');
  const { documents: jobPostings } = useFirestore('jobPostings');
  
  // Fetch job details from jobPostings if candidate only has jobId
  const candidateJob = candidate.jobId ? jobPostings.find(j => j.id === candidate.jobId) : null;
  
  // Ensure candidate has job details - check multiple possible field locations
  const jobTitle = candidate.jobTitle || candidate.jobPosition || candidate.position || 
                   candidate.job?.title || candidateJob?.title || 'Unknown Position';
  const jobDepartment = candidate.jobDepartment || candidate.department || 
                        candidate.job?.department || candidate.dept || candidateJob?.department || 'Unknown Department';
  
  const candidateWithJob = {
    ...candidate,
    jobTitle,
    jobDepartment
  };
  
  // Debug log to help troubleshoot
  console.log('ExpatOnboarding - Candidate data:', { 
    id: candidate.id, 
    name: candidate.name, 
    jobTitle, 
    jobDepartment,
    jobId: candidate.jobId,
    foundJob: candidateJob ? 'yes' : 'no',
    rawJobTitle: candidate.jobTitle,
    rawJobPosition: candidate.jobPosition,
    rawPosition: candidate.position,
    rawJob: candidate.job,
    rawDepartment: candidate.department
  });

  // Filter rooms - show available rooms or rooms without status (treat as available)
  const availableRooms = rooms.filter(r => 
    r.companyId === companyId && 
    (r.status === 'available' || !r.status || r.status === '' || r.status === 'vacant')
  );
  
  // All company rooms (when showing all)
  const allCompanyRooms = rooms.filter(r => r.companyId === companyId);
  
  // Use available rooms or all rooms if toggle is on
  const companyRooms = showAllRooms ? allCompanyRooms : availableRooms;
  
  // Also get occupied rooms for debugging
  const occupiedRooms = rooms.filter(r => r.companyId === companyId && r.status === 'occupied');

  // Calculate progress
  const getStageIndex = (stageId) => ONBOARDING_STAGES.findIndex(s => s.id === stageId);
  const currentStageIndex = getStageIndex(activeStage);
  const progress = ((currentStageIndex + 1) / ONBOARDING_STAGES.length) * 100;

  // Check if all documents received
  const requiredDocsReceived = REQUIRED_DOCUMENTS
    .filter(d => d.required)
    .every(d => documents[d.id]?.received);
  const allDocsReceived = REQUIRED_DOCUMENTS.every(d => !d.required || documents[d.id]?.received);

  const handleDocumentToggle = (docId) => {
    setDocuments(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        received: !prev[docId]?.received,
        receivedDate: !prev[docId]?.received ? new Date().toISOString() : null
      }
    }));
  };

  const handleSaveProgress = async () => {
    setLoading(true);
    try {
      const updateData = {
        onboardingStage: activeStage,
        documents,
        visaDetails,
        visaPayment,
        entryPass,
        tickets,
        accommodation,
        arrival,
        registration,
        handover,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'candidates', candidateWithJob.id), updateData);
      toast.success('Progress saved successfully');
    } catch (error) {
      toast.error('Failed to save progress: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStage = async (newStage) => {
    setActiveStage(newStage);
    await handleSaveProgress();
  };

  const handleCreateEmployee = async () => {
    console.log('handleCreateEmployee clicked');
    setLoading(true);
    try {
      console.log('Creating employee with candidate:', candidateWithJob);
      // Create employee from candidate data
      const employeeData = {
        companyId,
        name: candidateWithJob.name,
        email: candidateWithJob.email,
        phone: candidateWithJob.phone,
        department: candidateWithJob.jobDepartment || '',
        designation: candidateWithJob.jobTitle || '',
        status: 'active',
        employeeType: 'expat',
        joiningDate: arrival.arrivalDate || new Date().toISOString(),
        accommodationId: accommodation.roomId,
        probationStartDate: new Date().toISOString(),
        probationPeriod: '3 months',
        // Documents reference - ensure no undefined values
        documentReferences: {
          passport: documents.passport_copy?.fileUrl || null,
          cv: documents.cv?.fileUrl || null,
          medical: documents.medical_report?.fileUrl || null
        },
        // Visa info
        visaType: visaDetails.visaType,
        visaReference: visaDetails.referenceNumber,
        // Created from onboarding
        createdFromCandidateId: candidateWithJob.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const empRef = await addDoc(collection(db, 'employees'), employeeData);
      
      // Create probation evaluation schedule
      const probationSchedule = [
        { month: 1, title: '1 Month Review', dueDate: addMonths(new Date(), 1), status: 'pending' },
        { month: 2, title: '2 Month Review', dueDate: addMonths(new Date(), 2), status: 'pending' },
        { month: 3, title: '3 Month Review', dueDate: addMonths(new Date(), 3), status: 'pending' },
        { month: 12, title: 'Annual Review', dueDate: addMonths(new Date(), 12), status: 'pending' }
      ];

      await addDoc(collection(db, 'probationEvaluations'), {
        employeeId: empRef.id,
        employeeName: candidateWithJob.name,
        companyId,
        schedule: probationSchedule,
        currentStatus: 'probation',
        createdAt: new Date().toISOString()
      });

      // Update candidate
      await updateDoc(doc(db, 'candidates', candidateWithJob.id), {
        stage: 'hired',
        status: 'hired',
        employeeId: empRef.id,
        onboardingStage: 'employee_created',
        hiredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('Employee created successfully with probation schedule');
      console.log('Employee created:', empRef.id);
      onComplete && onComplete(empRef.id);
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to add months
  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
  };

  const renderStageContent = () => {
    switch (activeStage) {
      case 'offer_accepted':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Offer Accepted
              </h3>
              <p className="text-green-700 mt-2">
                Candidate <strong>{candidateWithJob.name}</strong> has accepted the offer for <strong>{candidateWithJob.jobTitle}</strong>.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleAdvanceStage('documents_pending')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Start Document Collection
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'documents_pending':
      case 'documents_received':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Required Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REQUIRED_DOCUMENTS.map(doc => (
                <div 
                  key={doc.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    documents[doc.id]?.received ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDocumentToggle(doc.id)}
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        documents[doc.id]?.received ? 'bg-green-500 text-white' : 'bg-gray-300'
                      }`}
                    >
                      {documents[doc.id]?.received && <CheckCircle className="h-4 w-4" />}
                    </button>
                    <div>
                      <span className={documents[doc.id]?.received ? 'line-through text-gray-500' : ''}>
                        {doc.name}
                      </span>
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  </div>
                  {documents[doc.id]?.received && (
                    <span className="text-xs text-green-600">
                      {new Date(documents[doc.id].receivedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Required documents:</strong> {REQUIRED_DOCUMENTS.filter(d => d.required).filter(d => documents[d.id]?.received).length} / {REQUIRED_DOCUMENTS.filter(d => d.required).length} received
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>All documents:</strong> {REQUIRED_DOCUMENTS.filter(d => documents[d.id]?.received).length} / {REQUIRED_DOCUMENTS.length} received
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('offer_accepted')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!requiredDocsReceived) {
                    toast.error('All required documents must be received first');
                    return;
                  }
                  handleAdvanceStage('visa_application');
                }}
                disabled={!requiredDocsReceived}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                Proceed to Visa
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'visa_application':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Visa Application
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Visa Type</label>
                <select
                  value={visaDetails.visaType}
                  onChange={(e) => setVisaDetails({...visaDetails, visaType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="work">Work Visa</option>
                  <option value="business">Business Visa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Application Date</label>
                <input
                  type="date"
                  value={visaDetails.applicationDate}
                  onChange={(e) => setVisaDetails({...visaDetails, applicationDate: e.target.value, applied: true})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference Number</label>
                <input
                  type="text"
                  value={visaDetails.referenceNumber}
                  onChange={(e) => setVisaDetails({...visaDetails, referenceNumber: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., VISA-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={visaDetails.status}
                  onChange={(e) => setVisaDetails({...visaDetails, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('documents_received')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!visaDetails.applied) {
                    toast.error('Please enter application date');
                    return;
                  }
                  handleAdvanceStage('visa_payment');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Proceed to Payment
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'visa_payment':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Visa Payment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={visaPayment.amount}
                  onChange={(e) => setVisaPayment({...visaPayment, amount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., 250"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date</label>
                <input
                  type="date"
                  value={visaPayment.paymentDate}
                  onChange={(e) => setVisaPayment({...visaPayment, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={visaPayment.receiptNumber}
                  onChange={(e) => setVisaPayment({...visaPayment, receiptNumber: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., REC-2024-001"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visaPayment.paid}
                    onChange={(e) => setVisaPayment({...visaPayment, paid: e.target.checked})}
                    className="h-5 w-5"
                  />
                  <span className="font-medium">Payment Completed</span>
                </label>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('visa_application')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!visaPayment.paid) {
                    toast.error('Please confirm payment is completed');
                    return;
                  }
                  handleAdvanceStage('entry_pass');
                }}
                disabled={!visaPayment.paid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                Generate Entry Pass
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'entry_pass':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Ticket className="h-5 w-5 text-cyan-600" />
              Entry Pass
            </h3>
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <p className="text-cyan-800 text-sm">
                Entry pass can be generated after visa payment is confirmed. This allows {candidateWithJob.name} to enter Maldives.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pass Number</label>
                <input
                  type="text"
                  value={entryPass.passNumber}
                  onChange={(e) => setEntryPass({...entryPass, passNumber: e.target.value, issued: true})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., EP-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  value={entryPass.issueDate}
                  onChange={(e) => setEntryPass({...entryPass, issueDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid Until</label>
                <input
                  type="date"
                  value={entryPass.validUntil}
                  onChange={(e) => setEntryPass({...entryPass, validUntil: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('visa_payment')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!entryPass.passNumber) {
                    toast.error('Please enter pass number');
                    return;
                  }
                  handleAdvanceStage('tickets_booked');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Book Tickets
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'tickets_booked':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Plane className="h-5 w-5 text-indigo-600" />
              Ticket Booking
            </h3>
            
            {/* Destination to Male */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                1. Destination to Male (Velana International Airport)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mode</label>
                  <select
                    value={tickets.destinationToMale.mode}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      destinationToMale: {...tickets.destinationToMale, mode: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="air">Air (Flight)</option>
                    <option value="sea">Sea (Boat/Ferry)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Flight/Boat Number</label>
                  <input
                    type="text"
                    value={tickets.destinationToMale.flightNumber}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      destinationToMale: {...tickets.destinationToMale, flightNumber: e.target.value, booked: true}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., QR 1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={tickets.destinationToMale.departureDate}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      destinationToMale: {...tickets.destinationToMale, departureDate: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival at Male</label>
                  <input
                    type="datetime-local"
                    value={tickets.destinationToMale.arrivalDate}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      destinationToMale: {...tickets.destinationToMale, arrivalDate: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Male to Villa Park */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                2. Male to Villa Park Resort
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mode</label>
                  <select
                    value={tickets.maleToVillaPark.mode}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      maleToVillaPark: {...tickets.maleToVillaPark, mode: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="sea">Sea (Speedboat/Ferry)</option>
                    <option value="air">Air (Seaplane)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Boat/Flight Number</label>
                  <input
                    type="text"
                    value={tickets.maleToVillaPark.flightNumber}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      maleToVillaPark: {...tickets.maleToVillaPark, flightNumber: e.target.value, booked: true}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Speedboat-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departure from Male</label>
                  <input
                    type="datetime-local"
                    value={tickets.maleToVillaPark.departureDate}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      maleToVillaPark: {...tickets.maleToVillaPark, departureDate: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Arrival at Villa Park</label>
                  <input
                    type="datetime-local"
                    value={tickets.maleToVillaPark.arrivalDate}
                    onChange={(e) => setTickets({
                      ...tickets, 
                      maleToVillaPark: {...tickets.maleToVillaPark, arrivalDate: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('entry_pass')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!tickets.destinationToMale.booked || !tickets.maleToVillaPark.booked) {
                    toast.error('Please book both tickets');
                    return;
                  }
                  handleAdvanceStage('accommodation_assigned');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Assign Accommodation
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'accommodation_assigned':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Home className="h-5 w-5 text-pink-600" />
              Accommodation Assignment
            </h3>
            
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
              <p className="text-pink-800 text-sm">
                Select an available room for the new employee. This will reserve the room until they arrive.
              </p>
            </div>

            {/* Debug info */}
            <div className="text-xs text-gray-400 mb-2">
              Company: {companyId} | Available: {availableRooms.length} | Occupied: {occupiedRooms.length} | Total: {rooms.length}
            </div>

            {/* Toggle to show all rooms */}
            {availableRooms.length === 0 && allCompanyRooms.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllRooms}
                    onChange={(e) => setShowAllRooms(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-blue-800">
                    Show all rooms (including occupied) - {allCompanyRooms.length} rooms available
                  </span>
                </label>
              </div>
            )}

            {companyRooms.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>No rooms found.</strong>
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Please add rooms in the Accommodation section first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {companyRooms.map(room => (
                  <div 
                    key={room.id}
                    onClick={() => setAccommodation({
                      assigned: true,
                      roomId: room.id,
                      roomNumber: room.roomNumber,
                      building: room.building
                    })}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      accommodation.roomId === room.id 
                        ? 'bg-pink-100 border-pink-500' 
                        : 'bg-gray-50 border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="font-medium">Room {room.roomNumber}</div>
                    <div className="text-sm text-gray-600">{room.building}</div>
                    <div className="text-xs text-gray-500">{room.floor} Floor</div>
                    <div className="text-xs text-green-600 mt-1">Available</div>
                  </div>
                ))}
              </div>
            )}

            {accommodation.assigned && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Room {accommodation.roomNumber} ({accommodation.building}) assigned
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('tickets_booked')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!accommodation.assigned) {
                    toast.error('Please assign accommodation first');
                    return;
                  }
                  handleAdvanceStage('arrival');
                }}
                disabled={!accommodation.assigned}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                Confirm Arrival
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'arrival':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Arrival / Receiving
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Arrival Date</label>
                <input
                  type="date"
                  value={arrival.arrivalDate}
                  onChange={(e) => setArrival({...arrival, arrivalDate: e.target.value, arrived: true})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={arrival.arrivalTime}
                  onChange={(e) => setArrival({...arrival, arrivalTime: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Received By</label>
                <input
                  type="text"
                  value={arrival.receivedBy}
                  onChange={(e) => setArrival({...arrival, receivedBy: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Name of staff who received"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('accommodation_assigned')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!arrival.arrived) {
                    toast.error('Please confirm arrival details');
                    return;
                  }
                  handleAdvanceStage('registered');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Proceed to Registration
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'registered':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600" />
              Registration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Registration Date</label>
                <input
                  type="date"
                  value={registration.registrationDate}
                  onChange={(e) => setRegistration({...registration, registrationDate: e.target.value, registered: true})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID to Assign</label>
                <input
                  type="text"
                  value={registration.employeeIdAssigned}
                  onChange={(e) => setRegistration({...registration, employeeIdAssigned: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., VP-2024-001"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('arrival')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => handleAdvanceStage('handed_over')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Proceed to Handover
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'handed_over':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Department Handover
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Handover Date</label>
                <input
                  type="date"
                  value={handover.handoverDate}
                  onChange={(e) => setHandover({...handover, handoverDate: e.target.value, handedOver: true})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Head</label>
                <input
                  type="text"
                  value={handover.departmentHead}
                  onChange={(e) => setHandover({...handover, departmentHead: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Name of department head"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Handover Notes</label>
                <textarea
                  value={handover.notes}
                  onChange={(e) => setHandover({...handover, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Any notes about the handover..."
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleAdvanceStage('registered')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => handleAdvanceStage('employee_created')}
                disabled={!handover.handedOver}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                Complete & Create Employee
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );

      case 'employee_created':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Ready to Create Employee</h3>
              <p className="text-green-700 mb-4">
                All onboarding steps are complete. Click below to create the employee record and set up probation evaluations.
              </p>
              <div className="bg-white p-4 rounded-lg text-left max-w-md mx-auto mb-4">
                <h4 className="font-medium mb-2">Summary:</h4>
                <ul className="text-sm space-y-1">
                  <li>✓ Name: {candidateWithJob.name}</li>
                  <li>✓ Position: {candidateWithJob.jobTitle}</li>
                  <li>✓ Department: {candidateWithJob.jobDepartment}</li>
                  <li>✓ Room: {accommodation.roomNumber}</li>
                  <li>✓ Arrival: {arrival.arrivalDate}</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-left max-w-md mx-auto mb-4">
                <h4 className="font-medium mb-2 text-yellow-800">Probation Schedule will be created:</h4>
                <ul className="text-sm space-y-1 text-yellow-700">
                  <li>• 1 Month Review</li>
                  <li>• 2 Month Review</li>
                  <li>• 3 Month Review</li>
                  <li>• Annual Review</li>
                </ul>
              </div>
              <button
                onClick={handleCreateEmployee}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Employee & Start Probation
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-blue-600" />
              Expat Onboarding: {candidateWithJob.name}
            </h2>
            <p className="text-gray-500 text-sm">{candidateWithJob.jobTitle} • {candidateWithJob.jobDepartment}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stage Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {ONBOARDING_STAGES.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isActive = stage.id === activeStage;
              const isCompleted = idx < currentStageIndex;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                      : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <StageIcon className="h-4 w-4" />
                  {stage.label}
                </button>
              );
            })}
          </div>

          {/* Stage Content */}
          <div className="bg-gray-50 rounded-lg p-6">
            {renderStageContent()}
          </div>

          {/* Save Progress Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProgress}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
