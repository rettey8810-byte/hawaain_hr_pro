import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, User, Phone, Mail, MapPin, Briefcase, Building2, Calendar, Heart, Shield, CreditCard, Users } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import AvatarUpload from './AvatarUpload';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addDocument, updateDocument } = useFirestore('employees');
  const { isHRorGM } = useAuth();
  const { companyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Fetch dynamic divisions and designations
  const { documents: divisions } = useFirestore('divisions');
  const { documents: designations } = useFirestore('designations');

  // Filter by company
  const companyDivisions = useMemo(() => 
    divisions.filter(d => d.companyId === companyId).sort((a, b) => a.name.localeCompare(b.name)),
    [divisions, companyId]
  );

  const companyDesignations = useMemo(() => 
    designations.filter(d => d.companyId === companyId).sort((a, b) => a.title.localeCompare(b.title)),
    [designations, companyId]
  );

  // Comprehensive form state matching Excel structure
  const [formData, setFormData] = useState({
    // Basic Info
    EmpID: '',
    FullName: '',
    ShortName: '',
    FingerPrintID: '',
    
    // Employment Details
    Division: '',
    'Department ': '',
    Section: '',
    Designation: '',
    Level: '',
    Superior: '',
    DOJ: '',
    status: 'active',
    
    // Personal Info
    Gender: '',
    DOB: '',
    MaritalStatus: '',
    BloodGroup: '',
    Nationality: '',
    Religion: '',
    
    // Contact Info
    PhoneNo: '',
    AlternateContactNo: '',
    EmailID: '',
    PersonalEmailID: '',
    
    // Present Address
    PresentCountry: '',
    PresentState: '',
    PresentCity: '',
    PresentAddress: '',
    
    // Permanent Address
    PermanentCountry: '',
    PermanentState: '',
    PermanentCity: '',
    PermanentAddress: '',
    
    // ID Documents
    NICNo: '',
    NICExpiry: '',
    PassportNo: '',
    PassportExpiry: '',
    PPExpiry: '',
    
    // Work Permit
    WPNo: '',
    WPExpiry: '',
    FeeExpiry: '',
    
    // Insurance & Medical
    MedExpiry: '',
    InsExpiry: '',
    VisaExpiry: '',
    
    // Emergency Contact 1
    EmergencyContactName1: '',
    EmergencyPhoneNo1: '',
    EmergencyRelation1: '',
    EmergencyAddress1: '',
    
    // Emergency Contact 2
    EmergencyContactName2: '',
    EmergencyPhoneNo2: '',
    EmergencyRelation2: '',
    EmergencyAddress2: '',
    
    // Salary Info
    'Fixed(USD)': '',
    'Fixed(MVR)': '',
    'Basic(MVR)': '',
    'Basic(USD)': '',
    'TotalSalary(MVR)': '',
    'TotalSalary(USD)': '',
    
    // Bank Info - Primary
    PayThrough1: '',
    CompanyBankName1: '',
    CompanyAccountNo1: '',
    BankName1: '',
    AccountName1: '',
    AccountNo1: '',
    
    // Bank Info - Secondary
    PayThrough2: '',
    BankName2: '',
    AccountName2: '',
    AccountNo2: '',
    
    // Photo
    photoURL: ''
  });

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFormData(prev => ({
        ...prev,
        ...data
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Add companyId if not present
      const dataToSave = {
        ...formData,
        companyId: formData.companyId || ''
      };
      
      if (id) {
        await updateDocument(id, dataToSave);
      } else {
        await addDocument(dataToSave);
      }
      navigate('/employees');
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 font-medium rounded-t-lg border-b-2 transition-colors ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600 bg-blue-50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  const InputField = ({ label, name, type = 'text', placeholder = '', required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );

  const SelectField = ({ label, name, options, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        required={required}
        className="block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/employees')}
              className="text-gray-400 hover:text-gray-600 mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              {id ? 'Edit Employee' : 'Add New Employee'}
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        {/* Avatar Upload */}
        <div className="p-6 border-b">
          <div className="flex justify-center">
            <AvatarUpload
              currentPhoto={formData.photoURL}
              onUpload={(url) => setFormData(prev => ({ ...prev, photoURL: url }))}
              employeeId={id}
              size="lg"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-6" aria-label="Tabs">
            <TabButton id="personal" label="Personal" icon={User} />
            <TabButton id="employment" label="Employment" icon={Briefcase} />
            <TabButton id="contact" label="Contact" icon={Phone} />
            <TabButton id="address" label="Address" icon={MapPin} />
            <TabButton id="emergency" label="Emergency" icon={Heart} />
            <TabButton id="documents" label="ID Documents" icon={Shield} />
            {isHRorGM() && (
              <>
                <TabButton id="salary" label="Salary" icon={DollarSign} />
                <TabButton id="bank" label="Bank" icon={CreditCard} />
              </>
            )}
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Full Name" name="FullName" required />
                <InputField label="Short Name" name="ShortName" />
                <InputField label="Employee ID" name="EmpID" required />
                <InputField label="Fingerprint ID" name="FingerPrintID" />
                <SelectField label="Gender" name="Gender" options={['Male', 'Female', 'Other']} />
                <InputField label="Date of Birth" name="DOB" type="date" />
                <SelectField label="Marital Status" name="MaritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} />
                <InputField label="Blood Group" name="BloodGroup" placeholder="e.g., O+" />
                <InputField label="Nationality" name="Nationality" />
                <InputField label="Religion" name="Religion" />
                <SelectField 
                  label="Status" 
                  name="status" 
                  options={['active', 'inactive', 'on_leave', 'terminated']}
                />
              </div>
            </div>
          )}

          {/* Employment Information Tab */}
          {activeTab === 'employment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Employment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField 
                  label="Division" 
                  name="Division" 
                  options={companyDivisions.filter(d => d.type === 'division').map(d => d.name)} 
                />
                <SelectField 
                  label="Department" 
                  name="Department " 
                  options={companyDivisions.filter(d => d.type === 'department').map(d => d.name)} 
                />
                <SelectField 
                  label="Section" 
                  name="Section" 
                  options={companyDivisions.filter(d => d.type === 'section').map(d => d.name)} 
                />
                <SelectField 
                  label="Designation" 
                  name="Designation" 
                  options={companyDesignations.map(d => d.title)} 
                />
                <InputField label="Level" name="Level" placeholder="e.g., Default, Executive" />
                <InputField label="Superior/Manager" name="Superior" />
                <InputField label="Date of Join (DOJ)" name="DOJ" type="date" />
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Primary Phone" name="PhoneNo" type="tel" />
                <InputField label="Alternate Phone" name="AlternateContactNo" type="tel" />
                <InputField label="Work Email" name="EmailID" type="email" />
                <InputField label="Personal Email" name="PersonalEmailID" type="email" />
              </div>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Address Information
              </h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-4">Present Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Country" name="PresentCountry" />
                  <InputField label="State" name="PresentState" />
                  <InputField label="City" name="PresentCity" />
                  <InputField label="Address" name="PresentAddress" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-4">Permanent Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Country" name="PermanentCountry" />
                  <InputField label="State" name="PermanentState" />
                  <InputField label="City" name="PermanentCity" />
                  <InputField label="Address" name="PermanentAddress" />
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Emergency Contacts
              </h3>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-4">Emergency Contact 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Name" name="EmergencyContactName1" />
                  <InputField label="Phone" name="EmergencyPhoneNo1" type="tel" />
                  <InputField label="Relationship" name="EmergencyRelation1" />
                  <InputField label="Address" name="EmergencyAddress1" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-4">Emergency Contact 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Name" name="EmergencyContactName2" />
                  <InputField label="Phone" name="EmergencyPhoneNo2" type="tel" />
                  <InputField label="Relationship" name="EmergencyRelation2" />
                  <InputField label="Address" name="EmergencyAddress2" />
                </div>
              </div>
            </div>
          )}

          {/* ID Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                ID Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="NIC Number" name="NICNo" />
                <InputField label="NIC Expiry" name="NICExpiry" type="date" />
                <InputField label="Passport Number" name="PassportNo" />
                <InputField label="Passport Expiry" name="PassportExpiry" type="date" />
                <InputField label="PP Expiry" name="PPExpiry" type="date" />
              </div>
              
              <div className="mt-6 border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Work Permit Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Work Permit No (WPNo)" name="WPNo" />
                  <InputField label="WP Expiry" name="WPExpiry" type="date" />
                  <InputField label="Fee Expiry" name="FeeExpiry" type="date" />
                </div>
              </div>
              
              <div className="mt-6 border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Insurance & Medical</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Medical Expiry" name="MedExpiry" type="date" />
                  <InputField label="Insurance Expiry" name="InsExpiry" type="date" />
                  <InputField label="Visa Expiry" name="VisaExpiry" type="date" />
                </div>
              </div>
            </div>
          )}

          {/* Salary Tab - HR/GM Only */}
          {activeTab === 'salary' && isHRorGM() && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Salary Information
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">HR/GM Only</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Fixed (USD)" name="Fixed(USD)" type="number" />
                <InputField label="Fixed (MVR)" name="Fixed(MVR)" type="number" />
                <InputField label="Basic (MVR)" name="Basic(MVR)" type="number" />
                <InputField label="Basic (USD)" name="Basic(USD)" type="number" />
                <InputField label="Total Salary (MVR)" name="TotalSalary(MVR)" type="number" />
                <InputField label="Total Salary (USD)" name="TotalSalary(USD)" type="number" />
              </div>
            </div>
          )}

          {/* Bank Tab - HR/GM Only */}
          {activeTab === 'bank' && isHRorGM() && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Bank Information
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">HR/GM Only</span>
              </h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-4">Primary Bank Account</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Pay Through" name="PayThrough1" />
                  <InputField label="Company Bank Name" name="CompanyBankName1" />
                  <InputField label="Company Account No" name="CompanyAccountNo1" />
                  <InputField label="Bank Name" name="BankName1" />
                  <InputField label="Account Name" name="AccountName1" />
                  <InputField label="Account Number" name="AccountNo1" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-4">Secondary Bank Account</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Pay Through" name="PayThrough2" />
                  <InputField label="Bank Name" name="BankName2" />
                  <InputField label="Account Name" name="AccountName2" />
                  <InputField label="Account Number" name="AccountNo2" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
          <div className="text-sm text-gray-500">
            Tab: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
