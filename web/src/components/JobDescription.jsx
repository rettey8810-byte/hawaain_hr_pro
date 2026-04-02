import React, { useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useFilteredEmployees } from '../hooks/useFilteredFirestore';
import { FileText, Printer, Download, X, Briefcase, Building2 } from 'lucide-react';

/**
 * Job Description (JD) Generator Module
 * 
 * Features:
 * - Select employee and auto-generate JD based on their position
 * - Generate JD for any position manually
 * - Print with company letterhead
 * - Professional formatting
 * - Export as PDF
 */

const DEPARTMENTS = [
  'Engineering', 'HR', 'Finance', 'Marketing', 
  'Operations', 'Sales', 'IT', 'Admin', 'Customer Service'
];

const POSITION_TEMPLATES = {
  'Software Engineer': {
    summary: 'Responsible for designing, developing, and maintaining software applications and systems.',
    responsibilities: [
      'Design and develop high-quality software solutions',
      'Write clean, maintainable, and efficient code',
      'Collaborate with cross-functional teams',
      'Participate in code reviews and technical discussions',
      'Troubleshoot and debug applications',
      'Maintain technical documentation'
    ],
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      '3+ years of software development experience',
      'Proficiency in programming languages (Java, Python, JavaScript)',
      'Experience with databases and SQL',
      'Strong problem-solving skills',
      'Excellent communication and teamwork abilities'
    ]
  },
  'HR Manager': {
    summary: 'Oversee all aspects of human resources management including recruitment, employee relations, and policy implementation.',
    responsibilities: [
      'Develop and implement HR strategies and initiatives',
      'Manage recruitment and selection process',
      'Oversee employee onboarding and offboarding',
      'Handle employee relations and conflict resolution',
      'Ensure compliance with labor laws and regulations',
      'Manage performance evaluation systems'
    ],
    requirements: [
      "Bachelor's degree in Human Resources or related field",
      '5+ years of HR management experience',
      'Knowledge of labor laws and HR best practices',
      'Strong leadership and interpersonal skills',
      'Experience with HRIS systems',
      'Professional HR certification preferred'
    ]
  },
  'Sales Manager': {
    summary: 'Lead sales team to achieve revenue targets and expand customer base through strategic planning and execution.',
    responsibilities: [
      'Develop and execute sales strategies',
      'Lead and motivate sales team members',
      'Set sales targets and monitor performance',
      'Build and maintain key client relationships',
      'Analyze market trends and competitor activities',
      'Prepare sales forecasts and reports'
    ],
    requirements: [
      "Bachelor's degree in Business or related field",
      '5+ years of sales experience with 2+ years in management',
      'Proven track record of meeting sales targets',
      'Strong leadership and negotiation skills',
      'Excellent communication and presentation abilities',
      'Proficiency in CRM software'
    ]
  },
  'Finance Manager': {
    summary: 'Manage financial operations, reporting, and planning to ensure organizational financial health and compliance.',
    responsibilities: [
      'Oversee financial planning and analysis',
      'Manage budgeting and forecasting processes',
      'Ensure accurate financial reporting',
      'Monitor cash flow and financial performance',
      'Ensure compliance with accounting standards',
      'Coordinate with auditors and tax consultants'
    ],
    requirements: [
      "Bachelor's degree in Finance, Accounting, or related field",
      'CPA or equivalent certification preferred',
      '5+ years of finance management experience',
      'Strong knowledge of accounting principles',
      'Proficiency in financial software and Excel',
      'Analytical and problem-solving skills'
    ]
  },
  'default': {
    summary: 'Responsible for performing duties and responsibilities as assigned by management to support departmental and organizational objectives.',
    responsibilities: [
      'Perform assigned duties and responsibilities efficiently',
      'Collaborate with team members and other departments',
      'Maintain professional standards and conduct',
      'Contribute to team and organizational goals',
      'Follow company policies and procedures',
      'Report to supervisor on work progress and issues'
    ],
    requirements: [
      "Bachelor's degree or equivalent experience",
      'Relevant work experience in similar role',
      'Strong communication and interpersonal skills',
      'Ability to work independently and in teams',
      'Proficiency in relevant software and tools',
      'Professional attitude and work ethic'
    ]
  }
};

