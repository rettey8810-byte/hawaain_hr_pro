import { useState } from 'react';
import { Clock, Calendar, Sun, Moon, Sunrise, Sunset, Briefcase, GraduationCap, Baby, Heart, AlertCircle } from 'lucide-react';

const leaveTypeOptions = [
  { 
    id: 'annual', 
    label: 'Annual Leave', 
    icon: Sun,
    description: 'Regular paid leave for rest and recreation',
    color: 'blue',
    defaultDays: 30,
    requiresApproval: true,
  },
  { 
    id: 'sick', 
    label: 'Sick Leave', 
    icon: Heart,
    description: 'Medical or health-related absence',
    color: 'rose',
    defaultDays: 15,
    requiresDocument: true,
    requiresApproval: true,
  },
  { 
    id: 'emergency', 
    label: 'Emergency Leave', 
    icon: AlertCircle,
    description: 'Urgent personal or family matters',
    color: 'amber',
    defaultDays: 7,
    requiresApproval: true,
    fastTrack: true,
  },
  { 
    id: 'halfDay', 
    label: 'Half Day Leave', 
    icon: Sunrise,
    description: 'Morning or afternoon only',
    color: 'orange',
    defaultDays: 60,
    requiresApproval: true,
    isHalfDay: true,
  },
  { 
    id: 'hourly', 
    label: 'Hourly Leave', 
    icon: Clock,
    description: 'Short leave for a few hours',
    color: 'cyan',
    defaultDays: 40,
    requiresApproval: true,
    isHourly: true,
  },
  { 
    id: 'compensatory', 
    label: 'Compensatory Leave', 
    icon: Briefcase,
    description: 'Overtime converted to leave',
    color: 'green',
    defaultDays: 0,
    requiresApproval: true,
    earnedOnly: true,
  },
  { 
    id: 'study', 
    label: 'Study Leave', 
    icon: GraduationCap,
    description: 'Educational or examination leave',
    color: 'purple',
    defaultDays: 30,
    requiresApproval: true,
    requiresDocument: true,
  },
  { 
    id: 'maternity', 
    label: 'Maternity Leave', 
    icon: Baby,
    description: 'Pregnancy and childbirth leave',
    color: 'pink',
    defaultDays: 90,
    requiresApproval: true,
    genderSpecific: 'female',
  },
  { 
    id: 'paternity', 
    label: 'Paternity Leave', 
    icon: Baby,
    description: 'Leave for new fathers',
    color: 'indigo',
    defaultDays: 7,
    requiresApproval: true,
    genderSpecific: 'male',
  },
  { 
    id: 'unpaid', 
    label: 'Leave Without Pay', 
    icon: Moon,
    description: 'Unpaid extended leave',
    color: 'gray',
    defaultDays: 365,
    requiresApproval: true,
    unpaid: true,
  },
];

