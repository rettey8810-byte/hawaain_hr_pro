// Attendance & Time Tracking Service
export const attendanceService = {
  // Shift types
  shiftTypes: [
    { id: 'morning', label: 'Morning Shift', start: '06:00', end: '14:00' },
    { id: 'day', label: 'Day Shift', start: '08:00', end: '17:00' },
    { id: 'afternoon', label: 'Afternoon Shift', start: '14:00', end: '22:00' },
    { id: 'night', label: 'Night Shift', start: '22:00', end: '06:00' },
    { id: 'split', label: 'Split Shift', start: '08:00', end: '20:00', break: '12:00-14:00' },
    { id: 'rotating', label: 'Rotating', pattern: 'varies' }
  ],

  // Attendance status
  attendanceStatus: [
    { id: 'present', label: 'Present', color: 'green', icon: 'CheckCircle' },
    { id: 'absent', label: 'Absent', color: 'red', icon: 'XCircle' },
    { id: 'late', label: 'Late', color: 'orange', icon: 'Clock' },
    { id: 'early-departure', label: 'Early Departure', color: 'yellow', icon: 'ArrowLeft' },
    { id: 'on-leave', label: 'On Leave', color: 'blue', icon: 'Calendar' },
    { id: 'holiday', label: 'Holiday', color: 'purple', icon: 'Star' },
    { id: 'wfh', label: 'Work From Home', color: 'teal', icon: 'Home' },
    { id: 'business-trip', label: 'Business Trip', color: 'indigo', icon: 'Briefcase' }
  ],

  // Work patterns
  workPatterns: {
    '5-day': { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], rest: ['Sat', 'Sun'] },
    '6-day': { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], rest: ['Sun'] },
    '4x10': { days: ['Mon', 'Tue', 'Wed', 'Thu'], hours: 10 },
    'compressed': { days: ['Mon-Thu'], hours: 9 },
    'rotating': { pattern: 'varies' }
  },

  // Calculate working hours
  calculateWorkingHours: (checkIn, checkOut, breakMinutes = 60) => {
    const start = new Date(`1970-01-01T${checkIn}`);
    const end = new Date(`1970-01-01T${checkOut}`);
    let diffMs = end - start;
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle night shift
    const diffMins = (diffMs / 1000 / 60) - breakMinutes;
    return (diffMins / 60).toFixed(2);
  },

  // Overtime calculation
  calculateOvertime: (regularHours, actualHours) => {
    const overtime = Math.max(0, actualHours - regularHours);
    return {
      regular: Math.min(regularHours, actualHours),
      overtime: overtime,
      total: actualHours
    };
  },

  // Late calculation
  calculateLateMinutes: (scheduledTime, actualTime) => {
    const scheduled = new Date(`1970-01-01T${scheduledTime}`);
    const actual = new Date(`1970-01-01T${actualTime}`);
    const diff = actual - scheduled;
    return diff > 0 ? Math.ceil(diff / 1000 / 60) : 0;
  },

  // Timesheet validation
  validateTimesheet: (entries) => {
    const issues = [];
    
    entries.forEach((entry, index) => {
      // Check for missing check-in/out
      if (!entry.checkIn) issues.push({ day: index + 1, issue: 'Missing check-in' });
      if (!entry.checkOut) issues.push({ day: index + 1, issue: 'Missing check-out' });
      
      // Check for gaps
      if (entry.checkIn && entry.checkOut) {
        const hours = attendanceService.calculateWorkingHours(entry.checkIn, entry.checkOut);
        if (hours < 4) {
          issues.push({ day: index + 1, issue: 'Less than 4 hours worked' });
        }
      }
    });
    
    return issues;
  },

  // Generate attendance summary
  generateSummary: (records, month, year) => {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      wfh: 0,
      totalWorkingDays: 0,
      totalHours: 0,
      overtimeHours: 0
    };
    
    records.forEach(record => {
      summary[record.status] = (summary[record.status] || 0) + 1;
      if (record.status === 'present' || record.status === 'wfh') {
        summary.totalWorkingDays++;
        summary.totalHours += parseFloat(record.hours || 0);
        summary.overtimeHours += parseFloat(record.overtime || 0);
      }
    });
    
    return summary;
  },

  // Biometric device integration (mock)
  syncBiometricData: async (deviceId, date) => {
    // In production, this would connect to biometric device API
    console.log(`Syncing data from device ${deviceId} for ${date}`);
    return { success: true, records: [] };
  }
};

export default attendanceService;
