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
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';

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
  { id: 'verbal-warning', label: 'Verbal Warning', severity: 1, color: 'yellow' },
  { id: 'written-warning', label: 'Written Warning', severity: 2, color: 'orange' },
  { id: 'final-warning', label: 'Final Warning', severity: 3, color: 'red' },
  { id: 'suspension', label: 'Suspension', severity: 4, color: 'purple' },
  { id: 'demotion', label: 'Demotion', severity: 4, color: 'rose' },
  { id: 'termination', label: 'Termination', severity: 5, color: 'red' }
];

const INCIDENT_CATEGORIES = [
  { id: 'attendance', label: 'Attendance Issues' },
  { id: 'performance', label: 'Performance Issues' },
  { id: 'conduct', label: 'Misconduct' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'discrimination', label: 'Discrimination' },
  { id: 'safety', label: 'Safety Violation' },
  { id: 'theft', label: 'Theft/Fraud' },
  { id: 'conflict', label: 'Workplace Conflict' },
  { id: 'substance', label: 'Substance Abuse' },
  { id: 'confidentiality', label: 'Breach of Confidentiality' }
];

const GRIEVANCE_TYPES = [
  { id: 'bullying', label: 'Bullying/Harassment', urgency: 'high' },
  { id: 'discrimination', label: 'Discrimination', urgency: 'high' },
  { id: 'pay', label: 'Pay Dispute', urgency: 'medium' },
  { id: 'conditions', label: 'Working Conditions', urgency: 'medium' },
  { id: 'management', label: 'Management Issues', urgency: 'medium' },
  { id: 'policy', label: 'Policy Concerns', urgency: 'low' },
  { id: 'colleague', label: 'Colleague Conflict', urgency: 'medium' },
  { id: 'other', label: 'Other', urgency: 'low' }
];

const EXIT_REASONS = [
  { id: 'resignation', label: 'Resignation' },
  { id: 'termination', label: 'Termination' },
  { id: 'end-of-contract', label: 'End of Contract' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'medical', label: 'Medical Reasons' },
  { id: 'relocation', label: 'Relocation' },
  { id: 'other', label: 'Other' }
];

export default function Operations() {
  const [activeTab, setActiveTab] = useState('disciplinary');
  const { companyId } = useCompany();
  const voiceRecorder = useVoiceRecorder();

  // Fetch data
  const { documents: disciplinaryActions, loading: disciplinaryLoading, deleteDocument: deleteDisciplinary } = useFirestore('disciplinary');
  const { documents: grievances, loading: grievancesLoading, deleteDocument: deleteGrievance } = useFirestore('grievances');
  const { documents: exits, loading: exitsLoading, deleteDocument: deleteExit } = useFirestore('exits');
  const { documents: employees } = useFirestore('employees');

  const filteredActions = disciplinaryActions.filter(a => a.companyId === companyId);
  const filteredGrievances = grievances.filter(g => g.companyId === companyId);
  const filteredExits = exits.filter(e => e.companyId === companyId);

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  if (disciplinaryLoading || grievancesLoading || exitsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">HR Operations</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('disciplinary')} className={activeTab === 'disciplinary' ? 'text-orange-600 font-bold' : ''}>
          Disciplinary ({filteredActions.length})
        </button>
        <button onClick={() => setActiveTab('grievances')} className={activeTab === 'grievances' ? 'text-orange-600 font-bold' : ''}>
          Grievances ({filteredGrievances.length})
        </button>
        <button onClick={() => setActiveTab('exit')} className={activeTab === 'exit' ? 'text-orange-600 font-bold' : ''}>
          Exit ({filteredExits.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'disciplinary' && filteredActions.map(action => (
          <div key={action.id} className="bg-white p-4 rounded-lg shadow">
            <p className="font-bold">{getEmployeeName(action.employeeId)}</p>
            <p>{action.type}</p>
          </div>
        ))}
        {activeTab === 'grievances' && filteredGrievances.map(g => (
          <div key={g.id} className="bg-white p-4 rounded-lg shadow">
            <p>{g.type}</p>
            <p>{g.description}</p>
          </div>
        ))}
        {activeTab === 'exit' && filteredExits.map(exit => (
          <div key={exit.id} className="bg-white p-4 rounded-lg shadow">
            <p className="font-bold">{getEmployeeName(exit.employeeId)}</p>
            <p>{exit.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
