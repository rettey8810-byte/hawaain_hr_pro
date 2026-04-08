import { useState, useMemo } from 'react';
import {
  Building2, Plus, Search, X, Edit2, Trash2, CheckCircle, Users,
  Briefcase, Building, Layers, FolderKanban, ChevronRight, ChevronDown,
  MoreVertical, ArrowUpDown, AlertCircle, Save, RefreshCw, Calendar,
  Palmtree
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

// Division/Department Modal
const DivisionModal = ({ isOpen, onClose, division, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'department',
    parentId: '',
    description: '',
    headOfDepartment: '',
    budgetCode: '',
    ...division
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            {division?.id ? 'Edit Division' : 'Add Division/Department'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Human Resources"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., HR"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="department">Department</option>
                <option value="division">Division</option>
                <option value="section">Section</option>
                <option value="unit">Unit</option>
                <option value="branch">Branch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget Code</label>
              <input
                type="text"
                value={formData.budgetCode}
                onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., BUD-HR-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Head of Department</label>
            <input
              type="text"
              value={formData.headOfDepartment}
              onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Name of HOD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Description of this division..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              {division?.id ? 'Update Division' : 'Create Division'}
            </button>
            {division?.id && (
              <button
                type="button"
                onClick={() => onDelete(division.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Designation Modal
const DesignationModal = ({ isOpen, onClose, designation, divisions, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: '',
    level: 'staff',
    grade: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    responsibilities: '',
    ...designation
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-600" />
            {designation?.id ? 'Edit Designation' : 'Add Designation'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Software Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., SE"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department/Division</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Department</option>
              {divisions.map(div => (
                <option key={div.id} value={div.name}>{div.name} ({div.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="entry">Entry Level</option>
                <option value="staff">Staff</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead/Principal</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
                <option value="vp">VP</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., G5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min Salary (USD)</label>
              <input
                type="number"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Salary (USD)</label>
              <input
                type="number"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Brief description of the role..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Key Responsibilities</label>
            <textarea
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="List main responsibilities..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              {designation?.id ? 'Update Designation' : 'Create Designation'}
            </button>
            {designation?.id && (
              <button
                type="button"
                onClick={() => onDelete(designation.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Leave Type Modal
const LeaveTypeModal = ({ isOpen, onClose, leaveType, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    daysPerYear: 0,
    daysPerMonth: 0,
    isPaid: true,
    requiresApproval: true,
    color: 'blue',
    emoji: '📋',
    description: '',
    ...leaveType
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-700' },
    { value: 'emerald', label: 'Emerald', class: 'bg-emerald-100 text-emerald-700' },
    { value: 'rose', label: 'Rose', class: 'bg-rose-100 text-rose-700' },
    { value: 'amber', label: 'Amber', class: 'bg-amber-100 text-amber-700' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-700' },
    { value: 'cyan', label: 'Cyan', class: 'bg-cyan-100 text-cyan-700' },
    { value: 'fuchsia', label: 'Fuchsia', class: 'bg-fuchsia-100 text-fuchsia-700' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-700' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-emerald-600" />
            {leaveType?.id ? 'Edit Leave Type' : 'Add Leave Type'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Annual Leave"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value (key) *</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., annual_leave"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Days Per Year</label>
              <input
                type="number"
                value={formData.daysPerYear}
                onChange={(e) => setFormData({ ...formData, daysPerYear: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Days Per Month</label>
              <input
                type="number"
                value={formData.daysPerMonth}
                onChange={(e) => setFormData({ ...formData, daysPerMonth: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {colorOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Emoji</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 🏖️"
                maxLength="2"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span className="text-sm">Paid Leave</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span className="text-sm">Requires Approval</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Description of this leave type..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700">
              {leaveType?.id ? 'Update Leave Type' : 'Create Leave Type'}
            </button>
            {leaveType?.id && (
              <button
                type="button"
                onClick={() => onDelete(leaveType.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default function CompanyStructure() {
  const [activeTab, setActiveTab] = useState('divisions');
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDivisions, setExpandedDivisions] = useState([]);

  const { companyId } = useCompany();
  const { user, userData, isHR } = useAuth();
  const isSuperAdmin = userData?.role === 'superadmin';

  const { documents: divisions, loading: divisionsLoading } = useFirestore('divisions');
  const { documents: designations, loading: designationsLoading } = useFirestore('designations');
  const { documents: employees } = useFirestore('employees');
  const { documents: leaveTypes, loading: leaveTypesLoading } = useFirestore('leaveTypes');

  const companyEmployees = useMemo(() => {
    return employees.filter(e => !companyId || e.companyId === companyId);
  }, [employees, companyId]);

  const employeeDerivedDepartments = useMemo(() => {
    const byName = new Map();
    for (const e of companyEmployees) {
      const name = (e['Department '] || e.Department || e.department || '').toString().trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (byName.has(key)) continue;
      byName.set(key, {
        id: `derived-dept-${key}`,
        name,
        code: name
          .split(' ')
          .filter(Boolean)
          .map(w => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 6) || 'DEPT',
        type: 'department',
        description: '',
        companyId
      });
    }
    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [companyEmployees, companyId]);

  const employeeDerivedDesignations = useMemo(() => {
    const byTitle = new Map();
    for (const e of companyEmployees) {
      const title = (e.Designation || e.position || '').toString().trim();
      if (!title) continue;
      const dept = (e['Department '] || e.Department || e.department || '').toString().trim();
      const key = title.toLowerCase();
      if (byTitle.has(key)) continue;
      byTitle.set(key, {
        id: `derived-desig-${key}`,
        title,
        code: title
          .split(' ')
          .filter(Boolean)
          .map(w => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 6) || 'ROLE',
        department: dept,
        level: 'staff',
        grade: '',
        description: '',
        responsibilities: '',
        companyId
      });
    }
    return Array.from(byTitle.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [companyEmployees, companyId]);

  const companyDivisions = useMemo(() => {
    const firestoreDivisions = divisions.filter(d => !companyId || d.companyId === companyId);
    const existingNames = new Set(
      firestoreDivisions
        .map(d => (d.name || '').toString().trim().toLowerCase())
        .filter(Boolean)
    );
    const merged = [...firestoreDivisions];
    for (const d of employeeDerivedDepartments) {
      if (!existingNames.has(d.name.toLowerCase())) merged.push(d);
    }
    return merged.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [divisions, companyId, employeeDerivedDepartments]);

  const companyDesignations = useMemo(() => {
    const firestoreDesignations = designations.filter(d => !companyId || d.companyId === companyId);
    const existingTitles = new Set(
      firestoreDesignations
        .map(d => (d.title || '').toString().trim().toLowerCase())
        .filter(Boolean)
    );
    const merged = [...firestoreDesignations];
    for (const d of employeeDerivedDesignations) {
      if (!existingTitles.has(d.title.toLowerCase())) merged.push(d);
    }
    return merged.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [designations, companyId, employeeDerivedDesignations]);

  const filteredDivisions = useMemo(() => {
    return companyDivisions.filter(d =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyDivisions, searchTerm]);

  const filteredDesignations = useMemo(() => {
    return companyDesignations.filter(d =>
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyDesignations, searchTerm]);

  const stats = {
    totalDivisions: companyDivisions.length,
    totalDesignations: companyDesignations.length,
    departments: companyDivisions.filter(d => d.type === 'department').length,
    designationsByLevel: companyDesignations.reduce((acc, d) => {
      acc[d.level || 'staff'] = (acc[d.level || 'staff'] || 0) + 1;
      return acc;
    }, {})
  };

  const getEmployeeCount = (divisionName) => {
    return companyEmployees.filter(e => {
      const dept = (e['Department '] || e.Department || e.department || '').toString().trim();
      return dept === divisionName;
    }).length;
  };

  const getDesignationCount = (divisionName) => {
    return companyDesignations.filter(d => d.department === divisionName).length;
  };

  const handleSaveDivision = async (divisionData) => {
    try {
      const data = {
        ...divisionData,
        companyId,
        createdBy: user?.uid,
        createdAt: divisionData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const canUpdateExisting = selectedDivision?.id && !String(selectedDivision.id).startsWith('derived-dept-');
      if (canUpdateExisting) {
        await updateDoc(doc(db, 'divisions', selectedDivision.id), data);
        toast.success('Division updated successfully');
      } else {
        await addDoc(collection(db, 'divisions'), data);
        toast.success('Division created successfully');
      }

      setShowDivisionModal(false);
      setSelectedDivision(null);
    } catch (error) {
      toast.error('Failed to save division: ' + error.message);
    }
  };

  const handleDeleteDivision = async (id) => {
    // Check if any employees are using this division
    const division = companyDivisions.find(d => d.id === id);
    const employeeCount = getEmployeeCount(division?.name);

    if (employeeCount > 0) {
      toast.error(`Cannot delete: ${employeeCount} employees are assigned to this division`);
      return;
    }

    // Check if any designations are linked
    const designationCount = getDesignationCount(division?.name);
    if (designationCount > 0) {
      toast.error(`Cannot delete: ${designationCount} designations are linked to this division`);
      return;
    }

    if (!confirm('Are you sure you want to delete this division?')) return;

    try {
      await deleteDoc(doc(db, 'divisions', id));
      toast.success('Division deleted');
      setShowDivisionModal(false);
      setSelectedDivision(null);
    } catch (error) {
      toast.error('Failed to delete division');
    }
  };

  const handleSaveDesignation = async (designationData) => {
    try {
      const data = {
        ...designationData,
        companyId,
        createdBy: user?.uid,
        createdAt: designationData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const canUpdateExisting = selectedDesignation?.id && !String(selectedDesignation.id).startsWith('derived-desig-');
      if (canUpdateExisting) {
        await updateDoc(doc(db, 'designations', selectedDesignation.id), data);
        toast.success('Designation updated successfully');
      } else {
        await addDoc(collection(db, 'designations'), data);
        toast.success('Designation created successfully');
      }

      setShowDesignationModal(false);
      setSelectedDesignation(null);
    } catch (error) {
      toast.error('Failed to save designation: ' + error.message);
    }
  };

  const handleDeleteDesignation = async (id) => {
    // Check if any employees are using this designation
    const designation = companyDesignations.find(d => d.id === id);
    const employeeCount = employees.filter(e =>
      e.companyId === companyId &&
      (e.Designation === designation?.title || e.position === designation?.title)
    ).length;

    if (employeeCount > 0) {
      toast.error(`Cannot delete: ${employeeCount} employees have this designation`);
      return;
    }

    if (!confirm('Are you sure you want to delete this designation?')) return;

    try {
      await deleteDoc(doc(db, 'designations', id));
      toast.success('Designation deleted');
      setShowDesignationModal(false);
      setSelectedDesignation(null);
    } catch (error) {
      toast.error('Failed to delete designation');
    }
  };

  const handleSaveLeaveType = async (leaveTypeData) => {
    try {
      const data = {
        ...leaveTypeData,
        companyId,
        createdBy: user?.uid,
        createdAt: leaveTypeData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedLeaveType?.id) {
        await updateDoc(doc(db, 'leaveTypes', selectedLeaveType.id), data);
        toast.success('Leave type updated successfully');
      } else {
        await addDoc(collection(db, 'leaveTypes'), data);
        toast.success('Leave type created successfully');
      }

      setShowLeaveTypeModal(false);
      setSelectedLeaveType(null);
    } catch (error) {
      toast.error('Failed to save leave type: ' + error.message);
    }
  };

  const handleDeleteLeaveType = async (id) => {
    if (!confirm('Are you sure you want to delete this leave type?')) return;

    try {
      await deleteDoc(doc(db, 'leaveTypes', id));
      toast.success('Leave type deleted');
      setShowLeaveTypeModal(false);
      setSelectedLeaveType(null);
    } catch (error) {
      toast.error('Failed to delete leave type');
    }
  };

  const toggleExpand = (id) => {
    setExpandedDivisions(prev =>
      prev.includes(id)
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  if (divisionsLoading || designationsLoading || leaveTypesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading company structure...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <Building2 className="h-full w-full text-white" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FolderKanban className="h-8 w-8" />
              Company Structure
            </h1>
            <p className="text-indigo-100 mt-1">Manage divisions, departments, and designations</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this company? This will also delete all associated data (divisions, designations, employees). This action cannot be undone.')) {
                  deleteDoc(doc(db, 'companies', companyId)).then(() => {
                    toast.success('Company deleted successfully');
                  }).catch(err => {
                    toast.error('Failed to delete company: ' + err.message);
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Company
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Divisions', value: stats.totalDivisions, icon: Building, color: 'bg-blue-500' },
          { label: 'Departments', value: stats.departments, icon: Layers, color: 'bg-purple-500' },
          { label: 'Designations', value: stats.totalDesignations, icon: Briefcase, color: 'bg-emerald-500' },
          { label: 'Entry Level', value: stats.designationsByLevel.entry || 0, icon: Users, color: 'bg-orange-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b">
          {[
            { id: 'divisions', label: 'Divisions & Departments', icon: Building },
            { id: 'designations', label: 'Designations', icon: Briefcase },
            ...(isHR() ? [{ id: 'leaveTypes', label: 'Leave Types', icon: Palmtree }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-6">
        {/* Search and Add */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <button
            onClick={() => {
              if (activeTab === 'divisions') {
                setSelectedDivision(null);
                setShowDivisionModal(true);
              } else if (activeTab === 'designations') {
                setSelectedDesignation(null);
                setShowDesignationModal(true);
              } else if (activeTab === 'leaveTypes') {
                setSelectedLeaveType(null);
                setShowLeaveTypeModal(true);
              }
            }}
            className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'divisions'
                ? 'bg-blue-600 hover:bg-blue-700'
                : activeTab === 'designations'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === 'divisions' ? 'Division' : activeTab === 'designations' ? 'Designation' : 'Leave Type'}
          </button>
        </div>

        {/* Divisions Tab */}
        {activeTab === 'divisions' && (
          <div className="space-y-3">
            {filteredDivisions.map(division => {
              const employeeCount = getEmployeeCount(division.name);
              const designationCount = getDesignationCount(division.name);
              const isExpanded = expandedDivisions.includes(division.id);

              return (
                <div key={division.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Building className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{division.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                            {division.code}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                            {division.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{division.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Users className="w-4 h-4" />
                            {employeeCount} employees
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Briefcase className="w-4 h-4" />
                            {designationCount} designations
                          </span>
                          {division.budgetCode && (
                            <span className="text-gray-400">
                              Budget: {division.budgetCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedDivision(division); setShowDivisionModal(true); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDivision(division.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredDivisions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No divisions found</p>
                <p className="text-sm mt-2">Create divisions and departments for your company structure</p>
              </div>
            )}
          </div>
        )}

        {/* Designations Tab */}
        {activeTab === 'designations' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Designation</th>
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Department</th>
                    <th className="text-left py-3 px-4">Level</th>
                    <th className="text-left py-3 px-4">Grade</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDesignations.map(designation => (
                    <tr key={designation.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{designation.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {designation.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                          {designation.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">{designation.department || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                          designation.level === 'executive' ? 'bg-red-100 text-red-700' :
                          designation.level === 'director' ? 'bg-orange-100 text-orange-700' :
                          designation.level === 'manager' ? 'bg-blue-100 text-blue-700' :
                          designation.level === 'senior' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {designation.level}
                        </span>
                      </td>
                      <td className="py-3 px-4">{designation.grade || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedDesignation(designation); setShowDesignationModal(true); }}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDesignation(designation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDesignations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No designations found</p>
                <p className="text-sm mt-2">Create designations for job positions in your company</p>
              </div>
            )}
          </div>
        )}

        {/* Leave Types Tab */}
        {activeTab === 'leaveTypes' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Leave Type</th>
                    <th className="text-left py-3 px-4">Value</th>
                    <th className="text-left py-3 px-4">Days/Year</th>
                    <th className="text-left py-3 px-4">Days/Month</th>
                    <th className="text-left py-3 px-4">Paid</th>
                    <th className="text-left py-3 px-4">Approval</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaveTypes.map(leaveType => (
                    <tr key={leaveType.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-${leaveType.color || 'gray'}-100 flex items-center justify-center`}>
                            <span className="text-lg">{leaveType.emoji || '📋'}</span>
                          </div>
                          <div>
                            <p className="font-medium">{leaveType.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {leaveType.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                          {leaveType.value}
                        </span>
                      </td>
                      <td className="py-3 px-4">{leaveType.daysPerYear || 0}</td>
                      <td className="py-3 px-4">{leaveType.daysPerMonth || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${leaveType.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {leaveType.isPaid ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${leaveType.requiresApproval ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {leaveType.requiresApproval ? 'Required' : 'Auto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedLeaveType(leaveType); setShowLeaveTypeModal(true); }}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLeaveType(leaveType.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {leaveTypes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Palmtree className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No leave types found</p>
                <p className="text-sm mt-2">Create leave types for your company</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <DivisionModal
        isOpen={showDivisionModal}
        onClose={() => { setShowDivisionModal(false); setSelectedDivision(null); }}
        division={selectedDivision}
        onSave={handleSaveDivision}
        onDelete={handleDeleteDivision}
      />

      <DesignationModal
        isOpen={showDesignationModal}
        onClose={() => { setShowDesignationModal(false); setSelectedDesignation(null); }}
        designation={selectedDesignation}
        divisions={companyDivisions}
        onSave={handleSaveDesignation}
        onDelete={handleDeleteDesignation}
      />

      <LeaveTypeModal
        isOpen={showLeaveTypeModal}
        onClose={() => { setShowLeaveTypeModal(false); setSelectedLeaveType(null); }}
        leaveType={selectedLeaveType}
        onSave={handleSaveLeaveType}
        onDelete={handleDeleteLeaveType}
      />
    </div>
  );
}
