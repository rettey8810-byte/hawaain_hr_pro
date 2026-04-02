import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Clock, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, XCircle,
  Plus, Search, Printer, Download, Filter, ChevronDown, ChevronUp,
  Clock8, Clock4, Coffee, ArrowRight, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Attendance & Time Tracking Module
 * 
 * Features:
 * - Daily check-in/check-out
 * - Overtime calculation and approval
 * - Timesheet management
 * - Late arrival tracking
 * - Monthly attendance reports
 * - Integration with payroll
 */

const ATTENDANCE_STATUS = {
  present: { label: 'Present', color: 'bg-green-100 text-green-800' },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-800' },
  late: { label: 'Late', color: 'bg-orange-100 text-orange-800' },
  half_day: { label: 'Half Day', color: 'bg-yellow-100 text-yellow-800' },
  on_leave: { label: 'On Leave', color: 'bg-blue-100 text-blue-800' },
  wfh: { label: 'Work From Home', color: 'bg-purple-100 text-purple-800' }
};

const WORKING_HOURS = {
  start: '09:00',
  end: '17:00',
  gracePeriod: 15 // minutes
};

export default function AttendanceTracking() {
  const { companyId, currentCompany } = useCompany();
  const { userData, hasAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    totalEmployees: 0
  });

  const [formData, setFormData] = useState({
    employeeId: '',
    date: selectedDate,
    checkIn: '',
    checkOut: '',
    status: 'present',
    location: '',
    notes: '',
    overtime: { hours: 0, approved: false }
  });

  useEffect(() => {
    fetchData();
  }, [companyId, selectedDate, selectedMonth]);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      
      // Fetch employees
      const employeesQuery = query(
        collection(db, 'employees'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      );
      const employeesSnap = await getDocs(employeesQuery);
      const employeesData = employeesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);

      // Fetch attendance records
      let attendanceQuery;
      if (activeTab === 'daily') {
        attendanceQuery = query(
          collection(db, 'attendance'),
          where('companyId', '==', companyId),
          where('date', '==', selectedDate),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Monthly view - get all records for the month
        const startOfMonth = `${selectedMonth}-01`;
        const endOfMonth = `${selectedMonth}-31`;
        attendanceQuery = query(
          collection(db, 'attendance'),
          where('companyId', '==', companyId),
          where('date', '>=', startOfMonth),
          where('date', '<=', endOfMonth),
          orderBy('date', 'desc')
        );
      }
      
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendanceData = attendanceSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(attendanceData);

      // Calculate daily stats
      const present = attendanceData.filter(r => r.status === 'present').length;
      const absent = attendanceData.filter(r => r.status === 'absent').length;
      const late = attendanceData.filter(r => r.status === 'late').length;
      const onLeave = attendanceData.filter(r => r.status === 'on_leave').length;
      
      setStats({
        present,
        absent,
        late,
        onLeave,
        totalEmployees: employeesData.length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (employeeId, isManual = false) => {
    try {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      const scheduledStart = WORKING_HOURS.start;
      
      // Calculate if late
      const [schedHours, schedMins] = scheduledStart.split(':').map(Number);
      const [actualHours, actualMins] = timeString.split(':').map(Number);
      
      let status = 'present';
      const schedTotal = schedHours * 60 + schedMins;
      const actualTotal = actualHours * 60 + actualMins;
      
      if (actualTotal > schedTotal + WORKING_HOURS.gracePeriod) {
        status = 'late';
      }

      const attendanceData = {
        employeeId,
        employeeName: employees.find(e => e.id === employeeId)?.name,
        date: selectedDate,
        checkIn: timeString,
        status,
        location: isManual ? 'Manual Entry' : 'Office',
        companyId,
        createdBy: userData.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'attendance'), attendanceData);
      toast.success(`Check-in recorded for ${attendanceData.employeeName}`);
      fetchData();
    } catch (error) {
      console.error('Error recording check-in:', error);
      toast.error('Failed to record check-in');
    }
  };

  const handleCheckOut = async (recordId, checkOutTime) => {
    try {
      const record = attendanceRecords.find(r => r.id === recordId);
      if (!record || !record.checkIn) {
        toast.error('No check-in record found');
        return;
      }

      // Calculate working hours
      const [inHours, inMins] = record.checkIn.split(':').map(Number);
      const [outHours, outMins] = checkOutTime.split(':').map(Number);
      
      const totalMinutes = (outHours * 60 + outMins) - (inHours * 60 + inMins);
      const workingHours = totalMinutes / 60;

      // Calculate overtime
      const standardHours = 8;
      const overtimeHours = Math.max(0, workingHours - standardHours);

      await updateDoc(doc(db, 'attendance', recordId), {
        checkOut: checkOutTime,
        workingHours: Math.round(workingHours * 100) / 100,
        overtime: {
          hours: Math.round(overtimeHours * 100) / 100,
          approved: overtimeHours > 0 ? false : null
        },
        updatedAt: Timestamp.now()
      });

      toast.success('Check-out recorded successfully');
      fetchData();
    } catch (error) {
      console.error('Error recording check-out:', error);
      toast.error('Failed to record check-out');
    }
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    try {
      const employee = employees.find(e => e.id === formData.employeeId);
      
      // Calculate working hours if both check-in and check-out provided
      let workingHours = 0;
      let overtime = { hours: 0, approved: false };
      
      if (formData.checkIn && formData.checkOut) {
        const [inHours, inMins] = formData.checkIn.split(':').map(Number);
        const [outHours, outMins] = formData.checkOut.split(':').map(Number);
        const totalMinutes = (outHours * 60 + outMins) - (inHours * 60 + inMins);
        workingHours = totalMinutes / 60;
        const overtimeHours = Math.max(0, workingHours - 8);
        overtime = { hours: Math.round(overtimeHours * 100) / 100, approved: false };
      }

      const attendanceData = {
        ...formData,
        employeeName: employee?.name,
        workingHours: Math.round(workingHours * 100) / 100,
        overtime,
        companyId,
        createdBy: userData.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'attendance'), attendanceData);
      toast.success('Attendance record added successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error adding attendance:', error);
      toast.error('Failed to add attendance record');
    }
  };

  const approveOvertime = async (recordId) => {
    try {
      await updateDoc(doc(db, 'attendance', recordId), {
        'overtime.approved': true,
        updatedAt: Timestamp.now()
      });
      toast.success('Overtime approved');
      fetchData();
    } catch (error) {
      console.error('Error approving overtime:', error);
      toast.error('Failed to approve overtime');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: selectedDate,
      checkIn: '',
      checkOut: '',
      status: 'present',
      location: '',
      notes: '',
      overtime: { hours: 0, approved: false }
    });
  };

  const getEmployeeAttendance = (employeeId) => {
    return attendanceRecords.find(r => r.employeeId === employeeId);
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Overtime'];
    const rows = attendanceRecords.map(r => [
      r.employeeName,
      r.date,
      r.checkIn || '-',
      r.checkOut || '-',
      r.workingHours || '-',
      ATTENDANCE_STATUS[r.status]?.label || r.status,
      r.overtime?.hours > 0 ? `${r.overtime.hours}h ${r.overtime.approved ? '(Approved)' : '(Pending)'}` : '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedMonth}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Attendance & Time Tracking</h2>
          </div>
          <p className="text-gray-600 mt-1">Daily attendance, overtime, and timesheet management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          {hasAccess('employees', 'create') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock8 className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-blue-600">{stats.onLeave}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Coffee className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Monthly View
            </button>
          </div>
          
          <div className="flex gap-4">
            {activeTab === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily View */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[1000px] sm:min-w-full px-4 sm:px-0">
              <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees
                .filter(emp => emp.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((employee) => {
                  const record = getEmployeeAttendance(employee.id);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record?.checkIn ? (
                          <span className="flex items-center gap-1">
                            <Clock8 className="h-4 w-4 text-green-600" />
                            {record.checkIn}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record?.checkOut ? (
                          <span className="flex items-center gap-1">
                            <Clock4 className="h-4 w-4 text-blue-600" />
                            {record.checkOut}
                          </span>
                        ) : record?.checkIn ? (
                          <button
                            onClick={() => handleCheckOut(record.id, new Date().toTimeString().slice(0, 5))}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record?.workingHours ? `${record.workingHours}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            ATTENDANCE_STATUS[record.status]?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {ATTENDANCE_STATUS[record.status]?.label || record.status}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Recorded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record?.overtime?.hours > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600 font-medium">{record.overtime.hours}h</span>
                            {record.overtime.approved ? (
                              <span className="text-xs text-green-600">(Approved)</span>
                            ) : hasAccess('payroll', 'approve') ? (
                              <button
                                onClick={() => approveOvertime(record.id)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Approve
                              </button>
                            ) : (
                              <span className="text-xs text-orange-600">(Pending)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!record && (
                          <button
                            onClick={() => handleCheckIn(employee.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
          </div>
        </div>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center text-gray-500 py-8">
            Monthly attendance summary view with:
            <ul className="mt-2 text-left max-w-md mx-auto space-y-1">
              <li>• Total working days per employee</li>
              <li>• Late arrivals count</li>
              <li>• Absent days</li>
              <li>• Total overtime hours</li>
              <li>• Attendance percentage</li>
            </ul>
          </div>
        </div>
      )}

      {/* Add Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Add Attendance Record</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddAttendance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <input
                    type="time"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(ATTENDANCE_STATUS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Office, WFH, Client Site"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
