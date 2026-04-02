import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { 
  FileText, FileSignature, Briefcase, Users, DollarSign, 
  Plane, AlertTriangle, TrendingUp, Printer, Settings, Eye,
  Target, Receipt
} from 'lucide-react';

/**
 * Form Templates Module
 * 
 * A centralized navigation hub for all form templates.
 * Accessible by GM and HRM to view, preview, and adjust form templates.
 * 
 * Includes:
 * - Job Descriptions
 * - Offer Letters & Contracts
 * - Payslips
 * - Leave Forms
 * - Disciplinary Letters
 * - Promotion Letters
 * - Company Letterhead Settings
 */

const FORM_CATEGORIES = [
  {
    id: 'hr_documents',
    name: 'HR Documents',
    icon: Users,
    color: 'blue',
    forms: [
      { id: 'job_description', name: 'Job Description', icon: Briefcase, path: '/job-descriptions', description: 'Generate position descriptions with templates' },
      { id: 'offer_letter', name: 'Offer Letter', icon: FileText, path: '/contracts?type=offer', description: 'Employment offer letters' },
      { id: 'employment_contract', name: 'Employment Contract', icon: FileSignature, path: '/contracts?type=contract', description: 'Full employment contracts' },
      { id: 'probation_contract', name: 'Probation Contract', icon: FileText, path: '/contracts?type=probation', description: 'Probationary period contracts' }
    ]
  },
  {
    id: 'payroll_documents',
    name: 'Payroll & Benefits',
    icon: DollarSign,
    color: 'green',
    forms: [
      { id: 'payslip', name: 'Payslip Template', icon: FileText, path: '/payroll', description: 'Monthly payslip format' },
      { id: 'payroll_approval', name: 'Payroll Approval Form', icon: FileSignature, path: '/payroll/approval', description: 'Payroll processing approval' },
      { id: 'salary_certificate', name: 'Salary Certificate', icon: FileText, path: '/payroll/certificate', description: 'Employee salary certificates' }
    ]
  },
  {
    id: 'leave_documents',
    name: 'Leave & Attendance',
    icon: Plane,
    color: 'orange',
    forms: [
      { id: 'leave_application', name: 'Leave Application', icon: FileText, path: '/leave-planner', description: 'Employee leave request form' },
      { id: 'leave_approval', name: 'Leave Approval Form', icon: FileSignature, path: '/leave-approval', description: 'Multi-level leave approval' }
    ]
  },
  {
    id: 'disciplinary_documents',
    name: 'Disciplinary & Actions',
    icon: AlertTriangle,
    color: 'red',
    forms: [
      { id: 'disciplinary_letter', name: 'Disciplinary Letter', icon: FileText, path: '/disciplinary', description: 'Warning and disciplinary notices' },
      { id: 'termination_letter', name: 'Termination Letter', icon: FileText, path: '/contracts?type=termination', description: 'Employment termination notices' },
      { id: 'warning_memo', name: 'Warning Memo', icon: FileText, path: '/disciplinary?type=warning', description: 'Official warning memorandums' }
    ]
  },
  {
    id: 'promotion_documents',
    name: 'Promotions & Reviews',
    icon: TrendingUp,
    color: 'purple',
    forms: [
      { id: 'promotion_letter', name: 'Promotion Letter', icon: FileText, path: '/promotions', description: 'Position promotion letters' },
      { id: 'salary_increment', name: 'Salary Increment Letter', icon: DollarSign, path: '/promotions?type=salary', description: 'Salary increase notifications' },
      { id: 'transfer_letter', name: 'Transfer Letter', icon: FileText, path: '/promotions?type=transfer', description: 'Department transfer notices' },
      { id: 'performance_review', name: 'Performance Review Form', icon: Target, path: '/performance-reviews', description: 'Employee performance evaluation forms' }
    ]
  },
  {
    id: 'expense_documents',
    name: 'Expense & Claims',
    icon: Receipt,
    color: 'teal',
    forms: [
      { id: 'expense_claim', name: 'Expense Claim Form', icon: Receipt, path: '/expense-claims', description: 'Submit expense reimbursements' },
      { id: 'travel_request', name: 'Travel Request Form', icon: Plane, path: '/expense-claims?type=travel', description: 'Business travel authorization' },
      { id: 'advance_request', name: 'Salary Advance Form', icon: DollarSign, path: '/expense-claims?type=advance', description: 'Request salary advance' }
    ]
  },
  {
    id: 'company_settings',
    name: 'Company Settings',
    icon: Settings,
    color: 'gray',
    forms: [
      { id: 'letterhead', name: 'Letterhead Settings', icon: FileText, path: '/companies', description: 'Manage company letterhead & logo' },
      { id: 'company_profile', name: 'Company Profile', icon: Settings, path: '/companies/profile', description: 'Company information and branding' }
    ]
  }
];

