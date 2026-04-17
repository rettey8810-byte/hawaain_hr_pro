import { useState, useEffect } from 'react';
import {
  Briefcase, Users, Calendar, Filter, Search, Plus, CheckCircle, Clock, Loader2, Mail, Phone, X, Star, MapPin, DollarSign,
  FileText, Send, CheckSquare, UserCheck, Plane, FileCheck, MoreHorizontal, Download, Eye, ChevronRight, Building2,
  Upload, ClipboardCheck, History
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/helpers';
import ExpatOnboarding from './ExpatOnboarding';

// Pipeline stages matching the workflow
const PIPELINE_STAGES = [
  { id: 'new', label: 'New Application', color: 'gray', description: 'CV received' },
  { id: 'prescreening', label: 'Prescreening', color: 'blue', description: 'Questions filled' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'indigo', description: 'CV shortlisted' },
  { id: 'interview', label: 'Interview', color: 'purple', description: 'Interview scheduled' },
  { id: 'offer', label: 'Offer Sent', color: 'yellow', description: 'Offer letter sent' },
  { id: 'notice_period', label: 'Notice Period', color: 'orange', description: 'Serving notice (Maldivian)' },
  { id: 'onboarding', label: 'Onboarding', color: 'cyan', description: 'Transport arranged' },
  { id: 'expat_processing', label: 'Expat Processing', color: 'pink', description: 'Visa/Entry pass/Tickets' },
  { id: 'hired', label: 'Hired', color: 'green', description: 'Joined successfully' },
  { id: 'rejected', label: 'Rejected', color: 'red', description: 'Not selected' }
];

// Prescreening questions template
const DEFAULT_PRESCREENING_QUESTIONS = [
  { id: 'experience', question: 'Years of relevant experience?', type: 'number', required: true },
  { id: 'availability', question: 'When can you start?', type: 'text', required: true },
  { id: 'salary_expectation', question: 'Expected salary (USD)?', type: 'number', required: true },
  { id: 'relocate', question: 'Willing to relocate to resort island?', type: 'boolean', required: true },
  { id: 'maldivian', question: 'Are you Maldivian?', type: 'boolean', required: true },
  { id: 'notice_period', question: 'Current notice period (days)?', type: 'number', required: false }
];

export default function Recruitment() {

  const [activeTab, setActiveTab] = useState('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCompany();
  const { userData } = useAuth();

  // Modals state
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showExpatModal, setShowExpatModal] = useState(false);
  const [showExpatOnboarding, setShowExpatOnboarding] = useState(false);
  const [showPrescreeningModal, setShowPrescreeningModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
    requirements: '',
    status: 'open',
    prescreeningQuestions: DEFAULT_PRESCREENING_QUESTIONS
  });

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    cvUrl: '',
    source: 'direct',
    stage: 'new',
    maldivian: false,
    noticePeriodDays: 0,
    prescreeningAnswers: {}
  });

  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    type: 'virtual',
    location: '',
    notes: '',
    interviewer: ''
  });

  const [offerForm, setOfferForm] = useState({
    salary: '',
    startDate: '',
    benefits: [],
    probationPeriod: '3 months',
    notes: ''
  });

  const [onboardingForm, setOnboardingForm] = useState({
    transportArranged: false,
    transportDetails: '',
    accommodationArranged: false,
    selectedRoomId: '',
    joiningDate: '',
    orientationScheduled: false,
    // Additional Registration Fields
    passportNumber: '',
    passportExpiry: '',
    workPermitNumber: '',
    workPermitExpiry: '',
    visaNumber: '',
    visaExpiry: '',
    nationalId: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    bankAccountNumber: '',
    bankName: '',
    medicalInsuranceNumber: '',
    uniformSize: '',
    allergies: '',
    dietaryRestrictions: ''
  });

  const [expatForm, setExpatForm] = useState({
    visaType: 'work',
    visaApplied: false,
    visaStatus: 'pending',
    entryPassApplied: false,
    entryPassStatus: 'pending',
    ticketsBooked: false,
    flightDetails: '',
    arrivalDate: ''
  });

  const { documents: jobPostings, loading: jobsLoading, addDocument: addJob } = useFirestore('jobPostings');

  const { documents: candidates, loading: candidatesLoading, addDocument: addCandidate } = useFirestore('candidates');

  const { documents: employees } = useFirestore('employees');

  const { documents: rooms } = useFirestore('rooms');

  // Helper to update candidate with activity tracking
  const updateCandidate = async (id, data, actionNote = '') => {
    try {
      const candidate = candidates.find(c => c.id === id);
      const oldStage = candidate?.stage;
      const newStage = data.stage;
      
      // Build activity entry if stage changed
      const activityEntry = {
        timestamp: new Date().toISOString(),
        action: newStage && oldStage && newStage !== oldStage 
          ? `Stage changed: ${oldStage} → ${newStage}`
          : (actionNote || 'Updated'),
        details: data,
        user: userData?.name || userData?.email || 'System'
      };
      
      // Get existing history or create new array
      const existingHistory = candidate?.activityHistory || [];
      
      await updateDoc(doc(db, 'candidates', id), {
        ...data,
        updatedAt: new Date().toISOString(),
        activityHistory: [...existingHistory, activityEntry]
      });
      
      toast.success('Candidate updated successfully');
    } catch (err) {
      toast.error('Error updating candidate: ' + err.message);
      throw err;
    }
  };



  // Filter by company and department (for dept_head/supervisor)
  const userRole = userData?.role;
  const userDept = userData?.department?.toLowerCase().trim();
  const isDeptHeadOrSupervisor = ['dept_head', 'supervisor'].includes(userRole);

  const filteredJobs = jobPostings.filter(job => {
    if (job.companyId !== companyId) return false;
    // For dept_head/supervisor, only show jobs from their department
    if (isDeptHeadOrSupervisor && userDept) {
      const jobDept = (job.department || '').toLowerCase().trim();
      return jobDept === userDept || 
             jobDept.startsWith(userDept + ' ') ||
             jobDept.startsWith(userDept + '-') ||
             jobDept.includes(' ' + userDept + ' ') ||
             jobDept.includes('-' + userDept + ' ') ||
             jobDept.includes('(' + userDept + ')');
    }
    return true;
  });

  const filteredCandidates = candidates.filter(c => {
    if (c.companyId !== companyId) return false;
    // For dept_head/supervisor, only show candidates from their department
    if (isDeptHeadOrSupervisor && userDept) {
      const candidateDept = (c.jobDepartment || c.department || '').toLowerCase().trim();
      return candidateDept === userDept || 
             candidateDept.startsWith(userDept + ' ') ||
             candidateDept.startsWith(userDept + '-') ||
             candidateDept.includes(' ' + userDept + ' ') ||
             candidateDept.includes('-' + userDept + ' ') ||
             candidateDept.includes('(' + userDept + ')');
    }
    return true;
  });



  // Stats
  const stats = {
    openPositions: filteredJobs.filter(j => j.status === 'open').length,
    totalApplicants: filteredCandidates.length,
    inPipeline: filteredCandidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length,
    shortlisted: filteredCandidates.filter(c => c.stage === 'shortlisted').length,
    interviewsScheduled: filteredCandidates.filter(c => c.stage === 'interview').length,
    offersSent: filteredCandidates.filter(c => c.stage === 'offer').length,
    hiredThisMonth: filteredCandidates.filter(c => {
      if (c.stage !== 'hired') return false;
      const hireDate = new Date(c.hiredAt || c.updatedAt);
      const now = new Date();
      return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
    }).length
  };

  const pipelineStages = PIPELINE_STAGES;



  const handleNewJob = async () => {
    try {
      if (!jobForm.title || !jobForm.department) {
        toast.error('Please fill required fields');
        return;
      }
      await addJob({
        ...jobForm,
        companyId,
        createdAt: new Date().toISOString(),
        postedAt: new Date().toISOString()
      });
      toast.success('Job posting created successfully');
      setShowJobModal(false);
      setJobForm({
        title: '', department: '', location: '', type: 'Full-time',
        salary: '', description: '', requirements: '', status: 'open',
        prescreeningQuestions: DEFAULT_PRESCREENING_QUESTIONS
      });
    } catch (err) {
      toast.error('Error creating job: ' + err.message);
    }
  };



  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading company data...</span>
        </div>
      </div>
    );
  }

  if (jobsLoading || candidatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              Recruitment & ATS - Full Workflow
            </h1>
            <p className="text-blue-100 mt-1">Complete hiring: CV → Interview → Offer → Onboarding</p>
          </div>
          <button 
            onClick={() => setShowJobModal(true)}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-50"
          >
            <Plus className="h-5 w-5" />
            New Job Posting
          </button>
        </div>

      </div>



      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        {[
          { label: 'Open Jobs', value: stats.openPositions, icon: Briefcase, color: 'bg-blue-500' },
          { label: 'Applicants', value: stats.totalApplicants, icon: Users, color: 'bg-green-500' },
          { label: 'In Pipeline', value: stats.inPipeline, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Shortlisted', value: stats.shortlisted, icon: CheckSquare, color: 'bg-indigo-500' },
          { label: 'Interviews', value: stats.interviewsScheduled, icon: Calendar, color: 'bg-purple-500' },
          { label: 'Offers', value: stats.offersSent, icon: Mail, color: 'bg-orange-500' },
          { label: 'Notice Period', value: filteredCandidates.filter(c => c.stage === 'notice_period').length, icon: Clock, color: 'bg-amber-500' },
          { label: 'Hired', value: stats.hiredThisMonth, icon: CheckCircle, color: 'bg-emerald-500' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'jobs', label: 'Job Postings', icon: Briefcase },
            { id: 'new', label: 'New', icon: FileText },
            { id: 'applications', label: 'New Applications', icon: FileText },
            { id: 'prescreening', label: 'Prescreening', icon: ClipboardCheck },
            { id: 'shortlisted', label: 'Shortlisted', icon: CheckSquare },
            { id: 'interviews', label: 'Interviews', icon: Calendar },
            { id: 'offers', label: 'Offers', icon: Mail },
            { id: 'onboarding', label: 'Onboarding', icon: UserCheck },
            { id: 'expat', label: 'Expat Processing', icon: Plane },
            { id: 'hired', label: 'Hired', icon: CheckCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id !== 'jobs' && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tab.id === 'applications' ? filteredCandidates.filter(c => c.stage === 'new').length :
                   tab.id === 'prescreening' ? filteredCandidates.filter(c => c.stage === 'prescreening').length :
                   tab.id === 'shortlisted' ? filteredCandidates.filter(c => c.stage === 'shortlisted').length :
                   tab.id === 'interviews' ? filteredCandidates.filter(c => c.stage === 'interview').length :
                   tab.id === 'offers' ? filteredCandidates.filter(c => ['offer', 'notice_period'].includes(c.stage)).length :
                   tab.id === 'onboarding' ? filteredCandidates.filter(c => c.stage === 'onboarding').length :
                   tab.id === 'expat' ? filteredCandidates.filter(c => c.stage === 'expat_processing').length :
                   filteredCandidates.filter(c => c.stage === 'hired').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>



      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm p-6">
        {/* Search and Add */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates, jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
            />
          </div>
          {activeTab !== 'jobs' && (
            <button
              onClick={() => setShowCandidateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Candidate
            </button>
          )}
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



        {/* Candidates Tabs */}
        {activeTab !== 'jobs' && (
          <div className="space-y-4">
            {(() => {
              const stageMap = {
                'applications': 'new',
                'prescreening': 'prescreening',
                'shortlisted': 'shortlisted',
                'interviews': 'interview',
                'offers': ['offer', 'notice_period'],
                'onboarding': 'onboarding',
                'expat': 'expat_processing',
                'hired': 'hired'
              };
              const targetStage = stageMap[activeTab];
              const stageCandidates = filteredCandidates.filter(c =>
                Array.isArray(targetStage) ? targetStage.includes(c.stage) : c.stage === targetStage
              );

              if (stageCandidates.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No candidates in this stage</p>
                  </div>
                );
              }

              return stageCandidates.map(candidate => {
                const job = filteredJobs.find(j => j.id === candidate.jobId);
                const stageConfig = PIPELINE_STAGES.find(s => s.id === candidate.stage);

                return (
                  <div key={candidate.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {candidate.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{candidate.name}</p>
                          <p className="text-gray-600">{job?.title || 'Unknown Position'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">{candidate.email}</span>
                            <Phone className="h-4 w-4 text-gray-400 ml-2" />
                            <span className="text-sm text-gray-500">{candidate.phone}</span>
                          </div>
                          {candidate.maldivian && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                              Maldivian
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${stageConfig?.color}-100 text-${stageConfig?.color}-700`}>
                          {stageConfig?.label}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{stageConfig?.description}</p>
                      </div>
                    </div>

                    {/* Stage-specific actions */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {candidate.stage === 'new' && (
                        <>
                          <button
                            onClick={() => { setSelectedCandidate(candidate); setShowPrescreeningModal(true); }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            <ClipboardCheck className="h-4 w-4 inline mr-1" />
                            Fill Prescreening
                          </button>
                          <button
                            onClick={() => { setSelectedCandidate(candidate); setShowCandidateModal(true); updateCandidate(candidate.id, { stage: 'shortlisted', updatedAt: new Date().toISOString() }); }}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                          >
                            <CheckSquare className="h-4 w-4 inline mr-1" />
                            Shortlist
                          </button>
                        </>
                      )}

                      {candidate.stage === 'shortlisted' && (
                        <button
                          onClick={() => { setSelectedCandidate(candidate); setShowInterviewModal(true); }}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                        >
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Schedule Interview
                        </button>
                      )}

                      {candidate.stage === 'interview' && (
                        <>
                          <button
                            onClick={() => { setSelectedCandidate(candidate); setShowOfferModal(true); }}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                          >
                            <Mail className="h-4 w-4 inline mr-1" />
                            Send Offer
                          </button>
                          <button
                            onClick={() => updateCandidate(candidate.id, { stage: 'rejected', updatedAt: new Date().toISOString() })}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                          >
                            <X className="h-4 w-4 inline mr-1" />
                            Reject
                          </button>
                        </>
                      )}

                      {(candidate.stage === 'offer' || candidate.stage === 'notice_period') && (
                        <>
                          <button
                            onClick={() => { setSelectedCandidate(candidate); setShowOnboardingModal(true); }}
                            className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700"
                          >
                            <UserCheck className="h-4 w-4 inline mr-1" />
                            Start Onboarding
                          </button>
                          {candidate.maldivian && candidate.noticePeriodDays > 0 && (
                            <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm">
                              Notice: {candidate.noticePeriodDays} days
                            </span>
                          )}
                        </>
                      )}

                      {candidate.stage === 'onboarding' && !candidate.maldivian && (
                        <button
                          onClick={() => { 
                            setSelectedCandidate(candidate); 
                            setShowExpatOnboarding(true);
                          }}
                          className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700"
                        >
                          <Plane className="h-4 w-4 inline mr-1" />
                          Start Expat Onboarding
                        </button>
                      )}

                      {candidate.stage === 'expat_processing' && (
                        <>
                          <button
                            onClick={() => { 
                              setSelectedCandidate(candidate); 
                              setShowExpatOnboarding(true);
                            }}
                            className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700"
                          >
                            <Plane className="h-4 w-4 inline mr-1" />
                            Continue Onboarding
                          </button>
                          <button
                            onClick={() => updateCandidate(candidate.id, { stage: 'hired', hiredAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Complete & Hire
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => { setSelectedCandidate(candidate); setShowHistoryModal(true); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <History className="h-4 w-4 inline mr-1" />
                        History ({candidate.activityHistory?.length || 0})
                      </button>

                      <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                        <Eye className="h-4 w-4 inline mr-1" />
                        View CV
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Job Posting</h2>
              <button onClick={() => setShowJobModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. Front Office Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input
                    type="text"
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. Front Office"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. Sun Island Resort"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (USD)</label>
                <input
                  type="number"
                  value={jobForm.salary}
                  onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Describe the role..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="List requirements..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewJob}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Candidate</h2>
              <button onClick={() => setShowCandidateModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={candidateForm.name}
                  onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Position *</label>
                <select
                  value={candidateForm.jobId}
                  onChange={(e) => setCandidateForm({ ...candidateForm, jobId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a job...</option>
                  {filteredJobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={candidateForm.source}
                    onChange={(e) => setCandidateForm({ ...candidateForm, source: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="direct">Direct Application</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indeed">Indeed</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CV URL</label>
                  <input
                    type="text"
                    value={candidateForm.cvUrl}
                    onChange={(e) => setCandidateForm({ ...candidateForm, cvUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Link to CV"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={candidateForm.maldivian}
                    onChange={(e) => setCandidateForm({ ...candidateForm, maldivian: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Maldivian Candidate</span>
                </label>
              </div>
              {candidateForm.maldivian && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period (days)</label>
                  <input
                    type="number"
                    value={candidateForm.noticePeriodDays}
                    onChange={(e) => setCandidateForm({ ...candidateForm, noticePeriodDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCandidateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (!candidateForm.name || !candidateForm.email || !candidateForm.jobId) {
                        toast.error('Please fill required fields');
                        return;
                      }
                      // Get job details to store with candidate
                      const selectedJob = filteredJobs.find(j => j.id === candidateForm.jobId);
                      await addCandidate({
                        ...candidateForm,
                        jobTitle: selectedJob?.title || '',
                        jobDepartment: selectedJob?.department || '',
                        companyId,
                        appliedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      toast.success('Candidate added successfully');
                      setShowCandidateModal(false);
                      setCandidateForm({
                        name: '', email: '', phone: '', jobId: '', cvUrl: '',
                        source: 'direct', stage: 'new', maldivian: false,
                        noticePeriodDays: 0, prescreeningAnswers: {}
                      });
                    } catch (err) {
                      toast.error('Error adding candidate: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Schedule Interview</h2>
              <button onClick={() => setShowInterviewModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium">{selectedCandidate.name}</p>
              <p className="text-sm text-gray-600">{filteredJobs.find(j => j.id === selectedCandidate.jobId)?.title}</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={interviewForm.date}
                    onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={interviewForm.time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                <select
                  value={interviewForm.type}
                  onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="virtual">Virtual (Zoom/Teams)</option>
                  <option value="in_person">In Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location/Link</label>
                <input
                  type="text"
                  value={interviewForm.location}
                  onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={interviewForm.type === 'virtual' ? 'Zoom link...' : 'Office address...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                <input
                  type="text"
                  value={interviewForm.interviewer}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Name of interviewer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Any specific notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (!interviewForm.date || !interviewForm.time) {
                        toast.error('Please select date and time');
                        return;
                      }
                      await updateCandidate(selectedCandidate.id, {
                        stage: 'interview',
                        interviewScheduled: true,
                        interviewDetails: interviewForm,
                        updatedAt: new Date().toISOString()
                      });
                      toast.success('Interview scheduled successfully');
                      setShowInterviewModal(false);
                      setInterviewForm({ date: '', time: '', type: 'virtual', location: '', notes: '', interviewer: '' });
                    } catch (err) {
                      toast.error('Error scheduling interview: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Send className="h-4 w-4 inline mr-1" />
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Send Offer Letter</h2>
              <button onClick={() => setShowOfferModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <p className="font-medium">{selectedCandidate.name}</p>
              <p className="text-sm text-gray-600">
                {selectedCandidate.maldivian ? 'Maldivian - Will go to Notice Period stage' : 'Expat - Will go to Offer stage'}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Salary (USD)</label>
                <input
                  type="number"
                  value={offerForm.salary}
                  onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. 2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={offerForm.startDate}
                  onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probation Period</label>
                <select
                  value={offerForm.probationPeriod}
                  onChange={(e) => setOfferForm({ ...offerForm, probationPeriod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="none">No Probation</option>
                </select>
              </div>
              {selectedCandidate.maldivian && selectedCandidate.noticePeriodDays > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">
                    Notice Period: {selectedCandidate.noticePeriodDays} days
                  </p>
                  <p className="text-xs text-orange-600">
                    Candidate will need to serve notice before joining
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={offerForm.notes}
                  onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Any additional terms or notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (!offerForm.salary || !offerForm.startDate) {
                        toast.error('Please fill offer details');
                        return;
                      }
                      const stage = selectedCandidate.maldivian ? 'notice_period' : 'offer';
                      await updateCandidate(selectedCandidate.id, {
                        stage,
                        offerDetails: offerForm,
                        offerSentAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      toast.success('Offer sent successfully');
                      setShowOfferModal(false);
                      setOfferForm({ salary: '', startDate: '', benefits: [], probationPeriod: '3 months', notes: '' });
                    } catch (err) {
                      toast.error('Error sending offer: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Mail className="h-4 w-4 inline mr-1" />
                  Send Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboardingModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-cyan-600" />
                Complete Onboarding
              </h2>
              <button onClick={() => setShowOnboardingModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-cyan-50 rounded-lg">
              <p className="font-medium">{selectedCandidate.name}</p>
              <p className="text-sm text-gray-600">
                {selectedCandidate.maldivian ? 'Maldivian - Will complete onboarding directly' : 'Expat - Will go to visa processing after onboarding'}
              </p>
            </div>

            <div className="space-y-6">
              {/* Joining Date */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-600" />
                  Joining Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                    <input
                      type="date"
                      value={onboardingForm.joiningDate}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, joiningDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={onboardingForm.dateOfBirth}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Document Registration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Document Registration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                    <input
                      type="text"
                      value={onboardingForm.passportNumber}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, passportNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., A12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry</label>
                    <input
                      type="date"
                      value={onboardingForm.passportExpiry}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, passportExpiry: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit Number</label>
                    <input
                      type="text"
                      value={onboardingForm.workPermitNumber}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, workPermitNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., WP123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit Expiry</label>
                    <input
                      type="date"
                      value={onboardingForm.workPermitExpiry}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, workPermitExpiry: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visa Number</label>
                    <input
                      type="text"
                      value={onboardingForm.visaNumber}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, visaNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., V123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visa Expiry</label>
                    <input
                      type="date"
                      value={onboardingForm.visaExpiry}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, visaExpiry: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID / I-Card</label>
                    <input
                      type="text"
                      value={onboardingForm.nationalId}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, nationalId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., A123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Insurance Number</label>
                    <input
                      type="text"
                      value={onboardingForm.medicalInsuranceNumber}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, medicalInsuranceNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Insurance policy number"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-red-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={onboardingForm.emergencyContactName}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, emergencyContactName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={onboardingForm.emergencyContactPhone}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, emergencyContactPhone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="+960 xxx xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <select
                      value={onboardingForm.emergencyContactRelation}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, emergencyContactRelation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Bank Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={onboardingForm.bankName}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Bank of Maldives"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={onboardingForm.bankAccountNumber}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Bank account number"
                    />
                  </div>
                </div>
              </div>

              {/* Uniform & Medical */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  Uniform & Medical Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uniform Size</label>
                    <select
                      value={onboardingForm.uniformSize}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, uniformSize: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select size...</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (if any)</label>
                    <input
                      type="text"
                      value={onboardingForm.allergies}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, allergies: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="List allergies or 'None'"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
                    <input
                      type="text"
                      value={onboardingForm.dietaryRestrictions}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, dietaryRestrictions: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Halal, Vegetarian, No seafood, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Transport */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Plane className="h-5 w-5 text-orange-600" />
                  Transport Arrangement
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="transport"
                    checked={onboardingForm.transportArranged}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, transportArranged: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="transport" className="text-sm font-medium text-gray-700">Transport Arranged</label>
                </div>
                {onboardingForm.transportArranged && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Details</label>
                    <textarea
                      value={onboardingForm.transportDetails}
                      onChange={(e) => setOnboardingForm({ ...onboardingForm, transportDetails: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={2}
                      placeholder="Flight details, pickup arrangement, ferry schedule, etc."
                    />
                  </div>
                )}
              </div>

              {/* Accommodation Selection */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Accommodation Assignment
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="accommodation"
                    checked={onboardingForm.accommodationArranged}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, accommodationArranged: e.target.checked, selectedRoomId: '' })}
                    className="rounded"
                  />
                  <label htmlFor="accommodation" className="text-sm font-medium text-gray-700">Arrange Accommodation</label>
                </div>

                {onboardingForm.accommodationArranged && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Select Available Room *</label>
                    {rooms.filter(r => r.companyId === companyId && r.status === 'available').length === 0 ? (
                      <div className="p-4 bg-red-50 rounded-lg text-red-700 text-sm">
                        No available rooms found. Please add rooms in the Accommodation section first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {rooms
                          .filter(r => r.companyId === companyId && r.status === 'available')
                          .map(room => (
                            <div
                              key={room.id}
                              onClick={() => setOnboardingForm({ ...onboardingForm, selectedRoomId: room.id })}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                onboardingForm.selectedRoomId === room.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Room {room.roomNumber}</span>
                                {onboardingForm.selectedRoomId === room.id && (
                                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{room.building}, Floor {room.floor}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">{room.roomType}</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">{room.beds} beds</span>
                              </div>
                              {room.amenities?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {room.amenities.slice(0, 3).join(', ')}{room.amenities.length > 3 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                    {onboardingForm.selectedRoomId && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Room selected: Room {rooms.find(r => r.id === onboardingForm.selectedRoomId)?.roomNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Orientation */}
              <div className="flex items-center gap-2 border rounded-lg p-4">
                <input
                  type="checkbox"
                  id="orientation"
                  checked={onboardingForm.orientationScheduled}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, orientationScheduled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="orientation" className="text-sm font-medium text-gray-700">Orientation Scheduled</label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setShowOnboardingModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (!onboardingForm.joiningDate) {
                        toast.error('Please select a joining date');
                        return;
                      }

                      // If accommodation is arranged and room selected, assign it
                      if (onboardingForm.accommodationArranged && onboardingForm.selectedRoomId) {
                        const room = rooms.find(r => r.id === onboardingForm.selectedRoomId);
                        if (room) {
                          // Create room assignment
                          await addDoc(collection(db, 'roomAssignments'), {
                            roomId: room.id,
                            employeeId: selectedCandidate.id,
                            employeeName: selectedCandidate.name,
                            checkInDate: onboardingForm.joiningDate,
                            notes: `Auto-assigned during recruitment onboarding for ${selectedCandidate.name}`,
                            companyId: companyId,
                            status: 'active',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          });
                          // Update room status to occupied
                          await updateDoc(doc(db, 'rooms', room.id), {
                            status: 'occupied',
                            updatedAt: new Date().toISOString()
                          });
                          toast.success(`Room ${room.roomNumber} assigned successfully`);
                        }
                      }

                      await updateCandidate(selectedCandidate.id, {
                        stage: selectedCandidate.maldivian ? 'hired' : 'expat_processing',
                        onboardingDetails: onboardingForm,
                        updatedAt: new Date().toISOString()
                      });
                      toast.success('Onboarding completed successfully');
                      setShowOnboardingModal(false);
                    } catch (err) {
                      toast.error('Error completing onboarding: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expat Processing Modal */}
      {showExpatModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Expat Processing</h2>
              <button onClick={() => setShowExpatModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-pink-50 rounded-lg">
              <p className="font-medium">{selectedCandidate.name}</p>
              <p className="text-sm text-gray-600">Complete visa, entry pass, and ticket arrangements</p>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Passport className="h-5 w-5 text-pink-600" />
                  <h3 className="font-medium">Work Visa</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
                    <select
                      value={expatForm.visaType}
                      onChange={(e) => setExpatForm({ ...expatForm, visaType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="work">Work Visa</option>
                      <option value="business">Business Visa</option>
                      <option value="employment">Employment Visa</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="visaApplied"
                      checked={expatForm.visaApplied}
                      onChange={(e) => setExpatForm({ ...expatForm, visaApplied: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="visaApplied" className="text-sm font-medium text-gray-700">Visa Application Submitted</label>
                  </div>
                  {expatForm.visaApplied && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status</label>
                      <select
                        value={expatForm.visaStatus}
                        onChange={(e) => setExpatForm({ ...expatForm, visaStatus: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="in_process">In Process</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="h-5 w-5 text-pink-600" />
                  <h3 className="font-medium">Entry Pass / Work Permit</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="entryPassApplied"
                      checked={expatForm.entryPassApplied}
                      onChange={(e) => setExpatForm({ ...expatForm, entryPassApplied: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="entryPassApplied" className="text-sm font-medium text-gray-700">Entry Pass Applied</label>
                  </div>
                  {expatForm.entryPassApplied && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entry Pass Status</label>
                      <select
                        value={expatForm.entryPassStatus}
                        onChange={(e) => setExpatForm({ ...expatForm, entryPassStatus: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="in_process">In Process</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="h-5 w-5 text-pink-600" />
                  <h3 className="font-medium">Flight Tickets</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ticketsBooked"
                      checked={expatForm.ticketsBooked}
                      onChange={(e) => setExpatForm({ ...expatForm, ticketsBooked: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="ticketsBooked" className="text-sm font-medium text-gray-700">Tickets Booked</label>
                  </div>
                  {expatForm.ticketsBooked && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Flight Details</label>
                        <textarea
                          value={expatForm.flightDetails}
                          onChange={(e) => setExpatForm({ ...expatForm, flightDetails: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                          placeholder="Flight number, date, time, route..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
                        <input
                          type="date"
                          value={expatForm.arrivalDate}
                          onChange={(e) => setExpatForm({ ...expatForm, arrivalDate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setShowExpatModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateCandidate(selectedCandidate.id, {
                        stage: 'hired',
                        expatDetails: expatForm,
                        hiredAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      });
                      toast.success('Expat processing completed - candidate hired!');
                      setShowExpatModal(false);
                    } catch (err) {
                      toast.error('Error completing expat processing: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Complete & Hire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescreening Modal */}
      {showPrescreeningModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Prescreening Questions</h2>
              <button onClick={() => setShowPrescreeningModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium">{selectedCandidate.name}</p>
              <p className="text-sm text-gray-600">Fill prescreening answers to evaluate candidate</p>
            </div>
            <div className="space-y-4">
              {DEFAULT_PRESCREENING_QUESTIONS.map((q) => (
                <div key={q.id} className="border-b pb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {q.question}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {q.type === 'boolean' ? (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.id}
                          checked={selectedCandidate.prescreeningAnswers?.[q.id] === true}
                          onChange={() => setSelectedCandidate({
                            ...selectedCandidate,
                            prescreeningAnswers: { ...selectedCandidate.prescreeningAnswers, [q.id]: true }
                          })}
                          className="rounded"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.id}
                          checked={selectedCandidate.prescreeningAnswers?.[q.id] === false}
                          onChange={() => setSelectedCandidate({
                            ...selectedCandidate,
                            prescreeningAnswers: { ...selectedCandidate.prescreeningAnswers, [q.id]: false }
                          })}
                          className="rounded"
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  ) : (
                    <input
                      type={q.type === 'number' ? 'number' : 'text'}
                      value={selectedCandidate.prescreeningAnswers?.[q.id] || ''}
                      onChange={(e) => setSelectedCandidate({
                        ...selectedCandidate,
                        prescreeningAnswers: { ...selectedCandidate.prescreeningAnswers, [q.id]: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowPrescreeningModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateCandidate(selectedCandidate.id, {
                        stage: 'shortlisted',
                        prescreeningAnswers: selectedCandidate.prescreeningAnswers,
                        updatedAt: new Date().toISOString()
                      });
                      toast.success('Prescreening completed - candidate shortlisted');
                      setShowPrescreeningModal(false);
                    } catch (err) {
                      toast.error('Error saving prescreening: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Complete & Shortlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expat Onboarding Workflow Modal */}
      {showExpatOnboarding && selectedCandidate && (
        <ExpatOnboarding
          candidate={selectedCandidate}
          onClose={() => setShowExpatOnboarding(false)}
          onComplete={(employeeId) => {
            setShowExpatOnboarding(false);
            setSelectedCandidate(prev => ({ ...prev, stage: 'hired', employeeId }));
          }}
        />
      )}

      {/* Activity History Modal */}
      {showHistoryModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  Activity History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCandidate.name} - {selectedCandidate.email}
                </p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedCandidate.activityHistory?.length > 0 ? (
              <div className="space-y-3">
                {[...selectedCandidate.activityHistory].reverse().map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-800">{activity.action}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      By: {activity.user}
                    </p>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-white p-2 rounded">
                        <p className="font-medium">Changes:</p>
                        {Object.entries(activity.details).map(([key, value]) => (
                          <p key={key}>• {key}: {JSON.stringify(value)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No activity history yet</p>
                <p className="text-sm mt-1">Status changes will be tracked automatically</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

