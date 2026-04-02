import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const BenefitsContext = React.createContext();

export function BenefitsProvider({ children }) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [benefits, setBenefits] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [salaryAdvances, setSalaryAdvances] = useState([]);
  const [payrollCountries, setPayrollCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to benefits
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'benefits'),
      where('companyId', '==', company.id),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBenefits(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to enrollments
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'benefitEnrollments'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        enrolledAt: doc.data().enrolledAt?.toDate(),
        effectiveFrom: doc.data().effectiveFrom?.toDate(),
        effectiveTo: doc.data().effectiveTo?.toDate()
      }));
      setEnrollments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to salary advances
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'salaryAdvances'),
      where('companyId', '==', company.id),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate()
      }));
      setSalaryAdvances(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Create benefit
  const createBenefit = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const benefit = {
      ...data,
      companyId: company.id,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'benefits'), benefit);
  }, [company?.id]);

  // Enroll employee in benefit
  const enrollInBenefit = useCallback(async (employeeId, benefitId, data) => {
    if (!company?.id) throw new Error('No company selected');

    const enrollment = {
      employeeId,
      benefitId,
      companyId: company.id,
      status: 'active',
      enrolledAt: Timestamp.now(),
      effectiveFrom: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...data
    };

    return await addDoc(collection(db, 'benefitEnrollments'), enrollment);
  }, [company?.id]);

  // Request salary advance
  const requestSalaryAdvance = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const advance = {
      ...data,
      companyId: company.id,
      status: 'pending',
      totalRepaid: 0,
      remainingBalance: data.amount,
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'salaryAdvances'), advance);
  }, [company?.id]);

  // Approve salary advance
  const approveSalaryAdvance = useCallback(async (advanceId, approvedBy) => {
    const advanceRef = doc(db, 'salaryAdvances', advanceId);
    await updateDoc(advanceRef, {
      status: 'approved',
      approvedBy,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }, []);

  // Get employee benefits summary
  const getEmployeeBenefits = useCallback((employeeId) => {
    return enrollments.filter(e => e.employeeId === employeeId && e.status === 'active');
  }, [enrollments]);

  // Get employee advances
  const getEmployeeAdvances = useCallback((employeeId) => {
    return salaryAdvances.filter(a => a.employeeId === employeeId);
  }, [salaryAdvances]);

  const value = {
    benefits,
    enrollments,
    salaryAdvances,
    payrollCountries,
    loading,
    createBenefit,
    enrollInBenefit,
    requestSalaryAdvance,
    approveSalaryAdvance,
    getEmployeeBenefits,
    getEmployeeAdvances
  };

  return (
    <BenefitsContext.Provider value={value}>
      {children}
    </BenefitsContext.Provider>
  );
}

export const useBenefits = () => {
  const context = React.useContext(BenefitsContext);
  if (!context) throw new Error('useBenefits must be used within BenefitsProvider');
  return context;
};

import React from 'react';
import { orderBy } from 'firebase/firestore';
