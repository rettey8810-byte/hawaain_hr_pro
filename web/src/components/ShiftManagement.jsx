import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Calendar, Clock, Users, Plus, Search, ChevronLeft, ChevronRight,
  Sun, Moon, AlertCircle, CheckCircle, XCircle, Repeat, Briefcase,
  Download, Filter, Edit2, Trash2, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Shift & Schedule Management Module
 * 
 * Features:
 * - Create shift patterns
 * - Employee shift assignments
 * - Shift swap requests
 * - Coverage alerts for gaps
 * - Weekly/Monthly schedule views
 * - Overtime tracking
 */

const SHIFT_TYPES = [
  { id: 'morning', name: 'Morning Shift', start: '06:00', end: '14:00', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'day', name: 'Day Shift', start: '09:00', end: '17:00', color: 'bg-blue-100 text-blue-800' },
  { id: 'evening', name: 'Evening Shift', start: '14:00', end: '22:00', color: 'bg-orange-100 text-orange-800' },
  { id: 'night', name: 'Night Shift', start: '22:00', end: '06:00', color: 'bg-purple-100 text-purple-800' },
  { id: 'weekend', name: 'Weekend Shift', start: '09:00', end: '17:00', color: 'bg-green-100 text-green-800' }
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ShiftManagement() {
  const { companyId, currentCompany } = useCompany();
  const { userData, hasAccess } = useAuth();
  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const [formData, setFormData] = useState({
    employeeId: '',
    weekStart: selectedWeek.start,
    shifts: {},
    notes: ''
  });

  function getCurrentWeek() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    };
  }

  useEffect(() => {
    fetchData();
  }, [companyId, selectedWeek]);

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

      // Fetch schedules for selected week
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('companyId', '==', companyId),
        where('weekStart', '==', selectedWeek.start)
      );
      const schedulesSnap = await getDocs(schedulesQuery);
      const schedulesData = schedulesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(schedulesData);

      // Fetch shift swap requests
      const swapsQuery = query(
        collection(db, 'shiftSwaps'),
        where('companyId', '==', companyId),
        where('status', 'in', ['pending', 'approved'])
      );
      const swapsSnap = await getDocs(swapsQuery);
      const swapsData = swapsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShiftSwaps(swapsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const employee = employees.find(e => e.id === formData.employeeId);
      
      // Check if schedule already exists for this employee and week
      const existingSchedule = schedules.find(s => 
        s.employeeId === formData.employeeId && s.weekStart === selectedWeek.start
      );

      const scheduleData = {
        ...formData,
        employeeName: employee?.name,
        department: employee?.department,
        position: employee?.position,
        companyId,
        createdBy: userData.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (existingSchedule) {
        await updateDoc(doc(db, 'schedules', existingSchedule.id), scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await addDoc(collection(db, 'schedules'), scheduleData);
        toast.success('Schedule created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      toast.success('Schedule deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleApproveSwap = async (swapId, action) => {
    try {
      await updateDoc(doc(db, 'shiftSwaps', swapId), {
        status: action,
        approvedBy: userData.uid,
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      toast.success(`Swap request ${action}`);
      fetchData();
    } catch (error) {
      console.error('Error updating swap:', error);
      toast.error('Failed to update swap request');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      weekStart: selectedWeek.start,
      shifts: {},
      notes: ''
    });
  };

  const navigateWeek = (direction) => {
    const currentStart = new Date(selectedWeek.start);
    const newStart = new Date(currentStart);
    newStart.setDate(currentStart.getDate() + (direction === 'next' ? 7 : -7));
    
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);
    
    setSelectedWeek({
      start: newStart.toISOString().split('T')[0],
      end: newEnd.toISOString().split('T')[0]
    });
  };

  const getEmployeeSchedule = (employeeId) => {
    return schedules.find(s => s.employeeId === employeeId);
  };

  const getShiftForDay = (schedule, dayIndex) => {
    return schedule?.shifts?.[dayIndex] || null;
  };

  const getCoverageStatus = (dayIndex) => {
    const shiftsForDay = schedules.map(s => s.shifts?.[dayIndex]).filter(Boolean);
    const shiftCounts = {};
    shiftsForDay.forEach(shift => {
      shiftCounts[shift] = (shiftCounts[shift] || 0) + 1;
    });
    return shiftCounts;
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Department', ...DAYS_OF_WEEK, 'Notes'];
    const rows = filteredEmployees.map(emp => {
      const schedule = getEmployeeSchedule(emp.id);
      return [
        emp.name,
        emp.department,
        ...DAYS_OF_WEEK.map((_, i) => {
          const shift = getShiftForDay(schedule, i);
          return shift ? SHIFT_TYPES.find(s => s.id === shift)?.name || shift : 'Off';
        }),
        schedule?.notes || ''
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${selectedWeek.start}.csv`;
    a.click();
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departments = [...new Set(employees.map(e => e.department))];

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
            <Calendar className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Shift & Schedule Management</h2>
          </div>
          <p className="text-gray-600 mt-1">Employee shift assignments and schedule planning</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          {hasAccess('employees', 'create') && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Assign Shift
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Week of {new Date(selectedWeek.start).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(selectedWeek.start).toLocaleDateString()} - {new Date(selectedWeek.end).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex gap-4">
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
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'schedules' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Weekly Schedule
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'swaps' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Shift Swaps
          {shiftSwaps.filter(s => s.status === 'pending').length > 0 && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
              {shiftSwaps.filter(s => s.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('coverage')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'coverage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Coverage Alerts
        </button>
      </div>

      {/* Weekly Schedule View */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                  Employee
                </th>
                {DAYS_OF_WEEK.map((day, index) => (
                  <th key={day} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                    <div>{day.slice(0, 3)}</div>
                    <div className="text-gray-400 font-normal">
                      {new Date(new Date(selectedWeek.start).getTime() + index * 24 * 60 * 60 * 1000).getDate()}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                const schedule = getEmployeeSchedule(employee.id);
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.position}</div>
                      <div className="text-xs text-gray-400">{employee.department}</div>
                    </td>
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const shift = getShiftForDay(schedule, dayIndex);
                      const shiftType = SHIFT_TYPES.find(s => s.id === shift);
                      return (
                        <td key={dayIndex} className="px-3 py-3 text-center">
                          {shift ? (
                            <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${shiftType?.color || 'bg-gray-100'}`}>
                              {shiftType?.name || shift}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {hasAccess('employees', 'edit') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setFormData({
                                employeeId: employee.id,
                                weekStart: selectedWeek.start,
                                shifts: schedule?.shifts || {},
                                notes: schedule?.notes || ''
                              });
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {schedule && (
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Shift Swaps View */}
      {activeTab === 'swaps' && (
        <div className="space-y-4">
          {shiftSwaps.length > 0 ? (
            shiftSwaps.map((swap) => (
              <div key={swap.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        swap.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        swap.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {swap.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Requested on {swap.createdAt?.toDate?.().toLocaleDateString?.()}
                      </span>
                    </div>
                    <p className="text-gray-900">
                      <span className="font-medium">{swap.requesterName}</span> wants to swap 
                      <span className="font-medium"> {swap.originalShift}</span> on 
                      <span className="font-medium"> {swap.date}</span> with 
                      <span className="font-medium"> {swap.recipientName}'s {swap.targetShift}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Reason: {swap.reason}</p>
                  </div>
                  
                  {hasAccess('employees', 'approve') && swap.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveSwap(swap.id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveSwap(swap.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Repeat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No shift swap requests</p>
            </div>
          )}
        </div>
      )}

      {/* Coverage Alerts View */}
      {activeTab === 'coverage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map((day, index) => {
            const coverage = getCoverageStatus(index);
            const totalStaff = filteredEmployees.length;
            const hasGaps = Object.keys(coverage).length < 3; // Assuming we need at least 3 shift types covered
            
            return (
              <div key={day} className={`p-4 rounded-lg border ${hasGaps ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                <h4 className="font-semibold text-gray-900 mb-3">{day}</h4>
                <div className="space-y-2">
                  {SHIFT_TYPES.map(shift => {
                    const count = coverage[shift.id] || 0;
                    const isUnderstaffed = count < 2; // Minimum 2 per shift
                    
                    return (
                      <div key={shift.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{shift.name}</span>
                        <span className={`text-sm font-medium ${
                          count === 0 ? 'text-red-600' :
                          isUnderstaffed ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {count} staff
                        </span>
                      </div>
                    );
                  })}
                </div>
                {hasGaps && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Coverage gaps detected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shift Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Assign Shifts</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              {!formData.employeeId && (
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
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Schedule</label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={day} className="text-center">
                      <p className="text-xs font-medium text-gray-500 mb-1">{day.slice(0, 3)}</p>
                      <select
                        value={formData.shifts[index] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          shifts: {
                            ...formData.shifts,
                            [index]: e.target.value || null
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Off</option>
                        {SHIFT_TYPES.map(shift => (
                          <option key={shift.id} value={shift.id}>{shift.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  placeholder="Any special notes about this schedule..."
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
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
