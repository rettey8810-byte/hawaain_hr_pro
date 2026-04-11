import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  ArrowLeft,
  FileImage,
  File,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { formatDate } from '../utils/helpers';

export default function MyDocuments() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const documentTypes = [
    { id: 'passport', label: 'Passport', icon: FileImage },
    { id: 'id_card', label: 'ID Card', icon: FileText },
    { id: 'certificate', label: 'Certificates', icon: File },
    { id: 'contract', label: 'Employment Contract', icon: FileText },
    { id: 'payslip', label: 'Payslip', icon: FileText },
    { id: 'other', label: 'Other', icon: File },
  ];

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const docsQuery = query(
          collection(db, 'employeeDocuments'),
          where('userId', '==', user.uid)
        );
        const docsSnap = await getDocs(docsQuery);
        const docsData = docsSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setDocuments(docsData);
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const handleFileUpload = async (event, docType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // Upload to Storage
      const fileRef = ref(storage, `documents/${user.uid}/${docType}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      // Save to Firestore
      await addDoc(collection(db, 'employeeDocuments'), {
        userId: user.uid,
        employeeId: userData?.employeeId || user.uid,
        documentType: docType,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: serverTimestamp(),
        status: 'pending_review'
      });

      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      
      // Refresh documents list
      const docsQuery = query(
        collection(db, 'employeeDocuments'),
        where('userId', '==', user.uid)
      );
      const docsSnap = await getDocs(docsQuery);
      setDocuments(docsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from Storage
      const fileRef = ref(storage, `documents/${user.uid}/${doc.documentType}/${doc.fileName}`);
      await deleteObject(fileRef).catch(() => {}); // Ignore if already deleted

      // Delete from Firestore
      await deleteDoc(doc(db, 'employeeDocuments', doc.id));

      setMessage({ type: 'success', text: 'Document deleted successfully!' });
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_review: { color: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
      approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
      rejected: { color: 'bg-rose-100 text-rose-700', label: 'Rejected' }
    };
    return badges[status] || badges.pending_review;
  };

  const getDocumentIcon = (docType) => {
    const docConfig = documentTypes.find(d => d.id === docType);
    return docConfig?.icon || File;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="text-gray-600 mt-2">Upload and manage your personal documents</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            Upload Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((docType) => {
              const Icon = docType.icon;
              const existingDoc = documents.find(d => d.documentType === docType.id);
              
              return (
                <div 
                  key={docType.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    existingDoc 
                      ? 'border-emerald-200 bg-emerald-50' 
                      : 'border-dashed border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${existingDoc ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${existingDoc ? 'text-emerald-600' : 'text-gray-600'}`} />
                    </div>
                    <span className="font-medium text-gray-900">{docType.label}</span>
                  </div>
                  
                  {existingDoc ? (
                    <div className="text-sm text-emerald-700">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Uploaded {formatDate(existingDoc.uploadedAt)}
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, docType.id)}
                        disabled={uploading}
                      />
                      <span className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        + Upload {docType.label}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Uploaded Documents</h2>
                <p className="text-sm text-gray-500">
                  {documents.length} document{documents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-500">Upload your documents above to keep them organized.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Document</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Uploaded</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => {
                    const Icon = getDocumentIcon(doc.documentType);
                    const statusBadge = getStatusBadge(doc.status);
                    const docTypeLabel = documentTypes.find(d => d.id === doc.documentType)?.label || doc.documentType;
                    
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900 truncate max-w-xs">
                              {doc.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{docTypeLabel}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(doc.uploadedAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View/Download"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDelete(doc)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Document Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload clear, readable documents only</li>
            <li>• Maximum file size: 5MB per document</li>
            <li>• Accepted formats: PDF, JPG, PNG</li>
            <li>• Documents will be reviewed by HR within 2-3 business days</li>
            <li>• Keep your passport and ID documents up to date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
