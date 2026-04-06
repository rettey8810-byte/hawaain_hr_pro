import { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, Award, Calendar, BookOpen, Users, CheckCircle, Clock, Loader2,
  Plus, Search, Filter, ChevronLeft, ChevronRight, MapPin, User, DollarSign,
  FileText, Video, Wrench, Briefcase, Laptop, Monitor, BarChart3, Sparkles,
  X, Edit2, Trash2, Download, Mail, Phone, Building2, Star, TrendingUp,
  AlertCircle, CheckSquare, Clock4, MoreVertical, Eye, PlayCircle, PauseCircle,
  Send, RefreshCw, Brain, Target, Zap, LayoutGrid, List, CalendarDays,
  Save
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import trainingService from '../services/trainingService';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

// AI Training Recommendation Service
const aiTrainingService = {
  // Generate personalized training recommendations based on employee data
  generateRecommendations: async (employees, existingTrainings, certifications) => {
    const recommendations = [];
    
    // Analyze skill gaps
    employees.forEach(emp => {
      const empCerts = certifications.filter(c => c.employeeId === emp.id);
      const completedTrainings = existingTrainings.filter(t => 
        t.attendees?.some(a => a.employeeId === emp.id && a.status === 'completed')
      );
      
      // Check for missing mandatory certifications
      const mandatoryCerts = ['First Aid', 'Safety Officer', 'ISO 9001'];
      mandatoryCerts.forEach(certName => {
        const hasCert = empCerts.some(c => c.name === certName && c.status === 'valid');
        if (!hasCert && emp.Department !== 'Admin') {
          recommendations.push({
            type: 'certification',
            priority: 'high',
            employee: emp.FullName || emp.name,
            employeeId: emp.id,
            recommendation: `Complete ${certName} certification`,
            reason: 'Mandatory certification missing',
            estimatedDuration: '3-5 days',
            category: 'compliance'
          });
        }
      });
      
      // Skill-based recommendations
      if (emp.Designation?.toLowerCase().includes('manager') || emp.Designation?.toLowerCase().includes('lead')) {
        const hasLeadershipTraining = completedTrainings.some(t => t.type === 'leadership');
        if (!hasLeadershipTraining) {
          recommendations.push({
            type: 'training',
            priority: 'medium',
            employee: emp.FullName || emp.name,
            employeeId: emp.id,
            recommendation: 'Leadership & Management Skills',
            reason: 'Management role without leadership training',
            estimatedDuration: '2-3 days',
            category: 'leadership'
          });
        }
      }
      
      // Technical skill recommendations based on department
      const deptSkills = {
        'IT': ['Technical Skills', 'Cloud Computing', 'Cybersecurity'],
        'HR': ['Soft Skills', 'Communication', 'Conflict Resolution'],
        'Sales': ['Product Knowledge', 'Sales Techniques', 'Customer Service'],
        'Operations': ['Safety Training', 'Process Optimization', 'Quality Management']
      };
      
      const dept = emp.Department || emp.department;
      if (deptSkills[dept]) {
        deptSkills[dept].forEach(skill => {
          const hasSkillTraining = completedTrainings.some(t => 
            t.title?.toLowerCase().includes(skill.toLowerCase())
          );
          if (!hasSkillTraining) {
            recommendations.push({
              type: 'training',
              priority: 'medium',
              employee: emp.FullName || emp.name,
              employeeId: emp.id,
              recommendation: skill,
              reason: `Recommended for ${dept} department`,
              estimatedDuration: '1-2 days',
              category: 'skills'
            });
          }
        });
      }
    });
    
    return recommendations;
  },
  
  // Generate training calendar optimization suggestions
  optimizeCalendar: (trainings, employees) => {
    const suggestions = [];
    
    // Check for scheduling conflicts
    trainings.forEach(training => {
      const sameDayTrainings = trainings.filter(t => 
        t.id !== training.id && 
        t.date === training.date && 
        t.timeSlot === training.timeSlot
      );
      
      if (sameDayTrainings.length > 0) {
        suggestions.push({
          type: 'conflict',
          message: `Multiple trainings scheduled on ${training.date} at ${training.timeSlot}`,
          trainings: [training, ...sameDayTrainings].map(t => t.title),
          suggestion: 'Consider rescheduling or adjusting time slots'
        });
      }
    });
    
    // Identify low enrollment trainings
    trainings.forEach(training => {
      if (training.attendees?.length < 3 && training.status === 'scheduled') {
        suggestions.push({
          type: 'low-enrollment',
          message: `${training.title} has low enrollment (${training.attendees.length} participants)`,
          training: training.title,
          suggestion: 'Send reminder emails or consider merging with another session'
        });
      }
    });
    
    return suggestions;
  },
  
  // Generate training effectiveness analysis
  analyzeEffectiveness: (trainings) => {
    const completed = trainings.filter(t => t.status === 'completed');
    const withFeedback = completed.filter(t => t.feedback && t.feedback.length > 0);
    
    if (withFeedback.length === 0) return null;
    
    const avgRating = withFeedback.reduce((sum, t) => {
      const ratings = t.feedback.map(f => f.rating || 0);
      return sum + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
    }, 0) / withFeedback.length;
    
    const popularTopics = {};
    withFeedback.forEach(t => {
      if (!popularTopics[t.type]) popularTopics[t.type] = { count: 0, rating: 0 };
      popularTopics[t.type].count++;
      const ratings = t.feedback.map(f => f.rating || 0);
      popularTopics[t.type].rating += ratings.reduce((a, b) => a + b, 0) / ratings.length;
    });
    
    return {
      averageRating: avgRating.toFixed(1),
      totalCompleted: completed.length,
      feedbackRate: ((withFeedback.length / completed.length) * 100).toFixed(0),
      popularTopics: Object.entries(popularTopics)
        .sort((a, b) => b[1].rating - a[1].rating)
        .slice(0, 5)
    };
  }
};
// Calendar Component
const TrainingCalendar = ({ trainings, onSelectDate, onSelectTraining }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getTrainingsForDate = (day) => {
    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trainings.filter(t => t.date === dateStr);
  };
  
  const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          Training Calendar
        </h3>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-medium min-w-[140px] text-center">{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayTrainings = getTrainingsForDate(day);
          const isToday = new Date().toDateString() === new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toDateString();
          
          return (
            <div
              key={day}
              onClick={() => onSelectDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day))}
              className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                isToday ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              <span className={`text-sm font-medium ${isToday ? 'text-teal-700' : 'text-gray-700'}`}>{day}</span>
              {dayTrainings.length > 0 && (
                <div className="mt-1 space-y-1">
                  {dayTrainings.slice(0, 2).map((t, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); onSelectTraining(t); }}
                      className={`text-xs truncate px-1.5 py-0.5 rounded ${
                        t.status === 'completed' ? 'bg-green-100 text-green-700' :
                        t.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                        t.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >{t.title}</div>
                  ))}
                  {dayTrainings.length > 2 && <div className="text-xs text-gray-500 text-center">+{dayTrainings.length - 2} more</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// AI Recommendations Panel
const AIRecommendationsPanel = ({ recommendations, suggestions, onApplyRecommendation }) => (
  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-purple-100 rounded-lg"><Sparkles className="w-6 h-6 text-purple-600" /></div>
      <div>
        <h3 className="font-semibold text-gray-900">AI Training Insights</h3>
        <p className="text-sm text-gray-600">Smart recommendations powered by AI</p>
      </div>
    </div>
    
    {recommendations.length > 0 ? (
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {recommendations.slice(0, 5).map((rec, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{rec.priority}</span>
                  <span className="text-xs text-gray-500">{rec.category}</span>
                </div>
                <p className="font-medium text-gray-900">{rec.recommendation}</p>
                <p className="text-sm text-gray-600 mt-1">{rec.employee} - {rec.reason}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.estimatedDuration}</span>
                </div>
              </div>
              <button onClick={() => onApplyRecommendation(rec)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 text-gray-500">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-300" />
        <p>No recommendations yet</p>
        <p className="text-sm">Add more employee data to get AI insights</p>
      </div>
    )}
    
    {suggestions.length > 0 && (
      <div className="mt-4 pt-4 border-t border-purple-200">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />Calendar Optimization
        </h4>
        {suggestions.map((sugg, idx) => (
          <div key={idx} className="bg-orange-50 rounded-lg p-3 mb-2 text-sm">
            <p className="text-orange-800">{sugg.message}</p>
            <p className="text-orange-600 mt-1">{sugg.suggestion}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Add/Edit Training Modal
const TrainingModal = ({ isOpen, onClose, training, employees, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'technical', deliveryMethod: 'classroom',
    date: '', timeSlot: 'morning', duration: '1', durationUnit: 'days',
    venue: '', instructor: '', maxAttendees: '20', cost: '',
    objectives: '', prerequisites: '', materials: '', status: 'scheduled',
    attendees: [], ...training
  });
  
  const [searchAttendee, setSearchAttendee] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState(training?.attendees || []);
  
  const filteredEmployees = employees.filter(emp => 
    (emp.FullName || emp.name || '').toLowerCase().includes(searchAttendee.toLowerCase()) &&
    !selectedAttendees.some(a => a.employeeId === emp.id)
  );
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, attendees: selectedAttendees });
  };
  
  const addAttendee = (emp) => {
    setSelectedAttendees([...selectedAttendees, {
      employeeId: emp.id, name: emp.FullName || emp.name,
      email: emp['Email id'] || emp.email, department: emp.Department || emp.department,
      status: 'registered', registeredAt: new Date().toISOString()
    }]);
    setSearchAttendee('');
  };
  
  const removeAttendee = (empId) => setSelectedAttendees(selectedAttendees.filter(a => a.employeeId !== empId));
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-600" />
            {training?.id ? 'Edit Training' : 'Add New Training'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Training Title *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g., Advanced Project Management" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                {trainingService.trainingTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Method *</label>
              <select value={formData.deliveryMethod} onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                {trainingService.deliveryMethods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Slot</label>
              <select value={formData.timeSlot} onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="morning">Morning (9 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (1 PM - 5 PM)</option>
                <option value="evening">Evening (6 PM - 9 PM)</option>
                <option value="fullday">Full Day (9 AM - 5 PM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500">
                {trainingService.trainingStatus.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Venue/Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} 
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g., Conference Room A / Zoom Link" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instructor/Facilitator</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} 
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Instructor name" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Training Cost ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} 
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Attendees</label>
              <input type="number" value={formData.maxAttendees} onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" rows={3} placeholder="Detailed description of the training program" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Learning Objectives</label>
            <textarea value={formData.objectives} onChange={(e) => setFormData({ ...formData, objectives: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" rows={2} placeholder="What will participants learn?" />
          </div>
          
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">Attendees ({selectedAttendees.length})</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchAttendee} onChange={(e) => setSearchAttendee(e.target.value)} 
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Search employees to add..." />
              {searchAttendee && filteredEmployees.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredEmployees.slice(0, 5).map(emp => (
                    <button key={emp.id} type="button" onClick={() => addAttendee(emp)} 
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{emp.FullName || emp.name}</span>
                      <span className="text-xs text-gray-500">({emp.Department || emp.department})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAttendees.map(attendee => (
                  <div key={attendee.employeeId} className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-full text-sm">
                    <span>{attendee.name}</span>
                    <button type="button" onClick={() => removeAttendee(attendee.employeeId)} className="text-teal-600 hover:text-teal-800">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <Save className="w-4 h-4" />
              {training?.id ? 'Update Training' : 'Create Training'}
            </button>
            {training?.id && (
              <button type="button" onClick={() => onDelete(training.id)} className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Training Details View
const TrainingDetails = ({ training, employees, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');
  if (!training) return null;
  
  const completionRate = training.attendees?.length > 0
    ? Math.round((training.attendees.filter(a => a.status === 'completed').length / training.attendees.length) * 100)
    : 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-xl font-bold">{training.title}</h2>
            <p className="text-teal-100 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />{training.date} • {training.timeSlot}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(training)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"><Edit2 className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="border-b px-6">
          <div className="flex gap-6">
            {['overview', 'attendees', 'feedback', 'materials'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} 
                className={`py-3 px-1 border-b-2 font-medium capitalize transition-colors ${
                  activeTab === tab ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>{tab}</button>
            ))}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    training.status === 'completed' ? 'bg-green-100 text-green-800' :
                    training.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    training.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>{training.status}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{trainingService.trainingTypes.find(t => t.id === training.type)?.label || training.type}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Attendees</p>
                  <p className="font-medium">{training.attendees?.length || 0} / {training.maxAttendees}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="font-medium">{completionRate}%</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{training.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-600" />Venue</h3>
                  <p className="text-gray-600">{training.venue || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2"><User className="w-4 h-4 text-teal-600" />Instructor</h3>
                  <p className="text-gray-600">{training.instructor || 'Not assigned'}</p>
                </div>
              </div>
              
              {training.objectives && (
                <div>
                  <h3 className="font-medium mb-2">Learning Objectives</h3>
                  <p className="text-gray-600">{training.objectives}</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'attendees' && (
            <div>
              {training.attendees?.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {training.attendees.map((attendee, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-3 px-4">{attendee.name}</td>
                        <td className="py-3 px-4">{attendee.department}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            attendee.status === 'completed' ? 'bg-green-100 text-green-700' :
                            attendee.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                          }`}>{attendee.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No attendees registered yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'feedback' && (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Feedback collection coming soon</p>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Training materials upload coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Training Component
export default function Training() {
  const [view, setView] = useState('calendar');
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const { companyId } = useCompany();
  const { user } = useAuth();
  
  const { documents: trainings, loading: trainingsLoading } = useFirestore('trainings');
  const { documents: certifications, loading: certsLoading } = useFirestore('certifications');
  const { documents: employees } = useFirestore('employees');
  
  const filteredTrainings = useMemo(() => {
    return trainings
      .filter(t => t.companyId === companyId)
      .filter(t => {
        if (searchQuery) {
          return t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => filterType === 'all' || t.type === filterType);
  }, [trainings, companyId, searchQuery, filterStatus, filterType]);
  
  const filteredCertifications = certifications.filter(c => c.companyId === companyId);
  
  const now = new Date();
  const stats = {
    upcomingTrainings: filteredTrainings.filter(t => new Date(t.date) > now && t.status === 'scheduled').length,
    activeCertifications: filteredCertifications.filter(c => c.status === 'valid').length,
    completedThisMonth: filteredTrainings.filter(t => {
      const completedDate = new Date(t.completedAt || t.date);
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear();
    }).length,
    expiringSoon: filteredCertifications.filter(c => {
      if (!c.expiryDate) return false;
      const days = Math.ceil((new Date(c.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 30;
    }).length,
    totalAttendees: filteredTrainings.reduce((sum, t) => sum + (t.attendees?.length || 0), 0),
    totalCost: filteredTrainings.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0)
  };
  
  const generateAIInsights = async () => {
    setGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const recommendations = await aiTrainingService.generateRecommendations(
      employees.filter(e => e.companyId === companyId),
      filteredTrainings,
      filteredCertifications
    );
    
    const suggestions = aiTrainingService.optimizeCalendar(filteredTrainings);
    const analysis = aiTrainingService.analyzeEffectiveness(filteredTrainings);
    
    setAiRecommendations(recommendations);
    setAiSuggestions(suggestions);
    setAiAnalysis(analysis);
    setGeneratingAI(false);
  };
  
  const handleSaveTraining = async (trainingData) => {
    try {
      const data = { ...trainingData, companyId, createdBy: user?.uid, updatedAt: new Date().toISOString() };
      
      if (selectedTraining?.id) {
        await updateDoc(doc(db, 'trainings', selectedTraining.id), data);
        toast.success('Training updated successfully');
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'trainings'), data);
        toast.success('Training created successfully');
      }
      
      setShowModal(false);
      setSelectedTraining(null);
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    }
  };
  
  const handleDeleteTraining = async (id) => {
    if (!confirm('Are you sure you want to delete this training?')) return;
    try {
      await deleteDoc(doc(db, 'trainings', id));
      toast.success('Training deleted');
      setShowModal(false);
      setShowDetails(false);
      setSelectedTraining(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };
  
  const handleApplyRecommendation = (rec) => {
    setSelectedTraining({
      title: rec.recommendation,
      type: rec.category === 'leadership' ? 'leadership' : rec.category === 'compliance' ? 'compliance' : 'technical',
      description: rec.reason,
      attendees: rec.employeeId ? [{ employeeId: rec.employeeId, name: rec.employee, status: 'registered' }] : []
    });
    setShowModal(true);
  };
  
  if (trainingsLoading || certsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading training data...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img src="/storyset/Learning-amico.svg" alt="Training" className="h-full object-contain" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8" />Training & Development
          </h1>
          <p className="text-teal-100 mt-1">Comprehensive training management with AI-powered insights</p>
        </div>
      </div>
      
      {/* View Toggle & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
            { id: 'list', icon: List, label: 'List View' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' }
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                view === v.id ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <v.icon className="w-4 h-4" />{v.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={generateAIInsights} disabled={generatingAI}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}AI Insights
          </button>
          <button onClick={() => { setSelectedTraining(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <Plus className="w-4 h-4" />Add Training
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Upcoming', value: stats.upcomingTrainings, icon: Calendar, color: 'bg-teal-500' },
          { label: 'Active Certs', value: stats.activeCertifications, icon: Award, color: 'bg-green-500' },
          { label: 'Completed', value: stats.completedThisMonth, icon: CheckCircle, color: 'bg-blue-500' },
          { label: 'Expiring', value: stats.expiringSoon, icon: Clock, color: 'bg-orange-500' },
          { label: 'Total Attendees', value: stats.totalAttendees, icon: Users, color: 'bg-purple-500' },
          { label: 'Total Cost', value: `$${stats.totalCost.toLocaleString()}`, icon: DollarSign, color: 'bg-pink-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}><stat.icon className="h-5 w-5 text-white" /></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-8">
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search trainings..." className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Status</option>
              {trainingService.trainingStatus.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Types</option>
              {trainingService.trainingTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          
          {/* Calendar View */}
          {view === 'calendar' && (
            <TrainingCalendar trainings={filteredTrainings} 
              onSelectDate={(date) => { setSelectedTraining({ date: date.toISOString().split('T')[0] }); setShowModal(true); }}
              onSelectTraining={(training) => { setSelectedTraining(training); setShowDetails(true); }} />
          )}
          
          {/* List View */}
          {view === 'list' && (
            <div className="bg-white rounded-xl shadow-sm">
              {filteredTrainings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No trainings found</p>
                  <p className="text-sm">Create your first training session</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTrainings.map(training => (
                    <div key={training.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedTraining(training); setShowDetails(true); }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{training.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              training.status === 'completed' ? 'bg-green-100 text-green-700' :
                              training.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                              training.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>{training.status}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{training.date}</span>
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{training.attendees?.length || 0} attendees</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{training.venue || 'Online'}</span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedTraining(training); setShowModal(true); }}
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Analytics View */}
          {view === 'analytics' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Training Analytics</h3>
              {aiAnalysis ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6">
                      <p className="text-teal-600 text-sm font-medium">Average Rating</p>
                      <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-bold text-teal-800">{aiAnalysis.averageRating}</span>
                        <span className="text-teal-600">/5</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <p className="text-blue-600 text-sm font-medium">Total Completed</p>
                      <p className="text-3xl font-bold text-blue-800 mt-2">{aiAnalysis.totalCompleted}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                      <p className="text-purple-600 text-sm font-medium">Feedback Rate</p>
                      <p className="text-3xl font-bold text-purple-800 mt-2">{aiAnalysis.feedbackRate}%</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Popular Training Topics</h4>
                    <div className="space-y-3">
                      {aiAnalysis.popularTopics.map(([topic, data], idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-32 font-medium capitalize">{topic}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full bg-teal-500 rounded-full flex items-center justify-end px-2"
                              style={{ width: `${Math.min((data.rating / data.count / 5) * 100, 100)}%` }}>
                              <span className="text-white text-xs font-medium">{(data.rating / data.count).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="w-20 text-sm text-gray-500">{data.count} sessions</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No analytics available</p>
                  <p className="text-sm mb-4">Complete some trainings and collect feedback to see analytics</p>
                  <button onClick={generateAIInsights} disabled={generatingAI}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}Generate Insights
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div className="col-span-4 space-y-4">
          <AIRecommendationsPanel recommendations={aiRecommendations} suggestions={aiSuggestions} onApplyRecommendation={handleApplyRecommendation} />
          
          {/* Upcoming Trainings */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-teal-600" />Upcoming This Week</h3>
            {filteredTrainings.filter(t => {
              const trainingDate = new Date(t.date);
              const weekFromNow = new Date(); weekFromNow.setDate(weekFromNow.getDate() + 7);
              return trainingDate >= new Date() && trainingDate <= weekFromNow;
            }).slice(0, 5).map(training => (
              <div key={training.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => { setSelectedTraining(training); setShowDetails(true); }}>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 font-bold text-sm">
                  {new Date(training.date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{training.title}</p>
                  <p className="text-sm text-gray-500">{training.attendees?.length || 0} attendees</p>
                </div>
              </div>
            ))}
            {filteredTrainings.filter(t => {
              const trainingDate = new Date(t.date);
              const weekFromNow = new Date(); weekFromNow.setDate(weekFromNow.getDate() + 7);
              return trainingDate >= new Date() && trainingDate <= weekFromNow;
            }).length === 0 && <p className="text-center text-gray-500 py-4">No upcoming trainings this week</p>}
          </div>
          
          {/* Certification Alerts */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600" />Expiring Soon</h3>
            {filteredCertifications.filter(c => {
              if (!c.expiryDate) return false;
              const days = Math.ceil((new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              return days > 0 && days <= 30;
            }).slice(0, 5).map(cert => {
              const days = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              const emp = employees.find(e => e.id === cert.employeeId);
              return (
                <div key={cert.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg mb-2">
                  <Award className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cert.name}</p>
                    <p className="text-xs text-gray-600">{emp?.FullName || emp?.name || 'Unknown'} • {days} days left</p>
                  </div>
                </div>
              );
            })}
            {filteredCertifications.filter(c => {
              if (!c.expiryDate) return false;
              const days = Math.ceil((new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              return days > 0 && days <= 30;
            }).length === 0 && <p className="text-center text-gray-500 py-4">No expiring certifications</p>}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <TrainingModal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedTraining(null); }}
        training={selectedTraining} employees={employees.filter(e => e.companyId === companyId)}
        onSave={handleSaveTraining} onDelete={handleDeleteTraining} />
      
      {showDetails && selectedTraining && (
        <TrainingDetails training={selectedTraining} employees={employees} 
          onClose={() => { setShowDetails(false); setSelectedTraining(null); }}
          onEdit={(training) => { setShowDetails(false); setSelectedTraining(training); setShowModal(true); }} />
      )}
    </div>
  );
}
