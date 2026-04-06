import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { LeaveQuotaProvider } from './contexts/LeaveQuotaContext';

// New Context Providers
import { TimeAttendanceProvider } from './contexts/TimeAttendanceContext';
import { BenefitsProvider } from './contexts/BenefitsContext';
import { EngagementProvider } from './contexts/EngagementContext';
import { ComplianceProvider } from './contexts/ComplianceContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { IntegrationsProvider } from './contexts/IntegrationsContext';

import Layout from './components/Layout';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import EmployeeForm from './components/EmployeeForm';
import EmployeeDetail from './components/EmployeeDetail';
import Passports from './components/Passports';
import Visas from './components/Visas';
import WorkPermits from './components/WorkPermits';
import Medicals from './components/Medicals';
import DocumentForm from './components/DocumentForm';
import Notifications from './components/Notifications';
import Renewals from './components/Renewals';
import CompanyAdmin from './components/CompanyAdmin';
import Reports from './components/Reports';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import GlobalSearch from './components/GlobalSearch';
import AuditLog from './components/AuditLog';
import Help from './components/Help';
import Profile from './components/Profile';
import LeavePlanner from './components/LeavePlanner';
import LeaveApplication from './components/LeaveApplication';
import LeaveApproval from './components/LeaveApproval';
import TransportationBooking from './components/TransportationBooking';
import LeaveDetail from './components/LeaveDetail';
import LeaveReports from './components/LeaveReports';
import LeavePolicySettings from './components/LeavePolicySettings';

// New HR Modules
import Recruitment from './components/Recruitment';
import Performance from './components/Performance';
import Training from './components/Training';
import Payroll from './components/Payroll';
import Attendance from './components/Attendance';
import Engagement from './components/Engagement';
import Operations from './components/Operations';
import Analytics from './components/Analytics';
import Compliance from './components/Compliance';
import OrgStructure from './components/OrgStructure';
import SelfService from './components/SelfService';
import ApprovalWorkflowSettings from './components/ApprovalWorkflowSettings';
import BulkImportExport from './components/BulkImportExport';
import DataFixUtility from './components/DataFixUtility';

// Approval Workflow Modules
import PayrollApproval from './components/PayrollApproval';
import PromotionManagement from './components/PromotionManagement';
import DisciplinaryManagement from './components/DisciplinaryManagement';
import RecruitmentApproval from './components/RecruitmentApproval';

// New HR Modules
import Companies from './components/Companies';
import PositionQuota from './components/PositionQuota';
import JobDescription from './components/JobDescription';
import ContractsAndLetters from './components/ContractsAndLetters';
import FormTemplates from './components/FormTemplates';
import ManpowerBudget from './components/ManpowerBudget';

// Additional HR Feature Modules (v1.5.0)
import PerformanceReviews from './components/PerformanceReviews';
import AttendanceTracking from './components/AttendanceTracking';
import ExpenseClaims from './components/ExpenseClaims';
import SelfServicePortal from './components/SelfServicePortal';
import HRAnalytics from './components/HRAnalytics';
import EmployeeDirectory from './components/EmployeeDirectory';
import CompanyAnnouncements from './components/CompanyAnnouncements';
import ShiftManagement from './components/ShiftManagement';
import Accommodation from './components/Accommodation';
import CompanyStructure from './components/CompanyStructure';

