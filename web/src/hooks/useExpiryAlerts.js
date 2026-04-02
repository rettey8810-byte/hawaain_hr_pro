import { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

export function useExpiryAlerts(documents) {
  const [alerts, setAlerts] = useState({
    expired: [],
    expiring30: [],
    expiring60: [],
    expiring90: []
  });

  useEffect(() => {
    if (!documents) return;

    const today = new Date();
    const newAlerts = {
      expired: [],
      expiring30: [],
      expiring60: [],
      expiring90: []
    };

    documents.forEach(doc => {
      if (!doc.expiryDate) return;
      
      const expiryDate = parseISO(doc.expiryDate);
      const daysRemaining = differenceInDays(expiryDate, today);

      const alertData = {
        ...doc,
        daysRemaining,
        expiryDate
      };

      if (daysRemaining <= 0) {
        newAlerts.expired.push(alertData);
      } else if (daysRemaining <= 30) {
        newAlerts.expiring30.push(alertData);
      } else if (daysRemaining <= 60) {
        newAlerts.expiring60.push(alertData);
      } else if (daysRemaining <= 90) {
        newAlerts.expiring90.push(alertData);
      }
    });

    setAlerts(newAlerts);
  }, [documents]);

  const getTotalExpiring = () => {
    return alerts.expired.length + alerts.expiring30.length + 
           alerts.expiring60.length + alerts.expiring90.length;
  };

  return { alerts, getTotalExpiring };
}
