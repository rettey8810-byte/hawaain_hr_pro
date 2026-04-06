import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Award, Calendar, CheckCircle, Clock, Plus, Search, 
  Filter, ChevronRight, Star, Target, User, Building2, X, Edit2, 
  Trash2, Download, Mail, ArrowUpRight, BarChart3, Users, Briefcase,
  GraduationCap, DollarSign, FileText, MoreVertical, Eye
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

// Career Level Definitions
const CAREER_LEVELS = [
  { level: 1, title: 'Entry Level', minYears: 0, maxYears: 2, color: 'bg-gray-100' },
  { level: 2, title: 'Junior', minYears: 1, maxYears: 3, color: 'bg-blue-100' },
  { level: 3, title: 'Mid-Level', minYears: 3, maxYears: 5, color: 'bg-green-100' },
  { level: 4, title: 'Senior', minYears: 5, maxYears: 8, color: 'bg-yellow-100' },
  { level: 5, title: 'Lead', minYears: 7, maxYears: 10, color: 'bg-orange-100' },
  { level: 6, title: 'Principal/Manager', minYears: 10, maxYears: 15, color: 'bg-purple-100' },
  { level: 7, title: 'Director', minYears: 12, maxYears: 20, color: 'bg-pink-100' },
  { level: 8, title: 'VP/Executive', minYears: 15, maxYears: 30, color: 'bg-red-100' }
];

