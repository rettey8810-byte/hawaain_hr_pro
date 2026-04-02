// Employee Engagement Service
export const engagementService = {
  // Survey types
  surveyTypes: [
    { 
      id: 'pulse', 
      label: 'Pulse Survey', 
      frequency: 'monthly',
      duration: '5-10 minutes',
      questions: 10
    },
    { 
      id: 'engagement', 
      label: 'Engagement Survey', 
      frequency: 'quarterly',
      duration: '15-20 minutes',
      questions: 25
    },
    { 
      id: 'satisfaction', 
      label: 'Job Satisfaction', 
      frequency: 'annually',
      duration: '10-15 minutes',
      questions: 20
    },
    { 
      id: 'exit', 
      label: 'Exit Survey', 
      frequency: 'on-demand',
      duration: '10-15 minutes',
      questions: 15
    },
    { 
      id: 'onboarding', 
      label: 'Onboarding Feedback', 
      frequency: '30-60-90 days',
      duration: '5-10 minutes',
      questions: 12
    }
  ],

  // Engagement question categories
  questionCategories: {
    satisfaction: [
      'I am satisfied with my job',
      'I feel valued at work',
      'My work is meaningful',
      'I have the resources to do my job well'
    ],
    management: [
      'My manager provides clear direction',
      'I receive regular feedback',
      'My manager supports my development',
      'Communication from management is effective'
    ],
    teamwork: [
      'I have good working relationships',
      'Teamwork is encouraged',
      'Collaboration is effective',
      'I feel part of a team'
    ],
    growth: [
      'I have opportunities to learn',
      'Career growth is possible',
      'Training is provided',
      'My development is supported'
    ],
    wellbeing: [
      'Work-life balance is good',
      'Stress levels are manageable',
      'The workplace is safe',
      'Wellness programs are available'
    ]
  },

  // Recognition types
  recognitionTypes: [
    { id: 'kudos', label: 'Kudos/Thanks', points: 10, icon: 'ThumbsUp' },
    { id: 'excellence', label: 'Excellence Award', points: 50, icon: 'Award' },
    { id: 'innovation', label: 'Innovation', points: 75, icon: 'Lightbulb' },
    { id: 'team-player', label: 'Team Player', points: 30, icon: 'Users' },
    { id: 'leadership', label: 'Leadership', points: 100, icon: 'Crown' },
    { id: 'milestone', label: 'Milestone', points: 25, icon: 'Target' }
  ],

  // Event types
  eventTypes: [
    { id: 'team-building', label: 'Team Building', category: 'team' },
    { id: 'social', label: 'Social Event', category: 'social' },
    { id: 'celebration', label: 'Celebration', category: 'social' },
    { id: 'volunteer', label: 'Volunteering', category: 'csr' },
    { id: 'wellness', label: 'Wellness Activity', category: 'health' },
    { id: 'training', label: 'Training Workshop', category: 'development' },
    { id: 'townhall', label: 'Town Hall', category: 'company' },
    { id: 'sports', label: 'Sports Tournament', category: 'recreation' }
  ],

  // Calculate engagement score
  calculateEngagementScore: (responses) => {
    const total = responses.reduce((sum, r) => sum + r.rating, 0);
    const average = total / responses.length;
    return Math.round((average / 5) * 100); // Convert to 0-100 scale
  },

  // Calculate eNPS (Employee Net Promoter Score)
  calculateENPS: (responses) => {
    const promoters = responses.filter(r => r >= 9).length;
    const detractors = responses.filter(r => r <= 6).length;
    const total = responses.length;
    return Math.round(((promoters - detractors) / total) * 100);
  },

  // Generate recognition certificate
  generateRecognition: (employee, type, reason, givenBy) => {
    const recognitionType = engagementService.recognitionTypes.find(r => r.id === type);
    return {
      recipient: employee,
      type: recognitionType,
      reason,
      givenBy,
      date: new Date().toISOString(),
      certificateId: `REC-${Date.now()}`,
      points: recognitionType?.points || 0
    };
  },

  // Event participation tracking
  trackEventParticipation: (event, employees) => {
    return {
      eventId: event.id,
      eventName: event.name,
      totalInvited: employees.length,
      confirmed: employees.filter(e => e.status === 'confirmed').length,
      attended: employees.filter(e => e.status === 'attended').length,
      noShow: employees.filter(e => e.status === 'no-show').length,
      feedback: employees.filter(e => e.feedbackSubmitted).length,
      satisfactionScore: employees.reduce((sum, e) => sum + (e.rating || 0), 0) / employees.length
    };
  },

  // Anniversary alerts
  getWorkAnniversaries: (employees) => {
    const today = new Date();
    return employees.map(emp => {
      const joinDate = new Date(emp.joinDate);
      const years = today.getFullYear() - joinDate.getFullYear();
      const thisYearAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
      
      if (thisYearAnniversary > today && thisYearAnniversary <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        return { ...emp, anniversaryYears: years, anniversaryDate: thisYearAnniversary };
      }
      return null;
    }).filter(Boolean);
  },

  // Birthday alerts
  getUpcomingBirthdays: (employees, days = 30) => {
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return employees.map(emp => {
      if (!emp.dateOfBirth) return null;
      const dob = new Date(emp.dateOfBirth);
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      
      if (thisYearBirthday >= today && thisYearBirthday <= future) {
        return { ...emp, birthday: thisYearBirthday, age: today.getFullYear() - dob.getFullYear() };
      }
      return null;
    }).filter(Boolean).sort((a, b) => a.birthday - b.birthday);
  }
};

export default engagementService;
