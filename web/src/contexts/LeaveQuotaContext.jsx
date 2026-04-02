import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const LeaveQuotaContext = createContext();

export function useLeaveQuota() {
  return useContext(LeaveQuotaContext);
}

export function LeaveQuotaProvider({ children }) {
  const { userData } = useAuth();
  const [quotas, setQuotas] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default quota settings
  const defaultQuotas = {
    annual: 30,
    sick: 15,
    emergency: 7,
    unpaid: 365, // Unlimited
    compensatory: 0, // Earned
    study: 30,
    maternity: 90,
    paternity: 7,
    halfDay: 60, // Counts as 0.5 each
    hourly: 40, // 4-hour blocks
  };

  // Fetch employee leave balance
  const fetchLeaveBalance = useCallback(async (employeeId, year = new Date().getFullYear()) => {
    try {
      setLoading(true);
      const balanceRef = collection(db, 'leaveBalances');
      const q = query(
        balanceRef,
        where('employeeId', '==', employeeId),
        where('year', '==', year)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create default balance
        const newBalance = {
          employeeId,
          year,
          quotas: { ...defaultQuotas },
          used: {
            annual: 0,
            sick: 0,
            emergency: 0,
            unpaid: 0,
            compensatory: 0,
            study: 0,
            maternity: 0,
            paternity: 0,
            halfDay: 0,
            hourly: 0,
          },
          remaining: { ...defaultQuotas },
          accrued: {
            compensatory: 0,
          },
          updatedAt: Timestamp.now(),
        };
        const docRef = await addDoc(balanceRef, newBalance);
        return { id: docRef.id, ...newBalance };
      }

      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (err) {
      console.error('Error fetching leave balance:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update leave balance after approval
  const updateLeaveBalance = useCallback(async (employeeId, leaveType, days, operation = 'add') => {
    try {
      const year = new Date().getFullYear();
      const balance = await fetchLeaveBalance(employeeId, year);
      
      if (!balance) return false;

      const multiplier = operation === 'add' ? 1 : -1;
      const newUsed = { ...balance.used };
      const leaveTypeKey = leaveType.toLowerCase().replace('-', '');
      
      newUsed[leaveTypeKey] = (newUsed[leaveTypeKey] || 0) + (days * multiplier);
      
      // Calculate remaining
      const newRemaining = { ...balance.remaining };
      if (balance.quotas[leaveTypeKey]) {
        newRemaining[leaveTypeKey] = balance.quotas[leaveTypeKey] - newUsed[leaveTypeKey];
      }

      await updateDoc(doc(db, 'leaveBalances', balance.id), {
        used: newUsed,
        remaining: newRemaining,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (err) {
      console.error('Error updating leave balance:', err);
      setError(err.message);
      return false;
    }
  }, [fetchLeaveBalance]);

  // Check if employee has enough leave balance
  const checkLeaveAvailability = useCallback(async (employeeId, leaveType, requestedDays) => {
    try {
      const year = new Date().getFullYear();
      const balance = await fetchLeaveBalance(employeeId, year);
      
      if (!balance) return { available: false, reason: 'Balance not found' };

      const leaveTypeKey = leaveType.toLowerCase().replace('-', '');
      const remaining = balance.remaining[leaveTypeKey] || 0;

      if (leaveType === 'Unpaid') {
        return { available: true, remaining: Infinity };
      }

      if (remaining >= requestedDays) {
        return { available: true, remaining };
      } else {
        return { 
          available: false, 
          remaining, 
          requested: requestedDays,
          reason: `Insufficient ${leaveType} leave. Available: ${remaining}, Requested: ${requestedDays}`
        };
      }
    } catch (err) {
      console.error('Error checking leave availability:', err);
      return { available: false, reason: err.message };
    }
  }, [fetchLeaveBalance]);

  // Set custom quota for employee
  const setEmployeeQuota = useCallback(async (employeeId, customQuotas) => {
    try {
      const year = new Date().getFullYear();
      const balance = await fetchLeaveBalance(employeeId, year);
      
      if (!balance) return false;

      const newQuotas = { ...balance.quotas, ...customQuotas };
      const newRemaining = {};

      // Recalculate remaining
      Object.keys(newQuotas).forEach(type => {
        newRemaining[type] = newQuotas[type] - (balance.used[type] || 0);
      });

      await updateDoc(doc(db, 'leaveBalances', balance.id), {
        quotas: newQuotas,
        remaining: newRemaining,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (err) {
      console.error('Error setting employee quota:', err);
      setError(err.message);
      return false;
    }
  }, [fetchLeaveBalance]);

  // Get all employee balances (for HR)
  const getAllLeaveBalances = useCallback(async (year = new Date().getFullYear()) => {
    try {
      setLoading(true);
      const balanceRef = collection(db, 'leaveBalances');
      const q = query(balanceRef, where('year', '==', year));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching all balances:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    quotas,
    balances,
    loading,
    error,
    defaultQuotas,
    fetchLeaveBalance,
    updateLeaveBalance,
    checkLeaveAvailability,
    setEmployeeQuota,
    getAllLeaveBalances,
  };

  return (
    <LeaveQuotaContext.Provider value={value}>
      {children}
    </LeaveQuotaContext.Provider>
  );
}

export default LeaveQuotaContext;
