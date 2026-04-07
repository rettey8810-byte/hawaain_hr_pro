import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertTriangle, FileWarning, UserMinus, LogOut, ClipboardList, Loader2,
  Plus, Search, X, CheckCircle, Mic, MicOff, Play, Pause, Square,
  Calendar, User, MessageSquare, Save, Download, MoreVertical,
  Shield, AlertCircle, Eye, Edit2, Trash2, Send, Filter,
  ChevronDown, ChevronUp, Clock, FileText, UserX, Phone
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

// Voice Recorder Hook
function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { isRecording, audioBlob, audioUrl, recordingTime, startRecording, stopRecording, clearRecording };
}

// Constants
const DISCIPLINARY_TYPES = [
  { id: 'verbal-warning', label: 'Verbal Warning' },
  { id: 'written-warning', label: 'Written Warning' },
  { id: 'final-warning', label: 'Final Warning' },
  { id: 'suspension', label: 'Suspension' },
  { id: 'termination', label: 'Termination' }
];

const INCIDENT_CATEGORIES = [
  { id: 'attendance', label: 'Attendance' },
  { id: 'performance', label: 'Performance' },
  { id: 'conduct', label: 'Conduct' },
  { id: 'safety', label: 'Safety' }
];

const GRIEVANCE_TYPES = [
  { id: 'bullying', label: 'Bullying/Harassment' },
  { id: 'discrimination', label: 'Discrimination' },
  { id: 'pay', label: 'Pay Dispute' },
  { id: 'conditions', label: 'Working Conditions' },
  { id: 'management', label: 'Management' },
  { id: 'other', label: 'Other' }
];

const EXIT_REASONS = [
  { id: 'resignation', label: 'Resignation' },
  { id: 'termination', label: 'Termination' },
  { id: 'end-of-contract', label: 'End of Contract' },
  { id: 'retirement', label: 'Retirement' }
];

