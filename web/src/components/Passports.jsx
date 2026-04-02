import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getDocumentStatus, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Passports() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employee');
  
  const { documents: passports, loading, deleteDocument, getAllDocuments } = useFirestore('passports');
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const { isHR, userData } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [filteredPassports, setFilteredPassports] = useState([]);

  // Fetch ALL employees for name lookup
  const fetchAllEmployees = useCallback(async () => {
    if (!userData?.companyId) return;
    setEmployeesLoading(true);
    try {
      const q = query(
        collection(db, 'employees'),
        where('companyId', '==', userData.companyId)
      );
      const snap = await getDocs(q);
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [userData?.companyId]);

  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  useEffect(() => {
    const unsub = getAllDocuments();
    return () => unsub?.();
  }, [getAllDocuments]);

  useEffect(() => {
    let filtered = passports;
    
    if (employeeId) {
      filtered = filtered.filter(p => p.employeeId === employeeId);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const employee = employees.find(e => e.id === p.employeeId);
        return (
          p.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    setFilteredPassports(filtered);
  }, [passports, employeeId, searchTerm, employees]);

  const handleDelete = async () => {
    if (selectedPassport) {
      await deleteDocument(selectedPassport.id);
      setShowDeleteModal(false);
      setSelectedPassport(null);
    }
  };

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp?.name || 'Unknown';
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
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Traveling-cuate.svg" 
            alt="Passports" 
            className="h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">
            🛂 Passport Management
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Track employee passports and expiry dates
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          {isHR() && (
            <Link
              to={employeeId ? `/passports/new?employee=${employeeId}` : '/passports/new'}
              className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-teal-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Passport
            </Link>
          )}
        </div>
      </div>

      {/* Alerts Summary - Colorful Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">Expired</p>
              <p className="text-2xl font-bold">{filteredPassports.filter(p => calculateDaysRemaining(p.expiryDate) <= 0).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">&lt; 30 days</p>
              <p className="text-2xl font-bold">{filteredPassports.filter(p => {
                const days = calculateDaysRemaining(p.expiryDate);
                return days > 0 && days <= 30;
              }).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">30-60 days</p>
              <p className="text-2xl font-bold">{filteredPassports.filter(p => {
                const days = calculateDaysRemaining(p.expiryDate);
                return days > 30 && days <= 60;
              }).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/80 font-medium">60-90 days</p>
              <p className="text-2xl font-bold">{filteredPassports.filter(p => {
                const days = calculateDaysRemaining(p.expiryDate);
                return days > 60 && days <= 90;
              }).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search - Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
          <input
            type="text"
            placeholder="🔍 Search by passport number or employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>
      </div>

      {/* Passports Table - Mobile Responsive with Horizontal Scroll */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-teal-50 to-emerald-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  👤 Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  🛂 Passport Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  🌍 Country
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  📅 Issue Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  ⏰ Expiry Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  📊 Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-teal-700 uppercase tracking-wider sticky top-0">
                  ⚙️ Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredPassports.map((passport) => {
                const status = getDocumentStatus(passport.expiryDate);
                const daysRemaining = calculateDaysRemaining(passport.expiryDate);
                
                return (
                  <tr key={passport.id} className="hover:bg-teal-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {getEmployeeName(passport.employeeId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {passport.passportNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {passport.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(passport.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-gray-900 font-medium'}>
                        {formatDate(passport.expiryDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full border ${
                        status.color === 'green' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        status.color === 'yellow' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        status.color === 'red' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {status.label}
                        {daysRemaining !== null && daysRemaining > 0 && ` (${daysRemaining}d)`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {passport.documentUrl && (
                          <a
                            href={passport.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        {isHR() && (
                          <>
                            <Link
                              to={`/passports/${passport.id}/edit`}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedPassport(passport);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
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
              {filteredPassports.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-5xl mb-3">🛂</div>
                    <p className="text-gray-500 font-medium">No passports found</p>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Passport</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Are you sure you want to delete this passport record?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPassport(null);
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
