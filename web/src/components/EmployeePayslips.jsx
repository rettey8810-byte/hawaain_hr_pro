import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Eye,
  ArrowLeft,
  Building2,
  User,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate } from '../utils/helpers';

export default function EmployeePayslips() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { currentCompany } = useCompany();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch payslips for current employee
  useEffect(() => {
    const fetchPayslips = async () => {
      if (!userData?.email && !userData?.employeeId) return;
      
      setLoading(true);
      try {
        let employeeId = userData?.employeeId;
        
        // If no employeeId, try to find by email
        if (!employeeId && userData?.email) {
          const empQuery = query(
            collection(db, 'employees'),
            where('Email', '==', userData.email)
          );
          const empSnap = await getDocs(empQuery);
          if (!empSnap.empty) {
            employeeId = empSnap.docs[0].id;
          }
        }
        
        if (!employeeId) {
          setLoading(false);
          return;
        }
        
        // Fetch payslips
        const payslipsQuery = query(
          collection(db, 'payslips'),
          where('employeeId', '==', employeeId),
          orderBy('payPeriod', 'desc')
        );
        const payslipsSnap = await getDocs(payslipsQuery);
        const payslipsData = payslipsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPayslips(payslipsData);
      } catch (err) {
        console.error('Error fetching payslips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [userData]);

  const handleDownload = (payslip) => {
    // In a real implementation, this would generate and download a PDF
    // For now, we'll create a text representation
    const content = `
PAYSLIP
=======

Employee: ${payslip.employeeName || userData?.name || 'N/A'}
Employee ID: ${payslip.employeeId}
Pay Period: ${formatDate(payslip.payPeriod)}

EARNINGS
--------
Basic Salary: $${payslip.basicSalary?.toFixed(2) || '0.00'}
Allowances: $${payslip.allowances?.toFixed(2) || '0.00'}
Overtime: $${payslip.overtime?.toFixed(2) || '0.00'}
Other Earnings: $${payslip.otherEarnings?.toFixed(2) || '0.00'}

GROSS PAY: $${payslip.grossPay?.toFixed(2) || '0.00'}

DEDUCTIONS
----------
Income Tax: $${payslip.incomeTax?.toFixed(2) || '0.00'}
Social Security: $${payslip.socialSecurity?.toFixed(2) || '0.00'}
Other Deductions: $${payslip.otherDeductions?.toFixed(2) || '0.00'}

TOTAL DEDUCTIONS: $${payslip.totalDeductions?.toFixed(2) || '0.00'}

NET PAY: $${payslip.netPay?.toFixed(2) || '0.00'}

Generated on: ${formatDate(payslip.createdAt)}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payslip_${payslip.payPeriod}_${payslip.employeeId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleView = (payslip) => {
    setSelectedPayslip(payslip);
    setViewModalOpen(true);
  };

  // Sample payslip data for demo (if no real data exists)
  const samplePayslips = [
    {
      id: 'sample1',
      payPeriod: '2026-03-01',
      basicSalary: 1500,
      allowances: 200,
      overtime: 100,
      otherEarnings: 0,
      grossPay: 1800,
      incomeTax: 150,
      socialSecurity: 50,
      otherDeductions: 0,
      totalDeductions: 200,
      netPay: 1600,
      isSample: true
    }
  ];

  const displayPayslips = payslips.length > 0 ? payslips : samplePayslips;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-2">View and download your salary slips</p>
        </div>

        {/* Payslips List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Salary History</h2>
                <p className="text-sm text-gray-500">
                  {displayPayslips.length} payslip{displayPayslips.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payslips...</p>
            </div>
          ) : displayPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payslips Available</h3>
              <p className="text-gray-500">Your payslips will appear here once they are generated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Pay Period</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Gross Pay</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Deductions</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Net Pay</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(payslip.payPeriod)}
                            </p>
                            {payslip.isSample && (
                              <span className="text-xs text-amber-600">Sample</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          ${payslip.grossPay?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-rose-600">
                          -${payslip.totalDeductions?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-600">
                          ${payslip.netPay?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleView(payslip)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(payslip)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {displayPayslips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Net Pay</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(displayPayslips.reduce((sum, p) => sum + (p.netPay || 0), 0) / displayPayslips.length).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Earnings (YTD)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${displayPayslips.reduce((sum, p) => sum + (p.grossPay || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-rose-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deductions (YTD)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${displayPayslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Payslip Modal */}
      {viewModalOpen && selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Payslip Details</h3>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">PAYSLIP</h2>
                <p className="text-gray-600">{formatDate(selectedPayslip.payPeriod)}</p>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Employee Name</p>
                  <p className="font-medium text-gray-900">{selectedPayslip.employeeName || userData?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="font-medium text-gray-900">{selectedPayslip.employeeId}</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">EARNINGS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-medium">${selectedPayslip.basicSalary?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-medium">${selectedPayslip.allowances?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overtime</span>
                    <span className="font-medium">${selectedPayslip.overtime?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Earnings</span>
                    <span className="font-medium">${selectedPayslip.otherEarnings?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-emerald-600">
                    <span>GROSS PAY</span>
                    <span>${selectedPayslip.grossPay?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3">DEDUCTIONS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income Tax</span>
                    <span className="font-medium text-rose-600">-${selectedPayslip.incomeTax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Social Security</span>
                    <span className="font-medium text-rose-600">-${selectedPayslip.socialSecurity?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Other Deductions</span>
                    <span className="font-medium text-rose-600">-${selectedPayslip.otherDeductions?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-rose-600">
                    <span>TOTAL DEDUCTIONS</span>
                    <span>-${selectedPayslip.totalDeductions?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-900">NET PAY</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    ${selectedPayslip.netPay?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedPayslip)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
