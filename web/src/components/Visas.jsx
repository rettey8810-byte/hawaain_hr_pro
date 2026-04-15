import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Download, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Visas() {
  const [loading, setLoading] = useState(true);
  const [visaRecords, setVisaRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const { isHR } = useAuth();
  const { companyId } = useCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'employees'), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      const employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const records = employees
        .filter(emp => emp.VisaExpiry)
        .map(emp => ({
          id: emp.id,
          employeeId: emp.id,
          visaExpiry: emp.VisaExpiry,
          employeeName: emp.FullName || 'Unknown',
          empId: emp.EmpID || 'N/A',
          department: emp.Department || 'N/A',
          nationality: emp.Nationality || 'N/A'
        }));
      
      setVisaRecords(records);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let filtered = visaRecords;
    if (activeFilter) {
      filtered = filtered.filter(v => {
        const days = calculateDaysRemaining(v.visaExpiry);
        switch(activeFilter) {
          case 'expired': return days <= 0;
          case '30days': return days > 0 && days <= 30;
          case '60days': return days > 30 && days <= 60;
          case '90days': return days > 60 && days <= 90;
          default: return true;
        }
      });
    }
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.empId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredRecords(filtered);
  }, [visaRecords, searchTerm, activeFilter]);

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Nationality', 'Visa Expiry', 'Status', 'Days Remaining'];
    const rows = filteredRecords.map(v => {
      const days = calculateDaysRemaining(v.visaExpiry);
      return [v.empId, v.employeeName, v.department, v.nationality, formatDate(v.visaExpiry), days <= 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : 'Valid', days];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (days) => {
    if (days <= 0) return 'bg-red-100 text-red-800';
    if (days <= 30) return 'bg-orange-100 text-orange-800';
    if (days <= 60) return 'bg-yellow-100 text-yellow-800';
    if (days <= 90) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h2 className="text-3xl font-bold">🛂 Visas</h2>
          <p className="mt-1 text-sm text-white/80">Track employee visa expiry dates</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-2">
          {isHR?.() && (
            <>
              <button onClick={exportToCSV} className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-600 shadow-lg hover:bg-gray-50">
                <Download className="h-5 w-5 mr-2" /> Export CSV
              </button>
              <Link to="/employees/new" className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-600 shadow-lg hover:bg-gray-50">
                <Plus className="h-5 w-5 mr-2" /> Add Employee
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { id: 'expired', label: 'Expired', color: 'from-rose-500 to-red-600' },
          { id: '30days', label: '< 30 days', color: 'from-orange-400 to-amber-500' },
          { id: '60days', label: '30-60 days', color: 'from-yellow-400 to-amber-500' },
          { id: '90days', label: '60-90 days', color: 'from-sky-400 to-blue-500' }
        ].map(filter => (
          <button key={filter.id} onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)} 
            className={`bg-gradient-to-br ${filter.color} rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === filter.id ? 'ring-4 ring-offset-2' : ''}`}>
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-3"><AlertTriangle className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-xs text-white/80 font-medium">{filter.label}</p>
                <p className="text-2xl font-bold">
                  {visaRecords.filter(v => {
                    const days = calculateDaysRemaining(v.visaExpiry);
                    if (filter.id === 'expired') return days <= 0;
                    if (filter.id === '30days') return days > 0 && days <= 30;
                    if (filter.id === '60days') return days > 30 && days <= 60;
                    if (filter.id === '90days') return days > 60 && days <= 90;
                  }).length}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/50">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
          <input type="text" placeholder="Search by employee name or ID..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nationality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((v) => {
              const days = calculateDaysRemaining(v.visaExpiry);
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{v.employeeName}</td>
                  <td className="px-6 py-4 text-sm">{v.empId}</td>
                  <td className="px-6 py-4 text-sm">{v.department}</td>
                  <td className="px-6 py-4 text-sm">{v.nationality}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(v.visaExpiry)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(days)}`}>
                      {days <= 0 ? 'Expired' : days <= 30 ? `${days} days` : days <= 60 ? `${days} days` : days <= 90 ? `${days} days` : 'Valid'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/employees/${v.employeeId}`} className="text-purple-600 hover:text-purple-900">
                      <Eye className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500">No visa records found</div>
        )}
      </div>
    </div>
  );
}
