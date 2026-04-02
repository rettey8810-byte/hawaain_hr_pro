import { useState } from 'react';
import { useCompliance } from '../contexts/ComplianceContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  FileText, 
  Eye, 
  Lock, 
  Download,
  History,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ComplianceCenter() {
  const { 
    auditLogs, 
    gdprRequests, 
    documentTemplates,
    createGDPRRequest,
    processGDPRRequest,
    generateDocument
  } = useCompliance();
  const { company } = useCompany();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Center</h1>
          <p className="text-gray-600">Audit logs, GDPR requests, and document templates</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={History} 
          label="Audit Events (30d)" 
          value={auditLogs.length} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Lock} 
          label="GDPR Requests" 
          value={gdprRequests.filter(r => r.status === 'pending').length} 
          color="bg-red-500" 
        />
        <StatCard 
          icon={FileText} 
          label="Templates" 
          value={documentTemplates.length} 
          color="bg-green-500" 
        />
        <StatCard 
          icon={Shield} 
          label="Compliance Score" 
          value="98%" 
          color="bg-purple-500" 
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'audit', label: 'Audit Trail', icon: History },
          { id: 'gdpr', label: 'GDPR Requests', icon: Lock },
          { id: 'templates', label: 'Document Templates', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {activeTab === 'audit' && (
          <AuditTab 
            logs={filteredLogs}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterAction={filterAction}
            setFilterAction={setFilterAction}
          />
        )}
        {activeTab === 'gdpr' && (
          <GDPRTab 
            requests={gdprRequests}
            onCreateRequest={createGDPRRequest}
            onProcessRequest={processGDPRRequest}
            currentUser={user}
          />
        )}
        {activeTab === 'templates' && (
          <TemplatesTab 
            templates={documentTemplates}
            onGenerate={generateDocument}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center gap-3">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Audit Trail Tab
function AuditTab({ logs, searchTerm, setSearchTerm, filterAction, setFilterAction }) {
  const actions = ['all', 'create', 'update', 'delete', 'view', 'export', 'login', 'logout'];

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      export: 'bg-purple-100 text-purple-800',
      login: 'bg-green-100 text-green-800',
      logout: 'bg-yellow-100 text-yellow-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, resource type, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Actions</option>
          {actions.filter(a => a !== 'all').map(action => (
            <option key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.slice(0, 100).map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{log.userEmail || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">({log.userRole})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-medium">{log.resourceType}</span>
                    <span className="text-gray-500 text-xs ml-2">({log.resourceId?.slice(0, 8)}...)</span>
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs">
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2).slice(0, 100)}...
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// GDPR Tab
function GDPRTab({ requests, onCreateRequest, onProcessRequest, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState('access');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const requestTypes = [
    { value: 'access', label: 'Access Request', description: 'Request a copy of all personal data' },
    { value: 'rectification', label: 'Rectification', description: 'Request correction of inaccurate data' },
    { value: 'erasure', label: 'Right to be Forgotten', description: 'Request deletion of personal data' },
    { value: 'portability', label: 'Data Portability', description: 'Request data in machine-readable format' },
    { value: 'restriction', label: 'Processing Restriction', description: 'Request to limit data processing' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreateRequest(employeeId || currentUser?.uid, requestType, description);
      toast.success('GDPR request submitted successfully!');
      setShowForm(false);
      setDescription('');
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const handleProcess = async (requestId, response) => {
    try {
      await onProcessRequest(requestId, response, currentUser?.uid);
      toast.success('Request processed successfully!');
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">GDPR Data Subject Requests</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <Lock className="h-4 w-4" />
          New Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Request Type</label>
            <select 
              value={requestType} 
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {requestTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-1">
              {requestTypes.find(t => t.value === requestType)?.description}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="Provide additional details about your request..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {requests.map(request => {
          const isOverdue = new Date(request.deadline) < new Date() && request.status === 'pending';
          return (
            <div key={request.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                      {request.type?.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      request.status === 'completed' ? 'bg-green-100 text-green-700' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.status}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Submitted: {format(new Date(request.requestedAt), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Deadline: {format(new Date(request.deadline), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {request.response && (
                    <div className="mt-3 bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium">Response:</p>
                      <p className="text-sm text-gray-600">{request.response}</p>
                    </div>
                  )}
                </div>
                {request.status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const response = prompt('Enter response to the request:');
                        if (response) handleProcess(request.id, response);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Process
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <p className="text-gray-500 text-center py-8">No GDPR requests</p>
        )}
      </div>
    </div>
  );
}

// Document Templates Tab
function TemplatesTab({ templates, onGenerate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [placeholders, setPlaceholders] = useState({});
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const templateTypes = [
    { value: 'contract', label: 'Employment Contract' },
    { value: 'offer_letter', label: 'Offer Letter' },
    { value: 'termination_letter', label: 'Termination Letter' },
    { value: 'warning_letter', label: 'Warning Letter' },
    { value: 'certificate', label: 'Employment Certificate' },
    { value: 'custom', label: 'Custom Template' }
  ];

  const handleGenerate = () => {
    try {
      const doc = onGenerate(selectedTemplate.id, placeholders);
      setGeneratedDoc(doc);
      toast.success('Document generated!');
    } catch (error) {
      toast.error('Failed to generate document');
    }
  };

  const handleDownload = () => {
    if (!generatedDoc) return;
    
    const blob = new Blob([generatedDoc.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate.name}-${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Document Templates</h3>
      </div>

      {!selectedTemplate ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div 
              key={template.id} 
              onClick={() => {
                setSelectedTemplate(template);
                // Initialize placeholders
                const initial = {};
                template.placeholders?.forEach(p => initial[p] = '');
                setPlaceholders(initial);
              }}
              className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-500">
                    {templateTypes.find(t => t.value === template.type)?.label || template.type}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.placeholders?.slice(0, 3).map((p, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
                {template.placeholders?.length > 3 && (
                  <span className="text-xs text-gray-500">+{template.placeholders.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center py-8">No templates available</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => {
              setSelectedTemplate(null);
              setGeneratedDoc(null);
            }}
            className="text-blue-600 hover:underline"
          >
            ← Back to Templates
          </button>

          <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Fill in the details:</h4>
              {selectedTemplate.placeholders?.map((placeholder, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {placeholder.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={placeholders[placeholder] || ''}
                    onChange={(e) => setPlaceholders({...placeholders, [placeholder]: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={`Enter ${placeholder.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
              <button
                onClick={handleGenerate}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Generate Document
              </button>
            </div>

            <div>
              <h4 className="font-medium mb-4">Preview:</h4>
              {generatedDoc ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div 
                    className="prose prose-sm max-w-none bg-white p-4 rounded"
                    dangerouslySetInnerHTML={{ __html: generatedDoc.content }}
                  />
                  <button
                    onClick={handleDownload}
                    className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download Document
                  </button>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-gray-500">
                  Fill in the details and click Generate to see preview
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
