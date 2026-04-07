import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, AlertTriangle, Download, Upload } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, getDocumentStatus, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Visas() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employee');
  
  const { documents: visas, loading, deleteDocument, getAllDocuments } = useFirestore('visas');
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const { isHR, userData } = useAuth();
  const { companyId } = useCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [filteredVisas, setFilteredVisas] = useState([]);

  // Fetch ALL employees for name lookup
  const fetchAllEmployees = useCallback(async () => {
    if (!companyId) return;
    setEmployeesLoading(true);
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId)
      );
      const snap = await getDocs(q);
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  useEffect(() => {
    const unsub = getAllDocuments();
    return () => unsub?.();
  }, [getAllDocuments]);

  useEffect(() => {
    let filtered = visas;
    
    if (employeeId) {
      filtered = filtered.filter(v => v.employeeId === employeeId);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(v => {
        const employee = employees.find(e => e.id === v.employeeId);
        return (
          v.visaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.visaType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    setFilteredVisas(filtered);
  }, [visas, employeeId, searchTerm, employees]);

  const handleDelete = async () => {
    if (selectedVisa) {
      await deleteDocument(selectedVisa.id);
      setShowDeleteModal(false);
      setSelectedVisa(null);
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
    
    const rows = filteredVisas.map(visa => {
      return [
        '',
        '',
        '',
        '',
        '',
        '',
        visa.visaNumber || '',
        formatDate(visa.expiryDate),
        '',
        'Issued'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visas_${new Date().toISOString().split('T')[0]}.csv`;
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
      
      const visaIdx = headers.findIndex(h => h.toLowerCase().includes('visa') && h.toLowerCase().includes('number'));
      
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        if (visaIdx >= 0 && cols[visaIdx]) {
          imported.push({
            visaNumber: cols[visaIdx]?.trim(),
            visaType: '',
            entryType: 'single',
            expiryDate: '',
            employeeId: ''
          });
        }
      }
      
      alert(`Found ${imported.length} visa records to import. Please review and save manually.`);
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
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Plane-pana.svg" 
            alt="Visas" 
            className="h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">🎫 Visa Management</h2>
          <p className="mt-1 text-sm text-white/80">Track employee visa status and expiry dates</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-2">
          {isHR() && (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-visas"
              />
              <label
                htmlFor="import-visas"
                className="inline-flex items-center rounded-xl bg-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-white/30 transition-all cursor-pointer"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import CSV
              </label>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-600 shadow-lg hover:bg-gray-50 transition-all"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
              <Link to={employeeId ? `/visas/new?employee=${employeeId}` : '/visas/new'} className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105">
                <Plus className="h-5 w-5 mr-2" />Add Visa
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Alerts Summary - Colorful Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div><p className="text-xs text-white/80 font-medium">Expired</p><p className="text-2xl font-bold">{filteredVisas.filter(v => calculateDaysRemaining(v.expiryDate) <= 0).length}</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div><p className="text-xs text-white/80 font-medium">&lt; 30 days</p><p className="text-2xl font-bold">{filteredVisas.filter(v => {const days = calculateDaysRemaining(v.expiryDate); return days > 0 && days <= 30;}).length}</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div><p className="text-xs text-white/80 font-medium">30-60 days</p><p className="text-2xl font-bold">{filteredVisas.filter(v => {const days = calculateDaysRemaining(v.expiryDate); return days > 30 && days <= 60;}).length}</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div><p className="text-xs text-white/80 font-medium">60-90 days</p><p className="text-2xl font-bold">{filteredVisas.filter(v => {const days = calculateDaysRemaining(v.expiryDate); return days > 60 && days <= 90;}).length}</p></div>
          </div>
        </div>
      </div>

      {/* Search - Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input type="text" placeholder="🔍 Search by visa number, type, or employee name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-500 transition-all" />
        </div>
      </div>

      {/* Visas Table - Mobile Responsive with Horizontal Scroll */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-violet-50 to-purple-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-32 max-w-[140px]">👤 Employee</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-24">🎫 Type</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-32">🔢 Number</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-24">🚪 Entry</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-28">⏰ Expiry</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-28">📊 Status</th>
                <th className="px-3 py-4 text-right text-xs font-bold text-purple-700 uppercase tracking-wider sticky top-0 w-20">⚙️</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredVisas.map((visa) => {
                const status = getDocumentStatus(visa.expiryDate);
                const daysRemaining = calculateDaysRemaining(visa.expiryDate);
                return (
                  <tr key={visa.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 truncate max-w-[140px]" title={getEmployeeInfo(visa.employeeId).name}>{getEmployeeInfo(visa.employeeId).name}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{visa.visaType}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{visa.visaNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{visa.entryType}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm"><span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-gray-900 font-medium'}>{formatDate(visa.expiryDate)}</span></td>
                    <td className="px-3 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${status.color === 'green' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : status.color === 'yellow' ? 'bg-amber-100 text-amber-700 border-amber-200' : status.color === 'red' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status.label}{daysRemaining !== null && daysRemaining > 0 && ` (${daysRemaining}d)`}</span></td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {visa.documentUrl && (<a href={visa.documentUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><Eye className="h-4 w-4" /></a>)}
                        {isHR() && (<><Link to={`/visas/${visa.id}/edit`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></Link><button onClick={() => {setSelectedVisa(visa); setShowDeleteModal(true);}} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button></>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVisas.length === 0 && (<tr><td colSpan="7" className="px-6 py-12 text-center"><div className="text-5xl mb-3">🎫</div><p className="text-gray-500 font-medium">No visas found</p><p className="text-sm text-gray-400 mt-2">Use Import CSV to add records</p></td></tr>)}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Delete Modal - Mobile Responsive */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="h-8 w-8 text-rose-600" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Visa</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Are you sure you want to delete this visa record?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => {setShowDeleteModal(false); setSelectedVisa(null);}} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
