// Performance Management Service
export const performanceService = {
  // Review cycle types
  reviewCycles: {
    annual: { label: 'Annual Review', frequency: 'yearly', months: 12 },
    quarterly: { label: 'Quarterly Review', frequency: 'quarterly', months: 3 },
    probation: { label: 'Probation Review', frequency: 'once', months: 3 },
    midYear: { label: 'Mid-Year Review', frequency: 'yearly', months: 6 },
    adHoc: { label: 'Ad-hoc Review', frequency: 'as-needed', months: 0 }
  },

  // Performance rating scale
  ratingScale: [
    { value: 1, label: 'Below Expectations', color: 'red', description: 'Performance needs significant improvement' },
    { value: 2, label: 'Partially Meets', color: 'orange', description: 'Some objectives met, improvement needed' },
    { value: 3, label: 'Meets Expectations', color: 'yellow', description: 'Consistently meets job requirements' },
    { value: 4, label: 'Exceeds Expectations', color: 'light-green', description: 'Regularly exceeds expectations' },
    { value: 5, label: 'Outstanding', color: 'green', description: 'Exceptional performance and contribution' }
  ],

  // Competency framework
  competencies: {
    technical: {
      category: 'Technical Skills',
      items: [
        'Job Knowledge',
        'Technical Expertise',
        'Quality of Work',
        'Problem Solving'
      ]
    },
    behavioral: {
      category: 'Behavioral Competencies',
      items: [
        'Communication',
        'Teamwork',
        'Adaptability',
        'Initiative',
        'Leadership'
      ]
    },
    business: {
      category: 'Business Acumen',
      items: [
        'Strategic Thinking',
        'Decision Making',
        'Customer Focus',
        'Innovation'
      ]
    }
  },

  // 360 Feedback questions
  feedbackQuestions: {
    manager: [
      'How well does the employee meet deadlines?',
      'How effectively does the employee communicate?',
      'How well does the employee handle pressure?',
      'What are the employee\'s key strengths?',
      'What areas need improvement?'
    ],
    peer: [
      'How well does this person collaborate with the team?',
      'How reliable is this person in delivering work?',
      'How well do they share knowledge and help others?',
      'What do you appreciate most about working with them?'
    ],
    self: [
      'What were your key accomplishments this period?',
      'What challenges did you face and how did you overcome them?',
      'What skills would you like to develop?',
      'What support do you need from your manager?'
    ],
    directReport: [
      'How well does your manager provide guidance?',
      'How effectively do they support your development?',
      'How well do they communicate expectations?',
      'What could they do better as a leader?'
    ]
  },

  // Goal setting templates
  goalTemplates: {
    smart: {
      name: 'SMART Goals',
      description: 'Specific, Measurable, Achievable, Relevant, Time-bound',
      fields: ['specific', 'measurable', 'achievable', 'relevant', 'timeBound']
    },
    okr: {
      name: 'OKRs',
      description: 'Objectives and Key Results',
      fields: ['objective', 'keyResults', 'target', 'current']
    },
    kpi: {
      name: 'KPIs',
      description: 'Key Performance Indicators',
      fields: ['indicator', 'target', 'actual', 'weight']
    }
  },

  // Performance improvement plan (PIP) template
  pipTemplate: {
    sections: [
      { title: 'Performance Concerns', description: 'Specific areas requiring improvement' },
      { title: 'Expected Standards', description: 'Clear expectations to be met' },
      { title: 'Support Provided', description: 'Training, coaching, resources' },
      { title: 'Timeline', description: 'Review checkpoints' },
      { title: 'Consequences', description: 'If improvement not achieved' }
    ],
    durations: [30, 60, 90] // days
  },

  // Calculate performance score
  calculateScore: (ratings) => {
    const sum = ratings.reduce((a, b) => a + b, 0);
    return (sum / ratings.length).toFixed(2);
  },

  // Generate performance report
  generateReport: (employeeId, reviewData) => {
    return {
      employeeId,
      overallRating: performanceService.calculateScore(reviewData.ratings),
      strengths: reviewData.strengths || [],
      improvements: reviewData.improvements || [],
      goals: reviewData.goals || [],
      recommendations: reviewData.recommendations || [],
      generatedAt: new Date().toISOString()
    };
  }
};

export default performanceService;
