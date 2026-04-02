import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const ComplianceContext = React.createContext();

export function ComplianceProvider({ children }) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [auditLogs, setAuditLogs] = useState([]);
  const [gdprRequests, setGdprRequests] = useState([]);
  const [documentTemplates, setDocumentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to audit logs (last 30 days)
  useEffect(() => {
    if (!company?.id) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, 'auditLogs'),
      where('companyId', '==', company.id),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setAuditLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to GDPR requests
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'gdprRequests'),
      where('companyId', '==', company.id),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        deadline: doc.data().deadline?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      }));
      setGdprRequests(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to document templates
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'documentTemplates'),
      where('companyId', '==', company.id),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setDocumentTemplates(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Log audit event
  const logAuditEvent = useCallback(async (action, resourceType, resourceId, details = {}) => {
    if (!company?.id) return;

    const logEntry = {
      companyId: company.id,
      userId: user?.uid,
      userEmail: user?.email,
      userRole: user?.role,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: null, // Would need server-side or cloud function
      userAgent: navigator.userAgent,
      timestamp: Timestamp.now()
    };

    // Use a batched write for better performance
    try {
      await addDoc(collection(db, 'auditLogs'), logEntry);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, [company?.id, user]);

  // Create GDPR request
  const createGDPRRequest = useCallback(async (employeeId, type, description) => {
    if (!company?.id) throw new Error('No company selected');

    // Calculate deadline (30 days from now as per GDPR)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const request = {
      employeeId,
      companyId: company.id,
      type, // access, rectification, erasure, portability, restriction
      description,
      status: 'pending',
      requestedAt: Timestamp.now(),
      deadline: Timestamp.fromDate(deadline),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'gdprRequests'), request);
  }, [company?.id]);

  // Process GDPR request
  const processGDPRRequest = useCallback(async (requestId, response, handledBy) => {
    const requestRef = doc(db, 'gdprRequests', requestId);
    await updateDoc(requestRef, {
      status: 'completed',
      response,
      handledBy,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }, []);

  // Create document template
  const createDocumentTemplate = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const template = {
      ...data,
      companyId: company.id,
      createdBy: user?.uid,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'documentTemplates'), template);
  }, [company?.id, user?.uid]);

  // Generate document from template
  const generateDocument = useCallback((templateId, placeholders) => {
    const template = documentTemplates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    let content = template.content;
    Object.entries(placeholders).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return {
      content,
      templateId,
      generatedAt: new Date(),
      placeholders
    };
  }, [documentTemplates]);

  // Get audit trail for specific resource
  const getResourceAuditTrail = useCallback((resourceType, resourceId) => {
    return auditLogs.filter(
      log => log.resourceType === resourceType && log.resourceId === resourceId
    );
  }, [auditLogs]);

  const value = {
    auditLogs,
    gdprRequests,
    documentTemplates,
    loading,
    logAuditEvent,
    createGDPRRequest,
    processGDPRRequest,
    createDocumentTemplate,
    generateDocument,
    getResourceAuditTrail
  };

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
}

export const useCompliance = () => {
  const context = React.useContext(ComplianceContext);
  if (!context) throw new Error('useCompliance must be used within ComplianceProvider');
  return context;
};

import React from 'react';
