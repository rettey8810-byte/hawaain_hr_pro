// Self Service Portal Service
export const selfServiceService = {
  // Available self-service actions
  availableServices: {
    profile: {
      id: 'profile',
      label: 'Update Profile',
      description: 'Update personal information, contact details',
      icon: 'User',
      allowed: true
    },
    documents: {
      id: 'documents',
      label: 'My Documents',
      description: 'View and upload personal documents',
      icon: 'FileText',
      allowed: true
    },
    payslips: {
      id: 'payslips',
      label: 'Payslips',
      description: 'View and download payslips',
      icon: 'CreditCard',
      allowed: true
    },
    leave: {
      id: 'leave',
      label: 'Leave Balance',
      description: 'Check leave quota and history',
      icon: 'Calendar',
      allowed: true
    },
    attendance: {
      id: 'attendance',
      label: 'My Attendance',
      description: 'View attendance records',
      icon: 'Clock',
      allowed: true
    },
    requests: {
      id: 'requests',
      label: 'My Requests',
      description: 'Track pending requests',
      icon: 'Inbox',
      allowed: true
    },
    certificates: {
      id: 'certificates',
      label: 'Request Certificates',
      description: 'NOC, Experience letters',
      icon: 'FileBadge',
      allowed: true
    },
    training: {
      id: 'training',
      label: 'My Training',
      description: 'Enroll in training courses',
      icon: 'GraduationCap',
      allowed: true
    },
    grievance: {
      id: 'grievance',
      label: 'Submit Grievance',
      description: 'Report issues anonymously',
      icon: 'MessageCircle',
      allowed: true
    },
    suggestion: {
      id: 'suggestion',
      label: 'Suggestion Box',
      description: 'Submit ideas for improvement',
      icon: 'Lightbulb',
      allowed: true
    }
  },

  // Request types
  requestTypes: [
    { id: 'salary-certificate', label: 'Salary Certificate', department: 'hr', duration: '3 days' },
    { id: 'noc', label: 'No Objection Certificate', department: 'hr', duration: '2 days' },
    { id: 'experience-letter', label: 'Experience Letter', department: 'hr', duration: '5 days' },
    { id: 'address-change', label: 'Address Change', department: 'hr', duration: '1 day' },
    { id: 'bank-change', label: 'Bank Account Change', department: 'finance', duration: '3 days' },
    { id: 'emergency-contact', label: 'Emergency Contact Update', department: 'hr', duration: '1 day' },
    { id: 'reference-letter', label: 'Reference Letter', department: 'hr', duration: '5 days' },
    { id: 'loan-request', label: 'Salary Advance/Loan', department: 'finance', duration: '7 days' }
  ],

  // Track request status
  trackRequest: (request) => {
    const submitted = new Date(request.submittedAt);
    const now = new Date();
    const daysElapsed = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
    const expectedDuration = parseInt(request.duration);
    
    return {
      daysElapsed,
      expectedDuration,
      remaining: Math.max(0, expectedDuration - daysElapsed),
      status: daysElapsed > expectedDuration ? 'overdue' : 'on-track',
      urgency: daysElapsed > expectedDuration ? 'high' : 'normal'
    };
  }
};

export default selfServiceService;
