import { useEffect, useState, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const Toast = ({ id, type, title, message, onClose }) => {
  const [progress, setProgress] = useState(100);
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  
  const Icon = icons[type] || Info;
  const colorClass = colors[type] || colors.info;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          onClose(id);
          return 0;
        }
        return prev - 2;
      });
    }, 100);

    const autoClose = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoClose);
    };
  }, [id, onClose]);

  return (
    <div className="relative overflow-hidden rounded-lg shadow-lg bg-white border-l-4 border-l-transparent min-w-[320px] max-w-[400px]">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />
      <div className="p-4 flex items-start gap-3">
        <div className={`${colorClass} bg-opacity-10 p-2 rounded-full`}>
          <Icon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <p className="text-gray-500 text-sm mt-1">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full ${colorClass} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const { notifications, markAsRead } = useNotifications();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const toastIdCounter = useRef(0);

  const generateUniqueId = () => {
    toastIdCounter.current += 1;
    return `${Date.now()}-${toastIdCounter.current}`;
  };

  useEffect(() => {
    // Check for new notifications
    if (notifications.length > lastNotificationCount) {
      const newNotifications = notifications.slice(0, notifications.length - lastNotificationCount);
      
      newNotifications.forEach(notification => {
        if (!notification.read && !notification.toastShown) {
          addToast({
            type: notification.type || 'info',
            title: notification.title || 'New Notification',
            message: notification.message,
            notificationId: notification.id
          });
        }
      });
    }
    setLastNotificationCount(notifications.length);
  }, [notifications, lastNotificationCount]);

  const addToast = (toast) => {
    const id = generateUniqueId();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
