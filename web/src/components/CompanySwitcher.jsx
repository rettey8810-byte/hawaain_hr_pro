import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, HardHat, Users, Palmtree, Briefcase, UserCircle } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';

const companyIcons = {
  'sun-island': Palmtree,
  'villa-construction': HardHat,
  'villa-park': Building2,
  'sister-property': Building2,
  '3rd-party': Briefcase,
  'visitors': UserCircle,
  'default': Building2
};

const companyColors = {
  'sun-island': 'bg-blue-100 text-blue-700 border-blue-200',
  'villa-construction': 'bg-orange-100 text-orange-700 border-orange-200',
  'villa-park': 'bg-green-100 text-green-700 border-green-200',
  'sister-property': 'bg-purple-100 text-purple-700 border-purple-200',
  '3rd-party': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'visitors': 'bg-pink-100 text-pink-700 border-pink-200',
  'default': 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function CompanySwitcher() {
  const { currentCompany, companies, switchCompany, canSwitchCompany, getCompanyDisplayName } = useCompany();
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

  if (!canSwitchCompany() || companies.length <= 1) {
    // Just show the current company name without switcher
    if (!currentCompany) return null;
    const Icon = companyIcons[currentCompany.id] || companyIcons.default;
    const colorClass = companyColors[currentCompany.id] || companyColors.default;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{getCompanyDisplayName()}</span>
      </div>
    );
  }

  const handleSwitch = (companyId) => {
    if (companyId !== currentCompany?.id) {
      switchCompany(companyId);
    }
    setIsOpen(false);
  };

  const CurrentIcon = companyIcons[currentCompany?.id] || companyIcons.default;
  const currentColorClass = companyColors[currentCompany?.id] || companyColors.default;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:shadow-md transition-all ${currentColorClass}`}
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">{getCompanyDisplayName()}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Company</p>
            <p className="text-xs text-gray-400 mt-1">Switch to view different company data</p>
          </div>
          
          <div className="max-h-80 overflow-y-auto py-1">
            {companies.map((company) => {
              const Icon = companyIcons[company.id] || companyIcons.default;
              const isActive = currentCompany?.id === company.id;
              
              return (
                <button
                  key={company.id}
                  onClick={() => handleSwitch(company.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 hover:bg-blue-50' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${companyColors[company.id] || companyColors.default}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {company.name || company.companyName}
                      </p>
                      {isActive && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {company.description || company.type}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Changes will reload the page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
