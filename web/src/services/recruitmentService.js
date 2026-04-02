// Recruitment Service - Job postings and applicant tracking
export const recruitmentService = {
  // Job posting templates
  jobTemplates: {
    fullTime: {
      type: 'Full-time',
      benefits: ['Health Insurance', 'Paid Leave', 'Annual Bonus'],
      employmentType: 'Permanent'
    },
    partTime: {
      type: 'Part-time',
      benefits: ['Flexible Hours'],
      employmentType: 'Contract'
    },
    contract: {
      type: 'Contract',
      benefits: ['Project Based'],
      employmentType: 'Fixed Term'
    }
  },

  // Application pipeline stages
  pipelineStages: [
    { id: 'new', label: 'New Application', color: 'gray' },
    { id: 'screening', label: 'Screening', color: 'blue' },
    { id: 'interview', label: 'Interview', color: 'purple' },
    { id: 'assessment', label: 'Assessment', color: 'orange' },
    { id: 'offer', label: 'Offer Pending', color: 'yellow' },
    { id: 'hired', label: 'Hired', color: 'green' },
    { id: 'rejected', label: 'Rejected', color: 'red' },
    { id: 'withdrawn', label: 'Withdrawn', color: 'gray' }
  ],

  // Email templates
  emailTemplates: {
    applicationReceived: (candidate) => ({
      subject: `Application Received - ${candidate.position}`,
      body: `Dear ${candidate.name},\n\nThank you for applying for the ${candidate.position} position. We have received your application and will review it shortly.\n\nBest regards,\nHR Team`
    }),
    interviewInvite: (candidate, interview) => ({
      subject: `Interview Invitation - ${candidate.position}`,
      body: `Dear ${candidate.name},\n\nWe are pleased to invite you for an interview for the ${candidate.position} position.\n\nDate: ${interview.date}\nTime: ${interview.time}\nLocation: ${interview.location || 'Virtual'}\n\nPlease confirm your availability.\n\nBest regards,\nHR Team`
    }),
    offerLetter: (candidate, offer) => ({
      subject: `Job Offer - ${candidate.position}`,
      body: `Dear ${candidate.name},\n\nWe are delighted to offer you the position of ${candidate.position}.\n\nStart Date: ${offer.startDate}\nSalary: ${offer.salary}\nBenefits: ${offer.benefits.join(', ')}\n\nPlease sign and return the attached offer letter.\n\nBest regards,\nHR Team`
    })
  },

  // Interview scheduling
  scheduleInterview: async (candidateId, interviewData) => {
    // Mock interview scheduling
    console.log('Interview scheduled:', { candidateId, ...interviewData });
    return { success: true, interviewId: `INT-${Date.now()}` };
  },

  // Calculate time-to-hire
  calculateTimeToHire: (applicationDate, hireDate) => {
    const start = new Date(applicationDate);
    const end = new Date(hireDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  },

  // Source tracking
  trackSource: (source) => {
    const sources = {
      'linkedin': 'LinkedIn',
      'indeed': 'Indeed',
      'company-website': 'Company Website',
      'referral': 'Employee Referral',
      'job-board': 'Job Board',
      'agency': 'Recruitment Agency',
      'walk-in': 'Walk-in',
      'other': 'Other'
    };
    return sources[source] || source;
  }
};

export default recruitmentService;
