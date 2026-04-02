// HR Operations Service - Disciplinary, Grievances, Exit
export const operationsService = {
  // Disciplinary action types
  disciplinaryTypes: [
    { 
      id: 'verbal-warning', 
      label: 'Verbal Warning', 
      severity: 1, 
      description: 'Informal verbal caution',
      duration: null
    },
    { 
      id: 'written-warning', 
      label: 'Written Warning', 
      severity: 2, 
      description: 'Formal written warning',
      duration: 180 // days
    },
    { 
      id: 'final-warning', 
      label: 'Final Written Warning', 
      severity: 3, 
      description: 'Last warning before termination',
      duration: 365 // days
    },
    { 
      id: 'suspension', 
      label: 'Suspension', 
      severity: 4, 
      description: 'Paid or unpaid suspension',
      duration: '1-14 days'
    },
    { 
      id: 'demotion', 
      label: 'Demotion', 
      severity: 4, 
      description: 'Reduction in grade/salary',
      duration: null
    },
    { 
      id: 'termination', 
      label: 'Termination', 
      severity: 5, 
      description: 'Dismissal from employment',
      duration: null
    }
  ],

  // Incident categories
  incidentCategories: [
    { id: 'attendance', label: 'Attendance Issues' },
    { id: 'performance', label: 'Performance Issues' },
    { id: 'conduct', label: 'Misconduct' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'discrimination', label: 'Discrimination' },
    { id: 'safety', label: 'Safety Violation' },
    { id: 'theft', label: 'Theft/Fraud' },
    { id: 'conflict', label: 'Workplace Conflict' },
    { id: 'substance', label: 'Substance Abuse' },
    { id: 'confidentiality', label: 'Breach of Confidentiality' }
  ],

  // Grievance types
  grievanceTypes: [
    { id: 'bullying', label: 'Bullying/Harassment', urgency: 'high' },
    { id: 'discrimination', label: 'Discrimination', urgency: 'high' },
    { id: 'pay', label: 'Pay Dispute', urgency: 'medium' },
    { id: 'conditions', label: 'Working Conditions', urgency: 'medium' },
    { id: 'management', label: 'Management Issues', urgency: 'medium' },
    { id: 'policy', label: 'Policy Concerns', urgency: 'low' },
    { id: 'colleague', label: 'Colleague Conflict', urgency: 'medium' },
    { id: 'other', label: 'Other', urgency: 'low' }
  ],

  // Grievance status
  grievanceStatus: [
    { id: 'submitted', label: 'Submitted', color: 'gray' },
    { id: 'under-review', label: 'Under Review', color: 'blue' },
    { id: 'investigating', label: 'Investigating', color: 'yellow' },
    { id: 'mediation', label: 'In Mediation', color: 'purple' },
    { id: 'resolved', label: 'Resolved', color: 'green' },
    { id: 'escalated', label: 'Escalated', color: 'orange' },
    { id: 'withdrawn', label: 'Withdrawn', color: 'gray' }
  ],

  // Exit checklist items
  exitChecklist: {
    hr: [
      'Conduct exit interview',
      'Process final paycheck',
      'Calculate end of service',
      'Update HR records',
      'Process benefits cancellation',
      'Remove from payroll'
    ],
    it: [
      'Disable system access',
      'Collect IT equipment',
      'Backup and transfer data',
      'Remove email account',
      'Disable VPN access'
    ],
    finance: [
      'Clear outstanding loans',
      'Process expense claims',
      'Cancel company credit card',
      'Clear advance payments'
    ],
    admin: [
      'Collect access cards',
      'Update phone directory',
      'Return office keys',
      'Clear desk/workspace',
      'Return uniform/items'
    ],
    manager: [
      'Knowledge transfer',
      'Handover documents',
      'Complete pending tasks',
      'Return department assets',
      'Team notification'
    ]
  },

  // Exit reasons
  exitReasons: [
    { id: 'resignation', label: 'Resignation', category: 'voluntary' },
    { id: 'retirement', label: 'Retirement', category: 'voluntary' },
    { id: 'end-contract', label: 'End of Contract', category: 'neutral' },
    { id: 'termination', label: 'Termination', category: 'involuntary' },
    { id: 'redundancy', label: 'Redundancy/Layoff', category: 'involuntary' },
    { id: 'medical', label: 'Medical Reasons', category: 'neutral' },
    { id: 'relocation', label: 'Relocation', category: 'voluntary' },
    { id: 'better-opportunity', label: 'Better Opportunity', category: 'voluntary' },
    { id: 'personal', label: 'Personal Reasons', category: 'voluntary' },
    { id: 'dissatisfaction', label: 'Job Dissatisfaction', category: 'voluntary' }
  ],

  // Generate disciplinary letter
  generateDisciplinaryLetter: (action, employee, incident) => {
    const templates = {
      'verbal-warning': `VERBAL WARNING RECORD\n\nEmployee: ${employee.name}\nDate: ${new Date().toLocaleDateString()}\n\nThis documents that the above employee has received a verbal warning regarding:\n\n${incident.description}\n\nExpected Improvement: ${incident.improvement}\n\nSupervisor: _________________`,
      
      'written-warning': `WRITTEN WARNING\n\nDear ${employee.name},\n\nThis letter serves as a formal written warning regarding:\n\nIncident: ${incident.description}\nDate: ${incident.date}\n\nThis warning will remain on your file for 6 months. Further incidents may result in more serious disciplinary action.\n\nAcknowledgment: _________________`
    };
    
    return templates[action.id] || 'Template not found';
  },

  // Calculate notice period
  calculateNoticePeriod: (joinDate, category = 'standard') => {
    const periods = {
      'probation': { days: 7, label: '7 days' },
      'standard': { days: 30, label: '30 days' },
      'senior': { days: 60, label: '60 days' },
      'executive': { days: 90, label: '90 days' }
    };
    return periods[category] || periods.standard;
  },

  // Grievance timeline tracking
  trackGrievanceTimeline: (grievance) => {
    const submitted = new Date(grievance.submittedAt);
    const now = new Date();
    const daysOpen = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
    
    return {
      daysOpen,
      sla: grievance.urgency === 'high' ? 7 : grievance.urgency === 'medium' ? 14 : 30,
      status: daysOpen > (grievance.urgency === 'high' ? 7 : grievance.urgency === 'medium' ? 14 : 30) ? 'overdue' : 'on-track'
    };
  }
};

export default operationsService;
