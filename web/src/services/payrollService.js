// Payroll Service
export const payrollService = {
  // Salary components
  salaryComponents: {
    earnings: {
      basic: { label: 'Basic Salary', type: 'fixed', taxable: true },
      housing: { label: 'Housing Allowance', type: 'fixed', taxable: true },
      transport: { label: 'Transport Allowance', type: 'fixed', taxable: true },
      meal: { label: 'Meal Allowance', type: 'fixed', taxable: true },
      overtime: { label: 'Overtime Pay', type: 'variable', taxable: true },
      bonus: { label: 'Bonus', type: 'variable', taxable: true },
      commission: { label: 'Commission', type: 'variable', taxable: true }
    },
    deductions: {
      tax: { label: 'Income Tax', type: 'statutory' },
      pension: { label: 'Pension Contribution', type: 'statutory' },
      health: { label: 'Health Insurance', type: 'voluntary' },
      loan: { label: 'Loan Repayment', type: 'voluntary' },
      advance: { label: 'Salary Advance', type: 'recovery' },
      other: { label: 'Other Deductions', type: 'voluntary' }
    }
  },

  // Overtime calculation
  calculateOvertime: (hours, rate, type = 'normal') => {
    const rates = {
      normal: 1.5,      // Weekday overtime
      weekend: 2.0,     // Weekend overtime
      holiday: 2.5      // Public holiday overtime
    };
    return hours * rate * (rates[type] || 1.5);
  },

  // Tax calculation (Maldives example - adjust for country)
  calculateTax: (taxableIncome) => {
    // Progressive tax brackets (example)
    const brackets = [
      { limit: 3000, rate: 0 },
      { limit: 10000, rate: 0.05 },
      { limit: 50000, rate: 0.10 },
      { limit: Infinity, rate: 0.15 }
    ];
    
    let tax = 0;
    let remaining = taxableIncome;
    let previousLimit = 0;
    
    for (const bracket of brackets) {
      if (remaining <= 0) break;
      const taxableAtBracket = Math.min(remaining, bracket.limit - previousLimit);
      tax += taxableAtBracket * bracket.rate;
      remaining -= taxableAtBracket;
      previousLimit = bracket.limit;
    }
    
    return tax;
  },

  // Payslip generator
  generatePayslip: (employee, month, year) => {
    const earnings = Object.values(employee.salary?.earnings || {});
    const deductions = Object.values(employee.salary?.deductions || {});
    const totalEarnings = earnings.reduce((a, b) => a + (b.amount || 0), 0);
    const totalDeductions = deductions.reduce((a, b) => a + (b.amount || 0), 0);
    const netSalary = totalEarnings - totalDeductions;
    
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.employeeId,
      department: employee.department,
      position: employee.position,
      month,
      year,
      payPeriod: `${month} ${year}`,
      earnings,
      totalEarnings,
      deductions,
      totalDeductions,
      netSalary,
      paymentMethod: employee.salary?.paymentMethod || 'Bank Transfer',
      bankAccount: employee.bankAccount,
      generatedAt: new Date().toISOString()
    };
  },

  // End of service calculation
  calculateEndOfService: (employee) => {
    const joinDate = new Date(employee.joinDate);
    const endDate = new Date();
    const yearsOfService = (endDate - joinDate) / (1000 * 60 * 60 * 24 * 365);
    const basicSalary = employee.salary?.basic || 0;
    
    let entitlement = 0;
    if (yearsOfService <= 3) {
      entitlement = (basicSalary / 30) * 21 * yearsOfService;
    } else {
      entitlement = (basicSalary / 30) * 21 * 3; // First 3 years
      entitlement += (basicSalary / 30) * 30 * (yearsOfService - 3); // Remaining years
    }
    
    return {
      yearsOfService: yearsOfService.toFixed(2),
      basicSalary,
      entitlement: Math.round(entitlement),
      unpaidLeaveDeductions: 0,
      loansDeductions: employee.loans?.reduce((a, b) => a + b.balance, 0) || 0,
      finalSettlement: Math.round(entitlement) - (employee.loans?.reduce((a, b) => a + b.balance, 0) || 0)
    };
  },

  // Loan/Advance tracking
  trackLoan: (employeeId, loanData) => {
    return {
      employeeId,
      loanId: `LOAN-${Date.now()}`,
      type: loanData.type, // 'salary-advance', 'personal-loan'
      amount: loanData.amount,
      interestRate: loanData.interestRate || 0,
      installments: loanData.installments,
      installmentAmount: loanData.amount / loanData.installments,
      remainingAmount: loanData.amount,
      remainingInstallments: loanData.installments,
      startDate: new Date().toISOString(),
      status: 'active'
    };
  },

  // Bank advice generation
  generateBankAdvice: (payrollData) => {
    return payrollData.map(employee => ({
      accountNumber: employee.bankAccount,
      accountName: employee.name,
      amount: employee.netSalary,
      reference: `SAL-${employee.employeeCode}-${payrollData.month}${payrollData.year}`
    }));
  }
};

export default payrollService;
