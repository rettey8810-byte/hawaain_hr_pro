import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Download } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: '⏳ Pending' },
  approved: { label: '✅ Approved' },
  rejected: { label: '❌ Rejected' },
  cancelled: { label: '🚫 Cancelled' }
};

const LEAVE_TYPE_LABELS = {
  annual: '🏖️ Annual Leave',
  sick: '🤒 Sick Leave',
  emergency: '🚨 Emergency Leave',
  unpaid: '💰 Unpaid Leave',
  other: '📋 Other'
};

export default function LeavePrintView({ leave, employee, onClose }) {
  const navigate = useNavigate();
  const printRef = useRef();

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = `
      <html>
        <head>
          <title>Leave Application - ${employee?.name || 'Unknown'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 14px; margin-top: 4px; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; }
            .signature-box { border: 2px dashed #d1d5db; padding: 20px; margin-top: 10px; text-align: center; color: #9ca3af; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadPDF = () => {
    // For now, just print to PDF using browser's print to PDF feature
    handlePrint();
  };

  const statusConfig = STATUS_CONFIG[leave?.status] || STATUS_CONFIG.pending;
  const leaveTypeLabel = LEAVE_TYPE_LABELS[leave?.leaveType] || leave?.leaveType;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        {/* Toolbar */}
        <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Save as PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-colors"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div ref={printRef} className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-12">
          {/* Header */}
          <div className="header">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LEAVE APPLICATION</h1>
            <p className="text-gray-500">Official Leave Request Form</p>
            <div className="mt-4">
              <span className={`status ${
                leave?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                leave?.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                leave?.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Employee Information */}
          <div className="section">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">👤 EMPLOYEE INFORMATION</h2>
            <div className="grid">
              <div className="field">
                <div className="label">Full Name</div>
                <div className="value">{employee?.name || 'N/A'}</div>
              </div>
              <div className="field">
                <div className="label">Employee Code</div>
                <div className="value">{employee?.employeeCode || 'N/A'}</div>
              </div>
              <div className="field">
                <div className="label">Department</div>
                <div className="value">{employee?.department || 'N/A'}</div>
              </div>
              <div className="field">
                <div className="label">Position</div>
                <div className="value">{employee?.position || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="section">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📅 LEAVE DETAILS</h2>
            <div className="grid">
              <div className="field">
                <div className="label">Leave Type</div>
                <div className="value">{leaveTypeLabel}</div>
              </div>
              <div className="field">
                <div className="label">Duration</div>
                <div className="value">{leave?.days} days</div>
              </div>
              <div className="field">
                <div className="label">Start Date</div>
                <div className="value">{leave?.startDate || 'N/A'}</div>
              </div>
              <div className="field">
                <div className="label">End Date</div>
                <div className="value">{leave?.endDate || 'N/A'}</div>
              </div>
            </div>
            <div className="field mt-4">
              <div className="label">Destination</div>
              <div className="value">{leave?.destination || 'N/A'}</div>
            </div>
            <div className="field mt-4">
              <div className="label">Reason for Leave</div>
              <div className="value">{leave?.reason || 'N/A'}</div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="section">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">📞 CONTACT DURING LEAVE</h2>
            <div className="grid">
              <div className="field">
                <div className="label">Contact Number</div>
                <div className="value">{leave?.contactNumber || 'N/A'}</div>
              </div>
              <div className="field">
                <div className="label">Email</div>
                <div className="value">{leave?.contactEmail || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {leave?.emergencyContact?.name && (
            <div className="section">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">🚨 EMERGENCY CONTACT</h2>
              <div className="grid">
                <div className="field">
                  <div className="label">Name</div>
                  <div className="value">{leave.emergencyContact.name}</div>
                </div>
                <div className="field">
                  <div className="label">Relationship</div>
                  <div className="value">{leave.emergencyContact.relationship || 'N/A'}</div>
                </div>
                <div className="field">
                  <div className="label">Phone</div>
                  <div className="value">{leave.emergencyContact.phone || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Transportation */}
          {leave?.transportation?.required && (
            <div className="section">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">✈️ TRANSPORTATION</h2>
              <div className="grid">
                <div className="field">
                  <div className="label">Mode</div>
                  <div className="value capitalize">{leave.transportation.mode}</div>
                </div>
                <div className="field">
                  <div className="label">From</div>
                  <div className="value">{leave.transportation.fromLocation || 'N/A'}</div>
                </div>
                <div className="field">
                  <div className="label">To</div>
                  <div className="value">{leave.transportation.toLocation || 'N/A'}</div>
                </div>
                <div className="field">
                  <div className="label">Preferred Time</div>
                  <div className="value">{leave.transportation.preferredTime || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Section */}
          <div className="section">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">✅ APPROVAL</h2>
            <div className="grid">
              <div className="field">
                <div className="label">Status</div>
                <div className="value">{statusConfig.label}</div>
              </div>
              <div className="field">
                <div className="label">Approved By</div>
                <div className="value">{leave?.approverName || 'Pending'}</div>
              </div>
            </div>
            {leave?.approvalComments && (
              <div className="field mt-4">
                <div className="label">Comments</div>
                <div className="value">{leave.approvalComments}</div>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid" style={{ marginTop: '40px' }}>
            <div>
              <div className="label">Employee Signature</div>
              <div className="signature-box">
                <div>Sign here</div>
                <div className="text-xs mt-2">Date: _______________</div>
              </div>
            </div>
            <div>
              <div className="label">Manager/HR Signature</div>
              <div className="signature-box">
                <div>Sign here</div>
                <div className="text-xs mt-2">Date: _______________</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Generated on {new Date().toLocaleString()}</p>
            <p>Reference ID: {leave?.id || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
