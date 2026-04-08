import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function DocumentForm({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employee');
  
  const collectionName = {
    passport: 'passports',
    visa: 'visas',
    'work-permit': 'workPermits',
    medical: 'medicals'
  }[type];
  
  const { addDocument, updateDocument, uploadFile } = useFirestore(collectionName);
  const { documents: employees } = useFirestore('employees');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [documentFile, setDocumentFile] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData(type));

  function getInitialFormData(docType) {
    const base = {
      employeeId: employeeId || '',
      issueDate: '',
      expiryDate: '',
      documentUrl: '',
      notes: ''
    };
    
    switch(docType) {
      case 'passport':
        return { ...base, passportNumber: '', country: '', placeOfIssue: '' };
      case 'visa':
        return { ...base, visaNumber: '', visaType: '', entryType: 'single' };
      case 'work-permit':
        return { ...base, permitNumber: '', jobPosition: '', employer: '' };
      case 'medical':
        return { 
          ...base, 
          testDate: '', 
          result: 'pending', 
          testCenter: '',
          medicalFee: '',
          medicalFeeExpiry: '',
          insuranceFeeExpiry: '',
          visaFeeExpiry: ''
        };
      default:
        return base;
    }
  }

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadDocument = async () => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFormData(data);
      setSelectedEmployee(data.employeeId);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let documentUrl = formData.documentUrl;
      
      if (documentFile) {
        setUploading(true);
        documentUrl = await uploadFile(documentFile, `${type}_documents`);
        setUploading(false);
      }

      const dataToSave = {
        ...formData,
        employeeId: selectedEmployee,
        documentUrl
      };

      if (id) {
        await updateDocument(id, dataToSave);
      } else {
        await addDocument(dataToSave);
      }
      
      navigate(`/${type === 'work-permit' ? 'work-permits' : type + 's'}`);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getTitle = () => {
    const titles = {
      passport: 'Passport',
      visa: 'Visa',
      'work-permit': 'Work Permit',
      medical: 'Medical Record'
    };
    return `${id ? 'Edit' : 'Add'} ${titles[type]}`;
  };

  const getBackPath = () => {
    const paths = {
      passport: '/passports',
      visa: '/visas',
      'work-permit': '/work-permits',
      medical: '/medical'
    };
    return paths[type];
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <button
              onClick={() => navigate(getBackPath())}
              className="text-gray-400 hover:text-gray-600 mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              {getTitle()}
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee *</label>
            <select
              required
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Passport Specific Fields */}
          {type === 'passport' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport Number *</label>
                <input
                  type="text"
                  name="passportNumber"
                  required
                  value={formData.passportNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country *</label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Issue</label>
                <input
                  type="text"
                  name="placeOfIssue"
                  value={formData.placeOfIssue}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Visa Specific Fields */}
          {type === 'visa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Visa Number *</label>
                <input
                  type="text"
                  name="visaNumber"
                  required
                  value={formData.visaNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visa Type *</label>
                <select
                  name="visaType"
                  required
                  value={formData.visaType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="Work">Work</option>
                  <option value="Residence">Residence</option>
                  <option value="Visit">Visit</option>
                  <option value="Transit">Transit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Entry Type</label>
                <select
                  name="entryType"
                  value={formData.entryType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="single">Single Entry</option>
                  <option value="multiple">Multiple Entry</option>
                </select>
              </div>
            </div>
          )}

          {/* Work Permit Specific Fields */}
          {type === 'work-permit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Permit Number *</label>
                <input
                  type="text"
                  name="permitNumber"
                  required
                  value={formData.permitNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Position</label>
                <input
                  type="text"
                  name="jobPosition"
                  value={formData.jobPosition}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employer</label>
                <input
                  type="text"
                  name="employer"
                  value={formData.employer}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Medical Specific Fields */}
          {type === 'medical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Date *</label>
                  <input
                    type="date"
                    name="testDate"
                    required
                    value={formData.testDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Center</label>
                  <input
                    type="text"
                    name="testCenter"
                    value={formData.testCenter}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Result</label>
                  <select
                    name="result"
                    value={formData.result}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medical Fee (MVR)</label>
                  <input
                    type="number"
                    name="medicalFee"
                    value={formData.medicalFee}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter medical fee amount"
                  />
                </div>
              </div>

              {/* Fee Expiry Dates */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Fee Expiry Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medical Fee Expiry</label>
                    <input
                      type="date"
                      name="medicalFeeExpiry"
                      value={formData.medicalFeeExpiry}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Insurance Fee Expiry</label>
                    <input
                      type="date"
                      name="insuranceFeeExpiry"
                      value={formData.insuranceFeeExpiry}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visa Fee Expiry</label>
                    <input
                      type="date"
                      name="visaFeeExpiry"
                      value={formData.visaFeeExpiry}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Common Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date *</label>
              <input
                type="date"
                name="issueDate"
                required
                value={formData.issueDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                required
                value={formData.expiryDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700">Document Upload</label>
            <div className="mt-2 flex items-center">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {documentFile ? documentFile.name : 'Choose file'}
                </span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
              {formData.documentUrl && (
                <a
                  href={formData.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-sm text-blue-600 hover:text-blue-500"
                >
                  View current document
                </a>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              PDF, JPG, JPEG, or PNG up to 10MB
            </p>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={() => navigate(getBackPath())}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
