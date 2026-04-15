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
  },
  employee: {
    level: 5,
    canCreate: [],
    label: 'Employee',
    description: 'Regular employee with view-only access'
  }
};

// Default feature permissions by role
// Superadmin can toggle these in settings
export const DEFAULT_FEATURE_PERMISSIONS = {
  superadmin: {
    companies: { view: true, create: true, edit: true, delete: true },
    employees: { view: true, create: true, edit: true, delete: true },
    salary: { view: true, edit: true, viewOwn: true, viewDepartment: true, viewAll: true },
    payroll: { view: true, run: true, approve: true, process: true },
    recruitment: { view: true, create: true, edit: true, delete: true, approve: true, reject: true },
    documents: { view: true, create: true, edit: true, delete: true, upload: true, download: true },
    leave: { view: true, apply: true, approve: true, reject: true, viewAll: true, viewDepartment: true },
    reports: { view: true, export: true, create: true, schedule: true },
    settings: { view: true, edit: true, configure: true },
    users: { view: true, create: true, edit: true, delete: true, resetPassword: true, managePermissions: true },
    // Approval Workflows
    approvals: { view: true, approve: true, reject: true, delegate: true, viewPending: true, viewHistory: true },
    promotions: { view: true, create: true, approve: true, reject: true, process: true },
    disciplinary: { view: true, create: true, approve: true, reject: true, execute: true },
    terminations: { view: true, create: true, approve: true, process: true, offboard: true },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: true, approveOvertime: true, approveTimesheet: true },
    benefits: { view: true, create: true, edit: true, approve: true, enroll: true, processClaims: true },
    engagement: { view: true, create: true, manage: true, surveys: true, feedback: true },
    compliance: { view: true, manage: true, process: true, audit: true, reports: true },
    integrations: { view: true, configure: true, manage: true, apiAccess: true },
    analytics: { view: true, create: true, export: true, dashboards: true, predictive: true },
    training: { view: true, create: true, assign: true, track: true, certify: true },
    performance: { view: true, create: true, evaluate: true, approve: true, calibrate: true },
    orgStructure: { view: true, edit: true, chart: true, manageHierarchy: true },
    notifications: { view: true, send: true, configure: true, manageTemplates: true }
  },
  gm: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: true, edit: true, delete: false },
    salary: { view: true, edit: true, viewOwn: true, viewDepartment: true, viewAll: true },
    payroll: { view: true, run: true, approve: true, process: true },
    recruitment: { view: true, create: true, edit: true, delete: false, approve: true, reject: true },
    documents: { view: true, create: true, edit: true, delete: false, upload: true, download: true },
    leave: { view: true, apply: true, approve: true, reject: true, viewAll: true, viewDepartment: true },
    reports: { view: true, export: true, create: true, schedule: true },
    settings: { view: true, edit: false, configure: false },
    users: { view: true, create: true, edit: true, delete: false, resetPassword: true, managePermissions: true },
    // Approval Workflows
    approvals: { view: true, approve: true, reject: true, delegate: true, viewPending: true, viewHistory: true },
    promotions: { view: true, create: true, approve: true, reject: true, process: true },
    disciplinary: { view: true, create: true, approve: true, reject: true, execute: true },
    terminations: { view: true, create: true, approve: true, process: true, offboard: true },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: true, approveOvertime: true, approveTimesheet: true },
    benefits: { view: true, create: true, edit: true, approve: true, enroll: true, processClaims: true },
    engagement: { view: true, create: true, manage: true, surveys: true, feedback: true },
    compliance: { view: true, manage: true, process: true, audit: true, reports: true },
    integrations: { view: true, configure: false, manage: false, apiAccess: false },
    analytics: { view: true, create: true, export: true, dashboards: true, predictive: true },
    training: { view: true, create: true, assign: true, track: true, certify: true },
    performance: { view: true, create: true, evaluate: true, approve: true, calibrate: true },
    orgStructure: { view: true, edit: true, chart: true, manageHierarchy: true },
    notifications: { view: true, send: true, configure: true, manageTemplates: true }
  },
  hrm: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: true, edit: true, delete: false },
    salary: { view: true, edit: true, viewOwn: true, viewDepartment: true, viewAll: true },
    payroll: { view: true, run: true, approve: true, process: true },
    recruitment: { view: true, create: true, edit: true, delete: false, approve: true, reject: true },
    documents: { view: true, create: true, edit: true, delete: false, upload: true, download: true },
    leave: { view: true, apply: true, approve: true, reject: true, viewAll: true, viewDepartment: true },
    reports: { view: true, export: true, create: true, schedule: false },
    settings: { view: true, edit: false, configure: false },
    users: { view: true, create: true, edit: true, delete: false, resetPassword: true, managePermissions: true },
    // Approval Workflows
    approvals: { view: true, approve: true, reject: true, delegate: true, viewPending: true, viewHistory: true },
    promotions: { view: true, create: true, approve: true, reject: true, process: true },
    disciplinary: { view: true, create: true, approve: true, reject: true, execute: true },
    terminations: { view: true, create: true, approve: true, process: true, offboard: true },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: true, approveOvertime: true, approveTimesheet: true },
    benefits: { view: true, create: true, edit: true, approve: true, enroll: true, processClaims: true },
    engagement: { view: true, create: true, manage: true, surveys: true, feedback: true },
    compliance: { view: true, manage: true, process: true, audit: true, reports: true },
    integrations: { view: true, configure: false, manage: false, apiAccess: false },
    analytics: { view: true, create: true, export: true, dashboards: true, predictive: false },
    training: { view: true, create: true, assign: true, track: true, certify: true },
    performance: { view: true, create: true, evaluate: true, approve: true, calibrate: true },
    orgStructure: { view: true, edit: true, chart: true, manageHierarchy: true },
    notifications: { view: true, send: true, configure: true, manageTemplates: true }
  },
  dept_head: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: false, edit: false, delete: false },
    salary: { view: false, edit: false, viewOwn: true, viewDepartment: true, viewAll: false },
    payroll: { view: false, run: false, approve: false, process: false },
    recruitment: { view: true, create: false, edit: false, delete: false, approve: false, reject: false },
    documents: { view: true, create: false, edit: false, delete: false, upload: true, download: true },
    leave: { view: true, apply: true, approve: true, reject: true, viewAll: false, viewDepartment: true },
    reports: { view: true, export: false, create: false, schedule: false },
    settings: { view: false, edit: false, configure: false },
    users: { view: true, create: true, edit: false, delete: false, resetPassword: false, managePermissions: false },
    // Approval Workflows
    approvals: { view: true, approve: true, reject: true, delegate: false, viewPending: true, viewHistory: false },
    promotions: { view: true, create: false, approve: true, reject: true, process: false },
    disciplinary: { view: true, create: true, approve: false, reject: false, execute: false },
    terminations: { view: true, create: false, approve: true, process: false, offboard: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false, approveOvertime: true, approveTimesheet: true },
    benefits: { view: true, create: false, edit: false, approve: false, enroll: false, processClaims: false },
    engagement: { view: true, create: true, manage: false, surveys: true, feedback: true },
    compliance: { view: false, manage: false, process: false, audit: false, reports: false },
    integrations: { view: false, configure: false, manage: false, apiAccess: false },
    analytics: { view: false, create: false, export: false, dashboards: false, predictive: false },
    training: { view: true, create: false, assign: true, track: true, certify: false },
    performance: { view: true, create: false, evaluate: true, approve: false, calibrate: false },
    orgStructure: { view: true, edit: false, chart: true, manageHierarchy: false },
    notifications: { view: true, send: false, configure: false, manageTemplates: false }
  },
  supervisor: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: true, create: false, edit: false, delete: false },
    salary: { view: false, edit: false, viewOwn: true, viewDepartment: false, viewAll: false },
    payroll: { view: false, run: false, approve: false, process: false },
    recruitment: { view: false, create: false, edit: false, delete: false, approve: false, reject: false },
    documents: { view: false, create: false, edit: false, delete: false, upload: false, download: false },
    leave: { view: true, apply: true, approve: true, reject: true, viewAll: false, viewDepartment: false },
    reports: { view: false, export: false, create: false, schedule: false },
    settings: { view: false, edit: false, configure: false },
    users: { view: true, create: true, edit: false, delete: false, resetPassword: false, managePermissions: false },
    // Approval Workflows
    approvals: { view: true, approve: true, reject: true, delegate: false, viewPending: true, viewHistory: false },
    promotions: { view: false, create: false, approve: false, reject: false, process: false },
    disciplinary: { view: false, create: false, approve: false, reject: false, execute: false },
    terminations: { view: false, create: false, approve: false, process: false, offboard: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false, approveOvertime: false, approveTimesheet: true },
    benefits: { view: true, create: false, edit: false, approve: false, enroll: false, processClaims: false },
    engagement: { view: true, create: true, manage: false, surveys: true, feedback: true },
    compliance: { view: false, manage: false, process: false, audit: false, reports: false },
    integrations: { view: false, configure: false, manage: false, apiAccess: false },
    analytics: { view: false, create: false, export: false, dashboards: false, predictive: false },
    training: { view: true, create: false, assign: false, track: false, certify: false },
    performance: { view: true, create: false, evaluate: false, approve: false, calibrate: false },
    orgStructure: { view: true, edit: false, chart: true, manageHierarchy: false },
    notifications: { view: true, send: false, configure: false, manageTemplates: false }
  },
  staff: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    salary: { view: false, edit: false, viewOwn: false, viewDepartment: false, viewAll: false },
    payroll: { view: false, run: false, approve: false, process: false },
    recruitment: { view: false, create: false, edit: false, delete: false, approve: false, reject: false },
    documents: { view: false, create: false, edit: false, delete: false, upload: false, download: false },
    leave: { view: true, apply: true, approve: false, reject: false, viewAll: false, viewDepartment: false },
    reports: { view: false, export: false, create: false, schedule: false },
    settings: { view: false, edit: false, configure: false },
    users: { view: false, create: false, edit: false, delete: false, resetPassword: false, managePermissions: false },
    // Approval Workflows
    approvals: { view: false, approve: false, reject: false, delegate: false, viewPending: false, viewHistory: false },
    promotions: { view: false, create: false, approve: false, reject: false, process: false },
    disciplinary: { view: false, create: false, approve: false, reject: false, execute: false },
    terminations: { view: false, create: false, approve: false, process: false, offboard: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false, approveOvertime: false, approveTimesheet: false },
    benefits: { view: true, create: false, edit: false, approve: false, enroll: false, processClaims: false },
    engagement: { view: true, create: true, manage: false, surveys: true, feedback: true },
    compliance: { view: false, manage: false, process: false, audit: false, reports: false },
    integrations: { view: false, configure: false, manage: false, apiAccess: false },
    analytics: { view: false, create: false, export: false, dashboards: false, predictive: false },
    training: { view: true, create: false, assign: false, track: false, certify: false },
    performance: { view: true, create: false, evaluate: false, approve: false, calibrate: false },
    orgStructure: { view: true, edit: false, chart: true, manageHierarchy: false },
    notifications: { view: true, send: false, configure: false, manageTemplates: false }
  },
  employee: {
    companies: { view: false, create: false, edit: false, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    salary: { view: true, edit: false, viewOwn: true, viewDepartment: false, viewAll: false },
    payroll: { view: false, run: false, approve: false, process: false },
    recruitment: { view: false, create: false, edit: false, delete: false, approve: false, reject: false },
    documents: { view: true, create: false, edit: false, delete: false, upload: false, download: true },
    leave: { view: true, apply: true, approve: false, reject: false, viewAll: false, viewDepartment: false },
    reports: { view: false, export: false, create: false, schedule: false },
    settings: { view: false, edit: false, configure: false },
    users: { view: false, create: false, edit: false, delete: false, resetPassword: false, managePermissions: false },
    // Approval Workflows
    approvals: { view: false, approve: false, reject: false, delegate: false, viewPending: false, viewHistory: false },
    promotions: { view: false, create: false, approve: false, reject: false, process: false },
    disciplinary: { view: false, create: false, approve: false, reject: false, execute: false },
    terminations: { view: false, create: false, approve: false, process: false, offboard: false },
    // v2.0 New Features
    timeAttendance: { view: true, clockIn: true, manage: false, approveOvertime: false, approveTimesheet: false },
    benefits: { view: true, create: false, edit: false, approve: false, enroll: false, processClaims: false },
    engagement: { view: true, create: true, manage: false, surveys: true, feedback: true },
    compliance: { view: false, manage: false, process: false, audit: false, reports: false },
    integrations: { view: false, configure: false, manage: false, apiAccess: false },
    analytics: { view: false, create: false, export: false, dashboards: false, predictive: false },
    training: { view: true, create: false, assign: false, track: false, certify: false },
    performance: { view: true, create: false, evaluate: false, approve: false, calibrate: false },
    orgStructure: { view: true, edit: false, chart: true, manageHierarchy: false },
    notifications: { view: true, send: false, configure: false, manageTemplates: false }
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
  // ============================================
  // SECTION 1: BASIC ADMIN - No Approval Required
  // Simple CRUD operations, direct access
  // ============================================
  { id: 'companies', label: '🏢 Companies', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'employees', label: '👥 Employees', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'documents', label: '📄 Documents', actions: ['view', 'create', 'edit', 'delete', 'upload', 'download'] },
  { id: 'reports', label: '📊 Reports', actions: ['view', 'export', 'create', 'schedule'] },
  { id: 'settings', label: '⚙️ Settings', actions: ['view', 'edit', 'configure'] },
  { id: 'analytics', label: '📈 HR Analytics', actions: ['view', 'create', 'export', 'dashboards', 'predictive'] },
  { id: 'orgStructure', label: '🏗️ Organization Structure', actions: ['view', 'edit', 'chart', 'manageHierarchy'] },
  { id: 'integrations', label: '🔌 Integrations Hub', actions: ['view', 'configure', 'manage', 'apiAccess'] },
  { id: 'notifications', label: '🔔 Notifications', actions: ['view', 'send', 'configure', 'manageTemplates'] },

  // ============================================
  // SECTION 2: USER MANAGEMENT - Special Access
  // Requires high-level permissions
  // ============================================
  { id: 'users', label: '👤 User Management', actions: ['view', 'create', 'edit', 'delete', 'resetPassword', 'managePermissions'] },

  // ============================================
  // SECTION 3: SALARY & PAYROLL - Multi-Level Views
  // Different view levels based on access
  // ============================================
  { id: 'salary', label: '💰 Salary Management', actions: ['viewOwn', 'viewDepartment', 'viewAll', 'edit'] },
  { id: 'payroll', label: '💵 Payroll', actions: ['view', 'run', 'approve', 'process'] },

  // ============================================
  // SECTION 4: APPROVAL REQUIRED FEATURES
  // These features NEED approve/reject permissions
  // Toggle both user action + approval workflow
  // ============================================
  
  // 4A: Leave & Time (Standard Approval)
  { id: 'leave', label: '📅 Leave Management', actions: ['view', 'apply', 'approve', 'reject', 'viewAll', 'viewDepartment'] },
  { id: 'timeAttendance', label: '⏰ Time & Attendance', actions: ['view', 'clockIn', 'manage', 'approveOvertime', 'approveTimesheet'] },
  
  // 4B: HR Processes (Multi-Stage Approval)
  { id: 'recruitment', label: '🎯 Recruitment', actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject'] },
  { id: 'promotions', label: '⬆️ Promotions', actions: ['view', 'create', 'approve', 'reject', 'process'] },
  { id: 'disciplinary', label: '⚠️ Disciplinary Actions', actions: ['view', 'create', 'approve', 'reject', 'execute'] },
  { id: 'terminations', label: '🚪 Terminations', actions: ['view', 'create', 'approve', 'process', 'offboard'] },
  
  // 4C: Benefits & Compensation (Financial Approval)
  { id: 'benefits', label: '🎁 Benefits Management', actions: ['view', 'create', 'edit', 'approve', 'enroll', 'processClaims'] },

  // ============================================
  // SECTION 5: EMPLOYEE DEVELOPMENT - View/Create Only
  // Generally no approval needed, self-service
  // ============================================
  { id: 'training', label: '📚 Training & Development', actions: ['view', 'create', 'assign', 'track', 'certify'] },
  { id: 'performance', label: '⭐ Performance Reviews', actions: ['view', 'create', 'evaluate', 'approve', 'calibrate'] },
  { id: 'engagement', label: '💬 Employee Engagement', actions: ['view', 'create', 'manage', 'surveys', 'feedback'] },
  
  // ============================================
  // SECTION 6: COMPLIANCE - Audit Required
  // Audit trail, may need approval for changes
  // ============================================
  { id: 'compliance', label: '⚖️ Compliance & Legal', actions: ['view', 'manage', 'process', 'audit', 'reports'] },

  // ============================================
  // SECTION 7: APPROVAL CENTER - Meta Feature
  // Access to approve anything across system
  // ============================================
  { id: 'approvals', label: '✅ Approval Center', actions: ['view', 'approve', 'reject', 'delegate', 'viewPending', 'viewHistory'] }
];

// ============================================
// NEW: Access Levels for HRM/GM Control
// ============================================

export const ACCESS_LEVELS = {
  level1: {
    id: 'level1',
    label: 'Level 1 - HR Staff & Executive',
    description: 'Full access including GM salary data',
    canViewSalary: ['all', 'gm', 'hrm', 'dept_head', 'supervisor', 'staff', 'employee'],
    canViewAllEmployees: true,
    canViewAllDepartments: true,
    canManageUsers: true,
    color: 'bg-purple-100 text-purple-800'
  },
  level2: {
    id: 'level2',
    label: 'Level 2 - HR Staff',
    description: 'All access except salary data',
    canViewSalary: [],
    canViewAllEmployees: true,
    canViewAllDepartments: true,
    canManageUsers: true,
    color: 'bg-blue-100 text-blue-800'
  },
  level3: {
    id: 'level3',
    label: 'Level 3 - HODs & Assistant HODs',
    description: 'Full access for their department only (no salary)',
    canViewSalary: [],
    canViewAllEmployees: false,
    canViewAllDepartments: false,
    canManageUsers: false,
    color: 'bg-green-100 text-green-800'
  },
  level4: {
    id: 'level4',
    label: 'Level 4 - Staff',
    description: 'View own data only',
    canViewSalary: ['self'],
    canViewAllEmployees: false,
    canViewAllDepartments: false,
    canManageUsers: false,
    color: 'bg-gray-100 text-gray-800'
  }
};

export const getAccessLevelLabel = (levelId) => {
  return ACCESS_LEVELS[levelId]?.label || 'No Access Level';
};

export const getAccessLevelColor = (levelId) => {
  return ACCESS_LEVELS[levelId]?.color || 'bg-gray-100 text-gray-600';
};

export const canViewSalary = (viewerAccessLevel, targetUserRole, isOwnData = false) => {
  const level = ACCESS_LEVELS[viewerAccessLevel];
  if (!level) return false;
  
  // Level 1 can view all salaries including GM
  if (level.canViewSalary.includes('all')) return true;
  
  // Level 4 can only view own salary
  if (level.canViewSalary.includes('self') && isOwnData) return true;
  
  // Check if can view specific role's salary
  return level.canViewSalary.includes(targetUserRole);
};

export const canViewEmployeeData = (viewerAccessLevel, targetUserDepartment, viewerDepartment) => {
  const level = ACCESS_LEVELS[viewerAccessLevel];
  if (!level) return false;
  
  // Level 1 and 2 can view all employees
  if (level.canViewAllEmployees) return true;
  
  // Level 3 can only view their department
  if (!level.canViewAllDepartments) {
    return targetUserDepartment === viewerDepartment;
  }
  
  return false;
};

export const ALL_ACCESS_LEVELS = Object.keys(ACCESS_LEVELS).map(level => ({
  value: level,
  label: ACCESS_LEVELS[level].label,
  description: ACCESS_LEVELS[level].description
}));

// Who can assign access levels (HRM and GM)
export const canAssignAccessLevel = (userRole) => {
  return userRole === 'hrm' || userRole === 'gm' || userRole === 'superadmin';
};
