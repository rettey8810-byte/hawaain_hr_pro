import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  Shield,
  DollarSign,
  Briefcase,
  Plane,
  HeartPulse,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Building2,
  BarChart3,
  Settings,
  UserCog,
  Search,
  ClipboardList,
  HelpCircle,
  User,
  Palmtree,
  Moon,
  Sun,
  Target,
  GraduationCap,
  CreditCard,
  Clock,
  Heart,
  AlertTriangle,
  Network,
  UserCircle,
  FolderOpen,
  FileSpreadsheet,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Megaphone,
  Award,
  Receipt,
  CalendarDays,
  HardHat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../contexts/ThemeContext';
import ToastContainer from './ToastContainer';
import CompanySwitcher from './CompanySwitcher';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(['Dashboard']);
  const { user, userData, logout, isHR, isHRorGM, hasAccess } = useAuth();
  const { unreadCount } = useNotifications();
  const { currentCompany, isSuperAdmin, companyId, isConstructionCompany, isExternalCompany } = useCompany();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation categories with sub-items and permissions
  const navigationCategories = useMemo(() => {
    const isConstruction = isConstructionCompany && isConstructionCompany();
    const isExternal = isExternalCompany && isExternalCompany();
    
    // Base categories that all companies see
    const baseCategories = [
      {
        name: 'Dashboard',
        icon: LayoutDashboard,
        items: [
          { name: 'Overview', href: '/', icon: LayoutDashboard, feature: 'employees', action: 'view' },
        ]
      }
    ];

    // Add Construction Workforce menu item for construction company
    const constructionMenu = isConstruction ? [
      {
        name: 'Workforce',
        icon: HardHat,
        items: [
          { name: 'Construction Workforce', href: '/construction-workforce', icon: HardHat, feature: 'employees', action: 'view' },
          { name: 'Export Data', href: '/construction-workforce', icon: FileSpreadsheet, feature: 'employees', action: 'view' },
        ]
      }
    ] : [];

    // Add External Staff menu for external companies
    const externalMenu = isExternal ? [
      {
        name: 'External Staff',
        icon: Users,
        items: [
          { name: 'Manage Staff', href: '/external-staff', icon: Users, feature: 'employees', action: 'view' },
          { name: 'Add New Entry', href: '/external-staff', icon: UserPlus, feature: 'employees', action: 'create' },
        ]
      }
    ] : [];

    // Full navigation for all companies
    return [
      ...baseCategories,
      ...constructionMenu,
      ...externalMenu,
      {
        name: 'People',
        icon: Users,
        items: [
          { name: 'Employees', href: '/employees', icon: Users, feature: 'employees', action: 'view' },
          { name: 'Employee Directory', href: '/employee-directory', icon: Network, feature: 'employees', action: 'view' },
          { name: 'Org Structure', href: '/org-structure', icon: Network, feature: 'employees', action: 'view' },
          { name: 'Recruitment', href: '/recruitment', icon: Briefcase, feature: 'recruitment', action: 'view' },
          { name: 'Bulk Import/Export', href: '/bulk-import-export', icon: FileSpreadsheet, feature: 'employees', action: 'create' },
        ]
      },
      {
        name: 'Leave & Time',
        icon: Palmtree,
        items: [
          { name: 'Leave Planner', href: '/leave-planner', icon: Palmtree, feature: 'leave', action: 'view' },
          { name: 'Apply for Leave', href: '/leave-planner/apply', icon: FileText, feature: 'leave', action: 'apply' },
          { name: 'My Leaves', href: '/leave-planner/my-leaves', icon: ClipboardList, feature: 'leave', action: 'view' },
          { name: 'Attendance', href: '/attendance-tracking', icon: Clock, feature: 'leave', action: 'view' },
          { name: 'Shift Management', href: '/shift-management', icon: CalendarDays, feature: 'leave', action: 'view' },
        ]
      },
      {
        name: 'Documents',
        icon: FolderOpen,
        items: [
          { name: 'Passports', href: '/passports', icon: FileText, feature: 'documents', action: 'view' },
          { name: 'Work Permits', href: '/work-permits', icon: Briefcase, feature: 'documents', action: 'view' },
          { name: 'Visas', href: '/visas', icon: Plane, feature: 'documents', action: 'view' },
          { name: 'Medical', href: '/medical', icon: HeartPulse, feature: 'documents', action: 'view' },
          { name: 'Renewals', href: '/renewals', icon: RefreshCw, feature: 'documents', action: 'view' },
        ]
      },
      {
        name: 'HR Management',
        icon: Briefcase,
        items: [
          { name: 'Performance Reviews', href: '/performance-reviews', icon: Award, feature: 'employees', action: 'view' },
          { name: 'Training', href: '/training', icon: GraduationCap, feature: 'employees', action: 'view' },
          { name: 'Payroll', href: '/payroll', icon: CreditCard, feature: 'payroll', action: 'view' },
          { name: 'Payroll Approval', href: '/payroll/approval', icon: FileText, feature: 'payroll', action: 'view' },
          { name: 'Expense Claims', href: '/expense-claims', icon: Receipt, feature: 'employees', action: 'view' },
          { name: 'Promotions', href: '/promotions', icon: TrendingUp, feature: 'employees', action: 'view' },
          { name: 'Disciplinary', href: '/disciplinary', icon: AlertTriangle, feature: 'employees', action: 'view' },
          { name: 'Recruitment Approval', href: '/recruitment/approval', icon: UserPlus, feature: 'recruitment', action: 'view' },
          { name: 'Form Templates', href: '/form-templates', icon: FileSpreadsheet, feature: 'settings', action: 'view' },
          { name: 'Position Quotas', href: '/position-quotas', icon: Users, feature: 'employees', action: 'view' },
          { name: 'Engagement', href: '/engagement', icon: Heart, feature: 'employees', action: 'view' },
          { name: 'Operations', href: '/operations', icon: AlertCircle, feature: 'employees', action: 'view' },
        ]
      },
      {
        name: 'Budget',
        icon: DollarSign,
        items: [
          { name: 'Manpower Budget', href: '/manpower-budget', icon: FileSpreadsheet, feature: 'payroll', action: 'view' },
        ]
      },
      {
        name: 'Compliance & Reports',
        icon: Shield,
        items: [
          { name: 'Compliance', href: '/compliance', icon: Shield, feature: 'documents', action: 'view' },
          { name: 'HR Analytics', href: '/hr-analytics', icon: BarChart3, feature: 'reports', action: 'view' },
          { name: 'Reports', href: '/reports', icon: BarChart3, feature: 'reports', action: 'view' },
          { name: 'Leave Reports', href: '/leave-reports', icon: BarChart3, feature: 'reports', action: 'view' },
          { name: 'Leave Policy', href: '/leave-policy', icon: Settings, feature: 'settings', action: 'view' },
        ]
      },
      {
        name: 'Self Service',
        icon: UserCircle,
        items: [
          { name: 'My Self Service', href: '/self-service', icon: UserCircle, feature: 'leave', action: 'apply' },
          { name: 'Announcements', href: '/announcements', icon: Megaphone, feature: 'settings', action: 'view' },
        ]
      },
      {
        name: 'Administration',
        icon: Building2,
        items: [
          { name: 'Companies', href: '/companies', icon: Building2, feature: 'companies', action: 'view' },
          { name: 'User Management', href: '/users', icon: UserCog, feature: 'users', action: 'view' },
          { name: 'Audit Log', href: '/audit-log', icon: ClipboardList, feature: 'reports', action: 'view' },
        ]
      },
      {
        name: 'Utilities',
        icon: Settings,
        items: [
          { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount, feature: 'settings', action: 'view' },
          { name: 'Global Search', href: '/search', icon: Search, feature: 'employees', action: 'view' },
          { name: 'Settings', href: '/settings', icon: Settings, feature: 'settings', action: 'view' },
          { name: 'Help', href: '/help', icon: HelpCircle },
        ]
      },
    ];
  }, [unreadCount, isConstructionCompany, isExternalCompany]);

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavCategory = ({ category }) => {
    const isExpanded = expandedCategories.includes(category.name);
    
    // Filter items based on permissions
    const allowedItems = category.items.filter(item => {
      // Check feature permission if specified
      if (item.feature && item.action) {
        return hasAccess(item.feature, item.action);
      }
      // Legacy checks
      if (category.hrOnly) return hasAccess('employees', 'view');
      if (category.adminOnly) return isSuperAdmin();
      return true;
    });
    
    // Don't show category if no allowed items
    if (allowedItems.length === 0) return null;
    
    const hasActiveChild = allowedItems.some(item => isActive(item.href));
    
    return (
      <div className="mb-2">
        <button
          onClick={() => toggleCategory(category.name)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            hasActiveChild
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <category.icon className="h-5 w-5 flex-shrink-0" />
            <span>{category.name}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
            {allowedItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications - DISABLED due to performance issues with large notification volume
      <ToastContainer />
      */}
      
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigationCategories.map(category => (
              <NavCategory key={category.name} category={category} />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto mr-2" />
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigationCategories.map(category => (
              <NavCategory key={category.name} category={category} />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1" />
            <div className="ml-4 flex items-center gap-3">
              {/* Company Switcher */}
              <CompanySwitcher />
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="ml-3 text-gray-700 hidden md:block">{user?.displayName || user?.email}</span>
                  <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      <div>Signed in as <span className="font-medium">{userData?.role}</span></div>
                      {currentCompany && (
                        <div className="text-xs text-gray-400 mt-1">{currentCompany.name}</div>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    {isSuperAdmin() && (
                      <Link
                        to="/companies"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Manage Companies
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Modern Footer */}
        <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto opacity-90" />
                <div className="text-white/90 font-semibold">Hawaain HR Pro</div>
              </div>
              
              {/* Developer Credit */}
              <div className="text-center md:text-left">
                <p className="text-slate-400 text-sm">
                  Developed by <span className="text-cyan-400 font-medium">RettsWebDev</span>
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Since 2016 • Powered by <span className="text-emerald-400">Hawaain 4 Brothers</span>
                </p>
              </div>
              
              {/* Links */}
              <div className="flex items-center gap-4 text-sm">
                <Link to="/help" className="text-slate-400 hover:text-white transition-colors">
                  Help
                </Link>
                <Link to="/settings" className="text-slate-400 hover:text-white transition-colors">
                  Settings
                </Link>
                <span className="text-slate-600">|</span>
                <span className="text-slate-500 text-xs">v1.3.0</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
