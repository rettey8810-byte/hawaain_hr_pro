import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  Users, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  Search,
  Download,
  Building2,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  ArrowRight
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

export default function ManpowerBudget() {
  const { companyId } = useCompany();
  const { userData } = useAuth();
  const { documents: budgets, loading } = useFirestore('manpowerBudgets');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState({});
  
  // Employee data for dropdowns
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employeesData, setEmployeesData] = useState([]);
  
  // Form state - department based structure
  const [formData, setFormData] = useState({
    department: '',
    section: '',
    designation: '',
    actual2026: '',
    required100_80: '',
    required80_65: '',
    required65_50: '',
    requiredBelow50: ''
  });

  // Fetch employee data for dropdowns
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!companyId) return;
      
      try {
        const q = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId)
        );
        const snapshot = await getDocs(q);
        const employees = snapshot.docs.map(d => d.data());
        setEmployeesData(employees);
        
        // Extract unique values
        const uniqueDepts = [...new Set(employees.map(e => e['Department '] || e.Department || e.department).filter(Boolean))].sort();
        const uniqueSections = [...new Set(employees.map(e => e.Section).filter(Boolean))].sort();
        const uniqueDesignations = [...new Set(employees.map(e => e.Designation || e.designation).filter(Boolean))].sort();
        
        setDepartments(uniqueDepts);
        setSections(uniqueSections);
        setDesignations(uniqueDesignations);
      } catch (err) {
        console.error('Error fetching employee data:', err);
      }
    };
    
    fetchEmployeeData();
  }, [companyId]);

  // Group budgets by department
  const groupedByDepartment = budgets?.reduce((acc, budget) => {
    const dept = budget.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(budget);
    return acc;
  }, {}) || {};

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.department || !formData.section || !formData.designation) {
      toast.error('Please fill Department, Section, and Designation');
      return;
    }

    try {
      await addDoc(collection(db, 'manpowerBudgets'), {
        department: formData.department,
        section: formData.section,
        designation: formData.designation,
        actual2026: formData.actual2026,
        requiredManpower: {
          '100_80': formData.required100_80,
          '80_65': formData.required80_65,
          '65_50': formData.required65_50,
          'below50': formData.requiredBelow50
        },
        companyId: companyId || '',
        createdBy: userData?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Budget entry saved!');
      
      // Clear form for next entry
      setFormData({
        department: '',
        section: '',
        designation: '',
        actual2026: '',
        required100_80: '',
        required80_65: '',
        required65_50: '',
        requiredBelow50: ''
      });
      
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    }
  };

  const handleSaveAndNewDept = async () => {
    await handleSave();
    // After save, modal stays open but form is cleared for new department
    setShowAddModal(false);
    setTimeout(() => setShowAddModal(true), 100);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'manpowerBudgets', id));
      toast.success('Deleted');
    } catch (error) {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const toggleDept = (dept) => {
    setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const exportToCSV = () => {
    const headers = ['Department', 'Section', 'Designation', 'Actual 2026', 'Required 100-80%', 'Required 80-65%', 'Required 65-50%', 'Required Below 50%'];
    const rows = budgets?.map(b => [
      b.department,
      b.section,
      b.designation,
      b.actual2026,
      b.requiredManpower?.['100_80'] || '',
      b.requiredManpower?.['80_65'] || '',
      b.requiredManpower?.['65_50'] || '',
      b.requiredManpower?.below50 || ''
    ]) || [];
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manpower_budget_2026.csv';
    a.click();
    toast.success('CSV exported!');
  };

  // Filter budgets
  const filteredDepts = Object.entries(groupedByDepartment).filter(([dept, items]) => 
    dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    items.some(i => i.section?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    items.some(i => i.designation?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            Manpower Budget 2026
          </h1>
          <p className="text-gray-600 mt-1">Department → Section → Designation → Actual 2026 → Required Manpower</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Budget Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Departments</p>
              <p className="text-2xl font-bold text-blue-800">{Object.keys(groupedByDepartment).length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Entries</p>
              <p className="text-2xl font-bold text-green-800">{budgets?.length || 0}</p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Sections</p>
              <p className="text-2xl font-bold text-purple-800">
                {new Set(budgets?.map(b => b.section)).size || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Designations</p>
              <p className="text-2xl font-bold text-orange-800">
                {new Set(budgets?.map(b => b.designation)).size || 0}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search department, section, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Department List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredDepts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budget entries yet. Click "Add Budget Entry" to start.
          </div>
        ) : (
          filteredDepts.map(([deptName, deptBudgets]) => (
            <div key={deptName} className="bg-white rounded-lg shadow border border-gray-200">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                onClick={() => toggleDept(deptName)}
              >
                <div className="flex items-center gap-3">
                  {expandedDepts[deptName] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-lg">{deptName}</span>
                  <span className="text-sm text-gray-500">({deptBudgets.length} entries)</span>
                </div>
              </div>
              
              {expandedDepts[deptName] && (
                <div className="p-4 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium">Section</th>
                        <th className="px-3 py-2 text-left text-sm font-medium">Designation</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Actual 2026</th>
                        <th className="px-3 py-2 text-center text-sm font-medium bg-blue-100">100-80%</th>
                        <th className="px-3 py-2 text-center text-sm font-medium bg-green-100">80-65%</th>
                        <th className="px-3 py-2 text-center text-sm font-medium bg-yellow-100">65-50%</th>
                        <th className="px-3 py-2 text-center text-sm font-medium bg-red-100">Below 50%</th>
                        <th className="px-3 py-2 text-center text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptBudgets.map((budget) => (
                        <tr key={budget.id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">{budget.section}</td>
                          <td className="px-3 py-2 font-medium">{budget.designation}</td>
                          <td className="px-3 py-2 text-center">{budget.actual2026 || '-'}</td>
                          <td className="px-3 py-2 text-center bg-blue-50/50">{budget.requiredManpower?.['100_80'] || '-'}</td>
                          <td className="px-3 py-2 text-center bg-green-50/50">{budget.requiredManpower?.['80_65'] || '-'}</td>
                          <td className="px-3 py-2 text-center bg-yellow-50/50">{budget.requiredManpower?.['65_50'] || '-'}</td>
                          <td className="px-3 py-2 text-center bg-red-50/50">{budget.requiredManpower?.below50 || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleDelete(budget.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                Add Budget Entry
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Workflow Steps */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">1. Department</span>
                <ArrowRight className="w-4 h-4" />
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">2. Section</span>
                <ArrowRight className="w-4 h-4" />
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">3. Designation</span>
                <ArrowRight className="w-4 h-4" />
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">4. Actual 2026</span>
                <ArrowRight className="w-4 h-4" />
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">5. Required</span>
              </div>

              {/* Step 1-3: Department Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section *</label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Section...</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Designation *</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Designation...</option>
                    {designations.map(desig => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 4: Actual 2026 */}
              <div>
                <label className="block text-sm font-medium mb-1">Actual 2026</label>
                <input
                  type="text"
                  value={formData.actual2026}
                  onChange={(e) => handleInputChange('actual2026', e.target.value)}
                  placeholder="Current actual count or value for 2026"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Step 5: Required Manpower Tiers */}
              <div>
                <label className="block text-sm font-medium mb-3">Required Manpower</label>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <label className="block text-sm font-bold text-blue-800 mb-2 text-center">100 - 80%</label>
                    <input
                      type="number"
                      value={formData.required100_80}
                      onChange={(e) => handleInputChange('required100_80', e.target.value)}
                      placeholder="Count"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <label className="block text-sm font-bold text-green-800 mb-2 text-center">80 - 65%</label>
                    <input
                      type="number"
                      value={formData.required80_65}
                      onChange={(e) => handleInputChange('required80_65', e.target.value)}
                      placeholder="Count"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-center"
                    />
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                    <label className="block text-sm font-bold text-yellow-800 mb-2 text-center">65 - 50%</label>
                    <input
                      type="number"
                      value={formData.required65_50}
                      onChange={(e) => handleInputChange('required65_50', e.target.value)}
                      placeholder="Count"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 text-center"
                    />
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <label className="block text-sm font-bold text-red-800 mb-2 text-center">Below 50%</label>
                    <input
                      type="number"
                      value={formData.requiredBelow50}
                      onChange={(e) => handleInputChange('requiredBelow50', e.target.value)}
                      placeholder="Count"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  Save Entry
                </button>
                <button
                  onClick={handleSaveAndNewDept}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Save & New Entry
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
