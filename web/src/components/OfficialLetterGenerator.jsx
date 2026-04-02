import React, { useRef, useState } from 'react';
import { Printer, Download, X, FileText } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Official Letter/Form Generator Component
 * 
 * Generates official company documents with:
 * - Company letterhead (logo, name, address)
 * - Document title and reference number
 * - Content sections
 * - Signature blocks for GM and HRM
 * - Date and document tracking
 * 
 * Used by: Promotion Letters, Disciplinary Letters, Leave Forms, Payroll Forms, Recruitment Forms
 */

export default function OfficialLetterGenerator({ 
  isOpen, 
  onClose, 
  documentType, 
  documentData,
  onGenerate 
}) {
  const { currentCompany } = useCompany();
  const { userData } = useAuth();
  const letterRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const generateDocumentNumber = () => {
    const prefix = documentType === 'promotion' ? 'PRO' : 
                   documentType === 'disciplinary' ? 'DIS' :
                   documentType === 'leave' ? 'LEV' :
                   documentType === 'payroll' ? 'PAY' :
                   documentType === 'recruitment' ? 'REC' : 'DOC';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
  };

  const documentNumber = documentData?.documentNumber || generateDocumentNumber();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const letterContent = letterRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Document - ${documentNumber}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
            .letterhead { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24pt; font-weight: bold; color: #1e40af; }
            .company-address { font-size: 10pt; color: #6b7280; margin-top: 5px; }
            .document-title { text-align: center; font-size: 16pt; font-weight: bold; margin: 30px 0; text-transform: uppercase; }
            .document-meta { margin-bottom: 20px; }
            .document-meta table { width: 100%; }
            .document-meta td { padding: 5px; }
            .document-meta .label { font-weight: bold; width: 30%; }
            .content-section { margin: 20px 0; }
            .content-section h3 { font-size: 12pt; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
            .signature-section { margin-top: 60px; page-break-inside: avoid; }
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
            .signature-block { text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; font-weight: bold; }
            .signature-title { font-size: 10pt; color: #6b7280; margin-top: 3px; }
            .employee-signature { margin-top: 80px; }
            .footer { margin-top: 40px; font-size: 9pt; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            @media print {
              .no-print { display: none; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${letterContent}
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

  const handleDownload = () => {
    // Generate PDF logic here (would need html2canvas + jsPDF)
    // For now, trigger print to PDF
    handlePrint();
  };

  const renderLetterhead = () => (
    <div className="letterhead">
      {currentCompany?.logoUrl && (
        <img 
          src={currentCompany.logoUrl} 
          alt="Company Logo" 
          style={{ height: '60px', marginBottom: '10px' }} 
        />
      )}
      <div className="company-name">{currentCompany?.name || 'Company Name'}</div>
      <div className="company-address">
        {currentCompany?.address || 'Company Address'}<br />
        Phone: {currentCompany?.phone || 'N/A'} | Email: {currentCompany?.email || 'N/A'}
      </div>
    </div>
  );

  const renderDocumentTitle = () => {
    const titles = {
      promotion: 'Promotion & Salary Adjustment Letter',
      disciplinary: 'Disciplinary Action Notice',
      leave: 'Leave Application Form',
      payroll: 'Payroll Approval Form',
      recruitment: 'Recruitment Requisition Form'
    };
    return <div className="document-title">{titles[documentType] || 'Official Document'}</div>;
  };

  const renderMetaSection = () => (
    <div className="document-meta">
      <table>
        <tbody>
          <tr>
            <td className="label">Document No:</td>
            <td>{documentNumber}</td>
            <td className="label">Date:</td>
            <td>{documentData?.date || currentDate}</td>
          </tr>
          {documentData?.employeeName && (
            <>
              <tr>
                <td className="label">Employee Name:</td>
                <td>{documentData.employeeName}</td>
                <td className="label">Employee ID:</td>
                <td>{documentData.employeeCode || 'N/A'}</td>
              </tr>
              <tr>
                <td className="label">Department:</td>
                <td>{documentData.department || 'N/A'}</td>
                <td className="label">Position:</td>
                <td>{documentData.position || 'N/A'}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (documentType) {
      case 'promotion':
        return renderPromotionContent();
      case 'disciplinary':
        return renderDisciplinaryContent();
      case 'leave':
        return renderLeaveContent();
      case 'payroll':
        return renderPayrollContent();
      case 'recruitment':
        return renderRecruitmentContent();
      default:
        return <div>{documentData?.content || 'Document content goes here...'}</div>;
    }
  };

  const renderPromotionContent = () => (
    <>
      <div className="content-section">
        <h3>Current Position & Salary</h3>
        <p><strong>Current Position:</strong> {documentData?.currentPosition}</p>
        <p><strong>Current Department:</strong> {documentData?.currentDepartment}</p>
        <p><strong>Current Salary:</strong> ${documentData?.currentSalary?.total?.toLocaleString()} per month</p>
      </div>
      
      <div className="content-section">
        <h3>Proposed Changes</h3>
        <p><strong>New Position:</strong> {documentData?.proposedPosition}</p>
        <p><strong>New Department:</strong> {documentData?.proposedDepartment}</p>
        <p><strong>New Salary:</strong> ${documentData?.proposedSalary?.total?.toLocaleString()} per month</p>
        <p><strong>Increase Amount:</strong> ${documentData?.proposedSalary?.increaseAmount?.toLocaleString()} ({documentData?.proposedSalary?.increasePercentage}%)</p>
        <p><strong>Effective Date:</strong> {documentData?.effectiveDate}</p>
      </div>
      
      <div className="content-section">
        <h3>Justification</h3>
        <p>{documentData?.reason}</p>
        <p><strong>Performance Rating:</strong> {documentData?.performanceRating}</p>
      </div>
      
      <div className="content-section">
        <h3>Approval Decision</h3>
        <p style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', margin: '30px 0' }}>
          {documentData?.status === 'approved' ? '✓ APPROVED' : '✗ NOT APPROVED'}
        </p>
      </div>
    </>
  );

  const renderDisciplinaryContent = () => (
    <>
      <div className="content-section">
        <h3>Incident Details</h3>
        <p><strong>Date of Incident:</strong> {documentData?.incidentDate}</p>
        <p><strong>Location:</strong> {documentData?.incidentLocation}</p>
        <p><strong>Violation Type:</strong> {documentData?.violationType}</p>
        <p><strong>Severity:</strong> {documentData?.severity}</p>
      </div>
      
      <div className="content-section">
        <h3>Description</h3>
        <p>{documentData?.incidentDescription}</p>
      </div>
      
      <div className="content-section">
        <h3>Policy Violated</h3>
        <p>{documentData?.policyViolated}</p>
      </div>
      
      <div className="content-section">
        <h3>Disciplinary Action</h3>
        <p style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', margin: '20px 0', color: '#dc2626' }}>
          {documentData?.proposedAction?.replace('_', ' ').toUpperCase()}
        </p>
        {documentData?.suspensionDays > 0 && (
          <p><strong>Suspension Period:</strong> {documentData.suspensionDays} days</p>
        )}
        <p><strong>Effective Date:</strong> {documentData?.actionEffectiveDate}</p>
      </div>
      
      <div className="content-section">
        <h3>Required Improvements</h3>
        <p>{documentData?.improvementPlan}</p>
      </div>
      
      <div className="content-section">
        <h3>Employee Acknowledgment</h3>
        <p>I acknowledge receipt of this disciplinary notice and understand the consequences of further violations.</p>
        <div className="employee-signature">
          <div className="signature-line" style={{ width: '300px' }}>Employee Signature</div>
          <div className="signature-title">Date: _______________</div>
        </div>
      </div>
    </>
  );

  const renderLeaveContent = () => (
    <>
      <div className="content-section">
        <h3>Leave Details</h3>
        <p><strong>Leave Type:</strong> {documentData?.leaveType}</p>
        <p><strong>Start Date:</strong> {documentData?.startDate}</p>
        <p><strong>End Date:</strong> {documentData?.endDate}</p>
        <p><strong>Number of Days:</strong> {documentData?.days}</p>
        <p><strong>Reason:</strong> {documentData?.reason}</p>
        <p><strong>Contact During Leave:</strong> {documentData?.contactDuringLeave}</p>
      </div>
      
      <div className="content-section">
        <h3>Leave Balance</h3>
        <p><strong>Current Balance:</strong> {documentData?.currentBalance} days</p>
        <p><strong>After This Leave:</strong> {documentData?.remainingAfter} days</p>
      </div>
      
      <div className="content-section">
        <h3>Approval Status</h3>
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Level</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {documentData?.workflow?.stages?.map((stage, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px' }}>{stage.stage.replace('_', ' ').toUpperCase()}</td>
                <td style={{ padding: '10px' }}>{stage.approverName || 'Pending'}</td>
                <td style={{ textAlign: 'center', padding: '10px' }}>
                  {stage.status === 'approved' ? '✓' : stage.status === 'rejected' ? '✗' : '○'}
                </td>
                <td style={{ padding: '10px' }}>{stage.date ? new Date(stage.date).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderPayrollContent = () => (
    <>
      <div className="content-section">
        <h3>Payroll Period</h3>
        <p><strong>Month:</strong> {documentData?.payrollMonth}</p>
        <p><strong>Period:</strong> {documentData?.periodStart} to {documentData?.periodEnd}</p>
      </div>
      
      <div className="content-section">
        <h3>Earnings</h3>
        <table style={{ width: '100%', marginTop: '10px' }}>
          <tbody>
            <tr><td>Basic Salary</td><td style={{ textAlign: 'right' }}>${documentData?.earnings?.basic?.toLocaleString()}</td></tr>
            <tr><td>Housing Allowance</td><td style={{ textAlign: 'right' }}>${documentData?.earnings?.housingAllowance?.toLocaleString()}</td></tr>
            <tr><td>Transport Allowance</td><td style={{ textAlign: 'right' }}>${documentData?.earnings?.transportAllowance?.toLocaleString()}</td></tr>
            <tr><td>Other Allowances</td><td style={{ textAlign: 'right' }}>${documentData?.earnings?.otherAllowances?.toLocaleString()}</td></tr>
            <tr><td>Overtime</td><td style={{ textAlign: 'right' }}>${documentData?.earnings?.overtime?.toLocaleString()}</td></tr>
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td>Total Earnings</td>
              <td style={{ textAlign: 'right' }}>${documentData?.earnings?.totalEarnings?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="content-section">
        <h3>Deductions</h3>
        <table style={{ width: '100%', marginTop: '10px' }}>
          <tbody>
            <tr><td>Income Tax</td><td style={{ textAlign: 'right' }}>${documentData?.deductions?.incomeTax?.toLocaleString()}</td></tr>
            <tr><td>Pension</td><td style={{ textAlign: 'right' }}>${documentData?.deductions?.pension?.toLocaleString()}</td></tr>
            <tr><td>Health Insurance</td><td style={{ textAlign: 'right' }}>${documentData?.deductions?.healthInsurance?.toLocaleString()}</td></tr>
            <tr><td>Other Deductions</td><td style={{ textAlign: 'right' }}>${documentData?.deductions?.otherDeductions?.toLocaleString()}</td></tr>
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td>Total Deductions</td>
              <td style={{ textAlign: 'right' }}>${documentData?.deductions?.totalDeductions?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="content-section" style={{ backgroundColor: '#f3f4f6', padding: '20px', marginTop: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Net Pay</h3>
        <p style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>
          ${documentData?.netPay?.toLocaleString()}
        </p>
      </div>
    </>
  );

  const renderRecruitmentContent = () => (
    <>
      <div className="content-section">
        <h3>Position Details</h3>
        <p><strong>Department:</strong> {documentData?.department}</p>
        <p><strong>Position:</strong> {documentData?.position}</p>
        <p><strong>Level:</strong> {documentData?.positionLevel}</p>
        <p><strong>Number of Positions:</strong> {documentData?.numberOfPositions}</p>
      </div>
      
      <div className="content-section">
        <h3>Job Requirements</h3>
        <p><strong>Qualifications:</strong> {documentData?.qualifications}</p>
        <p><strong>Experience Required:</strong> {documentData?.experienceRequired}</p>
        <p><strong>Skills Required:</strong> {documentData?.skillsRequired}</p>
      </div>
      
      <div className="content-section">
        <h3>Salary & Budget</h3>
        <p><strong>Salary Range:</strong> ${documentData?.salaryRange?.min?.toLocaleString()} - ${documentData?.salaryRange?.max?.toLocaleString()}</p>
        <p><strong>Budget Approved:</strong> {documentData?.budgetApproved ? 'Yes' : 'No'}</p>
        <p><strong>Budget Code:</strong> {documentData?.budgetCode || 'N/A'}</p>
      </div>
      
      <div className="content-section">
        <h3>Hiring Justification</h3>
        <p><strong>Reason:</strong> {documentData?.reasonForHiring}</p>
        <p><strong>Urgency:</strong> {documentData?.urgency}</p>
        <p><strong>Proposed Start Date:</strong> {documentData?.proposedStartDate}</p>
      </div>
    </>
  );

  const renderSignatures = () => (
    <div className="signature-section">
      <h3>Approvals</h3>
      <div className="signature-grid">
        {/* HRM Signature */}
        <div className="signature-block">
          <div className="signature-line">
            {documentData?.workflow?.stages?.find(s => s.stage.includes('hrm'))?.approverName || 'HRM Signature'}
          </div>
          <div className="signature-title">Human Resources Manager</div>
          <div className="signature-title">
            {documentData?.workflow?.stages?.find(s => s.stage.includes('hrm'))?.date 
              ? new Date(documentData.workflow.stages.find(s => s.stage.includes('hrm')).date).toLocaleDateString()
              : 'Date: _______________'
            }
          </div>
        </div>
        
        {/* GM Signature */}
        <div className="signature-block">
          <div className="signature-line">
            {documentData?.workflow?.stages?.find(s => s.stage.includes('gm'))?.approverName || 'GM Signature'}
          </div>
          <div className="signature-title">General Manager</div>
          <div className="signature-title">
            {documentData?.workflow?.stages?.find(s => s.stage.includes('gm'))?.date 
              ? new Date(documentData.workflow.stages.find(s => s.stage.includes('gm')).date).toLocaleDateString()
              : 'Date: _______________'
            }
          </div>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="footer">
      This is a computer-generated document. Document Reference: {documentNumber}<br />
      Generated by {currentCompany?.name} HR System on {currentDate}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Official Document Preview</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Letter Preview */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100">
          <div 
            ref={letterRef}
            style={{ 
              backgroundColor: 'white', 
              padding: '40px', 
              maxWidth: '210mm', 
              margin: '0 auto',
              minHeight: '297mm',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {renderLetterhead()}
            {renderDocumentTitle()}
            {renderMetaSection()}
            {renderContent()}
            {renderSignatures()}
            {renderFooter()}
          </div>
        </div>
      </div>
    </div>
  );
}
