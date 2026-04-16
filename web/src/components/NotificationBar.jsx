import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, AlertCircle, CheckCircle, Clock, FileText, UserPlus, Plane, DollarSign, AlertTriangle } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export default function NotificationBar() {
  const { userData } = useAuth();
  const { companyId } = useCompany();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  // Fetch all pending approvals
  const { documents: recruitments } = useFirestore('recruitmentApprovals');
  const { documents: leaves } = useFirestore('leaves');
  const { documents: expenses } = useFirestore('expenseClaims');
  const { documents: disciplinary } = useFirestore('disciplinaryActions');

  const userRole = userData?.role;
  const userDept = userData?.department;
  const isAdmin = userRole === 'superadmin' || userRole === 'gm' || userRole === 'hrm' || userRole === 'hr';
  const isHOD = userRole === 'dept_head';

  // Filter pending items based on user role
  const pendingItems = useMemo(() => {
    const items = [];

    // Recruitment approvals pending HOD review
    recruitments?.forEach(req => {
      if (req.status === 'pending_hod' || req.status === 'pending') {
        // Show to HOD of that department or to GM/HRM
        if (isAdmin || (isHOD && req.department === userDept)) {
          items.push({
            id: `rec-${req.id}`,
            type: 'recruitment',
            title: 'Recruitment Approval Pending',
            description: `${req.position} in ${req.department}`,
            status: req.status,
            date: req.raisedAt,
            link: '/recruitment-approval',
            icon: UserPlus,
            color: 'blue'
          });
        }
      }
    });

    // Leave requests pending approval
    leaves?.forEach(leave => {
      if (leave.status === 'pending' || leave.status === 'pending_approval') {
        // Check if user can approve (HOD for their dept, or HR/GM)
        if (isAdmin || (isHOD && leave.department === userDept)) {
          items.push({
            id: `leave-${leave.id}`,
            type: 'leave',
            title: 'Leave Request Pending',
            description: `${leave.employeeName || 'Employee'} - ${leave.leaveType}`,
            status: leave.status,
            date: leave.createdAt,
            link: '/leave-management',
            icon: Plane,
            color: 'green'
          });
        }
      }
    });

    // Expense claims pending approval
    expenses?.forEach(expense => {
      if (expense.status === 'pending' || expense.status === 'submitted') {
        if (isAdmin || (isHOD && expense.department === userDept)) {
          items.push({
            id: `exp-${expense.id}`,
            type: 'expense',
            title: 'Expense Claim Pending',
            description: `${expense.employeeName || 'Employee'} - ${expense.category}`,
            status: expense.status,
            date: expense.submittedAt || expense.createdAt,
            link: '/expense-claims',
            icon: DollarSign,
            color: 'orange'
          });
        }
      }
    });

    // Disciplinary actions pending
    disciplinary?.forEach(action => {
      if (action.status === 'pending' || action.status === 'pending_approval') {
        if (isAdmin || (isHOD && action.department === userDept)) {
          items.push({
            id: `disc-${action.id}`,
            type: 'disciplinary',
            title: 'Disciplinary Action Pending',
            description: `${action.employeeName || 'Employee'} - ${action.actionType}`,
            status: action.status,
            date: action.createdAt,
            link: '/disciplinary',
            icon: AlertTriangle,
            color: 'red'
          });
        }
      }
    });

    // Sort by date (newest first)
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [recruitments, leaves, expenses, disciplinary, isAdmin, isHOD, userDept]);

  // Filter out dismissed items
  const visibleItems = pendingItems.filter(item => !dismissed.has(item.id));
  const hasNotifications = visibleItems.length > 0;

  // Auto-expand if there are new notifications
  useEffect(() => {
    if (hasNotifications && visibleItems.length > 0) {
      const hasNewItems = visibleItems.some(item => {
        const itemDate = new Date(item.date);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return itemDate > fiveMinutesAgo;
      });
      if (hasNewItems) {
        setIsExpanded(true);
      }
    }
  }, [visibleItems, hasNotifications]);

  const dismissNotification = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissed(new Set(visibleItems.map(item => item.id)));
    setIsExpanded(false);
  };

  // Debug logging
  console.log('[NotificationBar] Pending items:', pendingItems.length, 'Visible:', visibleItems.length);
  console.log('[NotificationBar] User role:', userRole, 'isAdmin:', isAdmin, 'isHOD:', isHOD, 'Dept:', userDept);

  if (!hasNotifications) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      {/* Collapsed Bar */}
      <div 
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-amber-600" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {visibleItems.length}
            </span>
          </div>
          <span className="text-sm font-medium text-amber-800">
            {visibleItems.length} pending approval{visibleItems.length > 1 ? 's' : ''} requiring your attention
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              dismissAll();
            }}
            className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-200/50"
          >
            Dismiss all
          </button>
          {isExpanded ? (
            <X className="h-4 w-4 text-amber-600" />
          ) : (
            <span className="text-xs text-amber-600">Click to view</span>
          )}
        </div>
      </div>

      {/* Expanded List */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-800',
              green: 'bg-green-50 border-green-200 text-green-800',
              orange: 'bg-orange-50 border-orange-200 text-orange-800',
              red: 'bg-red-50 border-red-200 text-red-800'
            }[item.color];

            return (
              <div 
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${colorClasses}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={item.link}
                    className="block hover:underline"
                    onClick={() => setIsExpanded(false)}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs opacity-80 truncate">{item.description}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(item.date).toLocaleDateString()} • {item.status}
                    </p>
                  </Link>
                </div>
                <button
                  onClick={() => dismissNotification(item.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-black/5"
                >
                  <X className="h-4 w-4 opacity-60 hover:opacity-100" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
