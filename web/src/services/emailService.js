// Email Notification Service for Leave Management
// Note: In production, integrate with backend email service (SendGrid, AWS SES, etc.)

const emailTemplates = {
  leaveSubmitted: (data) => ({
    subject: `Leave Application Submitted - ${data.employeeName}`,
    body: `
      <h2>Leave Application Submitted</h2>
      <p><strong>Employee:</strong> ${data.employeeName}</p>
      <p><strong>Leave Type:</strong> ${data.leaveType}</p>
      <p><strong>Duration:</strong> ${data.startDate} to ${data.endDate} (${data.days} days)</p>
      <p><strong>Destination:</strong> ${data.destination || 'N/A'}</p>
      <p><strong>Reason:</strong> ${data.reason || 'N/A'}</p>
      <br>
      <p>Please review and approve/reject this application.</p>
      <a href="${data.reviewUrl}" style="padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Review Application</a>
    `
  }),

  leaveApproved: (data) => ({
    subject: `Leave Application Approved - ${data.leaveType}`,
    body: `
      <h2 style="color: #10B981;">Leave Application Approved</h2>
      <p>Your leave application has been approved!</p>
      <p><strong>Leave Type:</strong> ${data.leaveType}</p>
      <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
      <p><strong>Approved by:</strong> ${data.approverName}</p>
      ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
      <br>
      <p>Enjoy your time off!</p>
    `
  }),

  leaveRejected: (data) => ({
    subject: `Leave Application Rejected - ${data.leaveType}`,
    body: `
      <h2 style="color: #EF4444;">Leave Application Rejected</h2>
      <p>Your leave application has been rejected.</p>
      <p><strong>Leave Type:</strong> ${data.leaveType}</p>
      <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
      <p><strong>Rejected by:</strong> ${data.approverName}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <br>
      <p>If you have questions, please contact HR.</p>
    `
  }),

  leaveEscalated: (data) => ({
    subject: `Leave Application Requires Your Approval - ${data.levelLabel}`,
    body: `
      <h2>Leave Application Pending Your Approval</h2>
      <p><strong>Approval Level:</strong> ${data.levelLabel}</p>
      <p>A leave application has been escalated to you for review.</p>
      <p><strong>Employee:</strong> ${data.employeeName}</p>
      <p><strong>Leave Type:</strong> ${data.leaveType}</p>
      <p><strong>Duration:</strong> ${data.startDate} to ${data.endDate}</p>
      <p><strong>Previous Approver:</strong> ${data.previousApprover} (${data.previousLevel})</p>
      ${data.comments ? `<p><strong>Previous Comments:</strong> ${data.comments}</p>` : ''}
      <br>
      <a href="${data.reviewUrl}" style="padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Review Now</a>
    `
  }),

  transportUpdated: (data) => ({
    subject: `Transportation Update - ${data.status}`,
    body: `
      <h2>Transportation Status Updated</h2>
      <p>Your transportation booking has been updated.</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>Mode:</strong> ${data.transportMode}</p>
      <p><strong>From:</strong> ${data.fromLocation} <strong>To:</strong> ${data.toLocation}</p>
      ${data.ticketNumber ? `<p><strong>Ticket Number:</strong> ${data.ticketNumber}</p>` : ''}
      ${data.amount ? `<p><strong>Amount:</strong> $${data.amount}</p>` : ''}
    `
  }),

  leaveReminder: (data) => ({
    subject: `Reminder: Your Leave Starts Tomorrow`,
    body: `
      <h2>Leave Reminder</h2>
      <p>Your approved leave starts tomorrow!</p>
      <p><strong>Leave Type:</strong> ${data.leaveType}</p>
      <p><strong>Start Date:</strong> ${data.startDate}</p>
      <p><strong>End Date:</strong> ${data.endDate}</p>
      <br>
      <p>Don't forget to complete your handover tasks.</p>
    `
  }),

  lowBalanceWarning: (data) => ({
    subject: `Leave Balance Warning - ${data.leaveType}`,
    body: `
      <h2 style="color: #F59E0B;">Low Leave Balance Warning</h2>
      <p>Your ${data.leaveType} leave balance is running low.</p>
      <p><strong>Remaining:</strong> ${data.remaining} days</p>
      <p><strong>Used:</strong> ${data.used} days</p>
      <p><strong>Total Quota:</strong> ${data.quota} days</p>
      <br>
      <p>Please plan your leave accordingly.</p>
    `
  })
};

