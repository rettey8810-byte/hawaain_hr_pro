/**
 * Approval Workflow Data Models
 * 
 * Workflows:
 * 1. Payroll Approval: HRM → GM
 * 2. Leave Approval: Supervisor → Dept Head → HRM → GM (4-level)
 * 3. Promotion/Salary: HOD → HRM → GM
 * 4. Disciplinary Action: HOD → HRM → GM
 * 5. Recruitment: HOD → HRM → GM
 */

// Payroll Approval Schema
export const PayrollApprovalSchema = {
  collection: 'payrollApprovals',
  fields: {
    // Employee & Payroll Info
    employeeId: 'string',           // Reference to employee
    employeeName: 'string',
    employeeCode: 'string',
    department: 'string',
    position: 'string',
    
    // Payroll Period
    payrollMonth: 'string',           // e.g., "January 2026"
    payrollYear: 'number',
    periodStart: 'string',          // ISO date
    periodEnd: 'string',
    
    // Salary Details
    currentSalary: {
      basic: 'number',
      allowances: 'number',
      total: 'number'
    },
    
    // Payroll Calculations
    earnings: {
      basic: 'number',
      housingAllowance: 'number',
      transportAllowance: 'number',
      otherAllowances: 'number',
      overtime: 'number',
      totalEarnings: 'number'
    },
    deductions: {
      incomeTax: 'number',
      pension: 'number',
      healthInsurance: 'number',
      loanDeductions: 'number',
      otherDeductions: 'number',
      totalDeductions: 'number'
    },
    netPay: 'number',
    
    // Approval Workflow
    workflow: {
      currentStage: 'string',         // 'hrm_review', 'gm_review', 'approved', 'rejected'
      stages: [
        {
          stage: 'hrm_review',
          status: 'pending',          // pending, approved, rejected
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          date: 'string',             // ISO timestamp
          comments: 'string',
          action: 'string'            // approved, rejected, returned
        },
        {
          stage: 'gm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          date: 'string',
          comments: 'string',
          action: 'string'
        }
      ]
    },
    
    // Status
    status: 'string',                 // draft, pending_hrm, pending_gm, approved, rejected
    
    // Audit
    raisedBy: 'string',               // User ID who created
    raisedByName: 'string',
    raisedAt: 'string',
    companyId: 'string',
    
    // Document Generation
    letterGenerated: 'boolean',
    letterUrl: 'string',
    letterDate: 'string'
  }
};

