import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, AlertTriangle, Download, Upload, X } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, getDocumentStatus, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function WorkPermits() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employee');
  
  const { documents: permits, loading, deleteDocument, getAllDocuments } = useFirestore('workPermits');
  const [allPermits, setAllPermits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const { isHR, userData } = useAuth();
  const { companyId } = useCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [filteredPermits, setFilteredPermits] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null); // 'expired', '30days', '60days', '90days'

  // Fetch ALL employees and work permits for lookup
  const fetchAllData = useCallback(async () => {
    if (!companyId) return;
    setEmployeesLoading(true);
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId)
      );
      const snap = await getDocs(q);
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Fetch ALL work permits (without company filter - permits may not have companyId)
      const permitsSnap = await getDocs(collection(db, 'workPermits'));
      setAllPermits(permitsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const unsub = getAllDocuments();
    return () => unsub?.();
  }, [getAllDocuments]);

  useEffect(() => {
    let filtered = allPermits;
    
    if (employeeId) {
      filtered = filtered.filter(p => p.employeeId === employeeId);
    }
    
    // Apply active filter from stats click
    if (activeFilter) {
      filtered = filtered.filter(p => {
        const days = calculateDaysRemaining(p.expiryDate);
        switch (activeFilter) {
          case 'expired':
            return days <= 0;
          case '30days':
            return days > 0 && days <= 30;
          case '60days':
            return days > 30 && days <= 60;
          case '90days':
            return days > 60 && days <= 90;
          default:
            return true;
        }
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return (
          p.permitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.employer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    setFilteredPermits(filtered);
  }, [allPermits, employeeId, searchTerm, employees, activeFilter]);

  const handleDelete = async () => {
    if (selectedPermit) {
      await deleteDocument(selectedPermit.id);
      setShowDeleteModal(false);
      setSelectedPermit(null);
    }
  };

  const getEmployeeInfo = (id) => {
    const emp = employees.find(e => e.id === id);
    return {
      name: emp?.FullName || emp?.name || 'Unknown',
      empId: emp?.EmpID || emp?.employeeId || 'N/A'
    };
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'WorkpermitNumber',
      'PassportNumber',
      'WorkpermitExpiryDate',
      'MedicalExpiry',
      'InsuranceExpiry',
      'ArrivalDate',
      'WorkVisaNumber',
      'WorkVisaExpiryDate',
      'WorkpermitContractExpiry',
      'WorkpermitState'
    ];
    
    const rows = filteredPermits.map(permit => {
      return [
        permit.permitNumber || '',
        '',
        formatDate(permit.expiryDate),
        '',
        '',
        '',
        '',
        '',
        '',
        'Issued'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work_permits_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export filtered to CSV
  const exportFilteredToCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Permit Number', 'Job Position', 'Employer', 'Expiry Date', 'Status', 'Days Remaining'];
    
    const rows = filteredPermits.map(p => {
      const empInfo = getEmployeeInfo(p.employeeId);
      const days = calculateDaysRemaining(p.expiryDate);
      return [
        empInfo.name,
        empInfo.empId,
        p.permitNumber || '',
        p.jobPosition || '',
        p.employer || '',
        formatDate(p.expiryDate),
        days <= 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : days <= 60 ? 'Warning' : days <= 90 ? 'Attention' : 'Valid',
        days !== null ? days : ''
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filterLabel = activeFilter ? `_${activeFilter}` : '';
    a.download = `work_permits${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const permitIdx = headers.findIndex(h => h.toLowerCase().includes('workpermit'));
      
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        if (permitIdx >= 0 && cols[permitIdx]) {
          imported.push({
            permitNumber: cols[permitIdx]?.trim(),
            jobPosition: '',
            employer: '',
            expiryDate: '',
            employeeId: ''
          });
        }
      }
      
      alert(`Found ${imported.length} work permit records to import. Please review and save manually.`);
    };
    reader.readAsText(file);
  };

  if (loading || employeesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Modern Gradient with Illustration */}
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Briefcase-cuate.svg" 
            alt="Work Permits" 
            className="h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">
            📄 Work Permit Management
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Track employee work permits and renewal status
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-2">
          {isHR?.() && (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-permits"
              />
              <label
                htmlFor="import-permits"
                className="inline-flex items-center rounded-xl bg-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-white/30 transition-all cursor-pointer"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import CSV
              </label>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 shadow-lg hover:bg-gray-50 transition-all"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
              <Link
                to={employeeId ? `/work-permits/new?employee=${employeeId}` : '/work-permits/new'}
                className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Work Permit
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Alerts Summary - Colorful Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button 
          onClick={() => setActiveFilter(activeFilter === 'expired' ? null : 'expired')}
          className={`bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === 'expired' ? 'ring-4 ring-rose-300' : ''}`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Expired</p>
              <p className="text-2xl font-bold">{allPermits.filter(p => calculateDaysRemaining(p.expiryDate) <= 0).length}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => setActiveFilter(activeFilter === '30days' ? null : '30days')}
          className={`bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === '30days' ? 'ring-4 ring-orange-300' : ''}`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">&lt; 30 days</p>
              <p className="text-2xl font-bold">{allPermits.filter(p => {
                const days = calculateDaysRemaining(p.expiryDate);
                return days > 0 && days <= 30;
              }).length}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => setActiveFilter(activeFilter === '60days' ? null : '60days')}
          className={`bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === '60days' ? 'ring-4 ring-yellow-300' : ''}`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">30-60 days</p>
              <p className="text-2xl font-bold">{allPermits.filter(p => {
                const days = calculateDaysRemaining(p.expiryDate);
                return days > 30 && days <= 60;
              }).length}</p>
            </div>
          </div>
        </button>
        <button 
          onClick={() => setActiveFilter(activeFilter === '90days' ? null : '90days')}
          className={`bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === '90days' ? 'ring-4 ring-sky-300' : ''}`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">60-90 days</p>
              <p className="text-2xl font-bold">{allPermits.filter(p => {
                const days = calculateDaysRemaining(p.expiryDate);
                return days > 60 && days <= 90;
              }).length}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filter Indicator */}
      {activeFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">
              Filter: {activeFilter === 'expired' ? 'Expired Permits' : activeFilter === '30days' ? 'Expiring in < 30 days' : activeFilter === '60days' ? 'Expiring in 30-60 days' : 'Expiring in 60-90 days'}
            </span>
            <span className="text-sm text-blue-600">({filteredPermits.length} results)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportFilteredToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export Filtered
            </button>
            <button
              onClick={() => setActiveFilter(null)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
              title="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search - Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-400" />
          <input
            type="text"
            placeholder="🔍 Search by permit number, employer, or employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Work Permits Table - Mobile Responsive with Horizontal Scroll */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-32 max-w-[140px]">👤 Employee</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-24">🆔 Emp ID</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-32">📄 Permit Number</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-28">💼 Job Position</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-28">🏢 Employer</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-28">⏰ Expiry Date</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-24">📊 Status</th>
                <th className="px-3 py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 w-20">⚙️</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPermits.map((permit) => {
                const status = getDocumentStatus(permit.expiryDate);
                const daysRemaining = calculateDaysRemaining(permit.expiryDate);
                const empInfo = getEmployeeInfo(permit.employeeId);
                
                return (
                  <tr key={permit.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 truncate max-w-[140px]" title={empInfo.name}>{empInfo.name}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{empInfo.empId}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{permit.permitNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{permit.jobPosition}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{permit.employer}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm"><span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-gray-900 font-medium'}>{formatDate(permit.expiryDate)}</span></td>
                    <td className="px-3 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${status.color === 'green' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : status.color === 'yellow' ? 'bg-amber-100 text-amber-700 border-amber-200' : status.color === 'red' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status.label}{daysRemaining !== null && daysRemaining > 0 && ` (${daysRemaining}d)`}</span></td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {permit.documentUrl && (
                          <a
                            href={permit.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        {isHR?.() && (
                          <>
                            <Link
                              to={`/work-permits/${permit.id}/edit`}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedPermit(permit);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPermits.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-5xl mb-3">📄</div>
                    <p className="text-gray-500 font-medium">No work permits found</p>
                    <p className="text-sm text-gray-400 mt-2">Use Import CSV to add records</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Delete Modal - Mobile Responsive */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Work Permit</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to delete this work permit record?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPermit(null);
                }}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
