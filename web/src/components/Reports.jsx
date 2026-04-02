import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { calculateDaysRemaining, formatDate } from '../utils/helpers';

export default function Reports() {
  const { companyId } = useCompany();
  const { documents: employees } = useFirestore('employees');
  const { documents: passports } = useFirestore('passports');
  const { documents: visas } = useFirestore('visas');
  const { documents: workPermits } = useFirestore('workPermits');
  const { documents: medicals } = useFirestore('medicals');
  const { documents: renewals } = useFirestore('renewals');

  const [reportType, setReportType] = useState('expiry');
  const [dateRange, setDateRange] = useState('30');

  // Calculate statistics
  const totalEmployees = employees.length;
  const expiringDocuments = [...passports, ...visas, ...workPermits, ...medicals].filter(
    doc => {
      const days = calculateDaysRemaining(doc.expiryDate);
      return days !== null && days <= parseInt(dateRange);
    }
  );

  const expiredCount = expiringDocuments.filter(doc => calculateDaysRemaining(doc.expiryDate) <= 0).length;
  const expiring30Count = expiringDocuments.filter(doc => {
    const days = calculateDaysRemaining(doc.expiryDate);
    return days > 0 && days <= 30;
  }).length;

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${formatDate(new Date())}.csv`;
    a.click();
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">Reports & Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Comprehensive HR and expatriate reports</p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees" value={totalEmployees} icon={BarChart3} color="bg-blue-500" />
        <StatCard title="Expiring Soon" value={expiring30Count} icon={TrendingUp} color="bg-yellow-500" />
        <StatCard title="Expired Documents" value={expiredCount} icon={FileText} color="bg-red-500" />
        <StatCard title="Active Renewals" value={renewals.filter(r => r.status === 'in_progress').length} icon={PieChart} color="bg-green-500" />
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
            >
              <option value="expiry">Document Expiry</option>
              <option value="employees">Employee Summary</option>
              <option value="renewals">Renewal Status</option>
              <option value="compliance">Compliance Overview</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Range (Days)</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
            >
              <option value="30">Next 30 Days</option>
              <option value="60">Next 60 Days</option>
              <option value="90">Next 90 Days</option>
              <option value="365">Next Year</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => exportToCSV(expiringDocuments, 'expiring_documents')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Expiring Documents Report */}
      {reportType === 'expiry' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Expiring Documents</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expiringDocuments.map((doc, index) => {
                    const daysLeft = calculateDaysRemaining(doc.expiryDate);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{doc.type || 'Document'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.employeeId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(doc.expiryDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={daysLeft <= 0 ? 'text-red-600 font-medium' : daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-900'}>
                            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            daysLeft <= 0 ? 'bg-red-100 text-red-800' :
                            daysLeft <= 30 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {daysLeft <= 0 ? 'Expired' : daysLeft <= 30 ? 'Critical' : 'Warning'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
