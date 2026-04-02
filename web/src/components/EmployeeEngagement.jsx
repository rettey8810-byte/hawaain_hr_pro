import { useState } from 'react';
import { useEngagement } from '../contexts/EngagementContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Award, 
  Lightbulb, 
  Send,
  ThumbsUp,
  TrendingUp,
  Star,
  Users,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function EmployeeEngagement() {
  const { 
    surveys, 
    recognitions, 
    suggestions,
    createSurvey,
    submitSurveyResponse,
    sendRecognition,
    submitSuggestion,
    voteSuggestion
  } = useEngagement();
  const { company } = useCompany();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recognition');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Engagement</h1>
          <p className="text-gray-600">Surveys, recognition, and employee feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Award} 
          label="Total Kudos" 
          value={recognitions.length} 
          color="bg-yellow-500" 
        />
        <StatCard 
          icon={MessageSquare} 
          label="Active Surveys" 
          value={surveys.filter(s => s.status === 'active').length} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Lightbulb} 
          label="Suggestions" 
          value={suggestions.length} 
          color="bg-green-500" 
        />
        <StatCard 
          icon={Users} 
          label="Participation" 
          value="85%" 
          color="bg-purple-500" 
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'recognition', label: 'Kudos & Recognition', icon: Award },
          { id: 'surveys', label: 'Surveys', icon: MessageSquare },
          { id: 'suggestions', label: 'Suggestions', icon: Lightbulb }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {activeTab === 'recognition' && (
          <RecognitionTab 
            recognitions={recognitions} 
            onSendKudos={sendRecognition}
            currentUser={user}
          />
        )}
        {activeTab === 'surveys' && (
          <SurveysTab 
            surveys={surveys} 
            onSubmitResponse={submitSurveyResponse}
            currentUser={user}
          />
        )}
        {activeTab === 'suggestions' && (
          <SuggestionsTab 
            suggestions={suggestions}
            onSubmit={submitSuggestion}
            onVote={voteSuggestion}
            currentUser={user}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center gap-3">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Recognition Tab
function RecognitionTab({ recognitions, onSendKudos, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('teamwork');
  const [points, setPoints] = useState(10);

  const categories = [
    { value: 'teamwork', label: 'Teamwork', icon: Users },
    { value: 'innovation', label: 'Innovation', icon: Lightbulb },
    { value: 'excellence', label: 'Excellence', icon: Star },
    { value: 'leadership', label: 'Leadership', icon: TrendingUp },
    { value: 'customer_focus', label: 'Customer Focus', icon: MessageSquare }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSendKudos(recipient, category, message, points);
      toast.success('Kudos sent successfully!');
      setShowForm(false);
      setRecipient('');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send kudos');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Kudos</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
        >
          <Award className="h-4 w-4" />
          Give Kudos
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <select 
                value={recipient} 
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Employee...</option>
                <option value="emp1">John Doe</option>
                <option value="emp2">Jane Smith</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="3"
              placeholder="What did they do great?"
              required
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Points (0-100)</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-24 px-3 py-2 border rounded-lg"
                min="0"
                max="100"
              />
            </div>
            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Send Kudos
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {recognitions.slice(0, 20).map(rec => {
          const CatIcon = categories.find(c => c.value === rec.category)?.icon || Star;
          return (
            <div key={rec.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{rec.senderName || 'Someone'}</span>
                  <span className="text-gray-500">gave kudos to</span>
                  <span className="font-semibold">{rec.recipientName || 'Someone'}</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    <CatIcon className="h-3 w-3" />
                    {categories.find(c => c.value === rec.category)?.label || rec.category}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{rec.message}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{rec.points} points</span>
                  <span>•</span>
                  <span>{format(new Date(rec.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          );
        })}
        {recognitions.length === 0 && (
          <p className="text-gray-500 text-center py-8">No kudos yet. Be the first to recognize a colleague!</p>
        )}
      </div>
    </div>
  );
}

// Surveys Tab
function SurveysTab({ surveys, onSubmitResponse, currentUser }) {
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [responses, setResponses] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmitResponse(activeSurvey.id, responses, true);
      toast.success('Survey submitted!');
      setActiveSurvey(null);
      setResponses({});
    } catch (error) {
      toast.error('Failed to submit survey');
    }
  };

  if (activeSurvey) {
    return (
      <div className="p-6">
        <button 
          onClick={() => setActiveSurvey(null)}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Surveys
        </button>
        <h3 className="text-xl font-semibold mb-2">{activeSurvey.title}</h3>
        <p className="text-gray-600 mb-6">{activeSurvey.description}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeSurvey.questions?.map((q, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <p className="font-medium mb-3">{idx + 1}. {q.text}</p>
              {q.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setResponses({...responses, [idx]: num})}
                      className={`w-10 h-10 rounded-lg ${
                        responses[idx] === num ? 'bg-blue-600 text-white' : 'bg-gray-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <textarea
                  value={responses[idx] || ''}
                  onChange={(e) => setResponses({...responses, [idx]: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              )}
              {q.type === 'choice' && (
                <div className="space-y-2">
                  {q.options?.map((opt, optIdx) => (
                    <label key={optIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        value={opt}
                        onChange={(e) => setResponses({...responses, [idx]: e.target.value})}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Submit Survey
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Active Surveys</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {surveys.filter(s => s.status === 'active').map(survey => (
          <div 
            key={survey.id} 
            onClick={() => setActiveSurvey(survey)}
            className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold">{survey.title}</h4>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{survey.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{survey.questions?.length || 0} questions</span>
              <span>Ends {format(new Date(survey.endsAt), 'MMM d')}</span>
            </div>
          </div>
        ))}
        {surveys.filter(s => s.status === 'active').length === 0 && (
          <p className="text-gray-500 col-span-2 text-center py-8">No active surveys</p>
        )}
      </div>
    </div>
  );
}

// Suggestions Tab
function SuggestionsTab({ suggestions, onSubmit, onVote, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('process');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(title, description, category, isAnonymous);
      toast.success('Suggestion submitted!');
      setShowForm(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to submit suggestion');
    }
  };

  const handleVote = async (id) => {
    try {
      await onVote(id);
      toast.success('Vote recorded!');
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Employee Suggestions</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Lightbulb className="h-4 w-4" />
          Submit Idea
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Brief title of your suggestion"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="process">Process Improvement</option>
              <option value="culture">Culture & Environment</option>
              <option value="facility">Facility & Workspace</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows="4"
              placeholder="Describe your idea in detail..."
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="anonymous" className="text-sm">Submit anonymously</label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Suggestion
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {suggestions.map(suggestion => (
          <div key={suggestion.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                    {suggestion.category}
                  </span>
                  {suggestion.isAnonymous && (
                    <span className="text-xs text-gray-500">Anonymous</span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    suggestion.status === 'implemented' ? 'bg-green-100 text-green-700' :
                    suggestion.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {suggestion.status?.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{suggestion.votes || 0} votes</span>
                  <span>•</span>
                  <span>{format(new Date(suggestion.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <button
                onClick={() => handleVote(suggestion.id)}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ThumbsUp className="h-5 w-5 text-gray-400" />
                <span className="text-xs font-medium">{suggestion.votes || 0}</span>
              </button>
            </div>
          </div>
        ))}
        {suggestions.length === 0 && (
          <p className="text-gray-500 text-center py-8">No suggestions yet. Share your ideas!</p>
        )}
      </div>
    </div>
  );
}

import React from 'react';
