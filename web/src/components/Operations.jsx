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

  if (disciplinaryLoading || grievancesLoading || exitsLoading) {
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
    </div>
  );
}
