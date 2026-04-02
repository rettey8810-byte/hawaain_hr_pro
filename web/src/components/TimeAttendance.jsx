import { useState, useEffect } from 'react';
import { useTimeAttendance } from '../contexts/TimeAttendanceContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  ArrowRightLeft, 
  Plus, 
  CheckCircle, 
  XCircle,
  Navigation,
  Timer,
  ChevronRight
} from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import toast from 'react-hot-toast';

export default function TimeAttendance() {
  const { 
    timeRecords, 
    shifts, 
    overtimeRequests, 
    shiftSwaps,
    clockIn, 
    clockOut, 
    requestOvertime, 
    requestShiftSwap,
    loading 
  } = useTimeAttendance();
  const { company } = useCompany();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [location, setLocation] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);

  // Get today's record
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = timeRecords.find(r => {
      const recordDate = new Date(r.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime() && r.employeeId === user?.uid;
    });
    setTodayRecord(record || null);
  }, [timeRecords, user?.uid]);

  // Get GPS location
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          };
          setLocation(loc);
          resolve(loc);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      let loc = location;
      if (!loc) {
        loc = await getLocation();
      }
      await clockIn(user.uid, loc, 'gps');
      toast.success('Clocked in successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      let loc = location;
      if (!loc) {
        loc = await getLocation();
      }
      await clockOut(todayRecord.id, loc, 'gps');
      toast.success('Clocked out successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to clock out');
    }
  };

  const isClockedIn = todayRecord?.clockIn && !todayRecord?.clockOut;
  const workingHours = todayRecord?.clockIn && todayRecord?.clockOut
    ? differenceInHours(new Date(todayRecord.clockOut), new Date(todayRecord.clockIn))
    : todayRecord?.clockIn
    ? differenceInHours(new Date(), new Date(todayRecord.clockIn))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance</h1>
          <p className="text-gray-600">Track time, manage shifts, and handle overtime</p>
        </div>
      </div>

      {/* Quick Clock In/Out Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Current Time</p>
              <p className="text-3xl font-bold">{format(new Date(), 'HH:mm')}</p>
              <p className="text-blue-100 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {location && (
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Navigation className="h-4 w-4" />
                <span className="text-sm">GPS Active</span>
              </div>
            )}
            
            {!isClockedIn ? (
              <button
                onClick={handleClockIn}
                className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                <MapPin className="h-5 w-5" />
                Clock In
              </button>
            ) : (
              <button
                onClick={handleClockOut}
                className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                <Clock className="h-5 w-5" />
                Clock Out
              </button>
            )}
          </div>
        </div>

        {todayRecord && (
          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-100 text-sm">Clock In</p>
              <p className="text-xl font-semibold">
                {todayRecord.clockIn ? format(new Date(todayRecord.clockIn), 'HH:mm') : '--:--'}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Clock Out</p>
              <p className="text-xl font-semibold">
                {todayRecord.clockOut ? format(new Date(todayRecord.clockOut), 'HH:mm') : '--:--'}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Working Hours</p>
              <p className="text-xl font-semibold">{workingHours.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Status</p>
              <p className="text-xl font-semibold capitalize">{todayRecord.status || 'Not Started'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'attendance', label: 'Attendance History', icon: Calendar },
          { id: 'shifts', label: 'Shifts', icon: Clock },
          { id: 'overtime', label: 'Overtime', icon: Timer },
          { id: 'swaps', label: 'Shift Swaps', icon: ArrowRightLeft }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {activeTab === 'attendance' && <AttendanceHistory records={timeRecords} />}
        {activeTab === 'shifts' && <ShiftManagement shifts={shifts} />}
        {activeTab === 'overtime' && <OvertimeRequests requests={overtimeRequests} />}
        {activeTab === 'swaps' && <ShiftSwaps swaps={shiftSwaps} />}
      </div>
    </div>
  );
}

// Attendance History Component
function AttendanceHistory({ records }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[800px] sm:min-w-full px-4 sm:px-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.slice(0, 30).map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {format(new Date(record.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.clockIn ? format(new Date(record.clockIn), 'HH:mm') : '--:--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.clockOut ? format(new Date(record.clockOut), 'HH:mm') : '--:--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.totalWorkingHours?.toFixed(1) || '0.0'}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.clockInLocation ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      GPS
                    </span>
                  ) : (
                    'Manual'
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Shift Management Component
function ShiftManagement({ shifts }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Available Shifts</h3>
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <Plus className="h-4 w-4" />
          Request Shift Change
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map(shift => (
          <div key={shift.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: shift.color || '#3B82F6' }}
              >
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold">{shift.name}</h4>
                <p className="text-sm text-gray-500">{shift.code}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Break:</span>
                <span>{shift.breakDuration} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Working Days:</span>
                <span>{shift.workingDays?.length || 5} days</span>
              </div>
            </div>
          </div>
        ))}
        {shifts.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center py-8">No shifts configured</p>
        )}
      </div>
    </div>
  );
}

// Overtime Requests Component
function OvertimeRequests({ requests }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Overtime Requests</h3>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Request Overtime
        </button>
      </div>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[700px] sm:min-w-full px-4 sm:px-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(request.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {request.hours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {request.type}
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={request.status} />
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No overtime requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Shift Swaps Component
function ShiftSwaps({ swaps }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Shift Swap Requests</h3>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <ArrowRightLeft className="h-4 w-4" />
          Request Swap
        </button>
      </div>
      
      <div className="space-y-4">
        {swaps.map(swap => (
          <div key={swap.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {swap.requesterName?.charAt(0) || '?'}
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                  {swap.recipientName?.charAt(0) || '?'}
                </div>
              </div>
              <div>
                <p className="font-medium">
                  {swap.requesterName} ↔ {swap.recipientName}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(swap.swapDate), 'MMM d, yyyy')} • {swap.reason}
                </p>
              </div>
            </div>
            <StatusBadge status={swap.status} />
          </div>
        ))}
        {swaps.length === 0 && (
          <p className="text-gray-500 text-center py-8">No shift swap requests</p>
        )}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    processed: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

import React from 'react';
