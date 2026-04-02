import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../contexts/CompanyContext';

// Hook for fetching employees with pagination (one-time fetch, not real-time)
export function useEmployeesPaginated(pageSize = 50) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const { companyId } = useCompany();

  const loadMore = async () => {
    if (!companyId || !hasMore) return;
    
    setLoading(true);
    try {
      let q;
      if (lastDoc) {
        q = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId),
          orderBy('name'),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId),
          orderBy('name'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (newDocs.length < pageSize) {
        setHasMore(false);
      }

      if (newDocs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setEmployees(prev => [...prev, ...newDocs]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    setEmployees([]);
    setLastDoc(null);
    setHasMore(true);
    loadMore();
  }, [companyId]);

  return { employees, loading, hasMore, loadMore };
}

// Hook for fetching all documents by employee ID (for related docs)
export function useDocumentsByEmployee(collectionName, employeeId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompany();

  useEffect(() => {
    if (!companyId || !employeeId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, collectionName),
          where('companyId', '==', companyId),
          where('employeeId', '==', employeeId)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [collectionName, employeeId, companyId]);

  return { documents, loading };
}

// Hook for fetching a single document
export function useDocument(collectionName, docId) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) {
      setDocument(null);
      setLoading(false);
      return;
    }

    const fetchDoc = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, collectionName, docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setDocument({ id: snapshot.id, ...snapshot.data() });
        } else {
          setDocument(null);
        }
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [collectionName, docId]);

  return { document, loading };
}
