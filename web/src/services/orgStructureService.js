// Organization Structure Service
export const orgStructureService = {
  // Organization chart helpers
  buildOrgChart: (employees) => {
    const findChildren = (managerId) => {
      return employees.filter(e => e.reportsTo === managerId);
    };

    const buildNode = (employee) => ({
      id: employee.id,
      name: employee.name,
      position: employee.position,
      department: employee.department,
      avatar: employee.photoURL,
      children: findChildren(employee.id).map(buildNode)
    });

    // Find root (CEO/GM)
    const root = employees.find(e => !e.reportsTo || e.reportsTo === 'none');
    return root ? buildNode(root) : null;
  },

  // Department structure
  getDepartmentStructure: (employees, departments) => {
    return departments.map(dept => ({
      ...dept,
      head: employees.find(e => e.id === dept.headId),
      members: employees.filter(e => e.department === dept.name && e.id !== dept.headId),
      count: employees.filter(e => e.department === dept.name).length
    }));
  },

  // Find reporting line
  findReportingLine: (employeeId, employees) => {
    const line = [];
    let current = employees.find(e => e.id === employeeId);
    
    while (current) {
      line.unshift(current);
      current = employees.find(e => e.id === current.reportsTo);
    }
    
    return line;
  },

  // Calculate span of control
  calculateSpanOfControl: (managerId, employees) => {
    const directReports = employees.filter(e => e.reportsTo === managerId).length;
    return {
      direct: directReports,
      recommended: directReports <= 8 ? 'optimal' : directReports <= 12 ? 'acceptable' : 'excessive'
    };
  },

  // Position/Grade levels
  positionLevels: [
    { level: 1, title: 'Executive', examples: ['CEO', 'GM', 'Managing Director'] },
    { level: 2, title: 'Senior Management', examples: ['Director', 'VP', 'Head of Department'] },
    { level: 3, title: 'Middle Management', examples: ['Manager', 'Team Lead', 'Supervisor'] },
    { level: 4, title: 'Professional', examples: ['Specialist', 'Officer', 'Engineer'] },
    { level: 5, title: 'Support', examples: ['Assistant', 'Coordinator', 'Administrator'] }
  ]
};

export default orgStructureService;
