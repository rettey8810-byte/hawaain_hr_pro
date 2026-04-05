import { useState } from 'react';
import { CreditCard, Calculator, FileText, DollarSign, Clock, Download, Loader2, Users, Plus, X, Calendar, CheckCircle } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const { companyId } = useCompany();
  const { isHRorGM } = useAuth();

  const { documents: payrolls, loading: payrollsLoading, addDocument: addPayroll } = useFirestore('payrolls');
  const { documents: employees, loading: employeesLoading } = useFirestore('employees');

  const filteredPayrolls = payrolls.filter(p => p.companyId === companyId && p.month === selectedMonth);
  const activeEmployees = employees.filter(e => e.companyId === companyId && e.status === 'active');

  const summary = {
    totalEmployees: filteredPayrolls.length,
    totalGross: filteredPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
    totalDeductions: filteredPayrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
    totalNet: filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0)
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2026, i, 1);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  });

  const handleRunPayroll = async (payrollData) => {
    for (const entry of payrollData) {
      await addPayroll({
        ...entry,
        month: selectedMonth,
        companyId,
        processedAt: new Date().toISOString(),
        status: 'processed'
      });
    }
    setShowRunPayroll(false);
  };

  if (payrollsLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading payroll data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="h-8 w-8" />
              Payroll Management
            </h1>
            <p className="text-emerald-100 mt-1">Process salaries and generate payslips</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 text-white border-0"
            >
              {months.map(m => (
                <option key={m.value} value={m.value} className="text-gray-900">{m.label}</option>
              ))}
            </select>
            {isHRorGM() && (
              <button
                onClick={() => setShowRunPayroll(true)}
                className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Run Payroll
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Net Pay', value: `$${summary.totalNet.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
          { label: 'Total Gross', value: `$${summary.totalGross.toLocaleString()}`, icon: CreditCard, color: 'text-blue-600' },
          { label: 'Deductions', value: `$${summary.totalDeductions.toLocaleString()}`, icon: Calculator, color: 'text-orange-600' },
          { label: 'Employees Paid', value: `${summary.totalEmployees}/${activeEmployees.length}`, icon: Users, color: 'text-purple-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Payroll Records</h2>
          {filteredPayrolls.length > 0 && isHRorGM() && (
            <button className="text-emerald-600 text-sm font-medium flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export All
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Basic Salary</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Allowances</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Deductions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Net Pay</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payroll records for {selectedMonth}</p>
                    {isHRorGM() && (
                      <button
                        onClick={() => setShowRunPayroll(true)}
                        className="text-emerald-600 text-sm mt-2 hover:underline"
                      >
                        Run payroll now
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map(payroll => {
                  const employee = employees.find(e => e.id === payroll.employeeId);
                  return (
                    <tr key={payroll.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                            {employee?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{employee?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{employee?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">${payroll.basicSalary?.toLocaleString()}</td>
                      <td className="py-3 px-4">${(payroll.allowances || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600">-${(payroll.totalDeductions || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">${payroll.netSalary?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {payroll.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedPayslip({ payroll, employee })}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          View Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRunPayroll && (
        <RunPayrollModal
          employees={activeEmployees.filter(e => !filteredPayrolls.some(p => p.employeeId === e.id))}
          month={selectedMonth}
          onClose={() => setShowRunPayroll(false)}
          onSubmit={handleRunPayroll}
        />
      )}

      {selectedPayslip && (
        <PayslipModal
          payroll={selectedPayslip.payroll}
          employee={selectedPayslip.employee}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}

function RunPayrollModal({ employees, month, onClose, onSubmit }) {
  const [payrollEntries, setPayrollEntries] = useState(
    employees.map(emp => ({
      employeeId: emp.id,
      employeeName: emp.name,
      basicSalary: emp.salary?.basic || 0,
      housingAllowance: emp.salary?.housingAllowance || 0,
      transportAllowance: emp.salary?.transportAllowance || 0,
      otherAllowances: emp.salary?.otherAllowances || 0,
      taxDeduction: 0,
      pensionDeduction: 0,
      loanDeduction: 0,
      otherDeductions: 0
    }))
  );

  const updateEntry = (index, field, value) => {
    setPayrollEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: Number(value) || 0 } : entry
    ));
  };

  const calculateNet = (entry) => {
    const gross = entry.basicSalary + entry.housingAllowance + entry.transportAllowance + entry.otherAllowances;
    const deductions = entry.taxDeduction + entry.pensionDeduction + entry.loanDeduction + entry.otherDeductions;
    return gross - deductions;
  };

  const handleSubmit = () => {
    const finalData = payrollEntries.map(entry => ({
      ...entry,
      grossSalary: entry.basicSalary + entry.housingAllowance + entry.transportAllowance + entry.otherAllowances,
      totalDeductions: entry.taxDeduction + entry.pensionDeduction + entry.loanDeduction + entry.otherDeductions,
      netSalary: calculateNet(entry)
    }));
    onSubmit(finalData);
  };

  if (employees.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">All Caught Up!</h3>
            <p className="text-gray-500 mb-4">All active employees have been processed for {month}</p>
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold">Run Payroll</h2>
            <p className="text-sm text-gray-500">{month} • {employees.length} employees</p>
          </div>
          <button onClick={onClose}><X className="h-6 w-6" /></button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-sm">
                <th className="py-2 px-3">Employee</th>
                <th className="py-2 px-3">Basic</th>
                <th className="py-2 px-3">Housing</th>
                <th className="py-2 px-3">Transport</th>
                <th className="py-2 px-3">Other Allow.</th>
                <th className="py-2 px-3">Tax</th>
                <th className="py-2 px-3">Pension</th>
                <th className="py-2 px-3">Loan</th>
                <th className="py-2 px-3">Other Ded.</th>
                <th className="py-2 px-3 font-bold">Net Pay</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {payrollEntries.map((entry, idx) => (
                <tr key={entry.employeeId} className="border-b">
                  <td className="py-2 px-3 font-medium">{entry.employeeName}</td>
                  <td className="py-2 px-2"><input type="number" value={entry.basicSalary} onChange={e => updateEntry(idx, 'basicSalary', e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.housingAllowance} onChange={e => updateEntry(idx, 'housingAllowance', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.transportAllowance} onChange={e => updateEntry(idx, 'transportAllowance', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.otherAllowances} onChange={e => updateEntry(idx, 'otherAllowances', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.taxDeduction} onChange={e => updateEntry(idx, 'taxDeduction', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.pensionDeduction} onChange={e => updateEntry(idx, 'pensionDeduction', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.loanDeduction} onChange={e => updateEntry(idx, 'loanDeduction', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-2"><input type="number" value={entry.otherDeductions} onChange={e => updateEntry(idx, 'otherDeductions', e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="py-2 px-3 font-bold text-emerald-600">${calculateNet(entry).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Total Net Pay: <span className="font-bold text-emerald-600">${payrollEntries.reduce((sum, e) => sum + calculateNet(e), 0).toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium">Process Payroll</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayslipModal({ payroll, employee, onClose }) {
  const handleDownload = () => {
    alert('Payslip download feature - integrate with PDF library like jspdf or react-pdf');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Payslip</h2>
            <p className="text-emerald-100">{payroll.month}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <Download className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-lg">{employee?.name}</h3>
              <p className="text-gray-500">{employee?.department} • {employee?.position}</p>
              <p className="text-gray-500">Employee ID: {employee?.employeeId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Pay Date</p>
              <p className="font-medium">{new Date(payroll.processedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-800 mb-3">Earnings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span>${payroll.basicSalary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Housing Allowance</span>
                  <span>${(payroll.housingAllowance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Allowance</span>
                  <span>${(payroll.transportAllowance || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Allowances</span>
                  <span>${(payroll.otherAllowances || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-green-700">
                  <span>Gross Salary</span>
                  <span>${payroll.grossSalary?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4">
              <h4 className="font-semibold text-red-800 mb-3">Deductions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${(payroll.taxDeduction || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pension</span>
                  <span>${(payroll.pensionDeduction || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loan Repayment</span>
                  <span>${(payroll.loanDeduction || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Deductions</span>
                  <span>${(payroll.otherDeductions || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-red-700">
                  <span>Total Deductions</span>
                  <span>${payroll.totalDeductions?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-emerald-800">NET PAY</span>
            <span className="text-2xl font-bold text-emerald-700">${payroll.netSalary?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
