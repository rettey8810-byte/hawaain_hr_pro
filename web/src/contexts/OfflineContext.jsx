import { createContext, useContext, useState, useEffect } from 'react';

const OfflineContext = createContext();

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSubmissions, setPendingSubmissions] = useState(() => {
    const saved = localStorage.getItem('pendingSubmissions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save pending submissions to localStorage
  useEffect(() => {
    localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
  }, [pendingSubmissions]);

  const saveDraft = (key, data) => {
    localStorage.setItem(`draft_${key}`, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  };

  const getDraft = (key) => {
    const saved = localStorage.getItem(`draft_${key}`);
    if (saved) {
      const { data, timestamp } = JSON.parse(saved);
      return { data, timestamp };
    }
    return null;
  };

  const clearDraft = (key) => {
    localStorage.removeItem(`draft_${key}`);
  };

  const addPendingSubmission = (type, data) => {
    const submission = {
      id: `${type}_${Date.now()}`,
      type,
      data,
      createdAt: new Date().toISOString(),
      attempts: 0
    };
    setPendingSubmissions(prev => [...prev, submission]);
    return submission.id;
  };

  const removePendingSubmission = (id) => {
    setPendingSubmissions(prev => prev.filter(s => s.id !== id));
  };

  const updatePendingSubmission = (id, updates) => {
    setPendingSubmissions(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const getAllDrafts = () => {
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('draft_')) {
        const saved = localStorage.getItem(key);
        if (saved) {
          drafts.push({
            key: key.replace('draft_', ''),
            ...JSON.parse(saved)
          });
        }
      }
    }
    return drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const clearAllDrafts = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('draft_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const value = {
    isOnline,
    pendingSubmissions,
    saveDraft,
    getDraft,
    clearDraft,
    addPendingSubmission,
    removePendingSubmission,
    updatePendingSubmission,
    getAllDrafts,
    clearAllDrafts
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}
