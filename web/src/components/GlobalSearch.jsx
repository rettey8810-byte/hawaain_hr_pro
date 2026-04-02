import { useState, useEffect } from 'react';
import { Search, X, FileText, Users, Calendar, Filter } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../contexts/CompanyContext';
import { formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function GlobalSearch() {
  const { companyId } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    employees: true,
    passports: true,
    visas: true,
    workPermits: true,
    medicals: true
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim() || !companyId) return;
    
    setLoading(true);
    setSearched(true);
    const allResults = [];

    try {
      // Search Employees
      if (filters.employees) {
        const empQuery = query(
          collection(db, 'employees'),
          where('companyId', '==', companyId)
        );
        const empSnap = await getDocs(empQuery);
        empSnap.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.position?.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({ type: 'employee', id: doc.id, ...data });
          }
        });
      }

      // Search Passports
      if (filters.passports) {
        const passQuery = query(
          collection(db, 'passports'),
          where('companyId', '==', companyId)
        );
        const passSnap = await getDocs(passQuery);
        passSnap.forEach(doc => {
          const data = doc.data();
          if (data.passportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.country?.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({ type: 'passport', id: doc.id, ...data });
          }
        });
      }

      // Search Visas
      if (filters.visas) {
        const visaQuery = query(
          collection(db, 'visas'),
          where('companyId', '==', companyId)
        );
        const visaSnap = await getDocs(visaQuery);
        visaSnap.forEach(doc => {
          const data = doc.data();
          if (data.visaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.visaType?.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({ type: 'visa', id: doc.id, ...data });
          }
        });
      }

      // Search Work Permits
      if (filters.workPermits) {
        const permitQuery = query(
          collection(db, 'workPermits'),
          where('companyId', '==', companyId)
        );
        const permitSnap = await getDocs(permitQuery);
        permitSnap.forEach(doc => {
          const data = doc.data();
          if (data.permitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.employer?.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({ type: 'work-permit', id: doc.id, ...data });
          }
        });
      }

      // Search Medicals
      if (filters.medicals) {
        const medQuery = query(
          collection(db, 'medicals'),
          where('companyId', '==', companyId)
        );
        const medSnap = await getDocs(medQuery);
        medSnap.forEach(doc => {
          const data = doc.data();
          if (data.testCenter?.toLowerCase().includes(searchTerm.toLowerCase())) {
            allResults.push({ type: 'medical', id: doc.id, ...data });
          }
        });
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type) => {
    switch(type) {
      case 'employee': return Users;
      case 'passport': return FileText;
      case 'visa': return FileText;
      case 'work-permit': return FileText;
      case 'medical': return FileText;
      default: return FileText;
    }
  };

  const getResultLink = (result) => {
    switch(result.type) {
      case 'employee': return `/employees/${result.id}`;
      case 'passport': return `/passports`;
      case 'visa': return `/visas`;
      case 'work-permit': return `/work-permits`;
      case 'medical': return `/medical`;
      default: return '#';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900">Global Search</h2>
        <p className="mt-1 text-sm text-gray-500">Search across all records in your company</p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees, documents, records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full rounded-md border-gray-300 border pl-10 pr-3 py-3 text-base focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="text-sm text-gray-500 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            Search in:
          </span>
          {Object.entries({
            employees: 'Employees',
            passports: 'Passports',
            visas: 'Visas',
            workPermits: 'Work Permits',
            medicals: 'Medical Records'
          }).map(([key, label]) => (
            <label key={key} className="inline-flex items-center">
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => setFilters({...filters, [key]: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Search Results ({results.length} found)
              </h3>
              {results.length > 0 && (
                <button
                  onClick={() => {setResults([]); setSearched(false); setSearchTerm('');}}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No results found for "{searchTerm}"
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => {
                  const Icon = getResultIcon(result.type);
                  return (
                    <Link
                      key={index}
                      to={getResultLink(result)}
                      className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 capitalize">{result.type.replace('-', ' ')}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {result.name || result.passportNumber || result.visaNumber || result.permitNumber || 'Record'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {result.email && <span className="mr-3">{result.email}</span>}
                          {result.department && <span className="mr-3">Dept: {result.department}</span>}
                          {result.expiryDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Expires: {formatDate(result.expiryDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
