import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useFirestoreAdmin } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Building2, Users, Edit2, Trash2, CheckCircle } from 'lucide-react';

export default function CompanyAdmin() {
  const { companies, loading, switchCompany, currentCompany } = useCompany();
  const { userData } = useAuth();
  const { documents: allUsers, getAllDocumentsUnfiltered } = useFirestoreAdmin('users');
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    maxUsers: 10,
    status: 'active'
  });

  useEffect(() => {
    const unsub = getAllDocumentsUnfiltered();
    return () => unsub?.();
  }, []);

  const handleCreate = async () => {
    // Implementation for creating company
    setShowNewModal(false);
    setFormData({ name: '', code: '', address: '', phone: '', email: '', maxUsers: 10, status: 'active' });
  };

  const handleEdit = async () => {
    // Implementation for editing company
    setShowEditModal(false);
  };

  const getCompanyUsers = (companyId) => {
    return allUsers.filter(u => u.companyId === companyId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            Company Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage all companies in the system
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {getCompanyUsers(company.id).length} / {company.maxUsers || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {currentCompany?.id !== company.id && (
                        <button
                          onClick={() => switchCompany(company.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Switch
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setFormData(company);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No companies found. Create your first company.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Company Indicator */}
      {currentCompany && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-900">
              Currently viewing: <strong>{currentCompany.name}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
