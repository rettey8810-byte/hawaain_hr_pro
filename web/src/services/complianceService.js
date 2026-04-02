// Compliance & Legal Service
export const complianceService = {
  // Contract types
  contractTypes: [
    { 
      id: 'permanent', 
      label: 'Permanent Contract', 
      duration: 'Indefinite',
      noticePeriod: '30 days',
      benefits: 'Full'
    },
    { 
      id: 'fixed-term', 
      label: 'Fixed-Term Contract', 
      duration: '1-3 years',
      noticePeriod: '30 days',
      benefits: 'Full'
    },
    { 
      id: 'probation', 
      label: 'Probation Contract', 
      duration: '3-6 months',
      noticePeriod: '7 days',
      benefits: 'Limited'
    },
    { 
      id: 'part-time', 
      label: 'Part-Time Contract', 
      duration: 'Indefinite',
      noticePeriod: '14 days',
      benefits: 'Pro-rated'
    },
    { 
      id: 'consultant', 
      label: 'Consultant/Contractor', 
      duration: 'Project based',
      noticePeriod: '7 days',
      benefits: 'None'
    }
  ],

  // Document types
  documentTypes: [
    { id: 'offer-letter', label: 'Offer Letter', category: 'hiring' },
    { id: 'employment-contract', label: 'Employment Contract', category: 'hiring' },
    { id: 'nda', label: 'Non-Disclosure Agreement', category: 'legal' },
    { id: 'non-compete', label: 'Non-Compete Agreement', category: 'legal' },
    { id: 'code-of-conduct', label: 'Code of Conduct', category: 'policy' },
    { id: 'handbook', label: 'Employee Handbook', category: 'policy' },
    { id: 'hr-policy', label: 'HR Policy Manual', category: 'policy' },
    { id: 'safety-policy', label: 'Safety Policy', category: 'policy' },
    { id: 'noc', label: 'No Objection Certificate', category: 'certificate' },
    { id: 'experience', label: 'Experience Certificate', category: 'certificate' },
    { id: 'salary', label: 'Salary Certificate', category: 'certificate' },
    { id: 'termination', label: 'Termination Letter', category: 'termination' }
  ],

  // Labor law compliance areas
  complianceAreas: [
    { 
      id: 'working-hours', 
      label: 'Working Hours', 
      standard: '48 hours/week',
      check: 'Track overtime and breaks'
    },
    { 
      id: 'leave-entitlement', 
      label: 'Leave Entitlements', 
      standard: 'Annual, Sick, Emergency',
      check: 'Ensure minimum days provided'
    },
    { 
      id: 'wages', 
      label: 'Minimum Wages', 
      standard: 'As per labor law',
      check: 'All employees above minimum'
    },
    { 
      id: 'overtime', 
      label: 'Overtime Payment', 
      standard: '1.5x - 2.5x rate',
      check: 'Correct OT calculation'
    },
    { 
      id: 'gratuity', 
      label: 'End of Service Benefits', 
      standard: 'As per labor law',
      check: 'Calculate correctly'
    },
    { 
      id: 'safety', 
      label: 'Workplace Safety', 
      standard: 'OSHA standards',
      check: 'Safe environment'
    },
    { 
      id: 'discrimination', 
      label: 'Anti-Discrimination', 
      standard: 'Equal opportunity',
      check: 'Fair practices'
    },
    { 
      id: 'documentation', 
      label: 'Documentation', 
      standard: 'Complete records',
      check: 'All contracts signed'
    }
  ],

  // Incident types
  incidentTypes: [
    { id: 'workplace-injury', label: 'Workplace Injury', severity: 'high', reportable: true },
    { id: 'safety-violation', label: 'Safety Violation', severity: 'medium', reportable: true },
    { id: 'near-miss', label: 'Near Miss Incident', severity: 'low', reportable: false },
    { id: 'property-damage', label: 'Property Damage', severity: 'medium', reportable: true },
    { id: 'vehicle-incident', label: 'Vehicle Incident', severity: 'high', reportable: true },
    { id: 'fire-incident', label: 'Fire Incident', severity: 'high', reportable: true },
    { id: 'environmental', label: 'Environmental Incident', severity: 'high', reportable: true }
  ],

  // Generate contract
  generateContract: (type, employee, terms) => {
    const contractTemplates = {
      permanent: `EMPLOYMENT CONTRACT\n\nThis Employment Contract is made between:\n\nEmployer: [Company Name]\nEmployee: ${employee.name}\n\nPosition: ${terms.position}\nDepartment: ${terms.department}\nStart Date: ${terms.startDate}\n\nTerms and Conditions:\n1. Employment Type: Permanent\n2. Working Hours: ${terms.workingHours}\n3. Salary: ${terms.salary}\n4. Benefits: ${terms.benefits.join(', ')}\n5. Notice Period: 30 days\n\nBoth parties agree to the terms above.`,

      'fixed-term': `FIXED-TERM EMPLOYMENT CONTRACT\n\nEmployer: [Company Name]\nEmployee: ${employee.name}\n\nPosition: ${terms.position}\nDuration: ${terms.duration}\nStart Date: ${terms.startDate}\nEnd Date: ${terms.endDate}\n\nThis contract is for a fixed term and will automatically terminate on the end date unless extended by mutual agreement.`
    };

    return contractTemplates[type] || 'Template not found';
  },

  // Generate NOC
  generateNOC: (employee, purpose) => {
    return `NO OBJECTION CERTIFICATE\n\nDate: ${new Date().toLocaleDateString()}\n\nTo Whom It May Concern,\n\nThis is to certify that ${employee.name} (Employee ID: ${employee.employeeId}) is currently employed with us as ${employee.position} in the ${employee.department} department.\n\nWe have no objection to ${purpose}.\n\nThis certificate is issued upon request.\n\nFor [Company Name]\n\nHR Manager\n[Signature]`;
  },

  // Generate experience certificate
  generateExperienceCertificate: (employee) => {
    const duration = Math.ceil((new Date() - new Date(employee.joinDate)) / (1000 * 60 * 60 * 24 * 30));
    
    return `EXPERIENCE CERTIFICATE\n\nDate: ${new Date().toLocaleDateString()}\n\nTo Whom It May Concern,\n\nThis is to certify that ${employee.name} (Employee ID: ${employee.employeeId}) worked with us from ${new Date(employee.joinDate).toLocaleDateString()} to ${new Date().toLocaleDateString()}.\n\nPosition: ${employee.position}\nDepartment: ${employee.department}\nDuration: ${duration} months\n\nDuring their tenure, they were responsible for:\n- [Responsibilities]\n\nTheir performance was satisfactory, and we wish them success in future endeavors.\n\nFor [Company Name]\n\nHR Manager\n[Signature]`;
  },

  // Compliance checklist
  complianceChecklist: {
    preEmployment: [
      'Valid work permit/visa',
      'Background check completed',
      'Reference checks done',
      'Medical fitness certificate',
      'Signed employment contract'
    ],
    duringEmployment: [
      'Monthly salary payment on time',
      'Leave records maintained',
      'Overtime properly compensated',
      'Safety training provided',
      'Annual performance reviews'
    ],
    postEmployment: [
      'Final settlement paid',
      'End of service calculated',
      'Experience certificate issued',
      'Work permit cancellation'
    ]
  },

  // Track compliance status
  trackCompliance: (checks) => {
    const total = checks.length;
    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const pending = checks.filter(c => c.status === 'pending').length;

    return {
      total,
      passed,
      failed,
      pending,
      complianceRate: ((passed / total) * 100).toFixed(1),
      status: failed === 0 ? 'compliant' : failed > 3 ? 'non-compliant' : 'at-risk'
    };
  }
};

export default complianceService;
