import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

const EngagementContext = React.createContext();

export function EngagementProvider({ children }) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [surveys, setSurveys] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to surveys
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'surveys'),
      where('companyId', '==', company.id),
      where('status', 'in', ['active', 'closed'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startsAt: doc.data().startsAt?.toDate(),
        endsAt: doc.data().endsAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setSurveys(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to recognitions
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'recognitions'),
      where('companyId', '==', company.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setRecognitions(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Subscribe to suggestions
  useEffect(() => {
    if (!company?.id) return;

    const q = query(
      collection(db, 'suggestions'),
      where('companyId', '==', company.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setSuggestions(data);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Create survey
  const createSurvey = useCallback(async (data) => {
    if (!company?.id) throw new Error('No company selected');

    const survey = {
      ...data,
      companyId: company.id,
      createdBy: user?.uid,
      status: 'draft',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'surveys'), survey);
  }, [company?.id, user?.uid]);

  // Submit survey response
  const submitSurveyResponse = useCallback(async (surveyId, responses, isAnonymous = true) => {
    if (!company?.id) throw new Error('No company selected');

    const response = {
      surveyId,
      employeeId: isAnonymous ? null : user?.uid,
      companyId: company.id,
      responses,
      isAnonymous,
      submittedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'surveyResponses'), response);
  }, [company?.id, user?.uid]);

  // Send recognition (kudos)
  const sendRecognition = useCallback(async (recipientId, category, message, points = 0) => {
    if (!company?.id) throw new Error('No company selected');

    const recognition = {
      companyId: company.id,
      recipientId,
      senderId: user?.uid,
      category,
      message,
      points,
      isPublic: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'recognitions'), recognition);
  }, [company?.id, user?.uid]);

  // Submit suggestion
  const submitSuggestion = useCallback(async (title, description, category, isAnonymous = false) => {
    if (!company?.id) throw new Error('No company selected');

    const suggestion = {
      companyId: company.id,
      employeeId: isAnonymous ? null : user?.uid,
      title,
      description,
      category,
      isAnonymous,
      status: 'submitted',
      votes: 0,
      votedBy: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return await addDoc(collection(db, 'suggestions'), suggestion);
  }, [company?.id, user?.uid]);

  // Vote on suggestion
  const voteSuggestion = useCallback(async (suggestionId) => {
    const suggestionRef = doc(db, 'suggestions', suggestionId);
    await updateDoc(suggestionRef, {
      votes: increment(1),
      votedBy: arrayUnion(user?.uid),
      updatedAt: Timestamp.now()
    });
  }, [user?.uid]);

  // Get employee recognitions
  const getEmployeeRecognitions = useCallback((employeeId) => {
    return recognitions.filter(r => r.recipientId === employeeId);
  }, [recognitions]);

  // Get employee points
  const getEmployeePoints = useCallback((employeeId) => {
    return recognitions
      .filter(r => r.recipientId === employeeId)
      .reduce((sum, r) => sum + (r.points || 0), 0);
  }, [recognitions]);

  const value = {
    surveys,
    recognitions,
    suggestions,
    loading,
    createSurvey,
    submitSurveyResponse,
    sendRecognition,
    submitSuggestion,
    voteSuggestion,
    getEmployeeRecognitions,
    getEmployeePoints
  };

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
}

export const useEngagement = () => {
  const context = React.useContext(EngagementContext);
  if (!context) throw new Error('useEngagement must be used within EngagementProvider');
  return context;
};
