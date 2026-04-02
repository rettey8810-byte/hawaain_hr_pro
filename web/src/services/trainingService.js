// Training & Development Service
export const trainingService = {
  // Training types
  trainingTypes: [
    { id: 'induction', label: 'Induction/Orientation', category: 'onboarding' },
    { id: 'technical', label: 'Technical Skills', category: 'skills' },
    { id: 'soft-skills', label: 'Soft Skills', category: 'skills' },
    { id: 'compliance', label: 'Compliance/Mandatory', category: 'mandatory' },
    { id: 'leadership', label: 'Leadership', category: 'management' },
    { id: 'safety', label: 'Safety Training', category: 'mandatory' },
    { id: 'product', label: 'Product Knowledge', category: 'skills' },
    { id: 'certification', label: 'Certification Prep', category: 'certification' }
  ],

  // Training delivery methods
  deliveryMethods: [
    { id: 'classroom', label: 'Classroom', icon: 'Users' },
    { id: 'virtual', label: 'Virtual/Online', icon: 'Monitor' },
    { id: 'webinar', label: 'Webinar', icon: 'Video' },
    { id: 'elearning', label: 'E-Learning', icon: 'Laptop' },
    { id: 'workshop', label: 'Workshop', icon: 'Wrench' },
    { id: 'onjob', label: 'On-the-Job', icon: 'Briefcase' },
    { id: 'mentoring', label: 'Mentoring', icon: 'UserCheck' }
  ],

  // Training status
  trainingStatus: [
    { id: 'scheduled', label: 'Scheduled', color: 'blue' },
    { id: 'in-progress', label: 'In Progress', color: 'yellow' },
    { id: 'completed', label: 'Completed', color: 'green' },
    { id: 'cancelled', label: 'Cancelled', color: 'red' },
    { id: 'postponed', label: 'Postponed', color: 'orange' }
  ],

  // Skills matrix categories
  skillCategories: {
    technical: ['Programming', 'Data Analysis', 'Project Management', 'Design', 'Writing'],
    soft: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management'],
    domain: ['Industry Knowledge', 'Product Knowledge', 'Customer Service', 'Sales'],
    tools: ['MS Office', 'CRM Software', 'ERP Systems', 'Design Tools']
  },

  // Certification tracking
  certificationTypes: [
    { name: 'PMP', validity: 36, category: 'project-management' },
    { name: 'AWS Certified', validity: 36, category: 'technical' },
    { name: 'Scrum Master', validity: 24, category: 'agile' },
    { name: 'First Aid', validity: 24, category: 'safety' },
    { name: 'Safety Officer', validity: 12, category: 'safety' },
    { name: 'ISO 9001', validity: 36, category: 'quality' }
  ],

  // Training calendar helpers
  generateTrainingCalendar: (year, month) => {
    // Generate monthly training calendar
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return { startDate, endDate };
  },

  // Calculate training effectiveness
  calculateEffectiveness: (preScore, postScore) => {
    if (preScore === 0) return 0;
    return ((postScore - preScore) / preScore) * 100;
  },

  // Training cost calculation
  calculateTrainingCost: (participants, duration, ratePerHour, materials) => {
    const facilitatorCost = duration * ratePerHour;
    const materialCost = participants * materials;
    const venueCost = duration * 50; // example
    return {
      facilitator: facilitatorCost,
      materials: materialCost,
      venue: venueCost,
      total: facilitatorCost + materialCost + venueCost,
      perParticipant: (facilitatorCost + materialCost + venueCost) / participants
    };
  },

  // Check certification expiry
  checkCertificationExpiry: (certifications) => {
    const today = new Date();
    return certifications.map(cert => {
      const expiry = new Date(cert.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return {
        ...cert,
        daysUntilExpiry,
        status: daysUntilExpiry <= 30 ? 'expiring-soon' : 
                daysUntilExpiry <= 0 ? 'expired' : 'valid'
      };
    });
  }
};

export default trainingService;
