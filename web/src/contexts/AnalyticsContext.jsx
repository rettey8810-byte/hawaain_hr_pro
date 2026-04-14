import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const AnalyticsContext = React.createContext();

export function AnalyticsProvider({ children }) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [reports, setReports] = useState([]);
  const [retentionScores, setRetentionScores] = useState([]);
  const [diversityMetrics, setDiversityMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to saved reports
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'analyticsReports'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to retention risk scores
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'retentionRiskScores'),
      where('companyId', '==', company.id),
      orderBy('calculatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        calculatedAt: doc.data().calculatedAt?.toDate(),
        predictedDepartureDate: doc.data().predictedDepartureDate?.toDate()
      }));
      setRetentionScores(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to diversity metrics
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'diversityMetrics'),
      where('companyId', '==', company.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }));
      setDiversityMetrics(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Calculate retention risk score for employee
  const calculateRetentionRisk = useCallback(async (employeeId, employees, attendance, recognitions) => {
    if (!company?.id) return null;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    let score = 0;
    const factors = [];

    // Factor 1: Absence rate
    const recentAttendance = attendance.filter(a => 
      a.employeeId === employeeId &&
      a.date >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    const absenceRate = recentAttendance.filter(a => a.status === 'absent').length / recentAttendance.length;
    if (absenceRate > 0.2) {
      score += 25;
      factors.push({ factor: 'High absence rate', weight: 25, value: absenceRate });
    }

    // Factor 2: No recognition in last 6 months
    const recentRecognitions = recognitions.filter(r => 
      r.recipientId === employeeId &&
      r.createdAt >= new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    );
    if (recentRecognitions.length === 0) {
      score += 20;
      factors.push({ factor: 'No recent recognition', weight: 20, value: 0 });
    }

    // Factor 3: Tenure (new employees more likely to leave)
    const tenureMonths = employee.joinDate 
      ? (Date.now() - employee.joinDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      : 0;
    if (tenureMonths < 6) {
      score += 15;
      factors.push({ factor: 'New employee (< 6 months)', weight: 15, value: tenureMonths });
    }

    // Factor 4: No salary increase in 2+ years
    if (employee.lastSalaryIncrease) {
      const monthsSinceIncrease = (Date.now() - employee.lastSalaryIncrease.getTime()) / (30 * 24 * 60 * 60 * 1000);
      if (monthsSinceIncrease > 24) {
        score += 20;
        factors.push({ factor: 'No salary increase > 2 years', weight: 20, value: monthsSinceIncrease });
      }
    }

    // Determine risk level
    let riskLevel = 'low';
    if (score >= 70) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'medium';

    // Generate recommendations
    const recommendations = [];
    if (absenceRate > 0.2) recommendations.push('Schedule 1-on-1 to discuss attendance');
    if (recentRecognitions.length === 0) recommendations.push('Recognize recent achievements');
    if (tenureMonths < 6) recommendations.push('Schedule check-in for new employee');
    if (factors.find(f => f.factor.includes('salary'))) recommendations.push('Review compensation');

    const scoreData = {
      employeeId,
      companyId: company.id,
      score,
      riskLevel,
      factors,
      recommendedActions: recommendations,
      calculatedAt: Timestamp.now(),
      modelVersion: 'v1.0',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await addDoc(collection(db, 'retentionRiskScores'), scoreData);
    return scoreData;
  }, [company?.id]);

  // Save custom report
  const saveReport = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const report = {
      ...data,
      companyId: company.id,
      createdBy: user?.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'analyticsReports'), report);
  }, [company?.id, user?.uid]);

  // Calculate diversity metrics
  const calculateDiversityMetrics = useCallback(async (employees) => {
    if (!company?.id) return null;

    const metrics = {
      companyId: company.id,
      date: Timestamp.now(),
      metrics: {
        gender: { male: 0, female: 0, nonBinary: 0, preferNotToSay: 0 },
        ageGroups: { under25: 0, '25to34': 0, '35to44': 0, '45to54': 0, '55plus': 0 },
        ethnicity: {},
        disability: { yes: 0, no: 0 }
      }
    };

    employees.forEach(emp => {
      // Gender
      if (emp.gender) {
        metrics.metrics.gender[emp.gender] = (metrics.metrics.gender[emp.gender] || 0) + 1;
      }

      // Age groups
      if (emp.dateOfBirth) {
        const age = new Date().getFullYear() - emp.dateOfBirth.getFullYear();
        if (age < 25) metrics.metrics.ageGroups.under25++;
        else if (age < 35) metrics.metrics.ageGroups['25to34']++;
        else if (age < 45) metrics.metrics.ageGroups['35to44']++;
        else if (age < 55) metrics.metrics.ageGroups['45to54']++;
        else metrics.metrics.ageGroups['55plus']++;
      }

      // Ethnicity
      if (emp.ethnicity) {
        metrics.metrics.ethnicity[emp.ethnicity] = (metrics.metrics.ethnicity[emp.ethnicity] || 0) + 1;
      }

      // Disability
      if (emp.hasDisability !== undefined) {
        metrics.metrics.disability[emp.hasDisability ? 'yes' : 'no']++;
      }
    });

    await addDoc(collection(db, 'diversityMetrics'), metrics);
    return metrics;
  }, [company?.id]);

  // Get employees by risk level
  const getEmployeesByRisk = useCallback((level) => {
    return retentionScores.filter(s => s.riskLevel === level);
  }, [retentionScores]);

  const value = {
    reports,
    retentionScores,
    diversityMetrics,
    loading,
    calculateRetentionRisk,
    saveReport,
    calculateDiversityMetrics,
    getEmployeesByRisk
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = React.useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};