const PROMOTION_STATUS = {
  eligible: { label: 'Eligible', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: Award },
  promoted: { label: 'Promoted', color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
  rejected: { label: 'Not Ready', color: 'bg-red-100 text-red-800', icon: X }
};

// Promotion Modal Component
const PromotionModal = ({ isOpen, onClose, promotion, employees, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    fromPosition: '',
    toPosition: '',
    fromLevel: 1,
    toLevel: 2,
    fromSalary: '',
    toSalary: '',
    effectiveDate: '',
    status: 'review',
    reason: '',
    achievements: '',
    trainingCompleted: '',
    managerNotes: '',
    hrNotes: '',
    ...promotion
  });

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            {promotion?.id ? 'Edit Promotion' : 'New Promotion'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee *</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={promotion?.id}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.FullName || emp.name} - {emp.Designation || emp.position}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Position</label>
              <input
                type="text"
                value={formData.fromPosition}
                onChange={(e) => setFormData({ ...formData, fromPosition: e.target.value })}
                placeholder={selectedEmployee?.Designation || 'Current position'}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Position *</label>
              <input
                type="text"
                value={formData.toPosition}
                onChange={(e) => setFormData({ ...formData, toPosition: e.target.value })}
                placeholder="New position title"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Level</label>
              <select
                value={formData.fromLevel}
                onChange={(e) => setFormData({ ...formData, fromLevel: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CAREER_LEVELS.map(level => (
                  <option key={level.level} value={level.level}>Level {level.level} - {level.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Level</label>
              <select
                value={formData.toLevel}
                onChange={(e) => setFormData({ ...formData, toLevel: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CAREER_LEVELS.map(level => (
                  <option key={level.level} value={level.level}>Level {level.level} - {level.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Salary</label>
              <input
                type="number"
                value={formData.fromSalary}
                onChange={(e) => setFormData({ ...formData, fromSalary: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Salary</label>
              <input
                type="number"
                value={formData.toSalary}
                onChange={(e) => setFormData({ ...formData, toSalary: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Effective Date *</label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PROMOTION_STATUS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Promotion Justification</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Why does this employee deserve promotion?"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Key Achievements</label>
            <textarea
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              rows={2}
              placeholder="List major accomplishments..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Training Completed</label>
            <textarea
              value={formData.trainingCompleted}
              onChange={(e) => setFormData({ ...formData, trainingCompleted: e.target.value })}
              rows={2}
              placeholder="Relevant training and certifications..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              {promotion?.id ? 'Update Promotion' : 'Create Promotion'}
            </button>
            {promotion?.id && (
              <button
                type="button"
                onClick={() => onDelete(promotion.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Career Path Visualization
const CareerPath = ({ employee, promotions }) => {
  const employeePromotions = promotions
    .filter(p => p.employeeId === employee?.id)
    .sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Career Progression
      </h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        {employeePromotions.length === 0 ? (
          <p className="text-gray-500 pl-10">No promotion history yet</p>
        ) : (
          employeePromotions.map((promo, idx) => (
            <div key={promo.id} className="relative pl-10 pb-6 last:pb-0">
              <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                promo.status === 'promoted' ? 'bg-green-500 border-green-500' : 'bg-white border-blue-500'
              }`}></div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{promo.fromPosition} → {promo.toPosition}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${PROMOTION_STATUS[promo.status]?.color}`}>
                    {PROMOTION_STATUS[promo.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{promo.effectiveDate}</p>
                {promo.toSalary && promo.fromSalary && (
                  <p className="text-sm text-green-600 mt-1">
                    Salary increase: ${(parseFloat(promo.toSalary) - parseFloat(promo.fromSalary)).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main Promotions Component
export default function Promotions() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCareerPath, setShowCareerPath] = useState(false);

  const { companyId } = useCompany();
  const { user, userData } = useAuth();

  const { documents: promotions, loading: promotionsLoading } = useFirestore('promotions');
  const { documents: employees, loading: employeesLoading } = useFirestore('employees');

  const filteredPromotions = useMemo(() => {
    return promotions
      .filter(p => p.companyId === companyId)
      .filter(p => {
        if (searchTerm) {
          const emp = employees.find(e => e.id === p.employeeId);
          return (emp?.FullName || emp?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                 p.toPosition?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
      })
      .filter(p => filterStatus === 'all' || p.status === filterStatus)
      .sort((a, b) => new Date(b.createdAt || b.effectiveDate) - new Date(a.createdAt || a.effectiveDate));
  }, [promotions, companyId, employees, searchTerm, filterStatus]);

  const eligibleEmployees = useMemo(() => {
    return employees.filter(e => {
      if (e.companyId !== companyId) return false;
      const hireDate = e.HireDate ? new Date(e.HireDate) : null;
      if (!hireDate) return false;
      const yearsOfService = (new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365);
      const hasRecentPromotion = promotions.some(p => 
        p.employeeId === e.id && 
        p.status === 'promoted' &&
        new Date(p.effectiveDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      );
      return yearsOfService >= 2 && !hasRecentPromotion;
    });
  }, [employees, companyId, promotions]);

  const stats = {
    totalPromotions: filteredPromotions.length,
    pendingReview: filteredPromotions.filter(p => p.status === 'review').length,
    approvedThisYear: filteredPromotions.filter(p => 
      p.status === 'promoted' && 
      new Date(p.effectiveDate).getFullYear() === new Date().getFullYear()
    ).length,
    eligibleForPromotion: eligibleEmployees.length,
    avgSalaryIncrease: filteredPromotions
      .filter(p => p.toSalary && p.fromSalary)
      .reduce((sum, p) => sum + ((parseFloat(p.toSalary) - parseFloat(p.fromSalary)) / parseFloat(p.fromSalary) * 100), 0) / 
      filteredPromotions.filter(p => p.toSalary && p.fromSalary).length || 0
  };

  const handleSavePromotion = async (promotionData) => {
    try {
      const data = {
        ...promotionData,
        companyId,
        createdBy: user?.uid,
        createdAt: promotionData.id ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedPromotion?.id) {
        await updateDoc(doc(db, 'promotions', selectedPromotion.id), data);
        toast.success('Promotion updated successfully');
      } else {
        await addDoc(collection(db, 'promotions'), data);
        toast.success('Promotion created successfully');
      }

      setShowModal(false);
      setSelectedPromotion(null);
    } catch (error) {
      toast.error('Failed to save promotion: ' + error.message);
    }
  };

  const handleDeletePromotion = async (id) => {
    if (!confirm('Are you sure you want to delete this promotion record?')) return;
    try {
      await deleteDoc(doc(db, 'promotions', id));
      toast.success('Promotion deleted');
      setShowModal(false);
      setSelectedPromotion(null);
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  const handleApprovePromotion = async (promotion) => {
    try {
      await updateDoc(doc(db, 'promotions', promotion.id), {
        status: 'approved',
        approvedBy: user?.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Promotion approved');
    } catch (error) {
      toast.error('Failed to approve promotion');
    }
  };

  if (promotionsLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading promotions data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <TrendingUp className="h-full w-full text-white" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="h-8 w-8" />
            Career & Promotions
          </h1>
          <p className="text-blue-100 mt-1">Track employee career progression and promotions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Promotions', value: stats.totalPromotions, icon: TrendingUp, color: 'bg-blue-500' },
          { label: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Promoted This Year', value: stats.approvedThisYear, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Eligible Employees', value: stats.eligibleForPromotion, icon: Users, color: 'bg-purple-500' },
          { label: 'Avg Salary Increase', value: `${stats.avgSalaryIncrease.toFixed(1)}%`, icon: DollarSign, color: 'bg-emerald-500' },
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
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'promotions', label: 'Promotions', icon: TrendingUp },
            { id: 'eligible', label: 'Eligible Employees', icon: Star },
            { id: 'career-paths', label: 'Career Paths', icon: Target }
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Recent Promotions</h3>
              <div className="space-y-3">
                {filteredPromotions.slice(0, 5).map(promo => {
                  const emp = employees.find(e => e.id === promo.employeeId);
                  return (
                    <div key={promo.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {(emp?.FullName || emp?.name || '?').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{emp?.FullName || emp?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{promo.fromPosition} → {promo.toPosition}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${PROMOTION_STATUS[promo.status]?.color}`}>
                        {PROMOTION_STATUS[promo.status]?.label}
                      </span>
                    </div>
                  );
                })}
                {filteredPromotions.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No promotions yet</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Career Level Distribution</h3>
              <div className="space-y-2">
                {CAREER_LEVELS.map(level => {
                  const count = employees.filter(e => {
                    const empPromotions = promotions.filter(p => p.employeeId === e.id && p.status === 'promoted');
                    const currentLevel = empPromotions.length > 0 
                      ? Math.max(...empPromotions.map(p => p.toLevel))
                      : 1;
                    return currentLevel === level.level && e.companyId === companyId;
                  }).length;
                  return (
                    <div key={level.level} className="flex items-center gap-3">
                      <div className="w-24 text-sm">{level.title}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div 
                          className={`h-full ${level.color} flex items-center justify-end px-2`}
                          style={{ width: `${Math.max((count / Math.max(employees.filter(e => e.companyId === companyId).length, 1)) * 100, 5)}%` }}
                        >
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search promotions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  {Object.entries(PROMOTION_STATUS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setSelectedPromotion(null); setShowModal(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Promotion
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">From → To</th>
                  <th className="text-left py-3 px-4">Effective Date</th>
                  <th className="text-left py-3 px-4">Salary Change</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPromotions.map(promo => {
                  const emp = employees.find(e => e.id === promo.employeeId);
                  const salaryChange = promo.toSalary && promo.fromSalary 
                    ? parseFloat(promo.toSalary) - parseFloat(promo.fromSalary)
                    : 0;
                  return (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                            {(emp?.FullName || emp?.name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{emp?.FullName || emp?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{emp?.Department || emp?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{promo.fromPosition || 'N/A'}</span>
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{promo.toPosition}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{promo.effectiveDate}</td>
                      <td className="py-3 px-4">
                        {salaryChange > 0 ? (
                          <span className="text-green-600">+${salaryChange.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${PROMOTION_STATUS[promo.status]?.color}`}>
                          {PROMOTION_STATUS[promo.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedPromotion(promo); setShowModal(true); }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {promo.status === 'review' && (
                            <button
                              onClick={() => handleApprovePromotion(promo)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredPromotions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No promotions found</p>
              </div>
            )}
          </div>
        )}

        {/* Eligible Tab */}
        {activeTab === 'eligible' && (
          <div>
            <h3 className="font-semibold mb-4">Employees Eligible for Promotion</h3>
            <div className="grid grid-cols-2 gap-4">
              {eligibleEmployees.map(emp => {
                const empPromotions = promotions.filter(p => p.employeeId === emp.id && p.status === 'promoted');
                const lastPromotion = empPromotions.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))[0];
                const hireDate = emp.HireDate ? new Date(emp.HireDate) : null;
                const yearsOfService = hireDate ? ((new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(1) : 'N/A';
                
                return (
                  <div key={emp.id} className="bg-gray-50 rounded-xl p-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-medium">
                      {(emp.FullName || emp.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{emp.FullName || emp.name}</p>
                        <button
                          onClick={() => { 
                            setSelectedPromotion({ employeeId: emp.id, fromPosition: emp.Designation || emp.position, fromLevel: 1 }); 
                            setShowModal(true); 
                          }}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Initiate Promotion
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">{emp.Designation || emp.position} • {emp.Department || emp.department}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600">{yearsOfService} years of service</span>
                        {lastPromotion && (
                          <span className="text-gray-500">Last promoted: {lastPromotion.effectiveDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {eligibleEmployees.length === 0 && (
              <p className="text-center py-8 text-gray-500">No employees currently eligible for promotion</p>
            )}
          </div>
        )}

        {/* Career Paths Tab */}
        {activeTab === 'career-paths' && (
          <div>
            <h3 className="font-semibold mb-4">Employee Career Progression</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {employees
                .filter(e => e.companyId === companyId)
                .slice(0, 9)
                .map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => { setSelectedEmployee(emp); setShowCareerPath(true); }}
                    className="text-left bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {(emp.FullName || emp.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{emp.FullName || emp.name}</p>
                        <p className="text-sm text-gray-500">{emp.Designation || emp.position}</p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            {showCareerPath && selectedEmployee && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold">
                      {selectedEmployee.FullName || selectedEmployee.name}'s Career Path
                    </h3>
                    <button 
                      onClick={() => { setShowCareerPath(false); setSelectedEmployee(null); }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <CareerPath employee={selectedEmployee} promotions={promotions} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedPromotion(null); }}
        promotion={selectedPromotion}
        employees={employees.filter(e => e.companyId === companyId)}
        onSave={handleSavePromotion}
        onDelete={handleDeletePromotion}
      />
    </div>
  );
}