export default function JobDescriptionGenerator() {
  const { currentCompany } = useCompany();
  const { employees } = useFilteredEmployees();
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    reportsTo: '',
    employmentType: 'Full Time',
    location: '',
    summary: '',
    responsibilities: [''],
    requirements: [''],
    benefits: '',
    salaryRange: ''
  });

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      const template = POSITION_TEMPLATES[employee.position] || POSITION_TEMPLATES['default'];
      
      setFormData({
        jobTitle: employee.position,
        department: employee.department,
        reportsTo: employee.reportsTo || 'Department Manager',
        employmentType: employee.employmentType || 'Full Time',
        location: currentCompany?.address || 'Company Headquarters',
        summary: template.summary,
        responsibilities: [...template.responsibilities],
        requirements: [...template.requirements],
        benefits: 'Standard company benefits package including health insurance, paid time off, and retirement plans.',
        salaryRange: employee.salary ? 
          `$${employee.salary.basic?.toLocaleString()} - $${(employee.salary.basic * 1.2)?.toLocaleString()}` : 
          'Competitive salary based on experience'
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const jdContent = document.getElementById('jd-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Description - ${formData.jobTitle}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; }
            .letterhead { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 25px; }
            .company-name { font-size: 20pt; font-weight: bold; color: #1e40af; }
            .company-address { font-size: 9pt; color: #6b7280; margin-top: 5px; }
            .jd-title { text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0; }
            .section { margin: 15px 0; }
            .section-title { font-size: 12pt; font-weight: bold; margin-bottom: 8px; color: #1e40af; }
            .section-content { margin-left: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
            .info-item { display: flex; }
            .info-label { font-weight: bold; width: 120px; }
            ul { margin: 5px 0; padding-left: 20px; }
            li { margin: 3px 0; }
            .footer { margin-top: 40px; font-size: 9pt; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${jdContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      responsibilities: [...prev.responsibilities, '']
    }));
  };

  const updateResponsibility = (index, value) => {
    const updated = [...formData.responsibilities];
    updated[index] = value;
    setFormData(prev => ({ ...prev, responsibilities: updated }));
  };

  const removeResponsibility = (index) => {
    const updated = formData.responsibilities.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, responsibilities: updated }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index, value) => {
    const updated = [...formData.requirements];
    updated[index] = value;
    setFormData(prev => ({ ...prev, requirements: updated }));
  };

  const removeRequirement = (index) => {
    const updated = formData.requirements.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, requirements: updated }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Job Description Generator</h2>
          </div>
          <p className="text-gray-600 mt-1">Generate professional job descriptions with company letterhead</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-4">
        <button
          onClick={() => setCustomMode(false)}
          className={`px-4 py-2 rounded-lg ${!customMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Select Employee
        </button>
        <button
          onClick={() => setCustomMode(true)}
          className={`px-4 py-2 rounded-lg ${customMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Custom JD
        </button>
      </div>

      {/* Employee Selection */}
      {!customMode && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <label className="block text-sm font-medium mb-2">Select Employee</label>
          <select
            onChange={(e) => handleEmployeeSelect(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">Choose an employee...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} - {emp.position} ({emp.department})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-2">
            JD will be auto-populated based on the employee's position template
          </p>
        </div>
      )}

      {/* JD Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Job Details
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            {customMode ? (
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Department...</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reports To</label>
            <input
              type="text"
              value={formData.reportsTo}
              onChange={(e) => setFormData({...formData, reportsTo: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Engineering Manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Employment Type</label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Headquarters / Remote"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Salary Range</label>
          <input
            type="text"
            value={formData.salaryRange}
            onChange={(e) => setFormData({...formData, salaryRange: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., $50,000 - $70,000 per year"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Job Summary</label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
            placeholder="Brief overview of the position..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Key Responsibilities</label>
          {formData.responsibilities.map((resp, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={resp}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder={`Responsibility ${index + 1}`}
              />
              <button
                onClick={() => removeResponsibility(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addResponsibility}
            className="text-blue-600 text-sm hover:underline"
          >
            + Add Responsibility
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Requirements</label>
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={req}
                onChange={(e) => updateRequirement(index, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder={`Requirement ${index + 1}`}
              />
              <button
                onClick={() => removeRequirement(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addRequirement}
            className="text-blue-600 text-sm hover:underline"
          >
            + Add Requirement
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Benefits</label>
          <textarea
            value={formData.benefits}
            onChange={(e) => setFormData({...formData, benefits: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows="2"
            placeholder="List benefits and perks..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Preview & Print
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Print to PDF
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Job Description Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-100">
              <div id="jd-content" className="bg-white p-8 shadow-lg" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                {/* Letterhead */}
                <div className="letterhead" style={{ textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '15px', marginBottom: '25px' }}>
                  {currentCompany?.logoUrl && (
                    <img src={currentCompany.logoUrl} alt="Logo" style={{ height: '50px', marginBottom: '10px' }} />
                  )}
                  <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#1e40af' }}>
                    {currentCompany?.name || 'Company Name'}
                  </div>
                  <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '5px' }}>
                    {currentCompany?.address || 'Company Address'}<br />
                    {currentCompany?.phone && `Phone: ${currentCompany.phone} | `}
                    {currentCompany?.email && `Email: ${currentCompany.email}`}
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', margin: '20px 0' }}>
                  JOB DESCRIPTION
                </div>

                {/* Job Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '15px 0' }}>
                  <div style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', width: '120px' }}>Job Title:</span>
                    <span>{formData.jobTitle}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', width: '120px' }}>Department:</span>
                    <span>{formData.department}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', width: '120px' }}>Reports To:</span>
                    <span>{formData.reportsTo}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', width: '120px' }}>Employment:</span>
                    <span>{formData.employmentType}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', width: '120px' }}>Location:</span>
                    <span>{formData.location}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ fontWeight: 'bold', width: '120px' }}>Salary Range:</span>
                    <span>{formData.salaryRange}</span>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ margin: '15px 0' }}>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                    Position Summary
                  </div>
                  <div style={{ marginLeft: '15px' }}>{formData.summary}</div>
                </div>

                {/* Responsibilities */}
                <div style={{ margin: '15px 0' }}>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                    Key Responsibilities
                  </div>
                  <ul style={{ margin: '5px 0', paddingLeft: '35px' }}>
                    {formData.responsibilities.filter(r => r).map((resp, index) => (
                      <li key={index} style={{ margin: '3px 0' }}>{resp}</li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div style={{ margin: '15px 0' }}>
                  <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                    Qualifications & Requirements
                  </div>
                  <ul style={{ margin: '5px 0', paddingLeft: '35px' }}>
                    {formData.requirements.filter(r => r).map((req, index) => (
                      <li key={index} style={{ margin: '3px 0' }}>{req}</li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                {formData.benefits && (
                  <div style={{ margin: '15px 0' }}>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                      Benefits & Perks
                    </div>
                    <div style={{ marginLeft: '15px' }}>{formData.benefits}</div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '40px', fontSize: '9pt', color: '#6b7280', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                  This job description is intended to convey information essential to understanding the scope of the position.<br />
                  It is not an exhaustive list of skills, efforts, duties, or working conditions associated with the role.<br />
                  Generated by {currentCompany?.name || 'Company'} HR System
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