// Mock email sender - Replace with actual email API integration
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);
    
    // In production, this would call your backend email service
    console.log('📧 Email would be sent:', {
      to,
      subject: emailContent.subject,
      body: emailContent.body.substring(0, 100) + '...'
    });

    // Store in localStorage for demo purposes
    const sentEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
    sentEmails.push({
      to,
      template,
      subject: emailContent.subject,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem('sentEmails', JSON.stringify(sentEmails));

    return { success: true, message: 'Email queued for sending' };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
export const sendBulkEmails = async (recipients, template, data) => {
  const results = await Promise.all(
    recipients.map(recipient => sendEmail(recipient, template, data))
  );
  return results;
};

// Notification helper functions
export const notifyLeaveSubmitted = async (hrEmails, leaveData) => {
  return sendEmail(hrEmails, 'leaveSubmitted', leaveData);
};

export const notifyLeaveApproved = async (employeeEmail, leaveData) => {
  return sendEmail(employeeEmail, 'leaveApproved', leaveData);
};

export const notifyLeaveRejected = async (employeeEmail, leaveData) => {
  return sendEmail(employeeEmail, 'leaveRejected', leaveData);
};

export const notifyLeaveEscalated = async (approverEmail, leaveData) => {
  return sendEmail(approverEmail, 'leaveEscalated', leaveData);
};

// 4-Level specific notification helpers
const levelLabels = {
  0: 'Supervisor Approval',
  1: 'Department Head Approval',
  2: 'HR Review',
  3: 'GM Final Approval'
};

export const notifyLevelApproval = async (approverEmail, leaveData, level) => {
  return sendEmail(approverEmail, 'leaveEscalated', {
    ...leaveData,
    levelLabel: levelLabels[level] || 'Approval Required',
    currentLevel: level
  });
};

export const notifySupervisor = async (supervisorEmail, leaveData) => {
  return notifyLevelApproval(supervisorEmail, leaveData, 0);
};

export const notifyDepartmentHead = async (deptHeadEmail, leaveData) => {
  return notifyLevelApproval(deptHeadEmail, leaveData, 1);
};

export const notifyHR = async (hrEmail, leaveData) => {
  return notifyLevelApproval(hrEmail, leaveData, 2);
};

export const notifyGM = async (gmEmail, leaveData) => {
  return notifyLevelApproval(gmEmail, leaveData, 3);
};

export const notifyTransportUpdated = async (employeeEmail, transportData) => {
  return sendEmail(employeeEmail, 'transportUpdated', transportData);
};

export const notifyLeaveReminder = async (employeeEmail, leaveData) => {
  return sendEmail(employeeEmail, 'leaveReminder', leaveData);
};

export const notifyLowBalance = async (employeeEmail, balanceData) => {
  return sendEmail(employeeEmail, 'lowBalanceWarning', balanceData);
};

// Push notification service (for mobile)
export const sendPushNotification = async (userId, title, body, data = {}) => {
  // In production, integrate with Firebase Cloud Messaging or similar
  console.log('📱 Push notification would be sent:', {
    userId,
    title,
    body,
    data
  });
  return { success: true };
};

// Schedule reminder notifications
export const scheduleLeaveReminders = async (leave) => {
  const startDate = new Date(leave.startDate);
  const reminderDate = new Date(startDate);
  reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before

  // In production, use a cron job or scheduled function
  console.log(`⏰ Reminder scheduled for ${reminderDate.toISOString()}`);
};

export default {
  sendEmail,
  sendBulkEmails,
  notifyLeaveSubmitted,
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLeaveEscalated,
  notifyTransportUpdated,
  notifyLeaveReminder,
  notifyLowBalance,
  sendPushNotification,
  scheduleLeaveReminders,
};
