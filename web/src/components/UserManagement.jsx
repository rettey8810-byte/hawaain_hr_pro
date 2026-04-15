import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Mail, Shield, User, Lock, X, Key, Search,
  Eye, Phone, Briefcase, Building2, CheckCircle, EyeOff, ToggleLeft, ToggleRight, Settings2
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLE_HIERARCHY, getAccessLevelLabel, getAccessLevelColor, ALL_ACCESS_LEVELS, canAssignAccessLevel, FEATURES, DEFAULT_FEATURE_PERMISSIONS } from '../config/rolePermissions';

export default function UserManagement() {
  const { companyId, companies } = useCompany();
  const { userData, signup, isSuperAdmin } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);

  // Permission management state
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Load ALL users
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(docs);
      setLoading(false);
    }, (err) => {
      console.error('Error loading users:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter users
  const users = allUsers.filter(user => {
    if (isSuperAdmin()) return true;
    if (userData?.role === 'company_admin' || userData?.role === 'hr' || userData?.role === 'gm' || userData?.role === 'hrm') {
      return true;
    }
    return user.id === userData?.uid;
  }).filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (user.fullName || user.displayName || user.name || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.username || '').toLowerCase().includes(query) ||
        (user.employeeCode || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    designation: '',
    phone: '',
    companyId: '',
    status: 'active'
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800',
      gm: 'bg-red-100 text-red-800',
      hrm: 'bg-blue-100 text-blue-800',
      dept_head: 'bg-orange-100 text-orange-800',
      supervisor: 'bg-yellow-100 text-yellow-800',
      staff: 'bg-green-100 text-green-800',
      employee: 'bg-teal-100 text-teal-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => ROLE_HIERARCHY[role]?.label || role;

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || user.name || '',
      email: user.email || '',
      username: user.username || '',
      role: user.role || '',
      department: user.department || '',
      designation: user.designation || '',
      phone: user.phone || '',
      companyId: user.companyId || '',
      status: user.status || 'active',
      accessLevel: user.accessLevel || 'level4',
      password: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        fullName: formData.fullName,
        username: formData.username,
        department: formData.department,
        designation: formData.designation,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        companyId: formData.companyId,
        accessLevel: formData.accessLevel,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      setMessage('User updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting user: ' + error.message);
    }
  };

  // Permission management handlers
  const handleManagePermissions = (user) => {
    setSelectedUser(user);
    // Load existing custom permissions or use role defaults
    const existingPerms = user.customPermissions || {};
    const roleDefaults = DEFAULT_FEATURE_PERMISSIONS[user.role] || {};
    
    // Merge with defaults
    const mergedPerms = {};
    FEATURES.forEach(feature => {
      mergedPerms[feature.id] = {};
      feature.actions.forEach(action => {
        mergedPerms[feature.id][action] = existingPerms[feature.id]?.[action] ?? roleDefaults[feature.id]?.[action] ?? false;
      });
    });
    
    setUserPermissions(mergedPerms);
    setShowPermissionsModal(true);
  };

  const togglePermission = (featureId, action) => {
    setUserPermissions(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [action]: !prev[featureId][action]
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    setPermissionsLoading(true);
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        customPermissions: userPermissions,
        permissionsUpdatedAt: new Date().toISOString(),
        permissionsUpdatedBy: userData?.uid
      });
      setShowPermissionsModal(false);
      setMessage('Permissions updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating permissions: ' + error.message);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        mustChangePassword: false,
        passwordUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setResetSuccess({
        user: selectedUser.fullName || selectedUser.displayName || selectedUser.name,
        password: newPassword
      });
      setNewPassword('');
      setShowPassword(false);
    } catch (error) {
      setMessage('Error resetting password: ' + error.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('Error: Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Error: Password must be at least 6 characters');
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        role: formData.role,
        companyId: isSuperAdmin() ? formData.companyId || null : companyId,
        createdBy: userData?.uid
      });

      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: '',
        department: '',
        designation: '',
        phone: '',
        companyId: '',
        status: 'active'
      });
      setMessage('User created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating user: ' + error.message);
    }
  };

  // Group users by role
  const usersByRole = users.reduce((acc, user) => {
    const role = user.role || 'unknown';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">User Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage all users ({users.length} loaded)
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      {/* Users by Role - Card Grid */}
      {Object.keys(usersByRole).map(role => (
        <div key={role} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(role)}`}>
              {getRoleLabel(role)}
            </span>
            <span className="text-sm text-gray-500">({usersByRole[role].length} users)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {usersByRole[role].map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {(user.fullName || user.displayName || user.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.fullName || user.displayName || user.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{user.username || user.employeeCode || user.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 
                    user.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </div>

                {/* Access Level Badge */}
                <div className="mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getAccessLevelColor(user.accessLevel)}`}>
                    {getAccessLevelLabel(user.accessLevel) || 'Level 4 - Staff'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email || 'No email'}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      <span>{user.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{user.companyId || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewUser(user)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowResetPasswordModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 rounded hover:bg-orange-100"
                  >
                    <Key className="h-4 w-4" />
                    Reset
                  </button>
                  {/* Permission button - only for HRM/GM */}
                  {(userData?.role === 'hrm' || userData?.role === 'gm' || userData?.role === 'superadmin') && (
                    <button
                      onClick={() => handleManagePermissions(user)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                    >
                      <Settings2 className="h-4 w-4" />
                      Permissions
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading users...</p>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button onClick={() => setShowViewModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-medium text-2xl">
                  {(selectedUser.fullName || selectedUser.displayName || selectedUser.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-medium text-gray-900">{selectedUser.fullName || selectedUser.displayName || selectedUser.name}</h4>
                <p className="text-sm text-gray-500">{getRoleLabel(selectedUser.role)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Username:</span>
                <span className="text-gray-900">{selectedUser.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Employee Code:</span>
                <span className="text-gray-900">{selectedUser.employeeCode || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Department:</span>
                <span className="text-gray-900">{selectedUser.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Designation:</span>
                <span className="text-gray-900">{selectedUser.designation || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Phone:</span>
                <span className="text-gray-900">{selectedUser.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Company:</span>
                <span className="text-gray-900">{selectedUser.companyId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 
                  selectedUser.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                  'bg-red-100 text-red-800'
                }`}>{selectedUser.status || 'active'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Access Level:</span>
                <span className={`px-2 py-0.5 rounded text-xs ${getAccessLevelColor(selectedUser.accessLevel)}`}>
                  {getAccessLevelLabel(selectedUser.accessLevel) || 'Level 4 - Staff'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900 text-sm">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditUser(selectedUser);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Edit User
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  {Object.keys(ROLE_HIERARCHY).map(role => (
                    <option key={role} value={role}>{ROLE_HIERARCHY[role].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              
              {/* Access Level - Only visible to HRM/GM/Superadmin */}
              {canAssignAccessLevel(userData?.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Access Level
                    <span className="text-xs text-gray-500 ml-1">(Controls salary visibility & permissions)</span>
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) => setFormData({...formData, accessLevel: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  >
                    {ALL_ACCESS_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {ALL_ACCESS_LEVELS.find(l => l.value === formData.accessLevel)?.description}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
              <button onClick={() => { setShowResetPasswordModal(false); setResetSuccess(null); }}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            {resetSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successfully!</h4>
                <p className="text-sm text-gray-600 mb-4">User: <strong>{resetSuccess.user}</strong></p>
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-1">New Password:</p>
                  <p className="text-lg font-mono font-medium text-gray-900">{resetSuccess.password}</p>
                </div>
                <p className="text-xs text-amber-600 mb-4">⚠️ Please copy this password now. It won't be shown again!</p>
                <button
                  onClick={() => { setShowResetPasswordModal(false); setResetSuccess(null); }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Reset password for <strong>{selectedUser.fullName || selectedUser.displayName || selectedUser.name}</strong>
                </p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 pr-10"
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowResetPasswordModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700"
                    >
                      Reset Password
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  placeholder="Optional username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  placeholder="Re-enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="">Select role...</option>
                  {Object.keys(ROLE_HIERARCHY).map(role => (
                    <option key={role} value={role}>{ROLE_HIERARCHY[role].label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Management Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Manage Permissions</h3>
                <p className="text-sm text-gray-500">
                  {selectedUser.fullName || selectedUser.name} ({ROLE_HIERARCHY[selectedUser.role]?.label})
                </p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded">
              <strong>Note:</strong> Toggle permissions to customize access. Changes override default role permissions.
            </p>

            <div className="space-y-4">
              {FEATURES.map((feature, idx) => {
                // Feature color scheme - vibrant colors
                const colorSchemes = [
                  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', icon: 'text-pink-600' },
                  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: 'text-purple-600' },
                  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', icon: 'text-indigo-600' },
                  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: 'text-blue-600' },
                  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', icon: 'text-cyan-600' },
                  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', icon: 'text-teal-600' },
                  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', icon: 'text-emerald-600' },
                  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: 'text-green-600' },
                  { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300', icon: 'text-lime-600' },
                  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: 'text-yellow-600' },
                  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', icon: 'text-amber-600' },
                  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: 'text-orange-600' },
                  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: 'text-red-600' },
                  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', icon: 'text-rose-600' },
                  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-300', icon: 'text-fuchsia-600' },
                  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', icon: 'text-violet-600' }
                ];
                const colors = colorSchemes[idx % colorSchemes.length];

                return (
                  <div key={feature.id} className={`${colors.bg} ${colors.border} border-2 rounded-xl p-4 shadow-sm`}>
                    <h4 className={`font-bold ${colors.text} mb-3 flex items-center gap-2 text-base`}>
                      <Shield className={`h-5 w-5 ${colors.icon}`} />
                      {feature.label}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {feature.actions.map(action => {
                        const isEnabled = userPermissions[feature.id]?.[action] || false;
                        return (
                          <button
                            key={action}
                            onClick={() => togglePermission(feature.id, action)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-md ${
                              isEnabled
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-emerald-200'
                                : 'bg-white text-gray-500 border-2 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {isEnabled ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                            <span className="uppercase tracking-wide">{action}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={permissionsLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {permissionsLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
