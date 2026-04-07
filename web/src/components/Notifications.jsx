import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCheck, AlertTriangle, Clock, FileText, Briefcase, Plane, HeartPulse, Trash2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useFirestore } from '../hooks/useFirestore';
import { formatDate, calculateDaysRemaining } from '../utils/helpers';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { documents: employees } = useFirestore('employees');
  const { documents: passports } = useFirestore('passports');
  const { documents: visas } = useFirestore('visas');
  const { documents: workPermits } = useFirestore('workPermits');
  const { documents: medicals } = useFirestore('medicals');
  
  const [filter, setFilter] = useState('all');

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp?.name || 'Unknown';
  };

  const getEmployeeId = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp?.EmpID || emp?.employeeId || 'N/A';
  };

  const getDocumentIcon = (type) => {
    switch(type) {
      case 'passport': return FileText;
      case 'visa': return Plane;
      case 'work-permit': return Briefcase;
      case 'medical': return HeartPulse;
      default: return FileText;
    }
  };

  const getAllExpiringDocuments = () => {
    const allDocs = [
      ...passports.map(p => ({ ...p, type: 'passport' })),
      ...visas.map(v => ({ ...v, type: 'visa' })),
      ...workPermits.map(w => ({ ...w, type: 'work-permit' })),
      ...medicals.map(m => ({ ...m, type: 'medical' }))
    ].filter(doc => {
      const days = calculateDaysRemaining(doc.expiryDate);
      return days !== null && days <= 90;
    }).sort((a, b) => {
      const daysA = calculateDaysRemaining(a.expiryDate);
      const daysB = calculateDaysRemaining(b.expiryDate);
      return daysA - daysB;
    });
    
    return allDocs;
  };

  const expiringDocs = getAllExpiringDocuments();

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'expiring') return n.type?.includes('expir');
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="expiring">Expiring</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Documents Expiring Soon
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Emp ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doc Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expiringDocs.slice(0, 10).map((doc) => {
                    const daysRemaining = calculateDaysRemaining(doc.expiryDate);
                    const Icon = getDocumentIcon(doc.type);
                    
                    return (
                      <tr key={`${doc.type}-${doc.id}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 capitalize">{doc.type.replace('-', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {getEmployeeName(doc.employeeId)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                          {getEmployeeId(doc.employeeId)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {doc.passportNumber || doc.visaNumber || doc.permitNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(doc.expiryDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={daysRemaining <= 30 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            daysRemaining <= 0 ? 'bg-red-100 text-red-800' :
                            daysRemaining <= 30 ? 'bg-orange-100 text-orange-800' :
                            daysRemaining <= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {daysRemaining <= 0 ? 'Expired' :
                             daysRemaining <= 30 ? 'Critical' :
                             daysRemaining <= 60 ? 'Warning' : 'Notice'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            System Notifications
          </h3>
          
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications to display
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start p-4 rounded-lg border ${
                    notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {notification.type === 'expired' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : notification.type?.includes('expiring') ? (
                      <Clock className="h-5 w-5 text-orange-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.createdAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                    {notification.documentType && (
                      <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {notification.documentType}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
