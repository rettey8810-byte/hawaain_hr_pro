// Role hierarchy and permissions configuration
// Superadmin > GM > HRM > Department Head > Supervisor > Staff

export const ROLE_HIERARCHY = {
  superadmin: {
    level: 0,
    canCreate: ['gm', 'hrm', 'dept_head', 'supervisor', 'staff'],
    label: 'Super Admin',
    description: 'System administrator with full access'
  },
  gm: {
    level: 1,
    canCreate: ['hrm', 'dept_head', 'supervisor', 'staff'],
    label: 'General Manager',
    description: 'Can manage HRM and below'
  },
  hrm: {
    level: 2,
    canCreate: ['dept_head', 'supervisor', 'staff'],
    label: 'HR Manager',
    description: 'Can manage Department Heads and below'
  },
  dept_head: {
    level: 3,
    canCreate: ['supervisor', 'staff'],
    label: 'Department Head',
    description: 'Can manage Supervisors and Staff'
  },
  supervisor: {
    level: 4,
    canCreate: ['staff'],
    label: 'Supervisor',
    description: 'Can manage Staff only'
  },
  staff: {
    level: 5,
    canCreate: [],
    label: 'Staff',
    description: 'Regular employee, cannot create users'
  }
};

// Default feature permissions by role
// Superadmin can toggle these in settings
export const DEFAULT_FEATURE_PERMISSIONS = {
  superadmin: {
    companies: { view: true, create: true, edit: true, delete: true },
    employees: { view: true, create: true, edit: true, delete: true },
    salary: { view: true, edit: true },
    payroll: { view: true, run: true },
    recruitment: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    leave: { view: true, apply: true, approve: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: true },
    users: { view: true, create: true, edit: true, delete: true },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: true },
    benefits: { view: true, create: true, edit: true, approve: true },
    engagement: { view: true, create: true, manage: true },
    compliance: { view: true, manage: true, process: true },
    integrations: { view: true, configure: true, manage: true },
    analytics: { view: true, create: true, export: true }
  },
  gm: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: true, edit: true, delete: false },
    salary: { view: true, edit: true },
    payroll: { view: true, run: true },
    recruitment: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    leave: { view: true, apply: true, approve: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: false },
    users: { view: true, create: true, edit: true, delete: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: true },
    benefits: { view: true, create: true, edit: true, approve: true },
    engagement: { view: true, create: true, manage: true },
    compliance: { view: true, manage: true, process: true },
    integrations: { view: true, configure: false, manage: false },
    analytics: { view: true, create: true, export: true }
  },
  hrm: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: true, edit: true, delete: false },
    salary: { view: true, edit: true },
    payroll: { view: true, run: true },
    recruitment: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    leave: { view: true, apply: true, approve: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: false },
    users: { view: true, create: true, edit: true, delete: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: true },
    benefits: { view: true, create: true, edit: true, approve: true },
    engagement: { view: true, create: true, manage: true },
    compliance: { view: true, manage: true, process: true },
    integrations: { view: true, configure: false, manage: false },
    analytics: { view: true, create: true, export: true }
  },
  dept_head: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: false, edit: false, delete: false },
    salary: { view: false, edit: false },
    payroll: { view: false, run: false },
    recruitment: { view: true, create: false, edit: false, delete: false },
    documents: { view: true, create: false, edit: false, delete: false },
    leave: { view: true, apply: true, approve: true },
    reports: { view: true, export: false },
    settings: { view: false, edit: false },
    users: { view: true, create: true, edit: false, delete: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false },
    benefits: { view: true, create: false, edit: false, approve: false },
    engagement: { view: true, create: true, manage: false },
    compliance: { view: false, manage: false, process: false },
    integrations: { view: false, configure: false, manage: false },
    analytics: { view: false, create: false, export: false }
  },
  supervisor: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: false, edit: false, delete: false },
    salary: { view: false, edit: false },
    payroll: { view: false, run: false },
    recruitment: { view: false, create: false, edit: false, delete: false },
    documents: { view: false, create: false, edit: false, delete: false },
    leave: { view: true, apply: true, approve: true },
    reports: { view: false, export: false },
    settings: { view: false, edit: false },
    users: { view: true, create: true, edit: false, delete: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false },
    benefits: { view: true, create: false, edit: false, approve: false },
    engagement: { view: true, create: true, manage: false },
    compliance: { view: false, manage: false, process: false },
    integrations: { view: false, configure: false, manage: false },
    analytics: { view: false, create: false, export: false }
  },
  staff: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    salary: { view: false, edit: false },
    payroll: { view: false, run: false },
    recruitment: { view: false, create: false, edit: false, delete: false },
    documents: { view: false, create: false, edit: false, delete: false },
    leave: { view: true, apply: true, approve: false },
    reports: { view: false, export: false },
    settings: { view: false, edit: false },
    users: { view: false, create: false, edit: false, delete: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false },
    benefits: { view: true, create: false, edit: false, approve: false },
    engagement: { view: true, create: true, manage: false },
    compliance: { view: false, manage: false, process: false },
    integrations: { view: false, configure: false, manage: false },
    analytics: { view: false, create: false, export: false }
  }
};

