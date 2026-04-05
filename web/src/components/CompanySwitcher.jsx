import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';

export default function CompanySwitcher() {
  const { companies, currentCompany, switchCompany, isSuperAdmin } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (companyId) => {
    switchCompany(companyId);
    setIsOpen(false);
    // Reload page to refresh data for new company context
    window.location.reload();
  };

  // Get color based on company type
  const getCompanyColor = (company) => {
    if (company.type === 'external') {
      switch (company.id) {
        case 'construction': return 'bg-orange-500';
        case 'villa_park': return 'bg-blue-500';
        case 'third_party': return 'bg-purple-500';
        case 'sister_property': return 'bg-green-500';
        case 'visitors': return 'bg-yellow-500';
        default: return 'bg-gray-500';
      }
    }
    return 'bg-blue-600';
  };

  if (companies.length <= 1) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
      >
        <div className={`h-3 w-3 rounded-full ${getCompanyColor(currentCompany)}`} />
        <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
          {currentCompany?.name || 'Select Company'}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 font-medium px-2 py-1">SWITCH COMPANY</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSwitch(company.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                  currentCompany?.id === company.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${getCompanyColor(company)}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    currentCompany?.id === company.id ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {company.name}
                  </p>
                  {company.type === 'external' && (
                    <p className="text-xs text-gray-400">External Staff</p>
                  )}
                </div>
                {currentCompany?.id === company.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-400 text-center">
              Switch to view different company data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
