import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function FirebaseDataChecker() {
  const [collections, setCollections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkCollections = async () => {
      setLoading(true);
      setError(null);
      
      const collectionsToCheck = [
        'medicals',
        'employees',
        'passports',
        'visas',
        'workPermits',
        'insurances'
      ];
      
      const results = {};
      
      for (const collName of collectionsToCheck) {
        try {
          const snapshot = await getDocs(collection(db, collName));
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          results[collName] = {
            count: docs.length,
            sample: docs.slice(0, 3), // First 3 docs
            fields: docs.length > 0 ? Object.keys(docs[0]) : []
          };
        } catch (err) {
          results[collName] = { error: err.message };
        }
      }
      
      setCollections(results);
      setLoading(false);
    };
    
    checkCollections();
  }, []);

  if (loading) return <div className="p-4 bg-gray-100 rounded">Checking Firebase data...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded">Error: {error}</div>;

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="font-bold text-lg mb-2">Firebase Data Check</h3>
      <div className="space-y-3">
        {Object.entries(collections).map(([name, data]) => (
          <div key={name} className="bg-white p-3 rounded shadow-sm">
            <div className="font-semibold text-blue-600">
              {name}: {data.error ? `Error: ${data.error}` : `${data.count} documents`}
            </div>
            {data.fields && data.fields.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Fields: {data.fields.join(', ')}
              </div>
            )}
            {data.sample && data.sample.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer">
                  Show sample data ({data.sample.length} docs)
                </summary>
                <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto max-h-40">
                  {JSON.stringify(data.sample, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
