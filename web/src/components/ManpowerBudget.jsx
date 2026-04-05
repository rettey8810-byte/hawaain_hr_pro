import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Eye,
  X
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

export default function ManpowerBudget() {
  const { companyId } = useCompany();
  const { userData, isSuperAdmin } = useAuth();
  const { documents: budgets, loading } = useFirestore('manpowerBudgets');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    basicSalary: 0,
    foodAllowance: 0,
    transportAllowance: 0,
    phoneAllowance: 0,
    otherAllowance: 0,
    companyId: companyId || ''
  });

  // Smart checks
  const [smartChecks, setSmartChecks] = useState({
    totalBudget: 0,
    employeeCount: 0,
    avgSalary: 0,
    alerts: []
  });

  useEffect(() => {
    if (budgets && budgets.length > 0) {
      calculateSmartChecks();
    }
  }, [budgets]);

  const calculateSmartChecks = () => {
    const totalBudget = budgets.reduce((sum, b) => sum + (b.monthlySalary || 0), 0);
    const employeeCount = budgets.length;
    const avgSalary = employeeCount > 0 ? totalBudget / employeeCount : 0;
    
    const alerts = [];
    
    // Check for duplicates
    const names = budgets.map(b => b.name?.toLowerCase());
    const duplicates = names.filter((item, index) => names.indexOf(item) !== index);
    if (duplicates.length > 0) {
      alerts.push({ type: 'warning', message: `Duplicate employees found: ${[...new Set(duplicates)].join(', ')}` });
    }
    
    // Check for high salaries
    const highEarners = budgets.filter(b => (b.monthlySalary || 0) > 50000);
    if (highEarners.length > 0) {
      alerts.push({ type: 'info', message: `${highEarners.length} employees have monthly salary > 50,000 MVR` });
    }
    
    // Check for zero salaries
    const zeroSalary = budgets.filter(b => !(b.monthlySalary || 0));
    if (zeroSalary.length > 0) {
      alerts.push({ type: 'error', message: `${zeroSalary.length} employees have no salary data` });
    }

    setSmartChecks({
      totalBudget,
      employeeCount,
      avgSalary,
      alerts
    });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const totalAllowances = 
        parseFloat(formData.foodAllowance) + 
        parseFloat(formData.transportAllowance) + 
        parseFloat(formData.phoneAllowance) + 
        parseFloat(formData.otherAllowance);
      
      const monthlySalary = parseFloat(formData.basicSalary) + totalAllowances;
      
      await addDoc(collection(db, 'manpowerBudgets'), {
        ...formData,
        totalAllowances,
        monthlySalary,
        projectedBudget: monthlySalary * 12,
        actualBudget: monthlySalary * 12,
        createdAt: new Date().toISOString(),
        createdBy: userData?.uid,
        status: 'active'
      });
      
      toast.success('Employee added to budget');
      setShowAddModal(false);
      setFormData({
        name: '',
        designation: '',
        basicSalary: 0,
        foodAllowance: 0,
        transportAllowance: 0,
        phoneAllowance: 0,
        otherAllowance: 0,
        companyId: companyId || ''
      });
    } catch (error) {
      toast.error('Error adding employee: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this budget entry?')) return;
    try {
      await deleteDoc(doc(db, 'manpowerBudgets', id));
      toast.success('Budget entry deleted');
    } catch (error) {
      toast.error('Error deleting: ' + error.message);
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || budget.companyId === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const companyTotals = budgets.reduce((acc, budget) => {
    const cid = budget.companyId || 'unassigned';
    if (!acc[cid]) {
      acc[cid] = { count: 0, total: 0, name: budget.companyName || cid };
    }
    acc[cid].count++;
    acc[cid].total += budget.monthlySalary || 0;
    return acc;
  }, {});

  const exportToCSV = () => {
    const headers = ['Name', 'Designation', 'Basic Salary', 'Food', 'Transport', 'Phone', 'Other', 'Total Monthly'];
    const rows = filteredBudgets.map(b => [
      b.name,
      b.designation,
      b.basicSalary,
      b.foodAllowance,
      b.transportAllowance,
      b.phoneAllowance,
      b.otherAllowance,
      b.monthlySalary
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manpower_budget_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              Manpower Budget 2026
            </h1>
            <p className="text-gray-600 mt-1">Manage employee salary budgets and projections</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Smart Checks Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Budget (Monthly)</p>
              <p className="text-2xl font-bold text-gray-900">
                MVR {smartChecks.totalBudget.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{smartChecks.employeeCount}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Salary</p>
              <p className="text-2xl font-bold text-gray-900">
                MVR {Math.round(smartChecks.avgSalary).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Annual Projection</p>
              <p className="text-2xl font-bold text-gray-900">
                MVR {(smartChecks.totalBudget * 12).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {smartChecks.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {smartChecks.alerts.map((alert, idx) => (
            <div key={idx} className={`p-3 rounded-lg flex items-center gap-2 ${
              alert.type === 'error' ? 'bg-red-100 text-red-800' :
              alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {alert.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
               alert.type === 'warning' ? <AlertCircle className="h-5 w-5" /> :
               <CheckCircle className="h-5 w-5" />}
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Companies</option>
            {Object.entries(companyTotals).map(([id, data]) => (
              <option key={id} value={id}>{data.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Company Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(companyTotals).map(([cid, data]) => (
          <div key={cid} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{data.name}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.count} employees</p>
            <p className="text-sm text-gray-600">Monthly: MVR {data.total.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allowances</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Monthly</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBudgets.map((budget) => (
              <tr key={budget.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{budget.name}</div>
                    <div className="text-sm text-gray-500">{budget.designation}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  MVR {budget.basicSalary?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="text-xs space-y-1">
                    <div>Food: MVR {budget.foodAllowance?.toLocaleString()}</div>
                    <div>Transport: MVR {budget.transportAllowance?.toLocaleString()}</div>
                    <div>Phone: MVR {budget.phoneAllowance?.toLocaleString()}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  MVR {budget.monthlySalary?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  MVR {budget.projectedBudget?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => { setSelectedBudget(budget); setShowDetailModal(true); }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Employee to Budget</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Basic Salary (MVR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({...formData, basicSalary: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Food Allowance (MVR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.foodAllowance}
                    onChange={(e) => setFormData({...formData, foodAllowance: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transport (MVR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transportAllowance}
                    onChange={(e) => setFormData({...formData, transportAllowance: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone (MVR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.phoneAllowance}
                    onChange={(e) => setFormData({...formData, phoneAllowance: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other (MVR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.otherAllowance}
                    onChange={(e) => setFormData({...formData, otherAllowance: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Calculated Monthly Salary:</p>
                <p className="text-xl font-bold text-gray-900">
                  MVR {(
                    parseFloat(formData.basicSalary || 0) +
                    parseFloat(formData.foodAllowance || 0) +
                    parseFloat(formData.transportAllowance || 0) +
                    parseFloat(formData.phoneAllowance || 0) +
                    parseFloat(formData.otherAllowance || 0)
                  ).toLocaleString()}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add to Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Employee Budget Details</h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedBudget.name}</h3>
                <p className="text-gray-600">{selectedBudget.designation}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Salary Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>MVR {selectedBudget.basicSalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Food Allowance:</span>
                    <span>MVR {selectedBudget.foodAllowance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Allowance:</span>
                    <span>MVR {selectedBudget.transportAllowance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone Allowance:</span>
                    <span>MVR {selectedBudget.phoneAllowance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Allowance:</span>
                    <span>MVR {selectedBudget.otherAllowance?.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Monthly:</span>
                    <span>MVR {selectedBudget.monthlySalary?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Annual Projection:</span>
                    <span>MVR {selectedBudget.projectedBudget?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
