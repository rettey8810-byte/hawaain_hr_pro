import { useState } from 'react';
import { Save, Bell, Shield, Mail, Globe } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Settings() {
  const { currentCompany } = useCompany();
  const { userData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    expiryAlerts: true,
    alertDays: [90, 60, 30],
    
    // Company Settings
    defaultDepartment: '',
    employeeIdFormat: 'EMP-{YYYY}-{####}',
    
    // Security Settings
    requirePasswordChange: 90,
    sessionTimeout: 30,
    twoFactorAuth: false,
    
    // Display Settings
    dateFormat: 'MMM dd, yyyy',
    timezone: 'UTC',
    language: 'en',
  });

  const handleSave = async () => {
    if (!currentCompany) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', currentCompany.id), {
        settings,
        updatedAt: new Date().toISOString(),
        updatedBy: userData?.uid
      });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Configure your HR system preferences</p>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Document Expiry Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.expiryAlerts}
                  onChange={(e) => setSettings({...settings, expiryAlerts: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alert Days Before Expiry</label>
                <div className="mt-2 flex gap-2">
                  {[30, 60, 90].map(day => (
                    <label key={day} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alertDays.includes(day)}
                        onChange={(e) => {
                          const newDays = e.target.checked 
                            ? [...settings.alertDays, day]
                            : settings.alertDays.filter(d => d !== day);
                          setSettings({...settings, alertDays: newDays});
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">{day} days</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">Security Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password Change Required (Days)</label>
                <input
                  type="number"
                  value={settings.requirePasswordChange}
                  onChange={(e) => setSettings({...settings, requirePasswordChange: parseInt(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">Display Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="MMM dd, yyyy">Jan 01, 2026</option>
                  <option value="dd/MM/yyyy">01/01/2026</option>
                  <option value="yyyy-MM-dd">2026-01-01</option>
                  <option value="MM/dd/yyyy">01/01/2026</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Dubai">Dubai</option>
                  <option value="Asia/Singapore">Singapore</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">Email Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Department</label>
                <input
                  type="text"
                  value={settings.defaultDepartment}
                  onChange={(e) => setSettings({...settings, defaultDepartment: e.target.value})}
                  placeholder="e.g., Human Resources"
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID Format</label>
                <input
                  type="text"
                  value={settings.employeeIdFormat}
                  onChange={(e) => setSettings({...settings, employeeIdFormat: e.target.value})}
                  placeholder="EMP-{YYYY}-{####}"
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">Use {'{YYYY}'} for year, {'{####}'} for sequential number</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !currentCompany}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
