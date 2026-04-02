import { useState, useEffect } from 'react';
import { useLeaveQuota } from '../contexts/LeaveQuotaContext';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, TrendingUp, Award, Briefcase, Heart, GraduationCap, Baby } from 'lucide-react';

const leaveTypeConfig = {
  annual: { icon: Calendar, color: 'blue', label: 'Annual Leave' },
  sick: { icon: Heart, color: 'rose', label: 'Sick Leave' },
  emergency: { icon: AlertCircle, color: 'amber', label: 'Emergency' },
  compensatory: { icon: Award, color: 'green', label: 'Compensatory' },
  study: { icon: GraduationCap, color: 'purple', label: 'Study Leave' },
  maternity: { icon: Baby, color: 'pink', label: 'Maternity' },
  paternity: { icon: Baby, color: 'indigo', label: 'Paternity' },
  unpaid: { icon: XCircle, color: 'gray', label: 'Unpaid' },
  halfDay: { icon: Clock, color: 'orange', label: 'Half Day' },
  hourly: { icon: Clock, color: 'cyan', label: 'Hourly' },
};

export default function LeaveBalanceCard({ employeeId, compact = false }) {
  const { fetchLeaveBalance, checkLeaveAvailability, defaultQuotas } = useLeaveQuota();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, [employeeId]);

  const loadBalance = async () => {
    setLoading(true);
    const data = await fetchLeaveBalance(employeeId);
    setBalance(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded-xl" />
          <div className="h-20 bg-gray-200 rounded-xl" />
          <div className="h-20 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-gray-500 text-center">No leave balance found</p>
      </div>
    );
  }

  const activeTypes = Object.keys(balance.quotas).filter(type => balance.quotas[type] > 0);

  if (compact) {
    // Compact view - show only summary
    const totalUsed = Object.values(balance.used).reduce((a, b) => a + b, 0);
    const totalQuota = Object.values(balance.quotas).reduce((a, b) => a + b, 0);
    const totalRemaining = Object.values(balance.remaining).reduce((a, b) => a + (b > 0 ? b : 0), 0);

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Leave Balance</p>
            <p className="text-2xl font-bold text-blue-900">{totalRemaining} <span className="text-sm font-normal">days left</span></p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Used: {totalUsed} days</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">Total: {totalQuota} days</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Leave Balance</h3>
            <p className="text-blue-100 text-sm">Year {balance.year}</p>
          </div>
          <div className="p-2 bg-white/20 rounded-xl">
            <Calendar className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Balance Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeTypes.map(type => {
            const config = leaveTypeConfig[type] || { icon: Briefcase, color: 'gray', label: type };
            const Icon = config.icon;
            const quota = balance.quotas[type] || 0;
            const used = balance.used[type] || 0;
            const remaining = balance.remaining[type] || 0;
            const percentage = quota > 0 ? (used / quota) * 100 : 0;

            return (
              <div key={type} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                    <Icon className={`h-5 w-5 text-${config.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{config.label}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Used</span>
                    <span className="font-medium text-gray-900">{used}/{quota}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${config.color}-500 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold text-${remaining > 0 ? config.color : 'gray'}-600`}>
                      {remaining}
                    </span>
                    <span className="text-xs text-gray-400">days left</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Object.values(balance.used).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Used</p>
          </div>
          <div className="text-center border-x">
            <p className="text-2xl font-bold text-green-600">
              {Object.values(balance.remaining).reduce((a, b) => a + (b > 0 ? b : 0), 0)}
            </p>
            <p className="text-sm text-gray-500">Total Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {balance.accrued?.compensatory || 0}
            </p>
            <p className="text-sm text-gray-500">Compensatory Accrued</p>
          </div>
        </div>
      </div>

      {/* Low Balance Warnings */}
      {activeTypes.some(type => balance.remaining[type] < 3 && balance.remaining[type] > 0) && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-700">
              Low balance warning: {activeTypes.filter(type => balance.remaining[type] < 3 && balance.remaining[type] > 0).map(type => leaveTypeConfig[type]?.label || type).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
