import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock3,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate } from '../utils/helpers';

export default function EmployeeAttendance() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    totalWorkingDays: 0
  });

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user?.uid && !userData?.employeeId) return;
      
      setLoading(true);
      try {
        let employeeId = userData?.employeeId || user?.uid;
        
        // If no employeeId, try to find by email
        if (!userData?.employeeId && userData?.email) {
          const empQuery = query(
            collection(db, 'employees'),
            where('Email', '==', userData.email)
          );
          const empSnap = await getDocs(empQuery);
          if (!empSnap.empty) {
            employeeId = empSnap.docs[0].id;
          }
        }

        // Calculate month range
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('employeeId', '==', employeeId),
          where('date', '>=', startOfMonth.toISOString().split('T')[0]),
          where('date', '<=', endOfMonth.toISOString().split('T')[0]),
          orderBy('date', 'desc')
        );
        
        const attendanceSnap = await getDocs(attendanceQuery);
        const records = attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAttendanceRecords(records);
        
        // Calculate stats
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const halfDay = records.filter(r => r.status === 'half_day').length;
        
        setStats({
          present,
          absent,
          late,
          halfDay,
          totalWorkingDays: present + late + halfDay + absent
        });
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user, userData, currentMonth]);

  const handleCheckIn = async () => {
    try {
      let employeeId = userData?.employeeId || user?.uid;
      
      await addDoc(collection(db, 'attendance'), {
        employeeId,
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toISOString(),
        status: 'present',
        createdAt: serverTimestamp()
      });
      
      // Refresh records
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('employeeId', '==', employeeId),
        where('date', '>=', startOfMonth.toISOString().split('T')[0]),
        where('date', '<=', endOfMonth.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );
      
      const attendanceSnap = await getDocs(attendanceQuery);
      setAttendanceRecords(attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Check-in error:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Present' },
      absent: { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Absent' },
      late: { color: 'bg-amber-100 text-amber-700', icon: Clock3, label: 'Late' },
      half_day: { color: 'bg-blue-100 text-blue-700', icon: Clock3, label: 'Half Day' },
      on_leave: { color: 'bg-purple-100 text-purple-700', icon: Calendar, label: 'On Leave' }
    };
    return badges[status] || badges.present;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = attendanceRecords.find(r => r.date === dateStr);
      days.push({ day, record });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = attendanceRecords.some(r => r.date === today && r.checkIn);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
              <p className="text-gray-600 mt-2">Track your attendance and check-in records</p>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={hasCheckedInToday}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                hasCheckedInToday
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
              }`}
            >
              {hasCheckedInToday ? 'Checked In Today' : 'Check In Now'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-xl">
                <XCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalWorkingDays > 0 
                    ? Math.round(((stats.present + stats.late) / stats.totalWorkingDays) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-emerald-600" />
              Monthly Calendar
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <span className="font-medium text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((dayInfo, index) => (
              <div
                key={index}
                className={`aspect-square rounded-lg border p-2 ${
                  dayInfo?.record
                    ? dayInfo.record.status === 'present'
                      ? 'bg-emerald-50 border-emerald-200'
                      : dayInfo.record.status === 'late'
                      ? 'bg-amber-50 border-amber-200'
                      : dayInfo.record.status === 'absent'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-gray-50 border-gray-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                {dayInfo && (
                  <>
                    <span className={`text-sm font-medium ${
                      dayInfo.record?.date === today ? 'text-emerald-600 font-bold' : 'text-gray-700'
                    }`}>
                      {dayInfo.day}
                    </span>
                    {dayInfo.record && (
                      <div className="mt-1">
                        {(() => {
                          const StatusIcon = getStatusBadge(dayInfo.record.status).icon;
                          return <StatusIcon className={`h-3 w-3 ${
                            dayInfo.record.status === 'present' ? 'text-emerald-600' :
                            dayInfo.record.status === 'late' ? 'text-amber-600' :
                            dayInfo.record.status === 'absent' ? 'text-rose-600' :
                            'text-gray-600'
                          }`} />;
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded"></div>
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-100 border border-rose-200 rounded"></div>
              <span className="text-sm text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Half Day</span>
            </div>
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-6 w-6 text-emerald-600" />
              Recent Records
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Yet</h3>
              <p className="text-gray-500">Your attendance records will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Check In</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Check Out</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Working Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceRecords.slice(0, 10).map((record) => {
                    const statusBadge = getStatusBadge(record.status);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {record.workingHours ? `${record.workingHours} hrs` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
