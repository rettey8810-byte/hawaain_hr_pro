import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plane, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Bell,
  Mail,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';

const STATUS_CONFIG = {
  valid: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '✓ Valid', icon: CheckCircle },
  warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: '⚠ Warning', icon: AlertCircle },
  critical: { color: 'bg-rose-100 text-rose-700 border-rose-200', label: '🔴 Critical', icon: AlertCircle },
  expired: { color: 'bg-red-100 text-red-700 border-red-200', label: '✗ Expired', icon: AlertCircle }
};

export default function DocumentReports() {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState('visa');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});

  // Fetch documents
  const { documents: visas, loading: visasLoading } = useFirestore('visas');
  const { documents: passports, loading: passportsLoading } = useFirestore('passports');
  const { documents: workPermits, loading: permitsLoading } = useFirestore('workPermits');
  const { documents: employees, loading: employeesLoading } = useFirestore('employees');

  // Filter by company
  const companyVisas = useMemo(() => 
    visas.filter(v => v.companyId === currentCompany?.id),
    [visas, currentCompany]
  );
  
  const companyPassports = useMemo(() => 
    passports.filter(p => p.companyId === currentCompany?.id),
    [passports, currentCompany]
  );

  const companyPermits = useMemo(() => 
    workPermits.filter(w => w.companyId === currentCompany?.id),
    [workPermits, currentCompany]
  );

  // Get document status
  const getDocumentStatus = (expiryDate) => {
    const days = calculateDaysRemaining(expiryDate);
    if (days < 0) return 'expired';
    if (days <= 30) return 'critical';
    if (days <= 90) return 'warning';
    return 'valid';
  };

  // Get employee info
  const getEmployeeInfo = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return {
      name: emp?.FullName || emp?.name || 'Unknown',
      department: emp?.['Department '] || emp?.Department || emp?.department || 'N/A',
      empId: emp?.EmpID || emp?.employeeId || 'N/A'
    };
  };

  // Process visa data
  const processedVisas = useMemo(() => {
    return companyVisas.map(visa => {
      const status = getDocumentStatus(visa.expiryDate);
      const empInfo = getEmployeeInfo(visa.employeeId);
      const daysLeft = calculateDaysRemaining(visa.expiryDate);
      
      return {
        ...visa,
        status,
        daysLeft,
        ...empInfo
      };
    });
  }, [companyVisas, employees]);

  // Process passport data
  const processedPassports = useMemo(() => {
    return companyPassports.map(passport => {
      const status = getDocumentStatus(passport.expiryDate);
      const empInfo = getEmployeeInfo(passport.employeeId);
      const daysLeft = calculateDaysRemaining(passport.expiryDate);
      
      return {
        ...passport,
        status,
        daysLeft,
        ...empInfo
      };
    });
  }, [companyPassports, employees]);

  // Filter data
  const filterData = (data) => {
    return data.filter(item => {
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.empId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.visaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredVisas = filterData(processedVisas);
  const filteredPassports = filterData(processedPassports);

  // Stats
  const getStats = (data) => {
    return {
      total: data.length,
      valid: data.filter(d => d.status === 'valid').length,
      warning: data.filter(d => d.status === 'warning').length,
      critical: data.filter(d => d.status === 'critical').length,
      expired: data.filter(d => d.status === 'expired').length
    };
  };

  const visaStats = getStats(processedVisas);
  const passportStats = getStats(processedPassports);

  // Export to CSV
  const exportToCSV = (data, type) => {
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Document Number', 'Type', 'Issue Date', 'Expiry Date', 'Days Left', 'Status'];
    
    const rows = data.map(item => [
      item.name,
      item.empId,
      item.department,
      item.visaNumber || item.passportNumber || 'N/A',
      item.visaType || item.country || 'N/A',
      formatDate(item.issueDate),
      formatDate(item.expiryDate),
      item.daysLeft,
      item.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loading = visasLoading || passportsLoading || employeesLoading || permitsLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Document Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Visa and Passport status reports with expiry tracking</p>
        </div>
      </div>

      {/* Notification Alert for Critical Documents */}
      {(visaStats.critical > 0 || passportStats.critical > 0) && (
        <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg p-4 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-6 w-6 mr-3 animate-pulse" />
              <div>
                <p className="font-bold text-lg">⚠️ Urgent Action Required</p>
                <p className="text-rose-100 text-sm">
                  {visaStats.critical + passportStats.critical} document(s) expiring within 30 days
                </p>
              </div>
            </div>
            <button className="bg-white text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors">
              <Mail className="h-4 w-4 mr-2 inline" />
              Send Reminders
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Plane className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Visas</p>
              <p className="text-2xl font-bold text-gray-900">{visaStats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl shadow-sm p-4 border border-emerald-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-emerald-600">Valid</p>
              <p className="text-2xl font-bold text-emerald-700">{visaStats.valid + passportStats.valid}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl shadow-sm p-4 border border-amber-200">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-600">Warning (90d)</p>
              <p className="text-2xl font-bold text-amber-700">{visaStats.warning + passportStats.warning}</p>
            </div>
          </div>
        </div>
        <div className="bg-rose-50 rounded-xl shadow-sm p-4 border border-rose-200">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-rose-600">Critical (30d)</p>
              <p className="text-2xl font-bold text-rose-700">{visaStats.critical + passportStats.critical}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm p-4 border border-red-200">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Expired</p>
              <p className="text-2xl font-bold text-red-700">{visaStats.expired + passportStats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('visa')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'visa'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plane className="h-5 w-5 mr-2" />
              Visa Reports
              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                {filteredVisas.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('passport')}
              className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'passport'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              Passport Reports
              <span className="ml-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
                {filteredPassports.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, department, or document number..."
                className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border-gray-300 py-2 pl-3 pr-8 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="valid">✓ Valid</option>
                <option value="warning">⚠ Warning (60-90 days)</option>
                <option value="critical">🔴 Critical (0-30 days)</option>
                <option value="expired">✗ Expired</option>
              </select>
            </div>
            <button
              onClick={() => exportToCSV(activeTab === 'visa' ? filteredVisas : filteredPassports, activeTab)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'visa' ? 'Visa Number' : 'Passport Number'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type/Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'visa' ? filteredVisas : filteredPassports).length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No {activeTab} records found</p>
                  </td>
                </tr>
              ) : (
                (activeTab === 'visa' ? filteredVisas : filteredPassports).map((item) => {
                  const statusConfig = STATUS_CONFIG[item.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                            {item.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.empId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Building2 className="h-3 w-3 mr-1" />
                          {item.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {item.visaNumber || item.passportNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.visaType || item.country || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.expiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          item.daysLeft < 0 ? 'text-red-600' :
                          item.daysLeft <= 30 ? 'text-rose-600' :
                          item.daysLeft <= 90 ? 'text-amber-600' :
                          'text-emerald-600'
                        }`}>
                          {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} days ago` : `${item.daysLeft} days`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