// Helper functions
export const getRoleLevel = (role) => ROLE_HIERARCHY[role]?.level ?? 999;

export const canCreateRole = (creatorRole, targetRole) => {
  const creator = ROLE_HIERARCHY[creatorRole];
  if (!creator) return false;
  return creator.canCreate.includes(targetRole);
};

export const getCreatableRoles = (creatorRole) => {
  const creator = ROLE_HIERARCHY[creatorRole];
  if (!creator) return [];
  return creator.canCreate.map(role => ({
    value: role,
    label: ROLE_HIERARCHY[role].label,
    description: ROLE_HIERARCHY[role].description
  }));
};

export const isHigherRole = (role1, role2) => {
  return getRoleLevel(role1) < getRoleLevel(role2);
};

export const canManageUser = (managerRole, userRole) => {
  // Superadmin can manage everyone
  if (managerRole === 'superadmin') return true;
  // Cannot manage same level or higher
  if (getRoleLevel(managerRole) >= getRoleLevel(userRole)) return false;
  // Check if manager can create that role type
  return canCreateRole(managerRole, userRole);
};

export const hasFeatureAccess = (userRole, feature, action, customPermissions = null) => {
  // If custom permissions are set, use those
  const permissions = customPermissions || DEFAULT_FEATURE_PERMISSIONS;
  const rolePermissions = permissions[userRole];
  if (!rolePermissions) return false;
  const featurePermissions = rolePermissions[feature];
  if (!featurePermissions) return false;
  return featurePermissions[action] || false;
};

export const ALL_ROLES = Object.keys(ROLE_HIERARCHY).map(role => ({
  value: role,
  label: ROLE_HIERARCHY[role].label,
  level: ROLE_HIERARCHY[role].level
}));

export const FEATURES = [
  { id: 'companies', label: 'Companies', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'employees', label: 'Employees', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'salary', label: 'Salary Information', actions: ['view', 'edit'] },
  { id: 'payroll', label: 'Payroll', actions: ['view', 'run'] },
  { id: 'recruitment', label: 'Recruitment', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'documents', label: 'Documents', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'leave', label: 'Leave Management', actions: ['view', 'apply', 'approve'] },
  { id: 'reports', label: 'Reports', actions: ['view', 'export'] },
  { id: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { id: 'users', label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
  // v2.0 New Features
  { id: 'timeAttendance', label: 'Time & Attendance', actions: ['view', 'clockIn', 'manage'] },
  { id: 'benefits', label: 'Benefits Management', actions: ['view', 'create', 'edit', 'approve'] },
  { id: 'engagement', label: 'Employee Engagement', actions: ['view', 'create', 'manage'] },
  { id: 'compliance', label: 'Compliance & Legal', actions: ['view', 'manage', 'process'] },
  { id: 'integrations', label: 'Integrations Hub', actions: ['view', 'configure', 'manage'] },
  { id: 'analytics', label: 'HR Analytics', actions: ['view', 'create', 'export'] }
];
