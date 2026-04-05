import { useState } from 'react';
import { Briefcase, Users, Calendar, Filter, Search, Plus, CheckCircle, Clock, Loader2, Mail, Phone, X, Star, MapPin, DollarSign } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { recruitmentService } from '../services/recruitmentService';

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCompany();

  // Fetch data from Firestore
  const { documents: jobPostings, loading: jobsLoading, addDocument: addJob } = useFirestore('jobPostings');
  const { documents: candidates, loading: candidatesLoading } = useFirestore('candidates');
  const { documents: employees } = useFirestore('employees');

  // Filter by company
  const filteredJobs = jobPostings.filter(job => job.companyId === companyId);
  const filteredCandidates = candidates.filter(c => c.companyId === companyId);

  // Calculate stats from real data
  const stats = {
    openPositions: filteredJobs.filter(j => j.status === 'open').length,
    totalApplicants: filteredCandidates.length,
    inPipeline: filteredCandidates.filter(c => c.stage !== 'hired' && c.stage !== 'rejected').length,
    hiredThisMonth: filteredCandidates.filter(c => {
      if (c.stage !== 'hired') return false;
      const hireDate = new Date(c.hiredAt || c.updatedAt);
      const now = new Date();
      return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
    }).length
  };

  const pipelineStages = recruitmentService.pipelineStages;

  const handleNewJob = async () => {
    // This would open a modal or navigate to a form
    console.log('New job posting');
  };

  if (jobsLoading || candidatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading recruitment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
          <img 
            src="/storyset/Business decisions-cuate.svg" 
            alt="Recruitment" 
            className="h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Briefcase className="h-8 w-8" />
              Recruitment & ATS
            </h1>
            <p className="text-blue-100 mt-1">Manage job postings and track applicants</p>
          </div>
          <button 
            onClick={handleNewJob}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-50"
          >
            <Plus className="h-5 w-5" />
            New Job Posting
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Positions', value: stats.openPositions, icon: Briefcase, color: 'bg-blue-500' },
          { label: 'Total Applicants', value: stats.totalApplicants, icon: Users, color: 'bg-green-500' },
          { label: 'In Pipeline', value: stats.inPipeline, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Hired This Month', value: stats.hiredThisMonth, icon: CheckCircle, color: 'bg-purple-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b">
          {[
            { id: 'jobs', label: 'Job Postings', icon: Briefcase },
            { id: 'candidates', label: 'Candidates', icon: Users },
            { id: 'pipeline', label: 'Pipeline', icon: Filter },
            { id: 'calendar', label: 'Interviews', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-6">
        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Job Postings Tab */}
        {activeTab === 'jobs' && (
          <div className="overflow-x-auto">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No job postings found</p>
                <p className="text-sm">Create your first job posting to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Applicants</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{job.title}</td>
                      <td className="py-3 px-4">{job.department}</td>
                      <td className="py-3 px-4">{job.location}</td>
                      <td className="py-3 px-4">{job.type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {filteredCandidates.filter(c => c.jobId === job.id).length}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Candidates/Pipeline Tab */}
        {(activeTab === 'candidates' || activeTab === 'pipeline') && (
          <div className="grid grid-cols-7 gap-4">
            {pipelineStages.map(stage => (
              <div key={stage.id} className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
                  {stage.label}
                </h3>
                <div className="space-y-2">
                  {filteredCandidates
                    .filter(c => c.stage === stage.id)
                    .map(candidate => (
                      <div key={candidate.id} className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-medium text-sm">{candidate.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {filteredJobs.find(j => j.id === candidate.jobId)?.title || 'Unknown Position'}
                        </p>
                        {candidate.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(Math.floor(candidate.rating))}
                            </div>
                            <span className="text-xs text-gray-500">{candidate.rating}</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'calendar' && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Interview calendar coming soon</p>
            <p className="text-sm">Schedule and manage interviews with candidates</p>
          </div>
        )}
      </div>
    </div>
  );
}
