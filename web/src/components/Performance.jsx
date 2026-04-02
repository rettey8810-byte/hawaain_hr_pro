import { useState } from 'react';
import { Target, TrendingUp, Users, Star, Award, Calendar, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import performanceService from '../services/performanceService';

export default function Performance() {
  const [activeTab, setActiveTab] = useState('reviews');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: reviews, loading: reviewsLoading } = useFirestore('performanceReviews');
  const { documents: goals, loading: goalsLoading } = useFirestore('goals');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredReviews = reviews.filter(r => r.companyId === companyId);
  const filteredGoals = goals.filter(g => g.companyId === companyId);

  // Calculate stats from real data
  const stats = {
    pendingReviews: filteredReviews.filter(r => r.status === 'in-progress' || r.status === 'pending').length,
    completedReviews: filteredReviews.filter(r => r.status === 'completed').length,
    activeGoals: filteredGoals.filter(g => g.status === 'active').length,
    avgRating: filteredReviews.length > 0 
      ? (filteredReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / filteredReviews.length).toFixed(1)
      : '0.0'
  };

  const ratingScale = performanceService.ratingScale;

  if (reviewsLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Winners-amico.svg" 
            alt="Performance" 
            className="h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Target className="h-8 w-8" />
              Performance Management
            </h1>
            <p className="text-purple-100 mt-1">Reviews, goals, and 360° feedback</p>
          </div>
        </div>
      </div>

      {/* Stats - Real Data */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Reviews', value: stats.pendingReviews, icon: FileText, color: 'bg-yellow-500' },
          { label: 'Completed', value: stats.completedReviews, icon: CheckIcon, color: 'bg-green-500' },
          { label: 'Active Goals', value: stats.activeGoals, icon: TrendingUp, color: 'bg-blue-500' },
          { label: 'Avg Rating', value: stats.avgRating, icon: Star, color: 'bg-purple-500' },
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
            { id: 'reviews', label: 'Performance Reviews', icon: FileText },
            { id: 'goals', label: 'Goals & OKRs', icon: Target },
            { id: 'feedback', label: '360° Feedback', icon: Users },
            { id: 'competencies', label: 'Competencies', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
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
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Rating Scale */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium mb-3">Rating Scale</h3>
              <div className="flex gap-2">
                {ratingScale.map(rating => (
                  <div key={rating.value} className="flex-1 bg-white rounded-lg p-3 text-center shadow-sm">
                    <div className={`text-2xl font-bold text-${rating.color}-500`}>{rating.value}</div>
                    <div className="text-xs text-gray-600 mt-1">{rating.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Table */}
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No performance reviews found</p>
                <p className="text-sm">Start a review cycle to track employee performance</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Employee</th>
                    <th className="text-left py-3 px-4 font-medium">Review Type</th>
                    <th className="text-left py-3 px-4 font-medium">Reviewer</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map(review => (
                    <tr key={review.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {employees.find(e => e.id === review.employeeId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">{review.type}</td>
                      <td className="py-3 px-4">
                        {employees.find(e => e.id === review.reviewerId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          review.status === 'completed' ? 'bg-green-100 text-green-700' :
                          review.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{review.dueDate}</td>
                      <td className="py-3 px-4">
                        <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                          Review <ChevronRight className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No goals found</p>
                <p className="text-sm">Set employee goals to track progress</p>
              </div>
            ) : (
              filteredGoals.map(goal => (
                <div key={goal.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        {employees.find(e => e.id === goal.employeeId)?.name || 'Unknown Employee'}
                      </p>
                      <p className="text-sm text-gray-600">{goal.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Target: {goal.targetDate}</p>
                      <p className={`text-lg font-bold ${goal.progress >= 70 ? 'text-green-600' : goal.progress >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {goal.progress}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${goal.progress >= 70 ? 'bg-green-500' : goal.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
