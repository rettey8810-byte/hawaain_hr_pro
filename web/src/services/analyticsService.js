// HR Analytics & Reporting Service
export const analyticsService = {
  // Key HR Metrics
  metrics: {
    headcount: {
      label: 'Total Headcount',
      description: 'Current active employees',
      formula: (employees) => employees.filter(e => e.status === 'active').length
    },
    turnover: {
      label: 'Turnover Rate',
      description: 'Percentage of employees who left',
      formula: (left, total) => ((left / total) * 100).toFixed(1)
    },
    absenteeism: {
      label: 'Absenteeism Rate',
      description: 'Unplanned absence percentage',
      formula: (absentDays, workingDays) => ((absentDays / workingDays) * 100).toFixed(1)
    },
    timeToHire: {
      label: 'Time to Hire',
      description: 'Average days from application to hire',
      formula: (dates) => dates.reduce((a, b) => a + b, 0) / dates.length
    },
    costPerHire: {
      label: 'Cost per Hire',
      description: 'Total recruitment cost per new hire',
      formula: (totalCost, hires) => totalCost / hires
    },
    retention: {
      label: 'Retention Rate',
      description: 'Percentage of employees retained',
      formula: (retained, total) => ((retained / total) * 100).toFixed(1)
    }
  },

  // Dashboard widgets
  dashboardWidgets: [
    { id: 'headcount', type: 'stat', title: 'Total Employees', icon: 'Users' },
    { id: 'new-hires', type: 'stat', title: 'New Hires (30d)', icon: 'UserPlus' },
    { id: 'turnover', type: 'stat', title: 'Turnover Rate', icon: 'TrendingUp' },
    { id: 'open-positions', type: 'stat', title: 'Open Positions', icon: 'Briefcase' },
    { id: 'attendance', type: 'chart', title: 'Attendance Overview', chartType: 'pie' },
    { id: 'department', type: 'chart', title: 'Headcount by Department', chartType: 'bar' },
    { id: 'gender', type: 'chart', title: 'Gender Diversity', chartType: 'doughnut' },
    { id: 'tenure', type: 'chart', title: 'Tenure Distribution', chartType: 'bar' }
  ],

  // Report templates
  reportTemplates: {
    headcount: {
      title: 'Headcount Report',
      sections: ['summary', 'by-department', 'by-location', 'trends'],
      filters: ['date-range', 'department', 'location', 'employment-type']
    },
    recruitment: {
      title: 'Recruitment Report',
      sections: ['openings', 'applicants', 'hires', 'time-to-fill', 'source-analysis'],
      filters: ['date-range', 'position', 'department', 'recruiter']
    },
    turnover: {
      title: 'Turnover Analysis',
      sections: ['summary', 'reasons', 'by-department', 'by-tenure', 'exit-interviews'],
      filters: ['date-range', 'department', 'reason', 'voluntary-involuntary']
    },
    attendance: {
      title: 'Attendance Report',
      sections: ['summary', 'late-comers', 'absentees', 'overtime', 'leave-balance'],
      filters: ['date-range', 'department', 'employee', 'shift']
    },
    payroll: {
      title: 'Payroll Summary',
      sections: ['total-cost', 'by-department', 'overtime-cost', 'deductions'],
      filters: ['month', 'year', 'department', 'cost-center']
    }
  },

  // Demographics analysis
  analyzeDemographics: (employees) => {
    const analysis = {
      gender: {},
      age: { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '60+': 0 },
      tenure: { '0-1': 0, '1-3': 0, '3-5': 0, '5-10': 0, '10+': 0 },
      nationality: {},
      education: {}
    };

    employees.forEach(emp => {
      // Gender
      analysis.gender[emp.gender] = (analysis.gender[emp.gender] || 0) + 1;
      
      // Age groups
      if (emp.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(emp.dateOfBirth).getFullYear();
        if (age <= 30) analysis.age['20-30']++;
        else if (age <= 40) analysis.age['31-40']++;
        else if (age <= 50) analysis.age['41-50']++;
        else if (age <= 60) analysis.age['51-60']++;
        else analysis.age['60+']++;
      }
      
      // Tenure
      if (emp.joinDate) {
        const years = (new Date() - new Date(emp.joinDate)) / (1000 * 60 * 60 * 24 * 365);
        if (years < 1) analysis.tenure['0-1']++;
        else if (years < 3) analysis.tenure['1-3']++;
        else if (years < 5) analysis.tenure['3-5']++;
        else if (years < 10) analysis.tenure['5-10']++;
        else analysis.tenure['10+']++;
      }
    });

    return analysis;
  },

  // Turnover analysis
  analyzeTurnover: (exits, timeRange) => {
    const analysis = {
      total: exits.length,
      voluntary: exits.filter(e => e.reasonCategory === 'voluntary').length,
      involuntary: exits.filter(e => e.reasonCategory === 'involuntary').length,
      topReasons: {},
      byDepartment: {},
      byMonth: {}
    };

    exits.forEach(exit => {
      // Top reasons
      analysis.topReasons[exit.reason] = (analysis.topReasons[exit.reason] || 0) + 1;
      
      // By department
      analysis.byDepartment[exit.department] = (analysis.byDepartment[exit.department] || 0) + 1;
      
      // By month
      const month = new Date(exit.exitDate).toLocaleString('default', { month: 'short' });
      analysis.byMonth[month] = (analysis.byMonth[month] || 0) + 1;
    });

    return analysis;
  },

  // Export helper
  exportToCSV: (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Calculate diversity index
  calculateDiversityIndex: (demographics) => {
    const total = Object.values(demographics).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    // Simpson's Diversity Index
    let sumSquared = 0;
    Object.values(demographics).forEach(count => {
      const proportion = count / total;
      sumSquared += proportion * proportion;
    });
    
    return (1 - sumSquared).toFixed(2);
  }
};

export default analyticsService;
