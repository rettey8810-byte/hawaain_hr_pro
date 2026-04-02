import { useState } from 'react';
import { Clock, Calendar, UserCheck, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import attendanceService from '../services/attendanceService';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: attendanceRecords, loading: attendanceLoading } = useFirestore('attendance');
  const { documents: employees } = useFirestore('employees');

  // Filter by company and date
  const filteredRecords = attendanceRecords.filter(r => 
    r.companyId === companyId && r.date === selectedDate
  );

  // Calculate stats from real data
  const todayStats = {
    present: filteredRecords.filter(r => r.status === 'present').length,
    absent: filteredRecords.filter(r => r.status === 'absent').length,
    late: filteredRecords.filter(r => r.status === 'late').length,
    wfh: filteredRecords.filter(r => r.status === 'wfh').length,
    onLeave: filteredRecords.filter(r => r.status === 'on-leave').length
  };

  if (attendanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading attendance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Clock-cuate.svg" 
            alt="Attendance" 
            className="h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="h-8 w-8" />
              Attendance & Time Tracking
            </h1>
            <p className="text-cyan-100 mt-1">Monitor employee attendance and working hours</p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg border-0"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Present', value: todayStats.present, color: 'bg-green-500' },
          { label: 'Absent', value: todayStats.absent, color: 'bg-red-500' },
          { label: 'Late', value: todayStats.late, color: 'bg-orange-500' },
          { label: 'WFH', value: todayStats.wfh, color: 'bg-blue-500' },
          { label: 'On Leave', value: todayStats.onLeave, color: 'bg-purple-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} w-3 h-3 rounded-full`} />
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Daily Attendance - {selectedDate}</h3>
          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No attendance records for {selectedDate}</p>
            <p className="text-sm">Records will appear when employees check in</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Employee</th>
                <th className="text-left py-3 px-4">Check In</th>
                <th className="text-left py-3 px-4">Check Out</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Hours</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {employees.find(e => e.id === record.employeeId)?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4">{record.checkIn || '-'}</td>
                  <td className="py-3 px-4">{record.checkOut || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-700' :
                      record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{record.hours || '-'}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
