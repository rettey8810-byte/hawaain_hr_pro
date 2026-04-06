import { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, FileWarning, UserMinus, LogOut, ClipboardList, Loader2,
  Plus, Search, X, CheckCircle, Mic, MicOff, Play, Pause, Square,
  Calendar, User, MessageSquare, Save, Download, MoreVertical,
  Shield, AlertCircle, Eye, Edit2, Trash2, Send
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('disciplinary');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: disciplinaryActions, loading: disciplinaryLoading } = useFirestore('disciplinary');
  const { documents: grievances, loading: grievancesLoading } = useFirestore('grievances');
  const { documents: exits, loading: exitsLoading } = useFirestore('exits');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredActions = disciplinaryActions.filter(a => a.companyId === companyId);
  const filteredGrievances = grievances.filter(g => g.companyId === companyId);
  const filteredExits = exits.filter(e => e.companyId === companyId);

  if (disciplinaryLoading || grievancesLoading || exitsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading operations data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Stress-amico.svg" 
            alt="Operations" 
            className="h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 relative z-10">
          <ClipboardList className="h-8 w-8" />
          HR Operations
        </h1>
        <p className="text-orange-100 mt-1 relative z-10">Disciplinary, grievances, and exit management</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b">
          {[
            { id: 'disciplinary', label: 'Disciplinary', icon: AlertTriangle },
            { id: 'grievances', label: 'Grievances', icon: FileWarning },
            { id: 'exit', label: 'Exit Management', icon: LogOut },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-orange-600 border-b-2 border-orange-600'
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
        {activeTab === 'disciplinary' && (
          <div className="space-y-4">
            {filteredActions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No disciplinary actions found</p>
                <p className="text-sm">Record disciplinary actions when necessary</p>
              </div>
            ) : (
              filteredActions.map(action => (
                <div key={action.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {employees.find(e => e.id === action.employeeId)?.name || 'Unknown'}
                        </p>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">{action.status}</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{action.type}</p>
                      <p className="text-sm text-gray-600 mt-1">{action.incident}</p>
                      <p className="text-xs text-gray-500 mt-2">{action.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'grievances' && (
          <div className="space-y-4">
            {filteredGrievances.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileWarning className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No grievances found</p>
                <p className="text-sm">Employee grievances will appear here</p>
              </div>
            ) : (
              filteredGrievances.map(grievance => (
                <div key={grievance.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileWarning className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{grievance.type}</p>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">{grievance.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{grievance.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{grievance.date}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'exit' && (
          <div className="space-y-4">
            {filteredExits.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <LogOut className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No exit records found</p>
                <p className="text-sm">Track employee exits and clearances</p>
              </div>
            ) : (
              filteredExits.map(exit => (
                <div key={exit.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <UserMinus className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {employees.find(e => e.id === exit.employeeId)?.name || 'Unknown'}
                        </p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{exit.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Reason: {exit.reason}</p>
                      <p className="text-sm text-gray-600">Last Day: {exit.lastDay}</p>
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
