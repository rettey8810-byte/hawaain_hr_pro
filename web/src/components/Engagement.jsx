import { useState, useEffect, useMemo } from 'react';
import { 
  Heart, Award, Calendar, MessageCircle, Gift, ThumbsUp, Lightbulb, 
  TrendingUp, Loader2, Plus, Search, X, CheckCircle, Star, Users,
  Send, BarChart3, Clock, Target, Zap, Smile, FileText, MoreVertical,
  Edit2, Trash2, Eye, Download, Megaphone, Bell
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

// Survey Templates
const SURVEY_TEMPLATES = [
  {
    id: 'enps',
    name: 'Employee Net Promoter Score (eNPS)',
    description: 'Measure employee loyalty and satisfaction',
    questions: [
      { text: 'On a scale of 0-10, how likely are you to recommend this company as a place to work?', type: 'nps' },
      { text: 'What is the primary reason for your score?', type: 'text' }
    ]
  },
  {
    id: 'pulse',
    name: 'Pulse Survey',
    description: 'Quick check on employee sentiment',
    questions: [
      { text: 'How are you feeling at work this week?', type: 'emoji' },
      { text: 'Do you have the resources you need to do your job?', type: 'yes_no' },
      { text: 'How would you rate your workload?', type: 'scale' }
    ]
  },
  {
    id: 'engagement',
    name: 'Full Engagement Survey',
    description: 'Comprehensive engagement assessment',
    questions: [
      { text: 'I am proud to work for this company', type: 'agreement' },
      { text: 'My manager supports my development', type: 'agreement' },
      { text: 'I understand how my role contributes to company goals', type: 'agreement' },
      { text: 'I have opportunities to grow professionally', type: 'agreement' }
    ]
  }
];

// Recognition Badges
const RECOGNITION_BADGES = [
  { id: 'excellence', name: 'Excellence Award', icon: Star, color: 'bg-yellow-500' },
  { id: 'teamwork', name: 'Team Player', icon: Users, color: 'bg-blue-500' },
  { id: 'innovation', name: 'Innovation', icon: Lightbulb, color: 'bg-purple-500' },
  { id: 'dedication', name: 'Dedication', icon: Target, color: 'bg-red-500' },
  { id: 'leadership', name: 'Leadership', icon: TrendingUp, color: 'bg-green-500' }
];

// Recognition Modal
const RecognitionModal = ({ isOpen, onClose, onSave, employees }) => {
  const [formData, setFormData] = useState({
    toEmployeeId: '',
    badge: 'excellence',
    message: '',
    isPublic: true
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
            <Award className="w-6 h-6 text-yellow-600" />
            Give Recognition
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recognize Employee *</label>
            <select
              value={formData.toEmployeeId}
              onChange={(e) => setFormData({ ...formData, toEmployeeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.FullName || emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Badge Type</label>
            <div className="grid grid-cols-5 gap-2">
              {RECOGNITION_BADGES.map(badge => {
                const Icon = badge.icon;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, badge: badge.id })}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      formData.badge === badge.id ? `${badge.color} text-white` : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{badge.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              placeholder="Describe why you're recognizing this person..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded text-yellow-600"
            />
            <span className="text-sm">Post to public recognition wall</span>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600">
              Send Recognition
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Engagement() {
  const [activeTab, setActiveTab] = useState('surveys');
  const [showRecognitionModal, setShowRecognitionModal] = useState(false);
  const { companyId } = useCompany();
  const { userData } = useAuth();

  // Fetch data from Firestore
  const { documents: surveys, loading: surveysLoading } = useFirestore('surveys');
  const { documents: recognitions, loading: recognitionsLoading } = useFirestore('recognitions');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredSurveys = surveys.filter(s => s.companyId === companyId);
  const filteredRecognitions = recognitions.filter(r => r.companyId === companyId);

  const handleGiveRecognition = async (formData) => {
    try {
      await addDoc(collection(db, 'recognitions'), {
        ...formData,
        fromEmployeeId: userData?.uid,
        fromEmployeeName: userData?.name,
        companyId,
        createdAt: new Date().toISOString()
      });
      toast.success('Recognition sent!');
      setShowRecognitionModal(false);
    } catch (error) {
      toast.error('Failed to send recognition');
    }
  };

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
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recognition Wall</h3>
              <button
                onClick={() => setShowRecognitionModal(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Give Kudos
              </button>
            </div>
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

      {/* Recognition Modal */}
      <RecognitionModal
        isOpen={showRecognitionModal}
        onClose={() => setShowRecognitionModal(false)}
        onSave={handleGiveRecognition}
        employees={employees.filter(e => e.companyId === companyId)}
      />
    </div>
  );
}
