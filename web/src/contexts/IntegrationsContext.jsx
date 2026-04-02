import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const IntegrationsContext = React.createContext();

export function IntegrationsProvider({ children }) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [integrations, setIntegrations] = useState([]);
  const [calendarSyncs, setCalendarSyncs] = useState([]);
  const [slackSettings, setSlackSettings] = useState([]);
  const [jobBoardPostings, setJobBoardPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to integration configs
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'integrationConfigs'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSyncAt: doc.data().lastSyncAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setIntegrations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to calendar syncs
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'calendarSyncs'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSyncAt: doc.data().lastSyncAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setCalendarSyncs(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to Slack notifications
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'slackNotifications'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setSlackSettings(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to job board postings
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'jobBoardPostings'),
      where('companyId', '==', company.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedAt: doc.data().postedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setJobBoardPostings(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Configure integration
  const configureIntegration = useCallback(async (type, provider, settings) => {
    if (!company?.id) throw new Error('No company selected');

    // Check if already exists
    const existing = integrations.find(i => i.type === type && i.provider === provider);
    
    if (existing) {
      // Update existing
      const ref = doc(db, 'integrationConfigs', existing.id);
      await updateDoc(ref, {
        settings,
        isEnabled: true,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new
      const config = {
        companyId: company.id,
        type,
        provider,
        isEnabled: true,
        settings,
        credentials: {
          encrypted: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null
        },
        syncStatus: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      return await addDoc(collection(db, 'integrationConfigs'), config);
    }
  }, [company?.id, integrations]);

  // Setup calendar sync
  const setupCalendarSync = useCallback(async (employeeId, provider, settings) => {
    if (!company?.id) throw new Error('No company selected');

    const sync = {
      employeeId,
      companyId: company.id,
      provider, // google, microsoft
      externalCalendarId: settings.calendarId,
      syncDirection: settings.syncDirection || 'one_way',
      syncEvents: settings.syncEvents || ['leave', 'meetings', 'shifts'],
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'calendarSyncs'), sync);
  }, [company?.id]);

  // Configure Slack notification
  const configureSlackNotification = useCallback(async (channel, eventType, template, isEnabled = true) => {
    if (!company?.id) throw new Error('No company selected');

    const existing = slackSettings.find(s => s.channel === channel && s.eventType === eventType);
    
    if (existing) {
      const ref = doc(db, 'slackNotifications', existing.id);
      await updateDoc(ref, {
        messageTemplate: template,
        isEnabled,
        updatedAt: Timestamp.now()
      });
    } else {
      const setting = {
        companyId: company.id,
        channel,
        eventType,
        messageTemplate: template,
        isEnabled,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      return await addDoc(collection(db, 'slackNotifications'), setting);
    }
  }, [company?.id, slackSettings]);

  // Post job to external board
  const postToJobBoard = useCallback(async (requisitionId, jobBoard, postingData) => {
    if (!company?.id) throw new Error('No company selected');

    // In real implementation, this would call the job board API
    // For now, we just store the posting record
    const posting = {
      companyId: company.id,
      requisitionId,
      jobBoard,
      externalJobId: null, // Would be returned by API
      postingUrl: null,
      status: 'draft',
      postedAt: null,
      expiresAt: postingData.expiresAt ? Timestamp.fromDate(postingData.expiresAt) : null,
      applicantsCount: 0,
      cost: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'jobBoardPostings'), posting);
  }, [company?.id]);

  // Sync with external calendar (mock implementation)
  const syncCalendar = useCallback(async (syncId) => {
    const syncRef = doc(db, 'calendarSyncs', syncId);
    await updateDoc(syncRef, {
      lastSyncAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // In real implementation, this would sync events with Google/Microsoft APIs
    return { success: true, syncedEvents: 0 };
  }, []);

  // Get integration by type
  const getIntegration = useCallback((type, provider) => {
    return integrations.find(i => i.type === type && i.provider === provider);
  }, [integrations]);

  const value = {
    integrations,
    calendarSyncs,
    slackSettings,
    jobBoardPostings,
    loading,
    configureIntegration,
    setupCalendarSync,
    configureSlackNotification,
    postToJobBoard,
    syncCalendar,
    getIntegration
  };

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export const useIntegrations = () => {
  const context = React.useContext(IntegrationsContext);
  if (!context) throw new Error('useIntegrations must be used within IntegrationsProvider');
  return context;
};

import React from 'react';
