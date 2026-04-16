import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Calendar, Shield, Edit2, Save, X, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate } from '../utils/helpers';
import OutOfOfficeSettings from './OutOfOfficeSettings';

export default function Profile() {
  const { user, userData, logout } = useAuth();
  const { currentCompany } = useCompany();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Get name from various possible field names
  const getName = () => {
    return userData?.name || 
           userData?.['Full Name'] || 
           userData?.['Employee Name'] || 
           userData?.displayName || 
           user?.displayName || 
           '';
  };

  // Get phone from various possible field names
  const getPhone = () => {
    return userData?.phone || 
           userData?.['Phone'] || 
           userData?.['Contact'] || 
           userData?.['Mobile'] || 
           '';
  };

  // Get position/designation from various possible field names
  const getPosition = () => {
    return userData?.position || 
           userData?.['Position'] || 
           userData?.['Designation'] || 
           userData?.designation || 
           '';
  };

  const [formData, setFormData] = useState({
    name: getName(),
    email: user?.email || '',
    phone: getPhone(),
    department: userData?.department || '',
    position: getPosition(),
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: getName(),
        email: user?.email || '',
        phone: getPhone(),
        department: userData?.department || '',
        position: getPosition(),
      });
    }
  }, [userData, user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        updatedAt: new Date().toISOString(),
      });
      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      hr: 'bg-green-100 text-green-800',
      staff: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.staff;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900">My Profile</h2>
        <p className="mt-1 text-sm text-gray-500">View and manage your profile information</p>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 text-center">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-blue-600">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                </div>
                {editing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                {userData?.name || user?.displayName || 'User'}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              
              <div className="mt-3">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRoleBadgeColor(userData?.role)}`}>
                  {userData?.role?.toUpperCase()}
                </span>
              </div>

              {currentCompany && (
                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                  <Building2 className="h-4 w-4 mr-1" />
                  {currentCompany.name}
                </div>
              )}

              <div className="mt-6 flex justify-center space-x-3">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Account Info</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID</span>
                  <span className="text-gray-900 font-mono">{user?.uid?.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email Verified</span>
                  <span className="text-gray-900">{user?.emailVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="text-gray-900">
                    {userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-900">
                    {userData?.updatedAt ? formatDate(userData.updatedAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">Profile Details</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 disabled:bg-gray-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 disabled:bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={!editing}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 disabled:bg-gray-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Department
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 disabled:bg-gray-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Position
                  </label>
                  <input
                    type="text"
                    disabled={!editing}
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 disabled:bg-gray-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Join Date
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive email alerts for document expiries</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!editing}
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Browser Notifications</p>
                    <p className="text-sm text-gray-500">Show desktop notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!editing}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Out of Office Delegation - Only for HODs */}
          <OutOfOfficeSettings />
        </div>
      </div>
    </div>
  );
}
