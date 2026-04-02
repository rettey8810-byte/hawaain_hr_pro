import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, CalendarDays, Filter, Building2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';

export default function TeamCalendar({ leaves, employees, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(null);

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(e => e.department).filter(Boolean));
    return ['all', ...Array.from(deptSet)];
  }, [employees]);

  // Filter leaves by department
  const filteredLeaves = useMemo(() => {
    if (selectedDepartment === 'all') return leaves;
    return leaves.filter(leave => {
      const employee = employees.find(e => e.id === leave.employeeId);
      return employee?.department === selectedDepartment;
    });
  }, [leaves, employees, selectedDepartment]);

  // Get leaves for a specific date
  const getLeavesForDate = (date) => {
    return filteredLeaves.filter(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return date >= start && date <= end;
    });
  };

  // Calendar grid generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-amber-500';
      case 'rejected': return 'bg-rose-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-blue-500';
    }
  };

  // Check for overlap warning (more than 3 people on leave same day)
  const getOverlapWarning = (date) => {
    const dayLeaves = getLeavesForDate(date);
    const approvedLeaves = dayLeaves.filter(l => l.status === 'approved');
    if (approvedLeaves.length > 3) {
      return { warning: true, count: approvedLeaves.length };
    }
    return { warning: false, count: approvedLeaves.length };
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateClick) onDateClick(date, getLeavesForDate(date));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Team Leave Calendar</h2>
              <p className="text-white/80 text-sm">View all team leaves by department</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Department Filter */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-600" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="all">All Departments</option>
                {departments.filter(d => d !== 'all').map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center bg-white/20 rounded-xl">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white/20 rounded-l-xl transition-colors">
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button onClick={handleToday} className="px-4 py-2 text-white font-medium text-sm hover:bg-white/20 transition-colors">
                Today
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white/20 rounded-r-xl transition-colors">
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-2xl font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h3>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month start */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-xl" />
          ))}

          {daysInMonth.map(date => {
            const dayLeaves = getLeavesForDate(date);
            const { warning, count } = getOverlapWarning(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`h-24 p-2 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-violet-500 bg-violet-50' 
                    : isToday
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100 hover:border-violet-200'
                } ${warning ? 'bg-amber-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(date, 'd')}
                  </span>
                  {warning && (
                    <span className="text-xs text-amber-600 font-medium" title="Multiple people on leave">
                      ⚠️
                    </span>
                  )}
                </div>

                {/* Leave Indicators */}
                <div className="flex flex-wrap gap-1">
                  {dayLeaves.slice(0, 4).map((leave, idx) => {
                    const employee = employees.find(e => e.id === leave.employeeId);
                    return (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full ${getStatusColor(leave.status)}`}
                        title={`${employee?.name || 'Unknown'} - ${leave.status}`}
                      />
                    );
                  })}
                  {dayLeaves.length > 4 && (
                    <span className="text-xs text-gray-500">+{dayLeaves.length - 4}</span>
                  )}
                </div>

                {count > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{count} on leave</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-sm text-gray-600">Rejected</span>
        </div>
        <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-amber-100 rounded-lg">
          <span className="text-sm text-amber-700">⚠️ = 3+ people on leave</span>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="px-6 py-4 border-t bg-violet-50">
          <h4 className="font-semibold text-violet-900 mb-3">
            Leaves on {format(selectedDate, 'MMMM d, yyyy')}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {getLeavesForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-sm">No leaves scheduled</p>
            ) : (
              getLeavesForDate(selectedDate).map(leave => {
                const employee = employees.find(e => e.id === leave.employeeId);
                return (
                  <div key={leave.id} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                    <div className={`w-2 h-10 rounded-full ${getStatusColor(leave.status)}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{employee?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{leave.leaveType} • {employee?.department || 'No Dept'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