export default function Operations() {
  const [activeTab, setActiveTab] = useState('disciplinary');
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCompany();
  const voiceRecorder = useVoiceRecorder();

  // Modals
  const [dModal, setDModal] = useState(false);
  const [gModal, setGModal] = useState(false);
  const [eModal, setEModal] = useState(false);
  const [delModal, setDelModal] = useState({ open: false, id: null, type: '' });

  // Fetch data
  const { documents: disciplinaryActions, loading: dLoading, deleteDocument: deleteD } = useFirestore('disciplinary');
  const { documents: grievances, loading: gLoading, deleteDocument: deleteG } = useFirestore('grievances');
  const { documents: exits, loading: eLoading, deleteDocument: deleteE } = useFirestore('exits');
  const { documents: employees } = useFirestore('employees');

  const disciplinaryLoading = dLoading;
  const grievancesLoading = gLoading;
  const exitsLoading = eLoading;

  const filteredD = disciplinaryActions.filter(a => a.companyId === companyId);
  const filteredG = grievances.filter(g => g.companyId === companyId);
  const filteredE = exits.filter(e => e.companyId === companyId);

  // Forms
  const [dForm, setDForm] = useState({ employeeId: '', type: '', category: '', incident: '', date: new Date().toISOString().split('T')[0], description: '', action: '', status: 'active' });
  const [gForm, setGForm] = useState({ type: '', description: '', date: new Date().toISOString().split('T')[0], status: 'submitted', urgency: 'medium' });
  const [eForm, setEForm] = useState({ employeeId: '', reason: '', lastDay: '', noticeDate: new Date().toISOString().split('T')[0], status: 'pending', interviewNotes: '' });

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';
  const formatDuration = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const handleSave = async (type) => {
    try {
      if (type === 'disciplinary') {
        if (!dForm.employeeId || !dForm.type) return toast.error('Fill required fields');
        await addDoc(collection(db, 'disciplinary'), { ...dForm, companyId, createdAt: new Date().toISOString() });
        toast.success('Disciplinary action recorded');
        setDModal(false);
        setDForm({ employeeId: '', type: '', category: '', incident: '', date: new Date().toISOString().split('T')[0], description: '', action: '', status: 'active' });
      } else if (type === 'grievance') {
        if (!gForm.type || !gForm.description) return toast.error('Fill required fields');
        await addDoc(collection(db, 'grievances'), { ...gForm, companyId, createdAt: new Date().toISOString() });
        toast.success('Grievance submitted');
        setGModal(false);
        setGForm({ type: '', description: '', date: new Date().toISOString().split('T')[0], status: 'submitted', urgency: 'medium' });
      } else if (type === 'exit') {
        if (!eForm.employeeId || !eForm.reason || !eForm.lastDay) return toast.error('Fill required fields');
        await addDoc(collection(db, 'exits'), { ...eForm, companyId, audioUrl: voiceRecorder.audioUrl, hasRecording: !!voiceRecorder.audioBlob, createdAt: new Date().toISOString() });
        toast.success('Exit record created');
        setEModal(false);
        voiceRecorder.clearRecording();
        setEForm({ employeeId: '', reason: '', lastDay: '', noticeDate: new Date().toISOString().split('T')[0], status: 'pending', interviewNotes: '' });
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      if (delModal.type === 'disciplinary') await deleteD(delModal.id);
      else if (delModal.type === 'grievance') await deleteG(delModal.id);
      else await deleteE(delModal.id);
      toast.success('Deleted');
      setDelModal({ open: false, id: null, type: '' });
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  if (dLoading || gLoading || eLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Audio Player Component
  const AudioPlayer = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio(url));

    useEffect(() => {
      const audio = audioRef.current;
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('ended', () => setIsPlaying(false));
      return () => { audio.pause(); audio.src = ''; };
    }, [url]);

    const togglePlay = () => {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    };

    const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

    return (
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <button onClick={togglePlay} className="p-2 bg-indigo-600 text-white rounded-full">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex-1"><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-indigo-600" style={{width: `${duration?(currentTime/duration)*100:0}%`}}/></div></div>
        <span className="text-sm text-gray-500">{fmt(currentTime)} / {fmt(duration)}</span>
      </div>
    );
  };
      
  // Employee Selector
  const EmployeeSelector = ({ value, onChange }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = employees.find(e => e.id === value);
    const filtered = employees.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()));

    return (
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-2 border rounded-lg bg-white text-left">
          {selected ? selected.name : 'Select Employee...'}
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 border-b" />
            {filtered.map(emp => (
              <button key={emp.id} onClick={() => { onChange(emp.id); setIsOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50">{emp.name}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3"><ClipboardList className="h-8 w-8" />HR Operations</h1>
        <p className="mt-1">Disciplinary, grievances, and exit management</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Disciplinary</p>
          <p className="text-2xl font-bold">{filteredD.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">Grievances</p>
          <p className="text-2xl font-bold">{filteredG.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Exits</p>
          <p className="text-2xl font-bold">{filteredE.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button onClick={() => activeTab === 'disciplinary' ? setDModal(true) : activeTab === 'grievances' ? setGModal(true) : setEModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="bg-white rounded-t-xl shadow flex border-b">
        {[{id:'disciplinary',label:`Disciplinary (${filteredD.length})`,icon:AlertTriangle},{id:'grievances',label:`Grievances (${filteredG.length})`,icon:FileWarning},{id:'exit',label:`Exit (${filteredE.length})`,icon:LogOut}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 ${activeTab===tab.id?'text-orange-600 border-b-2 border-orange-600':'text-gray-600'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-xl shadow p-6 space-y-4">
        {activeTab === 'disciplinary' && filteredD.map(action => (
          <div key={action.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-lg">{getEmployeeName(action.employeeId)}</p>
                <p className="text-red-700">{DISCIPLINARY_TYPES.find(t => t.id === action.type)?.label || action.type}</p>
                <p className="text-sm text-gray-600 mt-1">{action.incident}</p>
                <p className="text-xs text-gray-500 mt-2">{action.date}</p>
              </div>
              <button onClick={() => setDelModal({ open: true, id: action.id, type: 'disciplinary' })} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}

        {activeTab === 'grievances' && filteredG.map(g => (
          <div key={g.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-lg">{GRIEVANCE_TYPES.find(t => t.id === g.type)?.label || g.type}</p>
                <p className="text-orange-700">Urgency: {g.urgency}</p>
                <p className="text-sm text-gray-600 mt-1">{g.description}</p>
                <p className="text-xs text-gray-500 mt-2">{g.date}</p>
              </div>
              <button onClick={() => setDelModal({ open: true, id: g.id, type: 'grievance' })} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}

        {activeTab === 'exit' && filteredE.map(exit => (
          <div key={exit.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-lg">{getEmployeeName(exit.employeeId)}</p>
                <p className="text-gray-700">{EXIT_REASONS.find(r => r.id === exit.reason)?.label || exit.reason}</p>
                <p className="text-sm text-gray-600 mt-1">Last Day: {exit.lastDay}</p>
                {exit.hasRecording && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">🎙️ Has Recording</span>}
              </div>
              <button onClick={() => setDelModal({ open: true, id: exit.id, type: 'exit' })} className="p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <DisciplinaryModal 
        isOpen={dModal} 
        onClose={() => setDModal(false)} 
        onSave={() => handleSave('disciplinary')}
        employees={employees}
        formData={dForm}
        setFormData={setDForm}
      />
      <GrievanceModal 
        isOpen={gModal} 
        onClose={() => setGModal(false)} 
        onSave={() => handleSave('grievance')}
        formData={gForm}
        setFormData={setGForm}
      />
      <ExitModal 
        isOpen={eModal} 
        onClose={() => setEModal(false)} 
        onSave={() => handleSave('exit')}
        employees={employees}
        formData={eForm}
        setFormData={setEForm}
        voiceRecorder={voiceRecorder}
      />

      {/* Delete Confirmation Modal */}
      {delModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this record?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDelModal({ open: false, id: null, type: '' })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Components (exported for use)
export function DisciplinaryModal({ isOpen, onClose, onSave, employees, formData, setFormData }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Add Disciplinary Action</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee *</label>
            <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Type...</option>
              {DISCIPLINARY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Category...</option>
              {INCIDENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Incident Description</label>
            <textarea value={formData.incident} onChange={(e) => setFormData({...formData, incident: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Save</button>
        </div>
      </div>
    </div>
  );
}

export function GrievanceModal({ isOpen, onClose, onSave, formData, setFormData }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2"><FileWarning className="w-5 h-5 text-orange-600" /> Submit Grievance</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Type...</option>
              {GRIEVANCE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Urgency</label>
            <select value={formData.urgency} onChange={(e) => setFormData({...formData, urgency: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="4" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Submit</button>
        </div>
      </div>
    </div>
  );
}

export function ExitModal({ isOpen, onClose, onSave, employees, formData, setFormData, voiceRecorder }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2"><LogOut className="w-5 h-5 text-blue-600" /> Add Exit Record</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee *</label>
            <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason *</label>
            <select value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Reason...</option>
              {EXIT_REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Day *</label>
            <input type="date" value={formData.lastDay} onChange={(e) => setFormData({...formData, lastDay: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notice Date</label>
            <input type="date" value={formData.noticeDate} onChange={(e) => setFormData({...formData, noticeDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Exit Interview Notes</label>
            <textarea value={formData.interviewNotes} onChange={(e) => setFormData({...formData, interviewNotes: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="3" />
          </div>
          {voiceRecorder && (
            <div>
              <label className="block text-sm font-medium mb-1">Voice Recording</label>
              <div className="flex items-center gap-2">
                {!voiceRecorder.isRecording ? (
                  <button onClick={voiceRecorder.startRecording} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Record
                  </button>
                ) : (
                  <button onClick={voiceRecorder.stopRecording} className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2">
                    <Square className="w-4 h-4" /> Stop ({Math.floor(voiceRecorder.recordingTime/60)}:{(voiceRecorder.recordingTime%60).toString().padStart(2,'0')})
                  </button>
                )}
                {voiceRecorder.audioUrl && (
                  <audio src={voiceRecorder.audioUrl} controls className="h-8" />
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}