export default function FormTemplates() {
  const { userData, hasAccess } = useAuth();
  const { currentCompany } = useCompany();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [previewForm, setPreviewForm] = useState(null);

  const canAccessTemplates = () => {
    return userData?.role === 'gm' || userData?.role === 'hrm' || userData?.role === 'superadmin';
  };

  if (!canAccessTemplates()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
            <FileText className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-600 mt-2">Only GM and HRM can access form templates.</p>
        </div>
      </div>
    );
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
      red: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      teal: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
      gray: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Form Templates</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Manage and preview all company forms with letterhead integration
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Current Company</div>
          <div className="font-semibold text-gray-900">{currentCompany?.name}</div>
          {currentCompany?.letterheadUrl && (
            <span className="text-xs text-green-600 flex items-center gap-1 mt-1 justify-end">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Letterhead Configured
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Quick Generate</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/job-descriptions" className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="text-sm">New Job Description</span>
          </a>
          <a href="/contracts?type=offer" className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <FileText className="h-4 w-4 text-green-600" />
            <span className="text-sm">Offer Letter</span>
          </a>
          <a href="/promotions" className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Promotion Letter</span>
          </a>
          <a href="/payroll/approval" className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm">Payroll Form</span>
          </a>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FORM_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isExpanded = selectedCategory === category.id;
          
          return (
            <div 
              key={category.id} 
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                isExpanded ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`}
            >
              <button
                onClick={() => setSelectedCategory(isExpanded ? null : category.id)}
                className={`w-full p-6 text-left flex items-center justify-between ${getColorClasses(category.color)}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white bg-opacity-50`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm opacity-75">{category.forms.length} templates</p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {isExpanded ? '−' : '+'}
                </span>
              </button>
              
              {isExpanded && (
                <div className="p-4 space-y-2 bg-gray-50">
                  {category.forms.map((form) => {
                    const FormIcon = form.icon;
                    return (
                      <a
                        key={form.id}
                        href={form.path}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <FormIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-blue-900">
                            {form.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {form.description}
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-gray-300 group-hover:text-blue-600" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Letterhead Preview */}
      {currentCompany?.letterheadUrl && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-600" />
            Current Letterhead Preview
          </h3>
          <div className="border rounded-lg p-8 max-w-3xl mx-auto" style={{ minHeight: '400px' }}>
            <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
              {currentCompany.logoUrl && (
                <img 
                  src={currentCompany.logoUrl} 
                  alt="Logo" 
                  className="h-16 mx-auto mb-2 object-contain" 
                />
              )}
              <h2 className="text-2xl font-bold text-blue-900">{currentCompany.name}</h2>
              <p className="text-sm text-gray-600">{currentCompany.address}</p>
              <p className="text-sm text-gray-600">
                {currentCompany.phone && `Phone: ${currentCompany.phone} | `}
                {currentCompany.email && `Email: ${currentCompany.email}`}
              </p>
            </div>
            <div className="text-center text-gray-400 text-sm">
              [Document content will appear here with the above letterhead]
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-gray-50 p-6 rounded-xl border">
        <h3 className="font-semibold text-gray-900 mb-3">How to Use Form Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
            <p>Click on any category to view available form templates</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
            <p>Select a form template to generate with employee data</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
            <p>Forms automatically include company letterhead</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
            <p>Preview and print to PDF with professional formatting</p>
          </div>
        </div>
      </div>
    </div>
  );
}
