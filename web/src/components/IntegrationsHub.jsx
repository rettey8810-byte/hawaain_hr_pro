import { useState } from 'react';
import { useIntegrations } from '../contexts/IntegrationsContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plug, 
  Calendar, 
  MessageSquare, 
  Briefcase,
  CreditCard,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function IntegrationsHub() {
  const { 
    integrations,
    calendarSyncs,
    slackSettings,
    jobBoardPostings,
    configureIntegration,
    setupCalendarSync,
    configureSlackNotification,
    postToJobBoard,
    syncCalendar
  } = useIntegrations();
  const { company } = useCompany();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const integrationTypes = [
    { id: 'calendar', name: 'Calendar Sync', icon: Calendar, description: 'Google & Outlook integration' },
    { id: 'slack', name: 'Slack Notifications', icon: MessageSquare, description: 'Team chat notifications' },
    { id: 'job_board', name: 'Job Boards', icon: Briefcase, description: 'LinkedIn, Indeed, Glassdoor' },
    { id: 'accounting', name: 'Accounting', icon: CreditCard, description: 'QuickBooks, Xero sync' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations Hub</h1>
          <p className="text-gray-600">Connect with external services and tools</p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrationTypes.map(type => {
          const integration = integrations.find(i => i.type === type.id);
          const isConnected = integration?.isEnabled;
          
          return (
            <div 
              key={type.id} 
              onClick={() => setActiveTab(type.id)}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                activeTab === type.id ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <type.icon className="h-5 w-5 text-blue-600" />
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{type.name}</h3>
              <p className="text-sm text-gray-500">{type.description}</p>
            </div>
          );
        })}
      </div>

      {/* Active Integration Details */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {activeTab === 'overview' && <OverviewTab integrations={integrations} />}
        {activeTab === 'calendar' && (
          <CalendarTab 
            syncs={calendarSyncs}
            onSetup={setupCalendarSync}
            onSync={syncCalendar}
          />
        )}
        {activeTab === 'slack' && (
          <SlackTab 
            settings={slackSettings}
            onConfigure={configureSlackNotification}
          />
        )}
        {activeTab === 'job_board' && (
          <JobBoardTab 
            postings={jobBoardPostings}
            onPost={postToJobBoard}
          />
        )}
        {activeTab === 'accounting' && (
          <AccountingTab 
            integration={integrations.find(i => i.type === 'accounting')}
            onConfigure={configureIntegration}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ integrations }) {
  const connectedCount = integrations.filter(i => i.isEnabled).length;
  
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Integration Status</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-blue-600">{connectedCount}</p>
          <p className="text-sm text-blue-800">Active Integrations</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-green-600">{integrations.filter(i => i.syncStatus === 'active').length}</p>
          <p className="text-sm text-green-800">Syncing</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-yellow-600">{integrations.filter(i => i.syncStatus === 'error').length}</p>
          <p className="text-sm text-yellow-800">Needs Attention</p>
        </div>
      </div>

      <div className="space-y-3">
        {integrations.map(integration => (
          <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                integration.isEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <div>
                <p className="font-medium capitalize">{integration.type?.replace('_', ' ')}</p>
                <p className="text-sm text-gray-500">
                  {integration.provider} • Last sync: {integration.lastSyncAt ? format(new Date(integration.lastSyncAt), 'MMM d, HH:mm') : 'Never'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              integration.syncStatus === 'active' ? 'bg-green-100 text-green-700' :
              integration.syncStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {integration.syncStatus}
            </span>
          </div>
        ))}
        {integrations.length === 0 && (
          <p className="text-gray-500 text-center py-8">No integrations configured yet</p>
        )}
      </div>
    </div>
  );
}

// Calendar Tab
function CalendarTab({ syncs, onSetup, onSync }) {
  const [provider, setProvider] = useState('google');
  const [calendarId, setCalendarId] = useState('');

  const handleSetup = async (e) => {
    e.preventDefault();
    try {
      await onSetup('current-user-id', provider, { calendarId });
      toast.success('Calendar sync configured!');
      setCalendarId('');
    } catch (error) {
      toast.error('Failed to setup calendar sync');
    }
  };

  const handleSync = async (syncId) => {
    try {
      await onSync(syncId);
      toast.success('Calendar synced!');
    } catch (error) {
      toast.error('Failed to sync');
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Calendar Integration</h3>
      
      <form onSubmit={handleSetup} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="google">Google Calendar</option>
              <option value="microsoft">Microsoft Outlook</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Calendar ID</label>
            <input
              type="text"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="primary or email@domain.com"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Connect Calendar
        </button>
      </form>

      <h4 className="font-medium mb-3">Active Syncs</h4>
      <div className="space-y-3">
        {syncs.map(sync => (
          <div key={sync.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium capitalize">{sync.provider} Calendar</p>
                <p className="text-sm text-gray-500">
                  {sync.syncEvents?.join(', ')} • Last sync: {sync.lastSyncAt ? format(new Date(sync.lastSyncAt), 'MMM d, HH:mm') : 'Never'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSync(sync.id)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </button>
          </div>
        ))}
        {syncs.length === 0 && (
          <p className="text-gray-500 text-center py-4">No calendar syncs configured</p>
        )}
      </div>
    </div>
  );
}

// Slack Tab
function SlackTab({ settings, onConfigure }) {
  const [channel, setChannel] = useState('#hr-notifications');
  const [eventType, setEventType] = useState('leave_request');
  const [template, setTemplate] = useState('');

  const eventTypes = [
    { value: 'leave_request', label: 'Leave Requests' },
    { value: 'expense_claim', label: 'Expense Claims' },
    { value: 'new_hire', label: 'New Hires' },
    { value: 'birthday', label: 'Birthdays' },
    { value: 'document_expiry', label: 'Document Expiry' }
  ];

  const handleConfigure = async (e) => {
    e.preventDefault();
    try {
      await onConfigure(channel, eventType, template, true);
      toast.success('Slack notification configured!');
      setTemplate('');
    } catch (error) {
      toast.error('Failed to configure');
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Slack Notifications</h3>
      
      <form onSubmit={handleConfigure} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Channel</label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="#hr-notifications"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select 
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message Template</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows="2"
            placeholder="e.g., {{employeeName}} requested {{leaveType}} leave from {{startDate}} to {{endDate}}"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Add Notification
        </button>
      </form>

      <h4 className="font-medium mb-3">Configured Notifications</h4>
      <div className="space-y-3">
        {settings.map(setting => (
          <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">{setting.channel}</p>
                <p className="text-sm text-gray-500 capitalize">{setting.eventType?.replace('_', ' ')}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              setting.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {setting.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        ))}
        {settings.length === 0 && (
          <p className="text-gray-500 text-center py-4">No Slack notifications configured</p>
        )}
      </div>
    </div>
  );
}

// Job Board Tab
function JobBoardTab({ postings, onPost }) {
  const jobBoards = [
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-600' },
    { id: 'indeed', name: 'Indeed', color: 'bg-orange-500' },
    { id: 'glassdoor', name: 'Glassdoor', color: 'bg-green-600' },
    { id: 'monster', name: 'Monster', color: 'bg-purple-600' }
  ];

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Job Board Integration</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {jobBoards.map(board => (
          <div key={board.id} className="border rounded-lg p-4 text-center hover:shadow-md cursor-pointer">
            <div className={`w-12 h-12 ${board.color} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <p className="font-medium">{board.name}</p>
            <p className="text-sm text-gray-500">Click to connect</p>
          </div>
        ))}
      </div>

      <h4 className="font-medium mb-3">Active Job Postings</h4>
      <div className="space-y-3">
        {postings.map(posting => (
          <div key={posting.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium capitalize">{posting.jobBoard}</p>
                <p className="text-sm text-gray-500">
                  Posted: {posting.postedAt ? format(new Date(posting.postedAt), 'MMM d, yyyy') : 'Draft'} • {posting.applicantsCount} applicants
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              posting.status === 'posted' ? 'bg-green-100 text-green-700' :
              posting.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {posting.status}
            </span>
          </div>
        ))}
        {postings.length === 0 && (
          <p className="text-gray-500 text-center py-4">No job board postings</p>
        )}
      </div>
    </div>
  );
}

// Accounting Tab
function AccountingTab({ integration, onConfigure }) {
  const [provider, setProvider] = useState('quickbooks');

  const handleConnect = async () => {
    try {
      await onConfigure('accounting', provider, {});
      toast.success('Accounting integration configured!');
    } catch (error) {
      toast.error('Failed to configure');
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Accounting Integration</h3>
      
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="font-medium mb-2">Connect Your Accounting Software</h4>
        <p className="text-gray-600 mb-4">Sync payroll data automatically with your accounting system</p>
        
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setProvider('quickbooks')}
            className={`px-4 py-2 rounded-lg border ${provider === 'quickbooks' ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            QuickBooks
          </button>
          <button
            onClick={() => setProvider('xero')}
            className={`px-4 py-2 rounded-lg border ${provider === 'xero' ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            Xero
          </button>
        </div>
        
        <button
          onClick={handleConnect}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Connect {provider === 'quickbooks' ? 'QuickBooks' : 'Xero'}
        </button>
      </div>

      {integration && (
        <div className="mt-6 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium capitalize">{integration.provider}</p>
                <p className="text-sm text-gray-500">
                  Last sync: {integration.lastSyncAt ? format(new Date(integration.lastSyncAt), 'MMM d, HH:mm') : 'Never'}
                </p>
              </div>
            </div>
            <button className="text-red-600 hover:text-red-700">
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
