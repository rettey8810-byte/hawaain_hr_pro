import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  limit,
  startAfter,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useCompany } from '../contexts/CompanyContext';

export function useFirestore(collectionName, customConstraints = []) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { companyId } = useCompany();

  // Auto-fetch data on mount
  useEffect(() => {
    console.log(`[useFirestore:${collectionName}] companyId:`, companyId);
    if (!companyId) {
      console.warn(`[useFirestore:${collectionName}] No companyId - returning empty`);
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Build query with company constraint and any custom constraints (department, etc.)
    const constraints = [where('companyId', '==', companyId), ...customConstraints];
    const q = query(collection(db, collectionName), ...constraints);

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`[useFirestore:${collectionName}] Fetched ${docs.length} docs for companyId: ${companyId}`);
      if (docs.length > 0) {
        console.log(`[useFirestore:${collectionName}] First doc companyId:`, docs[0]?.companyId);
      }
      
      // Data isolation: Only return documents matching the companyId
      // No fallback to prevent cross-company data leakage
      setDocuments(docs);
      setLoading(false);
    }, (err) => {
      console.error(`Firestore error in ${collectionName}:`, err);
      // Check for quota exceeded error
      if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
        setError('Firebase quota exceeded. Please try again later or upgrade your plan.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName, companyId, JSON.stringify(customConstraints)]);

  const addDocument = async (data) => {
    if (!companyId) throw new Error('No company selected');
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        companyId, // Automatically add companyId for isolation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...data };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id, data) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { id, ...data };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const uploadFile = async (file, path) => {
    try {
      const storageRef = ref(storage, `${companyId}/${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Query with automatic company filtering
  const getDocumentsByQuery = useCallback((queryConstraints = []) => {
    setLoading(true);
    if (!companyId) {
      setDocuments([]);
      setLoading(false);
      return () => {};
    }
    // Always filter by companyId for multi-tenancy
    const companyConstraint = where('companyId', '==', companyId);
    let q = query(collection(db, collectionName), companyConstraint, ...queryConstraints);
    
    return onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [collectionName, companyId]);

  const getAllDocuments = useCallback(() => {
    if (!companyId) return () => {};
    return getDocumentsByQuery([]);
  }, [getDocumentsByQuery, companyId]);

  const getDocumentsByEmployee = useCallback((employeeId) => {
    if (!companyId) return () => {};
    return getDocumentsByQuery([where('employeeId', '==', employeeId)]);
  }, [getDocumentsByQuery, companyId]);

  // Paginated query for large collections
  const getDocumentsPaginated = useCallback((pageSize = 50, lastDoc = null) => {
    setLoading(true);
    if (!companyId) {
      setDocuments([]);
      setLoading(false);
      return () => {};
    }
    
    const companyConstraint = where('companyId', '==', companyId);
    let constraints = [companyConstraint, limit(pageSize)];
    
    // If we have a last document, start after it
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    let q = query(collection(db, collectionName), ...constraints);
    
    return onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [collectionName, companyId]);

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    uploadFile,
    getAllDocuments,
    getDocumentsByQuery,
    getDocumentsByEmployee,
    getDocumentsPaginated
  };
}

// Hook for fetching data without company filtering (for superadmin)
export function useFirestoreAdmin(collectionName) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAllDocumentsUnfiltered = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, collectionName));
    
    return onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [collectionName]);

  return {
    documents,
    loading,
    error,
    getAllDocumentsUnfiltered
  };
}