// Promotion/Salary Increase Schema
export const PromotionSchema = {
  collection: 'promotions',
  fields: {
    // Employee Info
    employeeId: 'string',
    employeeName: 'string',
    employeeCode: 'string',
    currentDepartment: 'string',
    currentPosition: 'string',
    
    // Current Details
    currentSalary: {
      basic: 'number',
      housingAllowance: 'number',
      transportAllowance: 'number',
      otherAllowances: 'number',
      total: 'number'
    },
    
    // Promotion Type
    type: 'string',                   // 'promotion', 'salary_increase', 'position_change'
    
    // Proposed Changes
    proposedDepartment: 'string',       // For position change/promotion
    proposedPosition: 'string',
    effectiveDate: 'string',
    
    // Proposed Salary
    proposedSalary: {
      basic: 'number',
      housingAllowance: 'number',
      transportAllowance: 'number',
      otherAllowances: 'number',
      total: 'number',
      increasePercentage: 'number',
      increaseAmount: 'number'
    },
    
    // Justification
    reason: 'string',                 // Detailed justification
    achievements: 'string',             // Employee achievements
    performanceRating: 'string',      // Performance evaluation
    
    // Approval Workflow: HOD → HRM → GM
    workflow: {
      currentStage: 'string',         // 'hod_review', 'hrm_review', 'gm_review', 'approved', 'rejected'
      stages: [
        {
          stage: 'hod_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          department: 'string',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'           // Digital signature reference
        },
        {
          stage: 'hrm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          date: 'string',
          comments: 'string',
          validationNotes: 'string',      // HRM validation comments
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'gm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        }
      ]
    },
    
    // Status
    status: 'string',                 // draft, pending_hod, pending_hrm, pending_gm, approved, rejected
    
    // Audit
    raisedBy: 'string',
    raisedByName: 'string',
    raisedByRole: 'string',
    raisedAt: 'string',
    companyId: 'string',
    
    // Document
    letterGenerated: 'boolean',
    letterUrl: 'string',
    letterDate: 'string',
    signedByEmployee: 'boolean',
    employeeSignatureDate: 'string'
  }
};

// Disciplinary Action Schema
export const DisciplinarySchema = {
  collection: 'disciplinaryActions',
  fields: {
    // Employee Info
    employeeId: 'string',
    employeeName: 'string',
    employeeCode: 'string',
    department: 'string',
    position: 'string',
    
    // Incident Details
    incidentDate: 'string',
    reportedDate: 'string',
    incidentLocation: 'string',
    incidentDescription: 'string',
    witnesses: 'string',              // Names of witnesses
    
    // Violation Details
    violationType: 'string',          // 'misconduct', 'attendance', 'performance', 'policy_violation', 'other'
    policyViolated: 'string',         // Company policy reference
    severity: 'string',                 // 'minor', 'major', 'serious'
    
    // Previous Actions
    previousWarnings: 'number',
    previousActions: 'array',           // Array of previous disciplinary records
    
    // Proposed Action
    proposedAction: 'string',           // 'verbal_warning', 'written_warning', 'final_warning', 'suspension', 'termination'
    suspensionDays: 'number',           // If suspension
    actionEffectiveDate: 'string',
    improvementPlan: 'string',        // Required improvements
    
    // Supporting Documents
    evidenceDocuments: 'array',       // URLs to evidence
    
    // Approval Workflow: HOD → HRM → GM
    workflow: {
      currentStage: 'string',
      stages: [
        {
          stage: 'hod_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          department: 'string',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'hrm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          date: 'string',
          comments: 'string',
          validationNotes: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'gm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'string',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        }
      ]
    },
    
    // Status
    status: 'string',
    
    // Audit
    raisedBy: 'string',
    raisedByName: 'string',
    raisedByRole: 'string',
    raisedAt: 'string',
    companyId: 'string',
    
    // Acknowledgment
    employeeAcknowledged: 'boolean',
    employeeAcknowledgmentDate: 'string',
    employeeComments: 'string',
    
    // Document
    letterGenerated: 'boolean',
    letterUrl: 'string',
    letterDate: 'string',
    signedByEmployee: 'boolean',
    signedByGM: 'boolean',
    signedByHRM: 'boolean'
  }
};

// Updated Leave Approval Schema (4-level workflow)
export const LeaveApprovalSchema = {
  collection: 'leaveApprovals',
  fields: {
    // Employee Info
    employeeId: 'string',
    employeeName: 'string',
    employeeCode: 'string',
    department: 'string',
    supervisorId: 'string',
    
    // Leave Details
    leaveType: 'string',
    startDate: 'string',
    endDate: 'string',
    days: 'number',
    reason: 'string',
    contactDuringLeave: 'string',
    
    // Quota Info
    currentBalance: 'number',
    remainingAfter: 'number',
    
    // 4-Level Approval Workflow: Supervisor → Dept Head → HRM → GM
    workflow: {
      currentStage: 'string',         // 'supervisor', 'dept_head', 'hrm', 'gm', 'approved', 'rejected'
      stages: [
        {
          stage: 'supervisor',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'supervisor',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'dept_head',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'dept_head',
          department: 'string',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'hrm',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'hrm',
          date: 'string',
          comments: 'string',
          quotaValidation: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'gm',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'gm',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        }
      ]
    },
    
    // Status
    status: 'string',                 // draft, pending_supervisor, pending_dept_head, pending_hrm, pending_gm, approved, rejected
    
    // Audit
    raisedBy: 'string',
    raisedByName: 'string',
    raisedAt: 'string',
    companyId: 'string',
    
    // Document
    formGenerated: 'boolean',
    formUrl: 'string',
    formDate: 'string',
    signedByEmployee: 'boolean',
    signedBySupervisor: 'boolean',
    signedByDeptHead: 'boolean',
    signedByHRM: 'boolean',
    signedByGM: 'boolean'
  }
};

// Recruitment Approval Schema
export const RecruitmentSchema = {
  collection: 'recruitmentApprovals',
  fields: {
    // Position Details
    department: 'string',
    position: 'string',
    positionLevel: 'string',          // 'entry', 'mid', 'senior', 'manager'
    numberOfPositions: 'number',
    
    // Job Requirements
    jobDescription: 'string',
    qualifications: 'string',
    experienceRequired: 'string',
    skillsRequired: 'string',
    salaryRange: {
      min: 'number',
      max: 'number',
      currency: 'string'
    },
    
    // Justification
    reasonForHiring: 'string',        // 'new_position', 'replacement', 'expansion'
    replacementFor: 'string',         // If replacement
    urgency: 'string',                // 'immediate', 'within_month', 'planned'
    proposedStartDate: 'string',
    
    // Budget Approval
    budgetApproved: 'boolean',
    budgetCode: 'string',
    
    // Approval Workflow: HOD → HRM → GM
    workflow: {
      currentStage: 'string',
      stages: [
        {
          stage: 'hod_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'dept_head',
          department: 'string',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'hrm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'hrm',
          date: 'string',
          comments: 'string',
          budgetValidation: 'string',
          action: 'string',
          signature: 'string'
        },
        {
          stage: 'gm_review',
          status: 'pending',
          approverId: 'string',
          approverName: 'string',
          approverRole: 'gm',
          date: 'string',
          comments: 'string',
          action: 'string',
          signature: 'string'
        }
      ]
    },
    
    // Status
    status: 'string',
    
    // Audit
    raisedBy: 'string',
    raisedByName: 'string',
    raisedByRole: 'string',
    raisedAt: 'string',
    companyId: 'string',
    
    // Document
    formGenerated: 'boolean',
    formUrl: 'string',
    formDate: 'string',
    signedByDeptHead: 'boolean',
    signedByHRM: 'boolean',
    signedByGM: 'boolean'
  }
};

// Workflow Status Constants
export const WorkflowStatus = {
  DRAFT: 'draft',
  PENDING_SUPERVISOR: 'pending_supervisor',
  PENDING_DEPT_HEAD: 'pending_dept_head',
  PENDING_HRM: 'pending_hrm',
  PENDING_GM: 'pending_gm',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RETURNED: 'returned'
};

// Workflow Stages
export const WorkflowStages = {
  PAYROLL: ['hrm_review', 'gm_review'],
  LEAVE: ['supervisor', 'dept_head', 'hrm', 'gm'],
  PROMOTION: ['hod_review', 'hrm_review', 'gm_review'],
  DISCIPLINARY: ['hod_review', 'hrm_review', 'gm_review'],
  RECRUITMENT: ['hod_review', 'hrm_review', 'gm_review']
};

// Approval Actions
export const ApprovalActions = {
  APPROVE: 'approved',
  REJECT: 'rejected',
  RETURN: 'returned',
  FORWARD: 'forwarded'
};