// Advanced HR Feature Modules (v2.0.0)
import TimeAttendance from './components/TimeAttendance';
import BenefitsManagement from './components/BenefitsManagement';
import EmployeeEngagement from './components/EmployeeEngagement';
import ComplianceCenter from './components/ComplianceCenter';
import IntegrationsHub from './components/IntegrationsHub';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function HRAuthRoute({ children }) {
  const { user, isHR, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (!isHR()) return <Navigate to="/" />;
  
  return children;
}

function SuperAdminRoute({ children }) {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (userData?.role !== 'superadmin') return <Navigate to="/" />;
  
  return children;
}

// Feature-based permission route guard
function PermissionRoute({ children, feature, action }) {
  const { user, hasAccess, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (!hasAccess(feature, action)) return <Navigate to="/" />;
  
  return children;
}

function HRGMAuthRoute({ children }) {
  const { user, isHRorGM, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  if (!isHRorGM()) return <Navigate to="/" />;
  
  return children;
}

function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
    <AuthProvider>
      <LeaveQuotaProvider>
        <CompanyProvider>
          <NotificationProvider>
            <OfflineProvider>
              <TimeAttendanceProvider>
                <BenefitsProvider>
                  <EngagementProvider>
                    <ComplianceProvider>
                      <AnalyticsProvider>
                        <IntegrationsProvider>
                          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/data-fix" element={<DataFixUtility />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Layout><Dashboard /></Layout>
                </PrivateRoute>
              } />
              
              {/* Company Admin - Super Admin Only */}
              <Route path="/companies" element={
                <PrivateRoute>
                  <SuperAdminRoute>
                    <Layout><CompanyAdmin /></Layout>
                  </SuperAdminRoute>
                </PrivateRoute>
              } />
              
              {/* Employee Routes */}
              <Route path="/employees" element={
                <PrivateRoute>
                  <Layout><Employees /></Layout>
                </PrivateRoute>
              } />
              <Route path="/employees/new" element={
                <PrivateRoute>
                  <HRAuthRoute>
                    <Layout><EmployeeForm /></Layout>
                  </HRAuthRoute>
                </PrivateRoute>
              } />
              <Route path="/employees/:id" element={
                <PrivateRoute>
                  <Layout><EmployeeDetail /></Layout>
                </PrivateRoute>
              } />
              <Route path="/employees/:id/edit" element={
                <PrivateRoute>
                  <HRAuthRoute>
                    <Layout><EmployeeForm /></Layout>
                  </HRAuthRoute>
                </PrivateRoute>
              } />
              
              {/* Document Routes - Permission Protected */}
              <Route path="/passports" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="view">
                    <Layout><Passports /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/passports/new" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="create">
                    <Layout><DocumentForm type="passport" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/passports/:id/edit" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="edit">
                    <Layout><DocumentForm type="passport" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              <Route path="/visas" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="view">
                    <Layout><Visas /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/visas/new" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="create">
                    <Layout><DocumentForm type="visa" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/visas/:id/edit" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="edit">
                    <Layout><DocumentForm type="visa" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              <Route path="/work-permits" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="view">
                    <Layout><WorkPermits /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/work-permits/new" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="create">
                    <Layout><DocumentForm type="work-permit" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/work-permits/:id/edit" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="edit">
                    <Layout><DocumentForm type="work-permit" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              <Route path="/medical" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="view">
                    <Layout><Medicals /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/medical/new" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="create">
                    <Layout><DocumentForm type="medical" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/medical/:id/edit" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="edit">
                    <Layout><DocumentForm type="medical" /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Notifications */}
              <Route path="/notifications" element={
                <PrivateRoute>
                  <Layout><Notifications /></Layout>
                </PrivateRoute>
              } />
              
              {/* Renewals - Permission Protected */}
              <Route path="/renewals" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="view">
                    <Layout><Renewals /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Reports & Analytics - Permission Protected */}
              <Route path="/reports" element={
                <PrivateRoute>
                  <PermissionRoute feature="reports" action="view">
                    <Layout><Reports /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Settings - Permission Protected */}
              <Route path="/settings" element={
                <PrivateRoute>
                  <PermissionRoute feature="settings" action="view">
                    <Layout><Settings /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* User Management - Permission Protected */}
              <Route path="/users" element={
                <PrivateRoute>
                  <PermissionRoute feature="users" action="view">
                    <Layout><UserManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Global Search - Permission Protected */}
              <Route path="/search" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><GlobalSearch /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Audit Log */}
              <Route path="/audit-log" element={
                <PrivateRoute>
                  <HRAuthRoute>
                    <Layout><AuditLog /></Layout>
                  </HRAuthRoute>
                </PrivateRoute>
              } />
              
              {/* Help */}
              <Route path="/help" element={
                <PrivateRoute>
                  <Layout><Help /></Layout>
                </PrivateRoute>
              } />
              
              {/* Profile */}
              <Route path="/profile" element={
                <PrivateRoute>
                  <Layout><Profile /></Layout>
                </PrivateRoute>
              } />
              
              {/* New HR Module Routes - Permission Protected */}
              <Route path="/recruitment" element={
                <PrivateRoute>
                  <PermissionRoute feature="recruitment" action="view">
                    <Layout><Recruitment /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/performance" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><Performance /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/training" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><Training /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              {/* Payroll - Permission Protected */}
              <Route path="/payroll" element={
                <PrivateRoute>
                  <PermissionRoute feature="payroll" action="view">
                    <Layout><Payroll /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/payroll/approval" element={
                <PrivateRoute>
                  <PermissionRoute feature="payroll" action="view">
                    <Layout><PayrollApproval /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/attendance" element={
                <PrivateRoute>
                  <PermissionRoute feature="leave" action="view">
                    <Layout><Attendance /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/engagement" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><Engagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/operations" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><Operations /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute>
                  <PermissionRoute feature="reports" action="view">
                    <Layout><Analytics /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/compliance" element={
                <PrivateRoute>
                  <PermissionRoute feature="documents" action="view">
                    <Layout><Compliance /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/org-structure" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><OrgStructure /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/self-service" element={
                <PrivateRoute>
                  <Layout><SelfService /></Layout>
                </PrivateRoute>
              } />
              
              {/* Leave Policy Settings - Permission Protected */}
              <Route path="/leave-policy" element={
                <PrivateRoute>
                  <PermissionRoute feature="settings" action="edit">
                    <Layout><LeavePolicySettings /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/approval-workflows" element={
                <PrivateRoute>
                  <PermissionRoute feature="settings" action="edit">
                    <Layout><ApprovalWorkflowSettings /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/leave-planner" element={
                <PrivateRoute>
                  <Layout><LeavePlanner /></Layout>
                </PrivateRoute>
              } />
              <Route path="/leave-planner/apply" element={
                <PrivateRoute>
                  <Layout><LeaveApplication /></Layout>
                </PrivateRoute>
              } />
              <Route path="/leave-planner/:id" element={
                <PrivateRoute>
                  <Layout><LeaveDetail /></Layout>
                </PrivateRoute>
              } />
              <Route path="/leave-planner/:id/edit" element={
                <PrivateRoute>
                  <Layout><LeaveApplication /></Layout>
                </PrivateRoute>
              } />
              <Route path="/leave-planner/:id/approve" element={
                <PrivateRoute>
                  <HRAuthRoute>
                    <Layout><LeaveApproval /></Layout>
                  </HRAuthRoute>
                </PrivateRoute>
              } />
              <Route path="/leave-planner/:id/transport" element={
                <PrivateRoute>
                  <HRAuthRoute>
                    <Layout><TransportationBooking /></Layout>
                  </HRAuthRoute>
                </PrivateRoute>
              } />
              {/* Approval Workflow Routes */}
              <Route path="/promotions" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><PromotionManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/disciplinary" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><DisciplinaryManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/recruitment/approval" element={
                <PrivateRoute>
                  <PermissionRoute feature="recruitment" action="view">
                    <Layout><RecruitmentApproval /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              {/* Approval Workflow Routes */}
              <Route path="/promotions" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><PromotionManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/disciplinary" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><DisciplinaryManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/recruitment/approval" element={
                <PrivateRoute>
                  <PermissionRoute feature="recruitment" action="view">
                    <Layout><RecruitmentApproval /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* New Company & HR Modules */}
              <Route path="/companies" element={
                <PrivateRoute>
                  <PermissionRoute feature="companies" action="view">
                    <Layout><Companies /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/position-quotas" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><PositionQuota /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/manpower-budget" element={
                <PrivateRoute>
                  <PermissionRoute feature="payroll" action="view">
                    <Layout><ManpowerBudget /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/job-descriptions" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><JobDescription /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/contracts" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><ContractsAndLetters /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/form-templates" element={
                <PrivateRoute>
                  <PermissionRoute feature="settings" action="view">
                    <Layout><FormTemplates /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Additional HR Feature Modules (v1.5.0) */}
              <Route path="/performance-reviews" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><PerformanceReviews /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/attendance-tracking" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><AttendanceTracking /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/expense-claims" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><ExpenseClaims /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/self-service" element={
                <PrivateRoute>
                  <Layout><SelfServicePortal /></Layout>
                </PrivateRoute>
              } />
              <Route path="/hr-analytics" element={
                <PrivateRoute>
                  <PermissionRoute feature="reports" action="view">
                    <Layout><HRAnalytics /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/employee-directory" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><EmployeeDirectory /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/announcements" element={
                <PrivateRoute>
                  <Layout><CompanyAnnouncements /></Layout>
                </PrivateRoute>
              } />
              <Route path="/shift-management" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><ShiftManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/accommodation/*" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="view">
                    <Layout><Accommodation /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/company-structure" element={
                <PrivateRoute>
                  <PermissionRoute feature="settings" action="view">
                    <Layout><CompanyStructure /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              {/* Advanced HR Feature Modules (v2.0.0) */}
              <Route path="/time-attendance" element={
                <PrivateRoute>
                  <PermissionRoute feature="timeAttendance" action="view">
                    <Layout><TimeAttendance /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/benefits" element={
                <PrivateRoute>
                  <PermissionRoute feature="benefits" action="view">
                    <Layout><BenefitsManagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/engagement" element={
                <PrivateRoute>
                  <PermissionRoute feature="engagement" action="view">
                    <Layout><EmployeeEngagement /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/compliance" element={
                <PrivateRoute>
                  <PermissionRoute feature="compliance" action="view">
                    <Layout><ComplianceCenter /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              <Route path="/integrations" element={
                <PrivateRoute>
                  <PermissionRoute feature="integrations" action="view">
                    <Layout><IntegrationsHub /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              
              <Route path="/bulk-import-export" element={
                <PrivateRoute>
                  <PermissionRoute feature="employees" action="create">
                    <Layout><BulkImportExport /></Layout>
                  </PermissionRoute>
                </PrivateRoute>
              } />
              </Routes>
            </Router>
          </IntegrationsProvider>
        </AnalyticsProvider>
      </ComplianceProvider>
    </EngagementProvider>
  </BenefitsProvider>
</TimeAttendanceProvider>
          </OfflineProvider>
        </NotificationProvider>
      </CompanyProvider>
    </LeaveQuotaProvider>
  </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
