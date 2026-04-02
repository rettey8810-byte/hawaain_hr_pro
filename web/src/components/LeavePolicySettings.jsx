import { useState } from 'react';
import { Settings, Save, RotateCcw, Building2, Users, Calendar, Clock, AlertTriangle } from 'lucide-react';

const defaultPolicies = {
  // 4-Level Approval Workflow Settings
  enableSupervisorApproval: true,
  enableDepartmentHeadApproval: true,
  enableHRApproval: true,
  enableGMApproval: true,
  
  // Approval threshold - skip levels for short leaves
  supervisorToDeptHeadThreshold: 3,  // Days: >3 needs Dept Head
  deptHeadToHRThreshold: 7,          // Days: >7 needs HR
  hrToGMThreshold: 14,               // Days: >14 needs GM
  
  // Auto-approval
  autoApproveUnderDays: 1,
  
  // Annual Leave
  annualLeaveQuota: 30,
  annualLeaveMaxCarryOver: 5,
  annualLeaveExpiryDays: 365,
  
  // Sick Leave
  sickLeaveQuota: 15,
  sickLeaveDocumentRequiredAfter: 2,
  
  // Emergency Leave
  emergencyLeaveQuota: 7,
  emergencyLeaveMaxPerMonth: 2,
  
  // Compensatory Leave
  compensatoryLeaveEnabled: true,
  compensatoryExpiryDays: 90,
  
  // Half Day
  halfDayLeaveEnabled: true,
  halfDayMaxPerMonth: 10,
  
  // Hourly Leave
  hourlyLeaveEnabled: true,
  hourlyMaxHoursPerMonth: 40,
  
  // Notice Period
  minimumNoticeDays: 7,
  peakPeriodBlockEnabled: false,
  peakPeriodStart: '',
  peakPeriodEnd: '',
  
  // Overlap Rules
  maxConcurrentLeaves: 3,
  blockIfUnderstaffed: true,
  
  // Unpaid Leave
  unpaidLeaveMaxDays: 30,
  unpaidLeaveRequiresApproval: true,
  
  // Study Leave
  studyLeaveEnabled: true,
  studyLeaveMaxDays: 30,
  studyLeaveDocumentRequired: true,
};

