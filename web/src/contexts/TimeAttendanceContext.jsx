import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const TimeAttendanceContext = React.createContext();

export function TimeAttendanceProvider({ children }) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [timeRecords, setTimeRecords] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to time records
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'timeAttendance'),
      where('companyId', '==', company.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        clockIn: doc.data().clockIn?.toDate(),
        clockOut: doc.data().clockOut?.toDate(),
      }));
      setTimeRecords(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to shifts
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'shifts'),
      where('companyId', '==', company.id),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shiftData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShifts(shiftData);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Clock in with GPS
  const clockIn = useCallback(async (employeeId, location = null, method = 'manual') => {
    if (!company?.id) throw new Error('No company selected');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already clocked in today
    const q = query(
      collection(db, 'timeAttendance'),
      where('employeeId', '==', employeeId),
      where('companyId', '==', company.id),
      where('date', '==', Timestamp.fromDate(today))
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      throw new Error('Already clocked in today');
    }

    const record = {
      employeeId,
      companyId: company.id,
      date: Timestamp.fromDate(today),
      clockIn: Timestamp.fromDate(now),
      clockInLocation: location,
      clockInMethod: method,
      status: 'present',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'timeAttendance'), record);
  }, [company?.id]);

  // Clock out
  const clockOut = useCallback(async (recordId, location = null, method = 'manual') => {
    const now = new Date();
    const recordRef = doc(db, 'timeAttendance', recordId);
    
    const update = {
      clockOut: Timestamp.fromDate(now),
      clockOutLocation: location,
      clockOutMethod: method,
      updatedAt: Timestamp.now()
    };

    // Calculate working hours
    const record = timeRecords.find(r => r.id === recordId);
    if (record?.clockIn) {
      const hours = (now - record.clockIn) / (1000 * 60 * 60);
      update.totalWorkingHours = parseFloat(hours.toFixed(2));
    }

    return await updateDoc(recordRef, update);
  }, [timeRecords]);

  // Request overtime
  const requestOvertime = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const overtime = {
      ...data,
      companyId: company.id,
      status: 'pending',
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'overtimeRequests'), overtime);
  }, [company?.id]);

  // Request shift swap
  const requestShiftSwap = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const swap = {
      ...data,
      companyId: company.id,
      status: 'pending',
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'shiftSwaps'), swap);
  }, [company?.id]);

  // Get employee attendance summary
  const getAttendanceSummary = useCallback((employeeId, startDate, endDate) => {
    const records = timeRecords.filter(r => 
      r.employeeId === employeeId &&
      r.date >= startDate &&
      r.date <= endDate
    );

    return {
      totalDays: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      totalHours: records.reduce((sum, r) => sum + (r.totalWorkingHours || 0), 0),
      overtimeHours: records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0)
    };
  }, [timeRecords]);

  const value = {
    timeRecords,
    shifts,
    overtimeRequests,
    shiftSwaps,
    loading,
    clockIn,
    clockOut,
    requestOvertime,
    requestShiftSwap,
    getAttendanceSummary
  };

  return (
    <TimeAttendanceContext.Provider value={value}>
      {children}
    </TimeAttendanceContext.Provider>
  );
}

export const useTimeAttendance = () => {
  const context = React.useContext(TimeAttendanceContext);
  if (!context) throw new Error('useTimeAttendance must be used within TimeAttendanceProvider');
  return context;
};

import React from 'react';
