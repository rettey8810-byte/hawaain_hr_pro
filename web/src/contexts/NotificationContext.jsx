import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { user, userData } = useAuth();
  const { companyId } = useCompany();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !companyId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe = null;

    // Try query with orderBy first
    const tryOrderedQuery = () => {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
        setLoading(false);
      }, (error) => {
        // If index error, fall back to simple query
        if (error.code === 'failed-precondition') {
          console.log('Index building, using fallback query...');
          trySimpleQuery();
        } else {
          console.error('Error fetching notifications:', error);
          setLoading(false);
        }
      });
    };

    // Fallback: simple query without orderBy
    const trySimpleQuery = () => {
      const simpleQuery = query(
        collection(db, 'notifications'),
        where('companyId', '==', companyId)
      );

      unsubscribe = onSnapshot(simpleQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort client-side
        notificationsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      });
    };

    unsubscribe = tryOrderedQuery();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, companyId]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          updateDoc(doc(db, 'notifications', n.id), {
            read: true,
            readAt: new Date().toISOString()
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