export default function LeavePolicySettings({ policies = defaultPolicies, onSave, canEdit = false }) {
  const [settings, setSettings] = useState(policies);
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(defaultPolicies);
    setSaved(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'quotas', label: 'Leave Quotas', icon: Calendar },
    { id: 'workflow', label: '4-Level Workflow', icon: Users },
    { id: 'restrictions', label: 'Restrictions', icon: AlertTriangle },
  ];

  const renderSettingRow = (label, key, type = 'number', options = {}) => (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div>
        <label className="font-medium text-gray-900">{label}</label>
        {options.description && (
          <p className="text-sm text-gray-500 mt-1">{options.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {type === 'boolean' ? (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => handleChange(key, e.target.checked)}
              disabled={!canEdit}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        ) : type === 'select' ? (
          <select
            value={settings[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={!canEdit}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
          >
            {options.choices.map(choice => (
              <option key={choice.value} value={choice.value}>{choice.label}</option>
            ))}
          </select>
        ) : type === 'date' ? (
          <input
            type="date"
            value={settings[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={!canEdit}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settings[key]}
              onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
              disabled={!canEdit}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:border-blue-500 outline-none"
            />
            {options.unit && <span className="text-sm text-gray-500">{options.unit}</span>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/4 opacity-20">
          <img 
            src="/storyset/Settings-cuate.svg" 
            alt="Settings" 
            className="h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Leave Policy Settings</h3>
              <p className="text-slate-300 text-sm">Configure leave rules and quotas</p>
            </div>
          </div>
          {saved && (
            <span className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
              Settings Saved!
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-2">
            {renderSettingRow(
              'Minimum Notice Period',
              'minimumNoticeDays',
              'number',
              { unit: 'days', description: 'Days of advance notice required for leave applications' }
            )}
            {renderSettingRow(
              'Block Peak Period',
              'peakPeriodBlockEnabled',
              'boolean',
              { description: 'Prevent leave applications during peak business periods' }
            )}
            {settings.peakPeriodBlockEnabled && (
              <>
                {renderSettingRow('Peak Period Start', 'peakPeriodStart', 'date')}
                {renderSettingRow('Peak Period End', 'peakPeriodEnd', 'date')}
              </>
            )}
          </div>
        )}

        {/* Quotas Tab */}
        {activeTab === 'quotas' && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Annual Leave
            </h4>
            {renderSettingRow('Annual Leave Quota', 'annualLeaveQuota', 'number', { unit: 'days' })}
            {renderSettingRow('Max Carry Over', 'annualLeaveMaxCarryOver', 'number', { unit: 'days', description: 'Maximum days that can be carried to next year' })}
            
            <h4 className="font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Sick Leave
            </h4>
            {renderSettingRow('Sick Leave Quota', 'sickLeaveQuota', 'number', { unit: 'days' })}
            {renderSettingRow('Document Required After', 'sickLeaveDocumentRequiredAfter', 'number', { unit: 'days', description: 'Medical certificate required after this many days' })}
            
            <h4 className="font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              Emergency Leave
            </h4>
            {renderSettingRow('Emergency Leave Quota', 'emergencyLeaveQuota', 'number', { unit: 'days' })}
            {renderSettingRow('Max Per Month', 'emergencyLeaveMaxPerMonth', 'number', { unit: 'applications' })}
            
            <h4 className="font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-600" />
              Special Leave Types
            </h4>
            {renderSettingRow('Enable Half Day Leave', 'halfDayLeaveEnabled', 'boolean')}
            {settings.halfDayLeaveEnabled && renderSettingRow('Max Half Days Per Month', 'halfDayMaxPerMonth', 'number', { unit: 'days' })}
            
            {renderSettingRow('Enable Hourly Leave', 'hourlyLeaveEnabled', 'boolean')}
            {settings.hourlyLeaveEnabled && renderSettingRow('Max Hours Per Month', 'hourlyMaxHoursPerMonth', 'number', { unit: 'hours' })}
            
            {renderSettingRow('Enable Compensatory Leave', 'compensatoryLeaveEnabled', 'boolean')}
            {settings.compensatoryLeaveEnabled && renderSettingRow('Compensatory Expiry', 'compensatoryExpiryDays', 'number', { unit: 'days', description: 'Days until compensatory leave expires' })}
          </div>
        )}

        {/* 4-Level Approval Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">4-Level Approval Hierarchy</h4>
              <p className="text-sm text-blue-700">Supervisor → Department Head → HR → GM</p>
            </div>
            
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Enable/Disable Levels
            </h4>
            {renderSettingRow(
              'Enable Supervisor Approval (Level 1)',
              'enableSupervisorApproval',
              'boolean',
              { description: 'Direct supervisor must approve first' }
            )}
            {renderSettingRow(
              'Enable Department Head Approval (Level 2)',
              'enableDepartmentHeadApproval',
              'boolean',
              { description: 'Department manager approval required' }
            )}
            {renderSettingRow(
              'Enable HR Approval (Level 3)',
              'enableHRApproval',
              'boolean',
              { description: 'HR compliance and balance check' }
            )}
            {renderSettingRow(
              'Enable GM Approval (Level 4)',
              'enableGMApproval',
              'boolean',
              { description: 'General Manager final authorization' }
            )}
            
            <h4 className="font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Approval Thresholds (Days)
            </h4>
            <p className="text-sm text-gray-500 mb-4">Leaves longer than these thresholds require higher approval</p>
            
            {renderSettingRow(
              'Supervisor → Dept Head',
              'supervisorToDeptHeadThreshold',
              'number',
              { unit: 'days', description: 'Leaves over this need Department Head approval' }
            )}
            {renderSettingRow(
              'Dept Head → HR',
              'deptHeadToHRThreshold',
              'number',
              { unit: 'days', description: 'Leaves over this need HR approval' }
            )}
            {renderSettingRow(
              'HR → GM',
              'hrToGMThreshold',
              'number',
              { unit: 'days', description: 'Leaves over this need GM approval' }
            )}
            
            <h4 className="font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Auto-Approval
            </h4>
            {renderSettingRow(
              'Auto-Approve Under',
              'autoApproveUnderDays',
              'number',
              { unit: 'days', description: 'Automatically approve leaves shorter than this (if enabled levels approve)' }
            )}
          </div>
        )}

        {/* Restrictions Tab */}
        {activeTab === 'restrictions' && (
          <div className="space-y-2">
            {renderSettingRow(
              'Max Concurrent Leaves',
              'maxConcurrentLeaves',
              'number',
              { unit: 'people', description: 'Maximum number of people who can be on leave simultaneously' }
            )}
            {renderSettingRow(
              'Block if Understaffed',
              'blockIfUnderstaffed',
              'boolean',
              { description: 'Prevent leave if department would be understaffed' }
            )}
            {renderSettingRow(
              'Unpaid Leave Max Days',
              'unpaidLeaveMaxDays',
              'number',
              { unit: 'days per year' }
            )}
            {renderSettingRow(
              'Study Leave Enabled',
              'studyLeaveEnabled',
              'boolean'
            )}
            {settings.studyLeaveEnabled && (
              <>
                {renderSettingRow('Study Leave Max Days', 'studyLeaveMaxDays', 'number', { unit: 'days' })}
                {renderSettingRow('Document Required', 'studyLeaveDocumentRequired', 'boolean')}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {canEdit && (
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
