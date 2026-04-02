import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Eye, Download, FileCheck } from 'lucide-react';

export default function LeaveDocumentUpload({ leaveId, documents = [], onUpload, onDelete, canVerify = false }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const documentTypes = [
    { id: 'medical', label: 'Medical Certificate', required: false },
    { id: 'ticket', label: 'Flight/Ticket Booking', required: false },
    { id: 'approval', label: 'Manager Approval Letter', required: false },
    { id: 'proof', label: 'Supporting Document', required: false },
    { id: 'other', label: 'Other Document', required: false },
  ];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`File too large: ${file.name}. Max size is 10MB.`);
        return false;
      }
      return true;
    });
    setSelectedFiles(validFiles);
  };

  const handleUpload = async (docType) => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // In production, upload to Firebase Storage
        // For now, create a mock URL
        const mockUrl = URL.createObjectURL(file);
        
        await onUpload({
          leaveId,
          docType,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          url: mockUrl,
          uploadedAt: new Date().toISOString(),
          verified: false,
        });
      }
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = (docId) => {
    if (!canVerify) return;
    // In production, update in Firestore
    const updatedDocs = documents.map(doc => 
      doc.id === docId ? { ...doc, verified: true, verifiedAt: new Date().toISOString() } : doc
    );
    // onUpdate(updatedDocs);
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('image')) return <FileText className="h-8 w-8 text-blue-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <FileCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Leave Documents</h3>
            <p className="text-emerald-100 text-sm">Upload and verify supporting documents</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Document Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {documentTypes.map(type => {
            const count = documents.filter(d => d.docType === type.id).length;
            return (
              <button
                key={type.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  count > 0 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
                {count > 0 && <span className="ml-2 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6 hover:border-emerald-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFiles.length === 0 ? (
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-gray-400">PDF, JPG, PNG up to 10MB each</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Select Files
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">Selected Files:</p>
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getFileIcon(file.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== idx))}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-3 pt-3">
                <select className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Select document type...</option>
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleUpload('other')}
                  disabled={uploading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                {getFileIcon(doc.fileType)}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{doc.fileName}</p>
                    {doc.verified && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>{documentTypes.find(t => t.id === doc.docType)?.label || 'Document'}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  
                  {canVerify && !doc.verified && (
                    <button
                      onClick={() => handleVerify(doc.id)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Verify Document"
                    >
                      <FileCheck className="h-5 w-5" />
                    </button>
                  )}
                  
                  <a
                    href={doc.url}
                    download={doc.fileName}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                  
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documents uploaded yet</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{previewDoc.fileName}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              {previewDoc.fileType.includes('image') ? (
                <img src={previewDoc.url} alt={previewDoc.fileName} className="max-w-full mx-auto" />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-24 w-24 text-red-500 mb-4" />
                  <p className="text-gray-600 mb-4">PDF preview not available</p>
                  <a
                    href={previewDoc.url}
                    download={previewDoc.fileName}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
