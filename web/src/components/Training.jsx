import { useState } from 'react';
import { GraduationCap, Award, Calendar, BookOpen, Users, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import trainingService from '../services/trainingService';

export default function Training() {
  const [activeTab, setActiveTab] = useState('calendar');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: trainings, loading: trainingsLoading } = useFirestore('trainings');
  const { documents: certifications, loading: certsLoading } = useFirestore('certifications');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredTrainings = trainings.filter(t => t.companyId === companyId);
  const filteredCertifications = certifications.filter(c => c.companyId === companyId);

  // Calculate stats from real data
  const now = new Date();
  const stats = {
    upcomingTrainings: filteredTrainings.filter(t => new Date(t.date) > now).length,
    activeCertifications: filteredCertifications.filter(c => c.status === 'valid').length,
    completedThisMonth: filteredTrainings.filter(t => {
      const completedDate = new Date(t.completedAt || t.date);
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
    }).length,
    expiringSoon: filteredCertifications.filter(c => {
      if (!c.expiryDate) return false;
      const days = Math.ceil((new Date(c.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 30;
    }).length
  };

  const trainingTypes = trainingService.trainingTypes;

  if (trainingsLoading || certsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading training data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Learning-amico.svg" 
            alt="Training" 
            className="h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 relative z-10">
          <GraduationCap className="h-8 w-8" />
          Training & Development
        </h1>
        <p className="text-teal-100 mt-1 relative z-10">Manage training programs and certifications</p>
      </div>

      {/* Stats - Real Data */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Upcoming Trainings', value: stats.upcomingTrainings, icon: Calendar, color: 'bg-teal-500' },
          { label: 'Active Certifications', value: stats.activeCertifications, icon: Award, color: 'bg-green-500' },
          { label: 'Completed This Month', value: stats.completedThisMonth, icon: CheckCircle, color: 'bg-blue-500' },
          { label: 'Expiring Soon', value: stats.expiringSoon, icon: Clock, color: 'bg-orange-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Training Types */}
        <h3 className="font-semibold mb-4">Training Categories</h3>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {trainingTypes.map(type => (
            <div key={type.id} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 cursor-pointer">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-teal-600" />
              <p className="font-medium text-sm">{type.label}</p>
            </div>
          ))}
        </div>

        {/* Certifications - Real Data */}
        <h3 className="font-semibold mb-4">Certification Tracking</h3>
        {filteredCertifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No certifications found</p>
            <p className="text-sm">Add employee certifications to track expiry dates</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Employee</th>
                <th className="text-left py-3 px-4">Certification</th>
                <th className="text-left py-3 px-4">Expiry Date</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertifications.map(cert => {
                const daysUntil = cert.expiryDate 
                  ? Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;
                const status = daysUntil <= 0 ? 'expired' : daysUntil <= 30 ? 'expiring-soon' : 'valid';
                
                return (
                  <tr key={cert.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {(() => {
                        const emp = employees.find(e => e.id === cert.employeeId);
                        return emp ? (emp.FullName || emp.name || 'N/A') : 'Unknown';
                      })()}
                    </td>
                    <td className="py-3 px-4">{cert.name}</td>
                    <td className="py-3 px-4">{cert.expiryDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
