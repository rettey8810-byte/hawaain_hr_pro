import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, MapPin, Plane } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const STATUS_COLORS = {
  pending: 'bg-amber-200 border-amber-400 text-amber-800',
  approved: 'bg-emerald-200 border-emerald-400 text-emerald-800',
  rejected: 'bg-rose-200 border-rose-400 text-rose-800',
  cancelled: 'bg-gray-200 border-gray-400 text-gray-800'
};

export default function LeaveCalendar({ leaves, employees, onLeaveClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const getLeavesForDate = (date) => {
    return leaves.filter(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return date >= start && date <= end;
    });
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp?.name || 'Unknown';
  };

  const renderCalendarDays = () => {
    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = renderCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <CalendarIcon className="h-6 w-6 mr-2 text-emerald-500" />
          Leave Calendar
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-amber-200 border border-amber-400 mr-2" />
          <span>Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400 mr-2" />
          <span>Approved</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded bg-rose-200 border border-rose-400 mr-2" />
          <span>Rejected</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Week Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayLeaves = getLeavesForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  min-h-[100px] p-2 border-r border-b border-gray-200 cursor-pointer
                  hover:bg-gray-50 transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-inset ring-emerald-400' : ''}
                  ${isSelected ? 'bg-emerald-50' : ''}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayLeaves.slice(0, 3).map((leave, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveClick?.(leave);
                      }}
                      className={`
                        text-xs px-2 py-1 rounded border truncate cursor-pointer
                        ${STATUS_COLORS[leave.status] || STATUS_COLORS.pending}
                      `}
                      title={`${getEmployeeName(leave.employeeId)} - ${leave.leaveType}`}
                    >
                      {getEmployeeName(leave.employeeId).split(' ')[0]}
                    </div>
                  ))}
                  {dayLeaves.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayLeaves.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-bold text-gray-900 mb-3">
            Leaves on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {getLeavesForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-sm">No leaves scheduled</p>
          ) : (
            <div className="space-y-2">
              {getLeavesForDate(selectedDate).map(leave => (
                <div
                  key={leave.id}
                  onClick={() => onLeaveClick?.(leave)}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{getEmployeeName(leave.employeeId)}</span>
                    <MapPin className="h-4 w-4 ml-4 mr-1 text-gray-400" />
                    <span className="text-sm text-gray-600">{leave.destination}</span>
                    {leave.transportation?.required && (
                      <Plane className="h-4 w-4 ml-2 text-blue-400" />
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[leave.status]}`}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
