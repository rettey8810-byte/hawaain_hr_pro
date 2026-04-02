import { useState } from 'react';
import { Heart, Award, Calendar, MessageCircle, Gift, ThumbsUp, Lightbulb, TrendingUp, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import engagementService from '../services/engagementService';

export default function Engagement() {
  const [activeTab, setActiveTab] = useState('surveys');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: surveys, loading: surveysLoading } = useFirestore('surveys');
  const { documents: recognitions, loading: recognitionsLoading } = useFirestore('recognitions');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredSurveys = surveys.filter(s => s.companyId === companyId);
  const filteredRecognitions = recognitions.filter(r => r.companyId === companyId);

  // Calculate stats from real data
  const now = new Date();
  const stats = {
    eNPS: filteredSurveys.length > 0 
      ? Math.round(filteredSurveys.reduce((sum, s) => sum + (s.npsScore || 0), 0) / filteredSurveys.length)
      : 0,
    activeSurveys: filteredSurveys.filter(s => s.status === 'active').length,
    recognitions: filteredRecognitions.length,
    events: 3 // This would come from events collection
  };

  if (surveysLoading || recognitionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading engagement data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Mental health-amico.svg" 
            alt="Engagement" 
            className="h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 relative z-10">
          <Heart className="h-8 w-8" />
          Employee Engagement
        </h1>
        <p className="text-rose-100 mt-1 relative z-10">Surveys, recognition, and feedback</p>
      </div>

      {/* Stats - Real Data */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'eNPS Score', value: `+${stats.eNPS}`, icon: TrendingUp, color: 'bg-green-500' },
          { label: 'Active Surveys', value: stats.activeSurveys, icon: MessageCircle, color: 'bg-blue-500' },
          { label: 'Recognitions', value: stats.recognitions, icon: Award, color: 'bg-yellow-500' },
          { label: 'Upcoming Events', value: stats.events, icon: Calendar, color: 'bg-purple-500' },
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
            { id: 'surveys', label: 'Surveys', icon: MessageCircle },
            { id: 'recognition', label: 'Recognition', icon: Award },
            { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-rose-600 border-b-2 border-rose-600'
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
        {activeTab === 'surveys' && (
          <div className="space-y-4">
            {filteredSurveys.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No surveys found</p>
                <p className="text-sm">Create surveys to measure employee engagement</p>
              </div>
            ) : (
              filteredSurveys.map(survey => (
                <div key={survey.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{survey.title}</h3>
                    <p className="text-sm text-gray-500">{survey.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{survey.responseCount || 0} / {survey.totalCount || 0} responses</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      survey.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Recognition - Real Data */}
        {activeTab === 'recognition' && (
          <div className="space-y-4">
            {filteredRecognitions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recognitions found</p>
                <p className="text-sm">Recognize employees for their achievements</p>
              </div>
            ) : (
              filteredRecognitions.map(rec => (
                <div key={rec.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-400 p-2 rounded-full">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {employees.find(e => e.id === rec.fromId)?.name || 'Unknown'} recognized {employees.find(e => e.id === rec.toId)?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">{rec.type}</p>
                      <p className="text-xs text-gray-500 mt-2">{rec.date}</p>
                    </div>
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
