import { useState, useEffect, useMemo } from 'react';
import { 
  HardHat, 
  Search, 
  Download, 
  AlertTriangle, 
  Calendar,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Passport,
  CreditCard,
  HeartPulse,
  Shield,
  Building2
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  expiring30: 'bg-red-100 text-red-800',
  expiring60: 'bg-orange-100 text-orange-800',
  expiring90: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-200 text-red-900'
};

export default function ConstructionWorkforce() {
  const { currentCompany, getCompanyDisplayName, companyId } = useCompany();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterNationality, setFilterNationality] = useState('all');
  const [sortField, setSortField] = useState('Name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch construction workers from Firestore
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'constructionWorkers'),
      where('companyId', '==', companyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const worker = { id: doc.id, ...doc.data() };
        
        const today = new Date();
        const wpExpiry = new Date(worker.WPExpiry);
        const visaExpiry = new Date(worker.VIsaExpiry);
        const medicalExpiry = new Date(worker.MedicalExpiry);
        const insuranceExpiry = new Date(worker.InsuranceExpiry);
        
        const daysUntil = (date) => Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        
        const wpDays = daysUntil(wpExpiry);
        const visaDays = daysUntil(visaExpiry);
        const medicalDays = daysUntil(medicalExpiry);
        const insuranceDays = daysUntil(insuranceExpiry);
        
        let status = 'active';
        let statusReason = '';
        
        const minDays = Math.min(wpDays, visaDays, medicalDays, insuranceDays);
        
        if (minDays < 0) {
          status = 'expired';
          statusReason = 'Documents Expired';
        } else if (minDays <= 30) {
          status = 'expiring30';
          statusReason = `${minDays} days remaining`;
        } else if (minDays <= 60) {
          status = 'expiring60';
          statusReason = `${minDays} days remaining`;
        } else if (minDays <= 90) {
          status = 'expiring90';
          statusReason = `${minDays} days remaining`;
        }
        
        return {
          ...worker,
          wpDays,
          visaDays,
          medicalDays,
          insuranceDays,
          status,
          statusReason
        };
      });
      
      setWorkers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Get unique departments and nationalities for filters
  const departments = useMemo(() => [...new Set(workers.map(w => w.Department))], [workers]);
  const nationalities = useMemo(() => [...new Set(workers.map(w => w.Nationality))], [workers]);

  // Filter and sort workers
  const filteredWorkers = useMemo(() => {
    let result = workers.filter(worker => {
      const matchesSearch = 
        worker.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.PassportNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.WP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.Designation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = filterDept === 'all' || worker.Department === filterDept;
      const matchesNationality = filterNationality === 'all' || worker.Nationality === filterNationality;
      
      return matchesSearch && matchesDept && matchesNationality;
    });
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    return result;
  }, [workers, searchTerm, filterDept, filterNationality, sortField, sortDirection]);

  // Stats
  const stats = useMemo(() => {
    const total = workers.length;
    const expired = workers.filter(w => w.status === 'expired').length;
    const expiring30 = workers.filter(w => w.status === 'expiring30').length;
    const expiring60 = workers.filter(w => w.status === 'expiring60').length;
    const expiring90 = workers.filter(w => w.status === 'expiring90').length;
    const active = workers.filter(w => w.status === 'active').length;
    
    return { total, expired, expiring30, expiring60, expiring90, active };
  }, [workers]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Passport No', 'Nationality', 'WP', 'Department', 'Section', 'Designation', 'WP Expiry', 'Visa Expiry', 'Medical Expiry', 'Insurance Expiry'];
    const csvContent = [
      headers.join(','),
      ...filteredWorkers.map(w => [
        w.ID,
        `"${w.Name}"`,
        w['Passport No'],
        w.Nationality,
        w.WP,
        w.Department,
        w.Section,
        w.Designation,
        w.WPExpiry,
        w.VIsaExpiry,
        w.MedicalExpiry,
        w.InsuranceExpiry
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `construction-workforce-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Only allow access to Villa Construction company
  if (currentCompany?.id !== 'villa-construction') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
        <p className="text-gray-500 mt-2">Please switch to Villa Construction company to view this data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <HardHat className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getCompanyDisplayName()}</h1>
              <p className="text-gray-600">Construction Workforce Management</p>
            </div>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Workers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Shield className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring ≤30 Days</p>
              <p className="text-2xl font-bold text-red-600">{stats.expiring30}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring ≤60 Days</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiring60}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring ≤90 Days</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring90}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-300" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, passport, WP number, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterNationality}
            onChange={(e) => setFilterNationality(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Nationalities</option>
            {nationalities.map(nat => (
              <option key={nat} value={nat}>{nat}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredWorkers.length} of {workers.length} workers
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading workforce data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => handleSort('Name')} className="flex items-center gap-1 font-medium text-gray-700">
                    Name
                    {sortField === 'Name' && (sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Passport/WP</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nationality</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Designation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Expirations</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWorkers.map((worker) => (
                <>
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{worker.Name}</div>
                      <div className="text-xs text-gray-500">ID: {worker.ID}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{worker['Passport No']}</div>
                      <div className="text-xs text-gray-500">WP: {worker.WP}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{worker.Nationality}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{worker.Department}</div>
                      <div className="text-xs text-gray-500">{worker.Section}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{worker.Designation}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[worker.status]}`}>
                        {worker.status === 'active' ? 'Active' : worker.statusReason}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        <div className={`${worker.wpDays < 30 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          WP: {worker.WPExpiry}
                        </div>
                        <div className={`${worker.visaDays < 30 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          Visa: {worker.VIsaExpiry}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRowExpansion(worker.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {expandedRow === worker.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === worker.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <Passport className="h-4 w-4" />
                              Documents
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Passport:</span>
                                <span className="font-medium">{worker['Passport No']}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Work Permit:</span>
                                <span className="font-medium">{worker.WP}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Work Permit Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">WP Expiry:</span>
                                <span className={`font-medium ${worker.wpDays < 30 ? 'text-red-600' : ''}`}>
                                  {worker.WPExpiry} ({worker.wpDays} days)
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fee Expiry:</span>
                                <span className="font-medium">{worker.FeeExpiry}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <HeartPulse className="h-4 w-4" />
                              Health & Insurance
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Medical:</span>
                                <span className={`font-medium ${worker.medicalDays < 30 ? 'text-red-600' : ''}`}>
                                  {worker.MedicalExpiry} ({worker.medicalDays} days)
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Insurance:</span>
                                <span className={`font-medium ${worker.insuranceDays < 30 ? 'text-red-600' : ''}`}>
                                  {worker.InsuranceExpiry} ({worker.insuranceDays} days)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {filteredWorkers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No workers found. Data needs to be imported to Firestore.</p>
            <p className="text-sm text-gray-400 mt-2">Contact admin to upload Construction_Work_Force.json data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
