import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, AlertTriangle, Download, Upload, Shield, Globe, X } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate, getDocumentStatus, calculateDaysRemaining } from '../utils/helpers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Medicals() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employee');
  
  const { documents: medicals, loading, deleteDocument, getAllDocuments } = useFirestore('medicals');
  const [allMedicals, setAllMedicals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [passports, setPassports] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const { isHR, userData } = useAuth();
  const { companyId } = useCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedical, setSelectedMedical] = useState(null);
  const [filteredMedicals, setFilteredMedicals] = useState([]);
  const [activeTab, setActiveTab] = useState('medical'); // 'medical' or 'insurance' or 'visa'
  const [activeFilter, setActiveFilter] = useState(null); // 'expired', '30days', '60days', '90days'

  const getExpiryDateForTab = useCallback((record) => {
    if (activeTab === 'medical') return record?.expiryDate;
    if (activeTab === 'insurance') return record?.insuranceExpiryDate;
    if (activeTab === 'visa') return record?.visaFeeExpiry;
    return null;
  }, [activeTab]);

  // Fetch ALL employees, passports, and medicals for lookup
  const fetchAllData = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      // Fetch employees (only if companyId is set)
      if (companyId) {
        const empQuery = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId)
        );
        const empSnap = await getDocs(empQuery);
        setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      
      // Fetch passports (without company filter - same as Passports component)
      const passportSnap = await getDocs(collection(db, 'passports'));
      setPassports(passportSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Fetch ALL medicals (without company filter - medicals may not have companyId)
      const medicalsSnap = await getDocs(collection(db, 'medicals'));
      const medicalsData = medicalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('Fetched medicals:', medicalsData.length, medicalsData);
      setAllMedicals(medicalsData);
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

  // Sync useFirestore medicals with allMedicals (for records without companyId)
  useEffect(() => {
    if (medicals && medicals.length > 0 && allMedicals.length === 0) {
      setAllMedicals(medicals);
    }
  }, [medicals, allMedicals.length]);

  useEffect(() => {
    // Use allMedicals if available, otherwise fall back to medicals from useFirestore
    const sourceData = allMedicals.length > 0 ? allMedicals : medicals;
    let filtered = sourceData;
    
    if (employeeId) {
      filtered = filtered.filter(m => m.employeeId === employeeId);
    }
    
    // Apply active filter from stats click
    if (activeFilter) {
      filtered = filtered.filter(m => {
        const expiryDate = getExpiryDateForTab(m);
        const days = calculateDaysRemaining(expiryDate);
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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => {
        const info = getEmployeeInfo(m);
        return (
          info.name?.toLowerCase().includes(term) ||
          String(info.empId || '').toLowerCase().includes(term) ||
          String(info.passportNumber || '').toLowerCase().includes(term)
        );
      });
    }
    
    setFilteredMedicals(filtered);
  }, [allMedicals, medicals, employeeId, searchTerm, employees, activeFilter, activeTab]);

  const handleDelete = async () => {
    if (selectedMedical) {
      await deleteDocument(selectedMedical.id);
      setShowDeleteModal(false);
      setSelectedMedical(null);
    }
  };

  const getEmployeeInfo = (medical) => {
    const medicalEmployeeId = medical?.employeeId;
    const medicalEmpId = medical?.empId ?? medical?.EmpID ?? medical?.staffId ?? medical?.empID;

    // Try to find employee by employeeId first
    let emp = medicalEmployeeId ? employees.find(e => e.id === medicalEmployeeId) : null;
    
    // If not found, try to match by EmpID (handle both string and number types)
    if (!emp && medicalEmpId) {
      const searchId = String(medicalEmpId).trim();
      emp = employees.find(e => {
        const empId1 = e.EmpID !== undefined ? String(e.EmpID).trim() : null;
        const empId2 = e.empId !== undefined ? String(e.empId).trim() : null;
        const empId3 = e.empID !== undefined ? String(e.empID).trim() : null;
        return empId1 === searchId || empId2 === searchId || empId3 === searchId;
      });
    }

    // Get passport number from linked passport if available
    const passport = medicalEmployeeId ? passports.find(p => p.employeeId === medicalEmployeeId) : null;

    return {
      name: emp?.FullName || emp?.name || medical?.employeeName || medical?.EmployeeName || 'Unknown',
      empId: emp?.EmpID || emp?.empId || emp?.employeeId || medicalEmpId || 'N/A',
      passportNumber: passport?.passportNumber || medical?.passportNumber || medical?.PPNo || 'N/A'
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
    
    const rows = filteredMedicals.map(medical => {
      return [
        '',
        '',
        '',
        formatDate(medical.expiryDate),
        '',
        '',
        '',
        '',
        '',
        medical.result === 'approved' ? 'Valid' : 'Pending'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export filtered to CSV
  const exportFilteredToCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Passport Number', 'Test Date', 'Expiry Date', 'Insurance Expiry', 'Status', 'Days Remaining'];
    
    const rows = filteredMedicals.map(m => {
      const empInfo = getEmployeeInfo(m);
      const expiryDate = getExpiryDateForTab(m);
      const days = calculateDaysRemaining(expiryDate);
      return [
        empInfo.name,
        empInfo.empId,
        empInfo.passportNumber,
        formatDate(m.testDate),
        formatDate(m.expiryDate),
        formatDate(m.insuranceExpiryDate),
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
    a.download = `medicals${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`;
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
      
      const medicalIdx = headers.findIndex(h => h.toLowerCase().includes('medical'));
      
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        if (medicalIdx >= 0 && cols[medicalIdx]) {
          imported.push({
            testDate: '',
            expiryDate: cols[medicalIdx]?.trim(),
            result: 'pending',
            testCenter: '',
            employeeId: ''
          });
        }
      }
      
      alert(`Found ${imported.length} medical records to import. Please review and save manually.`);
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
      <div className="md:flex md:items-center md:justify-between bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/HeartPulse-cuate.svg" 
            alt="Medical" 
            className="h-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <h2 className="text-3xl font-bold leading-7">
            🏥 Medical Records
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Track employee medical tests and health certificates
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
                id="import-medicals"
              />
              <label
                htmlFor="import-medicals"
                className="inline-flex items-center rounded-xl bg-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-white/30 transition-all cursor-pointer"
              >
                <Upload className="h-5 w-5 mr-2" />
                Import CSV
              </label>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-rose-600 shadow-lg hover:bg-gray-50 transition-all"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
              <Link
                to={employeeId ? `/medical/new?employee=${employeeId}` : '/medical/new'}
                className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-rose-600 shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Medical
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Sub-nav Tabs for Medical and Insurance */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('medical')}
            className={`flex items-center gap-2 px-6 py-4 font-medium ${
              activeTab === 'medical'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Medical Expiry
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`flex items-center gap-2 px-6 py-4 font-medium ${
              activeTab === 'insurance'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="h-4 w-4" />
            Insurance Expiry
          </button>
          <button
            onClick={() => setActiveTab('visa')}
            className={`flex items-center gap-2 px-6 py-4 font-medium ${
              activeTab === 'visa'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="h-4 w-4" />
            Visa Fee Expiry
          </button>
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
              <p className="text-2xl font-bold">{allMedicals.filter(m => calculateDaysRemaining(getExpiryDateForTab(m)) <= 0).length}</p>
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
              <p className="text-2xl font-bold">{allMedicals.filter(m => {
                const days = calculateDaysRemaining(getExpiryDateForTab(m));
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
              <p className="text-2xl font-bold">{allMedicals.filter(m => {
                const days = calculateDaysRemaining(getExpiryDateForTab(m));
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
              <p className="text-2xl font-bold">{allMedicals.filter(m => {
                const days = calculateDaysRemaining(getExpiryDateForTab(m));
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
              Filter: {activeFilter === 'expired' ? 'Expired Records' : activeFilter === '30days' ? 'Expiring in < 30 days' : activeFilter === '60days' ? 'Expiring in 30-60 days' : 'Expiring in 60-90 days'}
            </span>
            <span className="text-sm text-blue-600">({filteredMedicals.length} results)</span>
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
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-rose-400" />
          <input
            type="text"
            placeholder="🔍 Search by employee name, passport, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-500 transition-all"
          />
        </div>
      </div>

      {/* Medicals/Insurance Table - Mobile Responsive with Horizontal Scroll */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[1000px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-rose-50 to-pink-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-32 max-w-[140px]">👤 Employee</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-24">🆔 Staff ID</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">🛂 Passport</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">💰 Fee</th>
                {activeTab === 'medical' ? (
                  <>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">📅 Test Date</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">⏰ Med Expiry</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">💊 Med Fee Exp</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">🛡️ Ins Fee Exp</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">🌐 Visa Fee Exp</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-24">📊 Status</th>
                  </>
                ) : activeTab === 'insurance' ? (
                  <>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">🛡️ Ins Expiry</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-24">📊 Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-28">🌐 Visa Fee Exp</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-24">📊 Status</th>
                  </>
                )}
                <th className="px-3 py-4 text-right text-xs font-bold text-rose-700 uppercase tracking-wider sticky top-0 w-20">⚙️</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMedicals.map((medical) => {
                const expiryDate = getExpiryDateForTab(medical);
                const status = getDocumentStatus(expiryDate);
                const daysRemaining = calculateDaysRemaining(expiryDate);
                
                return (
                  <tr key={medical.id} className="hover:bg-rose-50/50 transition-colors">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900 truncate max-w-[140px]" title={getEmployeeInfo(medical).name}>{getEmployeeInfo(medical).name}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{getEmployeeInfo(medical).empId}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{getEmployeeInfo(medical).passportNumber}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700">{medical.medicalFee ? `MVR ${medical.medicalFee}` : 'N/A'}</td>
                    {activeTab === 'medical' ? (
                      <>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(medical.testDate)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm"><span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-gray-900 font-medium'}>{formatDate(medical.expiryDate)}</span></td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{formatDate(medical.medicalFeeExpiry)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{formatDate(medical.insuranceFeeExpiry)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">{formatDate(medical.visaFeeExpiry)}</td>
                      </>
                    ) : activeTab === 'insurance' ? (
                      <>
                        <td className="px-3 py-4 whitespace-nowrap text-sm"><span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-gray-900 font-medium'}>{formatDate(medical.insuranceExpiryDate)}</span></td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-4 whitespace-nowrap text-sm"><span className={daysRemaining <= 30 ? 'text-rose-600 font-bold' : 'text-gray-900 font-medium'}>{formatDate(medical.visaFeeExpiry)}</span></td>
                      </>
                    )}
                    <td className="px-3 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${status.color === 'green' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : status.color === 'yellow' ? 'bg-amber-100 text-amber-700 border-amber-200' : status.color === 'red' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{status.label}{daysRemaining !== null && daysRemaining > 0 && ` (${daysRemaining}d)`}</span></td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {medical.documentUrl && (<a href={medical.documentUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Eye className="h-4 w-4" /></a>)}
                        {isHR?.() && (<><Link to={`/medical/${medical.id}/edit`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></Link><button onClick={() => {setSelectedMedical(medical); setShowDeleteModal(true);}} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button></>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicals.length === 0 && (<tr><td colSpan={activeTab === 'medical' ? 11 : 7} className="px-6 py-12 text-center"><div className="text-5xl mb-3">🏥</div><p className="text-gray-500 font-medium">No records found</p><p className="text-sm text-gray-400 mt-2">Use Import CSV to add records</p></td></tr>)}
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
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Medical Record</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Are you sure you want to delete this medical record?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => {setShowDeleteModal(false); setSelectedMedical(null);}} className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
