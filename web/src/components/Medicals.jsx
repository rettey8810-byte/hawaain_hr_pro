import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Download, Eye, Clock, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Medicals() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('medical'); // medical, insurance, fee
  const { isHR, userData } = useAuth();
  const { companyId } = useCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'employees'), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      let employees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter by department for dept_head and supervisor roles
      const userRole = userData?.role;
      const userDept = userData?.department;
      if (['dept_head', 'supervisor'].includes(userRole) && userDept) {
        employees = employees.filter(emp => {
          const empDept = emp['Department '] || emp.Department || emp.department;
          return empDept === userDept;
        });
      }
      
      // Create records based on active tab
      let extractedRecords = [];
      if (activeTab === 'medical') {
        extractedRecords = employees
          .filter(emp => emp.MedExpiry)
          .map(emp => ({
            id: `${emp.id}-med`,
            employeeId: emp.id,
            expiryDate: emp.MedExpiry,
            type: 'Medical',
            employeeName: emp.FullName || 'Unknown',
            empId: emp.EmpID || 'N/A',
            department: emp.Department || 'N/A'
          }));
      } else if (activeTab === 'insurance') {
        extractedRecords = employees
          .filter(emp => emp.InsExpiry)
          .map(emp => ({
            id: `${emp.id}-ins`,
            employeeId: emp.id,
            expiryDate: emp.InsExpiry,
            type: 'Insurance',
            employeeName: emp.FullName || 'Unknown',
            empId: emp.EmpID || 'N/A',
            department: emp.Department || 'N/A'
          }));
      } else if (activeTab === 'fee') {
        extractedRecords = employees
          .filter(emp => emp.FeeExpiry)
          .map(emp => ({
            id: `${emp.id}-fee`,
            employeeId: emp.id,
            expiryDate: emp.FeeExpiry,
            type: 'Fee',
            employeeName: emp.FullName || 'Unknown',
            empId: emp.EmpID || 'N/A',
            department: emp.Department || 'N/A'
          }));
      }
      
      setRecords(extractedRecords);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let filtered = records;
    if (activeFilter) {
      filtered = filtered.filter(r => {
        const days = calculateDaysRemaining(r.expiryDate);
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
      filtered = filtered.filter(r => 
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.empId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredRecords(filtered);
  }, [records, searchTerm, activeFilter]);

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Type', 'Expiry Date', 'Status', 'Days Remaining'];
    const rows = filteredRecords.map(r => {
      const days = calculateDaysRemaining(r.expiryDate);
      return [r.empId, r.employeeName, r.department, r.type, formatDate(r.expiryDate), days <= 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : 'Valid', days];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
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
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h2 className="text-3xl font-bold">🏥 Medical & Insurance</h2>
          <p className="mt-1 text-sm text-white/80">Track medical, insurance, and fee expiry dates</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-2">
          {isHR?.() && (
            <>
              <button onClick={exportToCSV} className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-rose-600 shadow-lg hover:bg-gray-50">
                <Download className="h-5 w-5 mr-2" /> Export CSV
              </button>
              <Link to="/employees/new" className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-rose-600 shadow-lg hover:bg-gray-50">
                <Plus className="h-5 w-5 mr-2" /> Add Employee
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        {[
          { id: 'medical', label: 'Medical' },
          { id: 'insurance', label: 'Insurance' },
          { id: 'fee', label: 'Visa Fee' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab.id ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Card */}
        <button onClick={() => setActiveFilter(null)} 
          className={`bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === null ? 'ring-4 ring-offset-2 ring-blue-300' : ''}`}>
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3"><FileText className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xs text-white/80 font-medium">📊 Total</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
          </div>
        </button>
        {[
          { id: 'expired', label: 'Expired', color: 'from-rose-500 to-red-600', icon: AlertTriangle },
          { id: '30days', label: '< 30 days', color: 'from-orange-400 to-amber-500', icon: Clock },
          { id: '60days', label: '30-60 days', color: 'from-yellow-400 to-amber-500', icon: Clock },
          { id: '90days', label: '60-90 days', color: 'from-sky-400 to-blue-500', icon: Clock }
        ].map(filter => (
          <button key={filter.id} onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)} 
            className={`bg-gradient-to-br ${filter.color} rounded-2xl p-4 text-white shadow-lg transform hover:scale-105 transition-all text-left ${activeFilter === filter.id ? 'ring-4 ring-offset-2' : ''}`}>
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-3"><filter.icon className="h-5 w-5 text-white" /></div>
              <div>
                <p className="text-xs text-white/80 font-medium">{filter.label}</p>
                <p className="text-2xl font-bold">
                  {records.filter(r => {
                    const days = calculateDaysRemaining(r.expiryDate);
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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-rose-400" />
          <input type="text" placeholder="Search by employee name or ID..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((r) => {
              const days = calculateDaysRemaining(r.expiryDate);
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.employeeName}</td>
                  <td className="px-6 py-4 text-sm">{r.empId}</td>
                  <td className="px-6 py-4 text-sm">{r.department}</td>
                  <td className="px-6 py-4 text-sm">{r.type}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(r.expiryDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(days)}`}>
                      {days <= 0 ? 'Expired' : days <= 30 ? `${days} days` : days <= 60 ? `${days} days` : days <= 90 ? `${days} days` : 'Valid'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/employees/${r.employeeId}`} className="text-rose-600 hover:text-rose-900">
                      <Eye className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500">No records found for {activeTab}</div>
        )}
      </div>
    </div>
  );
}
