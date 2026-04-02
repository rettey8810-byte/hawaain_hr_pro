import { useState } from 'react';
import { UserCheck, Users, UserCog, Building2, ArrowRight, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

// 4-Level Company Approval Hierarchy
const approvalLevels = [
  { id: 'supervisor', label: 'Supervisor Approval', icon: UserCheck, description: 'Direct supervisor review' },
  { id: 'department_head', label: 'Department Head', icon: Users, description: 'Department manager approval' },
  { id: 'hr', label: 'HR Review', icon: UserCog, description: 'HR compliance check' },
  { id: 'gm', label: 'GM Approval', icon: Building2, description: 'General Manager final authorization' },
];

export default function MultiLevelApproval({ leave, onApprove, onReject, onEscalate, currentUser, userRole }) {
  const [comments, setComments] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Determine current approval stage
  const getCurrentStage = () => {
    if (!leave.approvalWorkflow) return 0;
    const completed = leave.approvalWorkflow.filter(step => step.status === 'approved').length;
    return completed;
  };

  const currentStage = getCurrentStage();
  const isCurrentApprover = () => {
    if (!leave.approvalWorkflow) return false;
    const nextStep = leave.approvalWorkflow[currentStage];
    return nextStep?.approverRole === userRole || nextStep?.approverId === currentUser?.uid;
  };

  const canApprove = isCurrentApprover();

  const handleApprove = () => {
    const approvalData = {
      stage: currentStage,
      approverId: currentUser?.uid,
      approverName: currentUser?.displayName || currentUser?.email,
      approverRole: userRole,
      comments,
      approvedAt: new Date().toISOString(),
    };

    if (currentStage < approvalLevels.length - 1) {
      onEscalate(approvalData);
    } else {
      onApprove(approvalData);
    }
    setComments('');
  };

  const handleReject = () => {
    onReject({
      stage: currentStage,
      approverId: currentUser?.uid,
      approverName: currentUser?.displayName || currentUser?.email,
      approverRole: userRole,
      reason: rejectReason,
      rejectedAt: new Date().toISOString(),
    });
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">4-Level Approval Workflow</h3>
            <p className="text-indigo-100 text-sm">Supervisor → Dept Head → HR → GM</p>
          </div>
        </div>
      </div>

      {/* Approval Flow */}
      <div className="p-6">
        <div className="relative">
          {approvalLevels.map((level, index) => {
            const Icon = level.icon;
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;
            const stepData = leave.approvalWorkflow?.[index];

            return (
              <div key={level.id} className="flex items-start gap-4 mb-6 last:mb-0">
                {/* Status Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' :
                  isCurrent ? 'bg-blue-100 ring-2 ring-blue-500 ring-offset-2' :
                  'bg-gray-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : isCurrent ? (
                    <Icon className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Icon className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold ${
                      isCompleted ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {level.label}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isCompleted ? 'bg-green-100 text-green-700' :
                      isCurrent ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {isCompleted ? 'Approved' : isCurrent ? 'Pending' : 'Waiting'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1">{level.description}</p>

                  {stepData && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{stepData.approverName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{new Date(stepData.approvedAt).toLocaleDateString()}</span>
                      </div>
                      {stepData.comments && (
                        <p className="text-sm text-gray-600 mt-1 ml-6">
                          "{stepData.comments}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector */}
                {index < approvalLevels.length - 1 && (
                  <div className={`absolute left-6 top-12 w-0.5 h-8 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Action */}
        {isCurrent && canApprove && leave.status === 'pending' && (
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
              rows={3}
              placeholder="Add your comments or notes..."
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-5 w-5" />
                {currentStage < approvalLevels.length - 1 ? 'Approve & Escalate' : 'Final Approve'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
              >
                <XCircle className="h-5 w-5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {!canApprove && leave.status === 'pending' && (
          <div className="mt-6 p-4 bg-amber-50 rounded-xl">
            <p className="text-sm text-amber-700">
              Waiting for {approvalLevels[currentStage]?.label}. You will be notified when it's your turn to review.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Leave Application</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection (Required)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none resize-none"
              rows={4}
              placeholder="Please provide a reason for rejection..."
              required
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:bg-gray-300 transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
