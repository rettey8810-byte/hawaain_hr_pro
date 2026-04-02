import { useState } from 'react';
import { useBenefits } from '../contexts/BenefitsContext';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  Shield, 
  Wallet, 
  Plus, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Users,
  Clock,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BenefitsManagement() {
  const { 
    benefits, 
    enrollments, 
    salaryAdvances,
    createBenefit,
    enrollInBenefit,
    requestSalaryAdvance,
    approveSalaryAdvance,
    getEmployeeBenefits,
    getEmployeeAdvances
  } = useBenefits();
  const { company } = useCompany();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('benefits');
  const [showBenefitForm, setShowBenefitForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benefits & Payroll</h1>
          <p className="text-gray-600">Manage employee benefits, insurance, and salary advances</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Heart} 
          label="Active Benefits" 
          value={benefits.length} 
          color="bg-rose-500" 
        />
        <StatCard 
          icon={Users} 
          label="Enrolled Employees" 
          value={enrollments.filter(e => e.status === 'active').length} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Wallet} 
          label="Pending Advances" 
          value={salaryAdvances.filter(a => a.status === 'pending').length} 
          color="bg-yellow-500" 
        />
        <StatCard 
          icon={DollarSign} 
          label="Total Benefits Cost" 
          value="MVR 125K" 
          color="bg-green-500" 
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'benefits', label: 'Benefits Programs', icon: Shield },
          { id: 'enrollments', label: 'Enrollments', icon: Users },
          { id: 'advances', label: 'Salary Advances', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {activeTab === 'benefits' && (
          <BenefitsTab 
            benefits={benefits}
            showForm={showBenefitForm}
            setShowForm={setShowBenefitForm}
            onCreate={createBenefit}
          />
        )}
        {activeTab === 'enrollments' && (
          <EnrollmentsTab enrollments={enrollments} benefits={benefits} />
        )}
        {activeTab === 'advances' && (
          <AdvancesTab 
            advances={salaryAdvances}
            showForm={showAdvanceForm}
            setShowForm={setShowAdvanceForm}
            onRequest={requestSalaryAdvance}
            onApprove={approveSalaryAdvance}
          />
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center gap-3">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Benefits Tab
function BenefitsTab({ benefits, showForm, setShowForm, onCreate }) {
  const [newBenefit, setNewBenefit] = useState({
    name: '',
    type: 'health',
    provider: '',
    description: '',
    employerContribution: 50,
    employeeContribution: 50
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onCreate(newBenefit);
      toast.success('Benefit program created!');
      setShowForm(false);
      setNewBenefit({
        name: '',
        type: 'health',
        provider: '',
        description: '',
        employerContribution: 50,
        employeeContribution: 50
      });
    } catch (error) {
      toast.error('Failed to create benefit');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Benefit Programs</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Benefit
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Benefit Name</label>
              <input
                type="text"
                value={newBenefit.name}
                onChange={(e) => setNewBenefit({...newBenefit, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Health Insurance Premium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select 
                value={newBenefit.type}
                onChange={(e) => setNewBenefit({...newBenefit, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="health">Health Insurance</option>
                <option value="dental">Dental</option>
                <option value="vision">Vision</option>
                <option value="life">Life Insurance</option>
                <option value="retirement">Retirement/401k</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <input
              type="text"
              value={newBenefit.provider}
              onChange={(e) => setNewBenefit({...newBenefit, provider: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Allied Insurance"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newBenefit.description}
              onChange={(e) => setNewBenefit({...newBenefit, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
              placeholder="Describe the benefit coverage..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employer Contribution (%)</label>
              <input
                type="number"
                value={newBenefit.employerContribution}
                onChange={(e) => setNewBenefit({...newBenefit, employerContribution: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Employee Contribution (%)</label>
              <input
                type="number"
                value={newBenefit.employeeContribution}
                onChange={(e) => setNewBenefit({...newBenefit, employeeContribution: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Benefit
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map(benefit => (
          <div key={benefit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{benefit.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">{benefit.type}</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{benefit.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Provider: {benefit.provider}</span>
              <span className="text-blue-600 font-medium">
                {benefit.employerContribution}% employer paid
              </span>
            </div>
          </div>
        ))}
        {benefits.length === 0 && (
          <p className="text-gray-500 col-span-2 text-center py-8">No benefit programs configured</p>
        )}
      </div>
    </div>
  );
}

// Enrollments Tab
function EnrollmentsTab({ enrollments, benefits }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Employee Enrollments</h3>
      
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[800px] sm:min-w-full px-4 sm:px-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Benefit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {enrollments.map(enrollment => {
                const benefit = benefits.find(b => b.id === enrollment.benefitId);
                return (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {enrollment.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {benefit?.name || 'Unknown Benefit'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {enrollment.enrolledAt ? format(new Date(enrollment.enrolledAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      MVR {enrollment.monthlyContribution?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        enrollment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No enrollments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Advances Tab
function AdvancesTab({ advances, showForm, setShowForm, onRequest, onApprove }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onRequest({
        amount: parseFloat(amount),
        reason
      });
      toast.success('Advance requested!');
      setShowForm(false);
      setAmount('');
      setReason('');
    } catch (error) {
      toast.error('Failed to request advance');
    }
  };

  const handleApprove = async (id) => {
    try {
      await onApprove(id, 'current-user-id');
      toast.success('Advance approved!');
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Salary Advances</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Request Advance
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (MVR)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0.00"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select reason...</option>
                <option value="emergency">Emergency</option>
                <option value="medical">Medical</option>
                <option value="education">Education</option>
                <option value="housing">Housing</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[800px] sm:min-w-full px-4 sm:px-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {advances.map(advance => (
                <tr key={advance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {advance.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    MVR {advance.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {advance.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {advance.requestedAt ? format(new Date(advance.requestedAt), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      advance.status === 'approved' ? 'bg-green-100 text-green-700' :
                      advance.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      advance.status === 'repaid' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {advance.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {advance.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(advance.id)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {advances.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No salary advance requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
