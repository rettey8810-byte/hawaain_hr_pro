import { useState } from 'react';
import { FileCheck, AlertTriangle, Shield, ClipboardList, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import complianceService from '../services/complianceService';

export default function Compliance() {
  const [activeTab, setActiveTab] = useState('contracts');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: contracts, loading: contractsLoading } = useFirestore('contracts');
  const { documents: incidents, loading: incidentsLoading } = useFirestore('incidents');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredContracts = contracts.filter(c => c.companyId === companyId);
  const filteredIncidents = incidents.filter(i => i.companyId === companyId);

  // Calculate compliance score from real data
  const totalContracts = filteredContracts.length;
  const compliantContracts = filteredContracts.filter(c => c.status === 'active').length;
  const complianceScore = totalContracts > 0 ? Math.round((compliantContracts / totalContracts) * 100) : 100;

  if (contractsLoading || incidentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading compliance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Questions-bro.svg" 
            alt="Compliance" 
            className="h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 relative z-10">
          <Shield className="h-8 w-8" />
          Compliance & Legal
        </h1>
        <p className="text-amber-100 mt-1 relative z-10">Contracts, labor law compliance, and incidents</p>
      </div>

      {/* Compliance Score */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Compliance Score</h3>
            <p className="text-gray-500">Based on {filteredContracts.length} contracts</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-green-600">{complianceScore}%</p>
            <p className="text-sm text-gray-500">{filteredContracts.length - compliantContracts} contracts need attention</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
          <div className="bg-green-500 h-3 rounded-full" style={{ width: `${complianceScore}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b">
          {[
            { id: 'contracts', label: 'Contracts', icon: FileCheck },
            { id: 'compliance', label: 'Compliance', icon: ClipboardList },
            { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-6">
        {activeTab === 'contracts' && (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Employee</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Start Date</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No contracts found</p>
                    <p className="text-sm">Employee contracts will appear here</p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map(contract => (
                  <tr key={contract.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {employees.find(e => e.id === contract.employeeId)?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">{contract.type}</td>
                    <td className="py-3 px-4">{contract.startDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No incidents found</p>
                <p className="text-sm">Compliance incidents will appear here</p>
              </div>
            ) : (
              filteredIncidents.map(incident => (
                <div key={incident.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{incident.type}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          incident.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{incident.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
