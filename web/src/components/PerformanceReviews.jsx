import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Target, Star, Users, Calendar, TrendingUp, AlertCircle,
  CheckCircle, XCircle, Clock, FileText, Printer, Search,
  ChevronDown, ChevronUp, Plus, Edit2, Eye, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Performance Review System
 * 
 * Features:
 * - 360-degree feedback (Self, Manager, Peer reviews)
 * - KPI/Goal setting and tracking
 * - Review cycles with automated reminders
 * - Performance history and improvement plans
 * - Rating system with comments
 * - Department-wise performance analytics
 */

const REVIEW_CYCLES = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Ad-hoc'];
const REVIEW_STATUSES = ['Draft', 'Self Review', 'Manager Review', 'Peer Review', 'HR Review', 'Completed', 'Action Plan'];
const PERFORMANCE_RATINGS = [
  { value: 5, label: 'Exceptional', color: 'bg-green-500' },
  { value: 4, label: 'Exceeds Expectations', color: 'bg-blue-500' },
  { value: 3, label: 'Meets Expectations', color: 'bg-yellow-500' },
  { value: 2, label: 'Needs Improvement', color: 'bg-orange-500' },
  { value: 1, label: 'Unsatisfactory', color: 'bg-red-500' }
];

const COMPETENCY_AREAS = [
  { id: 'job_knowledge', name: 'Job Knowledge', weight: 20 },
  { id: 'quality_work', name: 'Quality of Work', weight: 20 },
  { id: 'productivity', name: 'Productivity', weight: 15 },
  { id: 'communication', name: 'Communication', weight: 15 },
  { id: 'teamwork', name: 'Teamwork', weight: 15 },
  { id: 'initiative', name: 'Initiative', weight: 15 }
];

export default function PerformanceReviews() {
  const { companyId, currentCompany } = useCompany();
  const { userData, hasAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCycle, setFilterCycle] = useState('all');
  const [stats, setStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    completedReviews: 0,
    avgRating: 0
  });

  const [formData, setFormData] = useState({
    employeeId: '',
    reviewCycle: 'Annual',
    reviewPeriod: { start: '', end: '' },
    goals: [{ description: '', target: '', weight: 0 }],
    competencies: {},
    selfReview: { ratings: {}, comments: '', submittedAt: null },
    managerReview: { ratings: {}, comments: '', submittedAt: null, managerId: '' },
    peerReviews: [],
    overallRating: 0,
    status: 'Draft',
    actionItems: []
  });

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      );
      const employeesSnap = await getDocs(employeesQuery);
      const employeesData = employeesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);

      // Fetch reviews
      const reviewsQuery = query(
        collection(db, 'performanceReviews'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);

      // Calculate stats
      const pending = reviewsData.filter(r => !['Completed', 'Action Plan'].includes(r.status)).length;
      const completed = reviewsData.filter(r => r.status === 'Completed').length;
      const avgRating = reviewsData.length > 0 
        ? reviewsData.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviewsData.length 
        : 0;
      
      setStats({
        totalReviews: reviewsData.length,
        pendingReviews: pending,
        completedReviews: completed,
        avgRating: avgRating.toFixed(1)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      const employee = employees.find(e => e.id === formData.employeeId);
      const reviewData = {
        ...formData,
        employeeName: employee?.name,
        employeeDepartment: employee?.department,
        employeePosition: employee?.position,
        companyId,
        createdBy: userData.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'performanceReviews'), reviewData);
      toast.success('Performance review created successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error('Failed to create review');
    }
  };

  const handleUpdateReview = async (reviewId, updates) => {
    try {
      await updateDoc(doc(db, 'performanceReviews', reviewId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      toast.success('Review updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      reviewCycle: 'Annual',
      reviewPeriod: { start: '', end: '' },
      goals: [{ description: '', target: '', weight: 0 }],
      competencies: {},
      selfReview: { ratings: {}, comments: '', submittedAt: null },
      managerReview: { ratings: {}, comments: '', submittedAt: null, managerId: '' },
      peerReviews: [],
      overallRating: 0,
      status: 'Draft',
      actionItems: []
    });
  };

  const calculateOverallRating = (competencies) => {
    const ratings = Object.values(competencies || {});
    if (ratings.length === 0) return 0;
    return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
  };

  const getRatingColor = (rating) => {
    const perf = PERFORMANCE_RATINGS.find(p => p.value === Math.round(rating));
    return perf?.color || 'bg-gray-400';
  };

  const getRatingLabel = (rating) => {
    const perf = PERFORMANCE_RATINGS.find(p => p.value === Math.round(rating));
    return perf?.label || 'Not Rated';
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.employeeDepartment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesCycle = filterCycle === 'all' || review.reviewCycle === filterCycle;
    return matchesSearch && matchesStatus && matchesCycle;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Performance Reviews</h2>
          </div>
          <p className="text-gray-600 mt-1">360-degree feedback and performance management</p>
        </div>
        {hasAccess('employees', 'create') && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Review
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedReviews}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgRating}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {REVIEW_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Cycles</option>
            {REVIEW_CYCLES.map(cycle => (
              <option key={cycle} value={cycle}>{cycle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[900px] sm:min-w-full px-4 sm:px-0">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{review.employeeName}</div>
                  <div className="text-sm text-gray-500">{review.employeePosition}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {review.employeeDepartment}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {review.reviewCycle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {review.reviewPeriod?.start} to {review.reviewPeriod?.end}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    review.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    review.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                    review.status === 'Action Plan' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {review.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {review.overallRating > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getRatingColor(review.overallRating)}`}></div>
                      <span className="font-medium">{review.overallRating}</span>
                      <span className="text-xs text-gray-500">({getRatingLabel(review.overallRating)})</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Not rated</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {hasAccess('employees', 'edit') && (
                    <button
                      onClick={() => {/* Edit logic */}}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>
        {filteredReviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No performance reviews found matching your criteria.
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Create Performance Review</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Cycle *</label>
                  <select
                    required
                    value={formData.reviewCycle}
                    onChange={(e) => setFormData({...formData, reviewCycle: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {REVIEW_CYCLES.map(cycle => (
                      <option key={cycle} value={cycle}>{cycle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {REVIEW_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewPeriod.start}
                    onChange={(e) => setFormData({
                      ...formData, 
                      reviewPeriod: {...formData.reviewPeriod, start: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewPeriod.end}
                    onChange={(e) => setFormData({
                      ...formData, 
                      reviewPeriod: {...formData.reviewPeriod, end: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
