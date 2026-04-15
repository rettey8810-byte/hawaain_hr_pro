import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  FileText, 
  Briefcase, 
  Plane, 
  HeartPulse,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  CreditCard,
  Home,
  Users,
  BadgeCheck,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  DollarSign,
  Banknote,
  Contact,
  Flag,
  Droplet
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getDocumentStatus, calculateDaysRemaining, formatCurrency } from '../utils/helpers';

function DocumentCard({ title, icon: Icon, documents, type, employeeId }) {
  const typePaths = {
    passport: '/passports',
    visa: '/visas',
    'work-permit': '/work-permits',
    medical: '/medical'
  };

  const latestDoc = documents?.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  )[0];

  const status = latestDoc ? getDocumentStatus(latestDoc.expiryDate) : null;
  const daysRemaining = latestDoc ? calculateDaysRemaining(latestDoc.expiryDate) : null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-blue-600 mr-2" />
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <Link 
          to={`${typePaths[type]}?employee=${employeeId}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>
      
      {latestDoc ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              status?.color === 'green' ? 'bg-green-100 text-green-800' :
              status?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              status?.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status?.label || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expires:</span>
            <span className={daysRemaining <= 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {formatDate(latestDoc.expiryDate)}
            </span>
          </div>
          {daysRemaining !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Days Left:</span>
              <span className={daysRemaining <= 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No documents found</p>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, subValue }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start">
        <Icon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-sm font-medium text-gray-900">{value || '-'}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHR, user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState({
    passports: [],
    visas: [],
    workPermits: [],
    medicals: []
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { getDocumentsByEmployee } = useFirestore('employees');
  const { getDocumentsByEmployee: getPassports } = useFirestore('passports');
  const { getDocumentsByEmployee: getVisas } = useFirestore('visas');
  const { getDocumentsByEmployee: getWorkPermits } = useFirestore('workPermits');
  const { getDocumentsByEmployee: getMedicals } = useFirestore('medicals');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Fetch single employee by ID using Firebase query
      try {
        const employeeQuery = query(
          collection(db, 'employees'),
          where('__name__', '==', id)
        );
        const employeeSnap = await getDocs(employeeQuery);
        if (!employeeSnap.empty) {
          const empData = { id: employeeSnap.docs[0].id, ...employeeSnap.docs[0].data() };
          setEmployee(empData);
          setFormData(empData);
        } else {
          console.log('Employee not found with ID:', id);
          setEmployee(null);
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
      
      const unsubPassports = getPassports(id);
      const unsubVisas = getVisas(id);
      const unsubPermits = getWorkPermits(id);
      const unsubMedicals = getMedicals(id);

      return () => {
        unsubPassports?.();
        unsubVisas?.();
        unsubPermits?.();
        unsubMedicals?.();
      };
    };

    loadData();
  }, [id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) {
      alert('You must be logged in to save changes');
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'employees', id), {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
      setEmployee(formData);
      setEditing(false);
      alert('Employee details updated successfully!');
    } catch (err) {
      console.error('Error updating employee:', err);
      alert('Error updating employee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayData = editing ? formData : employee;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
        <Link to="/employees" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
          Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <Link to="/employees" className="text-gray-400 hover:text-gray-600 mr-4">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {displayData?.FullName || displayData?.name || 'Employee'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {displayData?.Designation || displayData?.position} • {displayData?.['Department '] || displayData?.Department || displayData?.department}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 gap-2">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setFormData(employee); }}
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            isHR() && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )
          )}
        </div>
      </div>

      {/* Employee ID Badge */}
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <BadgeCheck className="h-4 w-4 mr-1" />
          Emp ID: {displayData?.EmpID || displayData?.employeeId || 'N/A'}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
          <AlertCircle className="h-4 w-4 mr-1" />
          Status: {displayData?.status || 'Active'}
        </span>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard icon={Mail} label="Email" value={displayData?.EmailID || displayData?.email} />
        <InfoCard icon={Phone} label="Phone" value={displayData?.PhoneNo || displayData?.phone} />
        <InfoCard icon={Building2} label="Department" value={displayData?.['Department '] || displayData?.Department || displayData?.department} />
        <InfoCard icon={Calendar} label="Date of Join" value={formatDate(displayData?.['Date of Join'] || displayData?.joinDate)} />
      </div>

      {/* Personal Information Section */}
      <Section title="Personal Information" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={User} label="Full Name" value={displayData?.FullName || displayData?.name} />
          <InfoCard icon={User} label="Short Name" value={displayData?.ShortName} />
          <InfoCard icon={Calendar} label="Date of Birth" value={formatDate(displayData?.DOB)} />
          <InfoCard icon={User} label="Gender" value={displayData?.Gender} />
          <InfoCard icon={Users} label="Marital Status" value={displayData?.MaritalStatus} />
          <InfoCard icon={Flag} label="Nationality" value={displayData?.Nationality} />
          <InfoCard icon={BadgeCheck} label="Religion" value={displayData?.Religion} />
          <InfoCard icon={Droplet} label="Blood Group" value={displayData?.BloodGroup} />
        </div>
      </Section>

      {/* Employment Information Section */}
      <Section title="Employment Information" icon={Briefcase}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={Building2} label="Division" value={displayData?.Division} />
          <InfoCard icon={Building2} label="Department" value={displayData?.['Department '] || displayData?.Department} />
          <InfoCard icon={Building2} label="Section" value={displayData?.Section} />
          <InfoCard icon={BadgeCheck} label="Designation" value={displayData?.Designation} />
          <InfoCard icon={BadgeCheck} label="Level" value={displayData?.Level} />
          <InfoCard icon={Users} label="Superior" value={displayData?.Superior} />
          <InfoCard icon={Calendar} label="Date of Join (DOJ)" value={formatDate(displayData?.DOJ || displayData?.['Date of Join'])} />
          <InfoCard icon={FileText} label="Work Permit No" value={displayData?.WPNo} />
        </div>
      </Section>

      {/* Contact Information Section */}
      <Section title="Contact Information" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={Phone} label="Phone Number" value={displayData?.PhoneNo || displayData?.phone} />
          <InfoCard icon={Phone} label="Alternate Phone" value={displayData?.AlternateContactNo} />
          <InfoCard icon={Mail} label="Email" value={displayData?.EmailID || displayData?.email} />
          <InfoCard icon={Mail} label="Personal Email" value={displayData?.PersonalEmailID} />
        </div>
      </Section>

      {/* Present Address Section */}
      <Section title="Present Address" icon={Home}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={MapPin} label="Country" value={displayData?.PresentCountry} />
          <InfoCard icon={MapPin} label="State" value={displayData?.PresentState} />
          <InfoCard icon={MapPin} label="City" value={displayData?.PresentCity} />
          <InfoCard icon={Home} label="Address" value={displayData?.PresentAddress} />
        </div>
      </Section>

      {/* Permanent Address Section */}
      <Section title="Permanent Address" icon={Home}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={MapPin} label="Country" value={displayData?.PermanentCountry} />
          <InfoCard icon={MapPin} label="State" value={displayData?.PermanentState} />
          <InfoCard icon={MapPin} label="City" value={displayData?.PermanentCity} />
          <InfoCard icon={Home} label="Address" value={displayData?.PermanentAddress} />
        </div>
      </Section>

      {/* Salary Information Section */}
      <Section title="Salary Information" icon={DollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard icon={DollarSign} label="Fixed (USD)" value={formatCurrency(displayData?.['Fixed(USD)'])} />
          <InfoCard icon={DollarSign} label="Fixed (MVR)" value={displayData?.['Fixed(MVR)'] ? `${displayData['Fixed(MVR)'].toLocaleString()} MVR` : '-'} />
          <InfoCard icon={DollarSign} label="Basic (USD)" value={formatCurrency(displayData?.['Basic(USD)'])} />
          <InfoCard icon={DollarSign} label="Basic (MVR)" value={displayData?.['Basic(MVR)'] ? `${displayData['Basic(MVR)'].toLocaleString()} MVR` : '-'} />
          <InfoCard icon={DollarSign} label="Total Salary (USD)" value={formatCurrency(displayData?.['TotalSalary(USD)'])} />
          <InfoCard icon={DollarSign} label="Total Salary (MVR)" value={displayData?.['TotalSalary(MVR)'] ? `${displayData['TotalSalary(MVR)'].toLocaleString()} MVR` : '-'} />
          <InfoCard icon={CreditCard} label="Pay Through" value={displayData?.PayThrough1} />
        </div>
      </Section>

      {/* Bank Information Section */}
      <Section title="Bank Information" icon={Banknote}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={Building2} label="Bank Name" value={displayData?.BankName2} />
          <InfoCard icon={User} label="Account Name" value={displayData?.AccountName2} />
          <InfoCard icon={CreditCard} label="Account Number" value={displayData?.AccountNo2} />
          <InfoCard icon={CreditCard} label="Pay Through" value={displayData?.PayThrough2} />
        </div>
      </Section>

      {/* Emergency Contacts Section */}
      <Section title="Emergency Contacts" icon={Contact}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Emergency Contact 1</h4>
            <div className="space-y-3">
              <InfoCard icon={User} label="Name" value={displayData?.EmergencyContactName1} />
              <InfoCard icon={Phone} label="Phone" value={displayData?.EmergencyPhoneNo1} />
              <InfoCard icon={Users} label="Relation" value={displayData?.EmergencyRelation1} />
              <InfoCard icon={Home} label="Address" value={displayData?.EmergencyAddress1} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Emergency Contact 2</h4>
            <div className="space-y-3">
              <InfoCard icon={User} label="Name" value={displayData?.EmergencyContactName2} />
              <InfoCard icon={Phone} label="Phone" value={displayData?.EmergencyPhoneNo2} />
              <InfoCard icon={Users} label="Relation" value={displayData?.EmergencyRelation2} />
              <InfoCard icon={Home} label="Address" value={displayData?.EmergencyAddress2} />
            </div>
          </div>
        </div>
      </Section>

      {/* ID Documents & Expiry Section */}
      <Section title="ID Documents & Expiry Dates" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={FileText} label="NIC Number" value={displayData?.NICNo} />
          <InfoCard icon={Calendar} label="NIC Expiry" value={formatDate(displayData?.NICExpiry)} />
          <InfoCard icon={FileText} label="Passport Number" value={displayData?.PassportNo} />
          <InfoCard icon={Calendar} label="Passport Expiry" value={formatDate(displayData?.PassportExpiry)} />
          <InfoCard icon={Calendar} label="PP Expiry" value={formatDate(displayData?.PPExpiry)} />
          <InfoCard icon={Calendar} label="WP Expiry" value={formatDate(displayData?.WPExpiry)} />
          <InfoCard icon={Calendar} label="Fee Expiry" value={formatDate(displayData?.FeeExpiry)} />
          <InfoCard icon={Calendar} label="Medical Expiry" value={formatDate(displayData?.MedExpiry)} />
          <InfoCard icon={Calendar} label="Insurance Expiry" value={formatDate(displayData?.InsExpiry)} />
          <InfoCard icon={Calendar} label="Visa Expiry" value={formatDate(displayData?.VisaExpiry)} />
        </div>
      </Section>

      {/* Documents Section */}
      <Section title="Uploaded Documents" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentCard
            title="Passport"
            icon={FileText}
            documents={documents.passports}
            type="passport"
            employeeId={id}
          />
          <DocumentCard
            title="Visa"
            icon={Plane}
            documents={documents.visas}
            type="visa"
            employeeId={id}
          />
          <DocumentCard
            title="Work Permit"
            icon={Briefcase}
            documents={documents.workPermits}
            type="work-permit"
            employeeId={id}
          />
          <DocumentCard
            title="Medical Record"
            icon={HeartPulse}
            documents={documents.medicals}
            type="medical"
            employeeId={id}
          />
        </div>
      </Section>
    </div>
  );
}
