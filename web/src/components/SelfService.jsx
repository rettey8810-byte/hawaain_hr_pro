import { useState } from 'react';
import { UserCircle, FileText, CreditCard, Calendar, Award, ChevronRight, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import selfServiceService from '../services/selfService';

export default function SelfService() {
  const [activeService, setActiveService] = useState(null);
  const { companyId } = useCompany();

  const services = Object.values(selfServiceService.availableServices);

  // Fetch data from Firestore
  const { documents: requests, loading: requestsLoading } = useFirestore('selfServiceRequests');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredRequests = requests.filter(r => r.companyId === companyId);

  if (requestsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading self-service data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/User-cuate.svg" 
            alt="Self Service" 
            className="h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 relative z-10">
          <UserCircle className="h-8 w-8" />
          Employee Self-Service
        </h1>
        <p className="text-cyan-100 mt-1 relative z-10">Manage your profile, requests, and information</p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => setActiveService(service.id)}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="bg-cyan-100 p-3 rounded-xl w-fit mb-3">
              <service.icon className="h-5 w-5 text-cyan-600" />
            </div>
            <p className="font-medium text-sm">{service.label}</p>
            <p className="text-xs text-gray-500 mt-1">{service.description}</p>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-2 gap-6">
        {/* My Requests - Real Data */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            My Requests
          </h3>
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No requests found</p>
                <p className="text-sm">Submit requests using the services above</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{request.type}</p>
                    <p className="text-xs text-gray-500">Submitted: {request.submitted}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-600" />
            Quick Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Leave Balance</p>
                  <p className="text-xs text-gray-500">15 days remaining</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">My Certifications</p>
                  <p className="text-xs text-gray-500">3 active certifications</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
