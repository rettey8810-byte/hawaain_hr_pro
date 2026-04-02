import React, { useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useFilteredEmployees } from '../hooks/useFilteredFirestore';
import { FileText, Printer, X, FileSignature, Mail, Building2 } from 'lucide-react';

/**
 * Contracts & Offer Letters Module
 * 
 * Features:
 * - Generate employment contracts
 * - Generate offer letters
 * - Company letterhead integration
 * - Print and export functionality
 * - Employee selection for auto-population
 */

const CONTRACT_TYPES = [
  { value: 'offer_letter', label: 'Offer Letter', icon: Mail },
  { value: 'employment_contract', label: 'Employment Contract', icon: FileSignature },
  { value: 'probation_contract', label: 'Probationary Contract', icon: FileText },
  { value: 'renewal_contract', label: 'Contract Renewal', icon: FileText }
];

export default function ContractsAndLetters() {
  const { currentCompany } = useCompany();
  const { employees } = useFilteredEmployees();
  
  const [selectedType, setSelectedType] = useState('offer_letter');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeAddress: '',
    position: '',
    department: '',
    startDate: '',
    salary: '',
    employmentType: 'Full Time',
    probationPeriod: '3 months',
    workingHours: '40 hours per week',
    benefits: 'Health insurance, paid leave, retirement plan',
    noticePeriod: '30 days',
    signingBonus: '',
    contractDuration: 'Permanent',
    managerName: '',
    managerTitle: 'HR Manager',
    specialClauses: ''
  });

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employeeName: employee.name,
        position: employee.position,
        department: employee.department,
        salary: employee.salary ? `$${employee.salary.basic?.toLocaleString()} per month` : ''
      }));
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = document.getElementById('contract-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedType === 'offer_letter' ? 'Offer Letter' : 'Employment Contract'}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; }
            .letterhead { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 20pt; font-weight: bold; color: #1e40af; }
            .company-address { font-size: 9pt; color: #6b7280; margin-top: 5px; }
            .document-title { text-align: center; font-size: 16pt; font-weight: bold; margin: 30px 0; text-transform: uppercase; }
            .date { text-align: right; margin-bottom: 20px; }
            .recipient { margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; margin-bottom: 10px; }
            .signature-section { margin-top: 60px; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin-top: 50px; padding-top: 5px; }
            .terms-list { margin-left: 20px; }
            .terms-list li { margin: 8px 0; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${content}
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

  const generateContractContent = () => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (selectedType === 'offer_letter') {
      return (
        <>
          <div className="date" style={{ textAlign: 'right', marginBottom: '20px' }}>
            Date: {today}
          </div>
          
          <div className="recipient" style={{ marginBottom: '30px' }}>
            <strong>{formData.employeeName}</strong><br />
            {formData.employeeAddress && formData.employeeAddress.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </div>

          <div className="document-title" style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', margin: '30px 0', textTransform: 'uppercase' }}>
            Letter of Employment Offer
          </div>

          <p>Dear {formData.employeeName},</p>

          <p>We are pleased to offer you the position of <strong>{formData.position}</strong> in the <strong>{formData.department}</strong> department at <strong>{currentCompany?.name}</strong>.</p>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>Position Details:</div>
            <ul className="terms-list" style={{ marginLeft: '20px' }}>
              <li><strong>Position:</strong> {formData.position}</li>
              <li><strong>Department:</strong> {formData.department}</li>
              <li><strong>Employment Type:</strong> {formData.employmentType}</li>
              <li><strong>Start Date:</strong> {formData.startDate}</li>
              <li><strong>Probation Period:</strong> {formData.probationPeriod}</li>
            </ul>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>Compensation & Benefits:</div>
            <ul className="terms-list" style={{ marginLeft: '20px' }}>
              <li><strong>Salary:</strong> {formData.salary}</li>
              <li><strong>Working Hours:</strong> {formData.workingHours}</li>
              <li><strong>Benefits:</strong> {formData.benefits}</li>
              {formData.signingBonus && <li><strong>Signing Bonus:</strong> {formData.signingBonus}</li>}
            </ul>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>Terms & Conditions:</div>
            <ul className="terms-list" style={{ marginLeft: '20px' }}>
              <li>This offer is contingent upon successful completion of background verification.</li>
              <li>You will be required to sign the Employment Agreement on your first day.</li>
              <li>Please bring original documents for verification: ID proof, educational certificates, and previous employment documents.</li>
              <li><strong>Notice Period:</strong> {formData.noticePeriod} required for resignation.</li>
            </ul>
          </div>

          {formData.specialClauses && (
            <div className="section">
              <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>Special Conditions:</div>
              <p>{formData.specialClauses}</p>
            </div>
          )}

          <p>Please confirm your acceptance of this offer by signing and returning a copy of this letter by <strong>{new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}</strong>.</p>

          <p>We look forward to welcoming you to our team!</p>

          <div className="signature-section" style={{ marginTop: '60px' }}>
            <p>Sincerely,</p>
            <div className="signature-line" style={{ borderTop: '1px solid #000', width: '250px', marginTop: '50px', paddingTop: '5px' }}>
              <strong>{formData.managerName || currentCompany?.name}</strong><br />
              {formData.managerTitle}
            </div>
          </div>

          <div style={{ marginTop: '60px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
            <p><strong>Acceptance of Offer:</strong></p>
            <p>I, <strong>{formData.employeeName}</strong>, accept the position of <strong>{formData.position}</strong> with <strong>{currentCompany?.name}</strong> under the terms and conditions stated above.</p>
            <div style={{ marginTop: '40px' }}>
              <div className="signature-line" style={{ borderTop: '1px solid #000', width: '250px', marginTop: '50px', paddingTop: '5px' }}>
                Employee Signature<br />
                Date: _______________
              </div>
            </div>
          </div>
        </>
      );
    } else {
      // Employment Contract
      return (
        <>
          <div className="document-title" style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', margin: '30px 0', textTransform: 'uppercase' }}>
            Employment Contract
          </div>

          <div className="section">
            <p><strong>THIS EMPLOYMENT AGREEMENT</strong> is made on <strong>{today}</strong></p>
            <p style={{ marginTop: '15px' }}><strong>BETWEEN:</strong></p>
            <p><strong>{currentCompany?.name}</strong>, a company registered at {currentCompany?.address} (hereinafter referred to as the "Employer")</p>
            <p style={{ marginTop: '10px' }}><strong>AND:</strong></p>
            <p><strong>{formData.employeeName}</strong>, residing at {formData.employeeAddress || '[Employee Address]'} (hereinafter referred to as the "Employee")</p>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>1. POSITION & COMMENCEMENT</div>
            <p>The Employer agrees to employ the Employee as <strong>{formData.position}</strong> in the <strong>{formData.department}</strong> department, effective <strong>{formData.startDate}</strong>.</p>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>2. DUTIES & RESPONSIBILITIES</div>
            <p>The Employee shall perform all duties and responsibilities as assigned by the Employer, including but not limited to:</p>
            <ul className="terms-list" style={{ marginLeft: '20px' }}>
              <li>Fulfilling the role of {formData.position} to the best of their ability</li>
              <li>Complying with all company policies and procedures</li>
              <li>Reporting to the designated supervisor/manager</li>
              <li>Maintaining confidentiality of company information</li>
            </ul>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>3. COMPENSATION</div>
            <p>In consideration for the Employee's services, the Employer shall pay:</p>
            <ul className="terms-list" style={{ marginLeft: '20px' }}>
              <li><strong>Base Salary:</strong> {formData.salary}</li>
              <li><strong>Payment Schedule:</strong> Monthly</li>
              <li><strong>Benefits:</strong> {formData.benefits}</li>
              {formData.signingBonus && <li><strong>Signing Bonus:</strong> {formData.signingBonus}</li>}
            </ul>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>4. WORKING HOURS & LOCATION</div>
            <ul className="terms-list" style={{ marginLeft: '20px' }}>
              <li><strong>Working Hours:</strong> {formData.workingHours}</li>
              <li><strong>Employment Type:</strong> {formData.employmentType}</li>
              <li><strong>Contract Duration:</strong> {formData.contractDuration}</li>
            </ul>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>5. PROBATION PERIOD</div>
            <p>The Employee shall serve a probationary period of <strong>{formData.probationPeriod}</strong>. During this period, either party may terminate employment with {formData.noticePeriod === '30 days' ? 'one week' : formData.noticePeriod} notice.</p>
          </div>

          <div className="section">
            <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>6. TERMINATION</div>
            <p>Either party may terminate this agreement by providing <strong>{formData.noticePeriod}</strong> written notice. The Employer may terminate immediately for gross misconduct.</p>
          </div>

          {formData.specialClauses && (
            <div className="section">
              <div className="section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>7. SPECIAL CONDITIONS</div>
              <p>{formData.specialClauses}</p>
            </div>
          )}

          <div className="signature-section" style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <p><strong>For the Employer:</strong></p>
              <div className="signature-line" style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '5px' }}>
                <strong>{formData.managerName || 'Authorized Signatory'}</strong><br />
                {formData.managerTitle}<br />
                {currentCompany?.name}
              </div>
              <p style={{ marginTop: '10px' }}>Date: _______________</p>
            </div>
            <div>
              <p><strong>For the Employee:</strong></p>
              <div className="signature-line" style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '5px' }}>
                <strong>{formData.employeeName}</strong><br />
                Employee
              </div>
              <p style={{ marginTop: '10px' }}>Date: _______________</p>
            </div>
          </div>
        </>
      );
    }
  };

  const TypeIcon = CONTRACT_TYPES.find(t => t.value === selectedType)?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Contracts & Offer Letters</h2>
          </div>
          <p className="text-gray-600 mt-1">Generate employment contracts and offer letters with company letterhead</p>
        </div>
      </div>

      {/* Contract Type Selection */}
      <div className="grid grid-cols-4 gap-4">
        {CONTRACT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedType === type.value 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <Icon className={`h-6 w-6 mb-2 ${selectedType === type.value ? 'text-blue-600' : 'text-gray-500'}`} />
              <div className={`font-medium ${selectedType === type.value ? 'text-blue-900' : 'text-gray-700'}`}>
                {type.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Employee Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <label className="block text-sm font-medium mb-2">Select Employee (Optional)</label>
        <select
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Choose an employee or fill manually...</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name} - {emp.position}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <TypeIcon className="h-5 w-5 text-blue-600" />
          Document Details
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee Full Name *</label>
            <input
              type="text"
              value={formData.employeeName}
              onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Position *</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Job title"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">Probation Period</label>
            <select
              value={formData.probationPeriod}
              onChange={(e) => setFormData({...formData, probationPeriod: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option>1 month</option>
              <option>3 months</option>
              <option>6 months</option>
              <option>None</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Salary</label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., $5,000 per month"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Signing Bonus (Optional)</label>
            <input
              type="text"
              value={formData.signingBonus}
              onChange={(e) => setFormData({...formData, signingBonus: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., $2,000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Notice Period</label>
            <select
              value={formData.noticePeriod}
              onChange={(e) => setFormData({...formData, noticePeriod: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option>1 week</option>
              <option>2 weeks</option>
              <option>30 days</option>
              <option>60 days</option>
              <option>90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contract Duration</label>
            <select
              value={formData.contractDuration}
              onChange={(e) => setFormData({...formData, contractDuration: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option>Permanent</option>
              <option>1 Year</option>
              <option>2 Years</option>
              <option>Project Based</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Employee Address</label>
          <textarea
            value={formData.employeeAddress}
            onChange={(e) => setFormData({...formData, employeeAddress: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows="2"
            placeholder="Full address for contract"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Benefits</label>
          <textarea
            value={formData.benefits}
            onChange={(e) => setFormData({...formData, benefits: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows="2"
            placeholder="List all benefits and perks"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Manager/Signatory Name</label>
            <input
              type="text"
              value={formData.managerName}
              onChange={(e) => setFormData({...formData, managerName: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Manager Title</label>
            <input
              type="text"
              value={formData.managerTitle}
              onChange={(e) => setFormData({...formData, managerTitle: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., HR Manager"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Special Clauses/Conditions</label>
          <textarea
            value={formData.specialClauses}
            onChange={(e) => setFormData({...formData, specialClauses: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            rows="3"
            placeholder="Any special terms, non-compete clauses, etc."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Preview Document
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileText className="h-4 w-4" />
            Print to PDF
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Document Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-gray-100">
              <div id="contract-content" className="bg-white p-8 shadow-lg" style={{ maxWidth: '210mm', margin: '0 auto' }}>
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

                {generateContractContent()}

                {/* Footer */}
                <div style={{ marginTop: '40px', fontSize: '9pt', color: '#6b7280', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                  Document generated by {currentCompany?.name || 'Company'} HR System<br />
                  This document is confidential and intended solely for the named recipient.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