export default function AdvancedLeaveTypes({ value, onChange, employeeBalance, employeeGender, errors = {} }) {
  const [selectedType, setSelectedType] = useState(value?.type || 'annual');
  const [isHalfDay, setIsHalfDay] = useState(value?.isHalfDay || false);
  const [halfDayPeriod, setHalfDayPeriod] = useState(value?.halfDayPeriod || 'morning');
  const [hours, setHours] = useState(value?.hours || 4);

  const selectedConfig = leaveTypeOptions.find(t => t.id === selectedType);

  const handleTypeChange = (typeId) => {
    setSelectedType(typeId);
    const config = leaveTypeOptions.find(t => t.id === typeId);
    
    onChange({
      type: typeId,
      label: config.label,
      isHalfDay: config.isHalfDay || false,
      halfDayPeriod: config.isHalfDay ? halfDayPeriod : null,
      hours: config.isHourly ? hours : null,
      requiresDocument: config.requiresDocument || false,
      unpaid: config.unpaid || false,
    });
  };

  const handleHalfDayChange = (checked) => {
    setIsHalfDay(checked);
    onChange({
      ...value,
      isHalfDay: checked,
      halfDayPeriod: checked ? halfDayPeriod : null,
    });
  };

  const handlePeriodChange = (period) => {
    setHalfDayPeriod(period);
    onChange({
      ...value,
      halfDayPeriod: period,
    });
  };

  const handleHoursChange = (h) => {
    setHours(h);
    onChange({
      ...value,
      hours: h,
    });
  };

  // Check if leave type is available for this employee
  const isTypeAvailable = (type) => {
    if (type.genderSpecific) {
      return employeeGender?.toLowerCase() === type.genderSpecific;
    }
    if (type.earnedOnly) {
      const accrued = employeeBalance?.accrued?.compensatory || 0;
      return accrued > 0;
    }
    return true;
  };

  // Check balance availability
  const getAvailability = (type) => {
    const balance = employeeBalance?.remaining?.[type.id] || 0;
    if (balance <= 0 && !type.unpaid) return 'exhausted';
    if (balance <= 3 && !type.unpaid) return 'low';
    return 'available';
  };

  return (
    <div className="space-y-4">
      {/* Leave Type Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Leave Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {leaveTypeOptions.map(type => {
            const Icon = type.icon;
            const available = isTypeAvailable(type);
            const status = getAvailability(type);
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => available && handleTypeChange(type.id)}
                disabled={!available}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? `border-${type.color}-500 bg-${type.color}-50 ring-2 ring-${type.color}-200`
                    : available
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-lg w-fit mb-2 ${
                  isSelected ? `bg-${type.color}-100` : 'bg-gray-100'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isSelected ? `text-${type.color}-600` : 'text-gray-500'
                  }`} />
                </div>
                <p className={`font-medium text-sm ${
                  isSelected ? `text-${type.color}-900` : 'text-gray-900'
                }`}>
                  {type.label}
                </p>
                
                {status === 'low' && (
                  <span className="absolute top-2 right-2 text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                    Low
                  </span>
                )}
                {status === 'exhausted' && (
                  <span className="absolute top-2 right-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    0 left
                  </span>
                )}
                {!available && type.genderSpecific && (
                  <span className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {type.genderSpecific}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {errors.type && <p className="mt-2 text-sm text-red-600">{errors.type}</p>}
      </div>

      {/* Selected Type Info */}
      {selectedConfig && (
        <div className={`p-4 rounded-xl bg-${selectedConfig.color}-50 border border-${selectedConfig.color}-200`}>
          <p className="text-sm text-gray-700">{selectedConfig.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedConfig.requiresDocument && (
              <span className="text-xs px-2 py-1 bg-white rounded-md text-gray-600">
                📄 Document Required
              </span>
            )}
            {selectedConfig.fastTrack && (
              <span className="text-xs px-2 py-1 bg-white rounded-md text-amber-600">
                ⚡ Fast Track
              </span>
            )}
            {selectedConfig.unpaid && (
              <span className="text-xs px-2 py-1 bg-white rounded-md text-gray-600">
                💰 Unpaid
              </span>
            )}
            {selectedConfig.earnedOnly && (
              <span className="text-xs px-2 py-1 bg-white rounded-md text-green-600">
                🎯 Earned Only
              </span>
            )}
          </div>
        </div>
      )}

      {/* Half Day Options */}
      {selectedConfig?.isHalfDay && (
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={isHalfDay}
              onChange={(e) => handleHalfDayChange(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-gray-300"
            />
            <span className="font-medium text-gray-700">Apply as Half Day (0.5 day)</span>
          </label>
          
          {isHalfDay && (
            <div className="flex gap-4 ml-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="halfDayPeriod"
                  value="morning"
                  checked={halfDayPeriod === 'morning'}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-4 h-4 text-orange-600"
                />
                <span className="text-sm text-gray-700">Morning (AM)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="halfDayPeriod"
                  value="afternoon"
                  checked={halfDayPeriod === 'afternoon'}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-4 h-4 text-orange-600"
                />
                <span className="text-sm text-gray-700">Afternoon (PM)</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Hourly Options */}
      {selectedConfig?.isHourly && (
        <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Hours
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="8"
              value={hours}
              onChange={(e) => handleHoursChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-lg font-semibold text-cyan-700 w-16 text-center">
              {hours} hrs
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Hourly leave is deducted as {hours / 8} day(s) from your balance
          </p>
        </div>
      )}

      {/* Document Upload Notice */}
      {selectedConfig?.requiresDocument && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Document Required</p>
            <p className="text-sm text-blue-700 mt-1">
              Please upload supporting documents (medical certificate, proof, etc.) in the Documents section after submitting your application.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export { leaveTypeOptions };
