import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Shield, User, Lock, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ROLE_HIERARCHY, getCreatableRoles, canManageUser, DEFAULT_FEATURE_PERMISSIONS, FEATURES } from '../config/rolePermissions';

export default function UserManagement() {
  const { companyId, companies } = useCompany();
  const { userData, signup, canManageOtherUser, getAllowedRolesToCreate, isSuperAdmin } = useAuth();
  const { documents: allUsers, loading } = useFirestore('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [expandedRoles, setExpandedRoles] = useState({});

  // Filter users based on company and hierarchy
  const users = allUsers.filter(user => {
    if (isSuperAdmin()) return true;
    return user.companyId === companyId;
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    companyId: ''
  });

  const [customPermissions, setCustomPermissions] = useState({});

  const creatableRoles = getAllowedRolesToCreate();
  const canCreateAnyUser = creatableRoles.length > 0;

  // When role changes, pre-populate permissions from defaults and adjust department requirement
  const handleRoleChange = (role) => {
    setFormData({ ...formData, role, department: '' });
    if (role && DEFAULT_FEATURE_PERMISSIONS[role]) {
      setCustomPermissions({ ...DEFAULT_FEATURE_PERMISSIONS[role] });
    } else {
      setCustomPermissions({});
    }
  };

  // Toggle a specific permission
  const togglePermission = (feature, action) => {
    setCustomPermissions(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [action]: !prev[feature]?.[action]
      }
    }));
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

    if (!canManageOtherUser(formData.role)) {
      setMessage('Error: You do not have permission to create this role');
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        companyId: isSuperAdmin() ? formData.companyId || null : companyId,
        createdBy: userData?.uid,
        customPermissions: customPermissions
      });

      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: '', companyId: '' });
      setCustomPermissions({});
      setMessage('User created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating user: ' + error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setShowEditModal(false);
      setMessage('User updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, userRole) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    if (!canManageOtherUser(userRole)) {
      setMessage('Error: You cannot delete this user');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setMessage('User deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting user: ' + error.message);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800 border-purple-200',
      gm: 'bg-red-100 text-red-800 border-red-200',
      hrm: 'bg-blue-100 text-blue-800 border-blue-200',
      dept_head: 'bg-orange-100 text-orange-800 border-orange-200',
      supervisor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      staff: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role] || colors.staff;
  };

  const getRoleLabel = (role) => ROLE_HIERARCHY[role]?.label || role;

  const toggleRoleExpand = (role) => {
    setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">User Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage users with hierarchical roles. 
            {isSuperAdmin() 
              ? ' Superadmin can create all roles and companies.' 
              : ` You can create: ${creatableRoles.map(r => r.label).join(', ') || 'None'}`
            }
          </p>
        </div>
        {canCreateAnyUser && (
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`rounded-md p-4 ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      {/* Role Hierarchy Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Role Hierarchy</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Superadmin</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded">GM</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">HRM</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">Dept Head</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Supervisor</span>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Staff</span>
        </div>
      </div>

      {/* Users by Role */}
      <div className="space-y-4">
        {Object.keys(ROLE_HIERARCHY).map(role => {
          const roleUsers = users.filter(u => u.role === role);
          const isExpanded = expandedRoles[role] !== false;
          
          if (roleUsers.length === 0 && !isSuperAdmin()) return null;
          
          return (
            <div key={role} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleRoleExpand(role)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getRoleBadgeColor(role)}`}>
                    {getRoleLabel(role)}
                  </span>
                  <span className="text-sm text-gray-500">({roleUsers.length} users)</span>
                </div>
                {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
              </button>
              
              {isExpanded && roleUsers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roleUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 
                              user.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canManageOtherUser(user.role) && user.id !== userData?.uid && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setFormData({
                                      name: user.name,
                                      email: user.email,
                                      role: user.role,
                                      status: user.status || 'active',
                                      password: '',
                                      confirmPassword: ''
                                    });
                                    setShowEditModal(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.role)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isExpanded && roleUsers.length === 0 && (
                <div className="px-6 py-4 text-center text-sm text-gray-500">
                  No {getRoleLabel(role)} users found
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
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
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Password
                </label>
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
                <label className="block text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Confirm Password
                </label>
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
                <label className="block text-sm font-medium text-gray-700">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Role
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  <option value="">Select a role...</option>
                  {creatableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  You can only create roles below your level in the hierarchy.
                </p>
              </div>

              {/* Feature Permissions Section */}
              {formData.role && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Feature Permissions</h4>
                    <span className="text-xs text-gray-500">Pre-configured for {ROLE_HIERARCHY[formData.role]?.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Toggle features on/off for this user. Default settings are pre-selected based on role.
                  </p>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md">
                    {FEATURES.map(feature => (
                      <div key={feature.id} className="bg-white p-2 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-700">{feature.label}</span>
                          <span className="text-xs text-gray-400">{feature.id}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {feature.actions.map(action => (
                            <label key={action} className="flex items-center space-x-1 text-xs cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
                              <input
                                type="checkbox"
                                checked={customPermissions[feature.id]?.[action] || false}
                                onChange={() => togglePermission(feature.id, action)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="capitalize">{action.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSuperAdmin() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Company
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                  >
                    <option value="">Select a company...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select the company this user belongs to
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                >
                  {creatableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
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
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
