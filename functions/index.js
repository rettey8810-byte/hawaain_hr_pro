const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Configure email transporter (Gmail SMTP example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.pass || process.env.EMAIL_PASS
  }
});

/**
 * Send email helper function
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const mailOptions = {
      from: `Hawaain HR Pro <${functions.config().email?.user || 'noreply@hawaainhr.com'}>`,
      to,
      subject,
      html,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Email template helpers
 */
const emailTemplates = {
  leaveApproved: (data) => ({
    subject: `Leave Request Approved - ${data.leaveType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Leave Request Approved</h2>
        <p>Hi ${data.employeeName},</p>
        <p>Your ${data.leaveType} leave request has been <strong>approved</strong>.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>From:</strong> ${data.startDate}</p>
          <p><strong>To:</strong> ${data.endDate}</p>
          <p><strong>Days:</strong> ${data.days}</p>
          ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
        </div>
        <p>Approved by: ${data.approverName}</p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          This is an automated notification from Hawaain HR Pro.
        </p>
      </div>
    `
  }),

  leaveRejected: (data) => ({
    subject: `Leave Request Rejected - ${data.leaveType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Leave Request Rejected</h2>
        <p>Hi ${data.employeeName},</p>
        <p>Your ${data.leaveType} leave request has been <strong>rejected</strong>.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>From:</strong> ${data.startDate}</p>
          <p><strong>To:</strong> ${data.endDate}</p>
          <p><strong>Reason:</strong> ${data.rejectionReason}</p>
        </div>
        <p>Rejected by: ${data.approverName}</p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          This is an automated notification from Hawaain HR Pro.
        </p>
      </div>
    `
  }),

  leavePending: (data) => ({
    subject: `New Leave Request - ${data.employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Leave Request</h2>
        <p>Hi ${data.approverName},</p>
        <p><strong>${data.employeeName}</strong> has submitted a leave request requiring your approval.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Type:</strong> ${data.leaveType}</p>
          <p><strong>From:</strong> ${data.startDate}</p>
          <p><strong>To:</strong> ${data.endDate}</p>
          <p><strong>Days:</strong> ${data.days}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>
        <a href="${data.approvalLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
          Review Request
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          This is an automated notification from Hawaain HR Pro.
        </p>
      </div>
    `
  }),

  documentExpiring: (data) => ({
    subject: `Document Expiring Soon - ${data.documentType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Document Expiring Soon</h2>
        <p>Hi ${data.employeeName},</p>
        <p>Your <strong>${data.documentType}</strong> is expiring soon.</p>
        <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #F59E0B;">
          <p><strong>Document:</strong> ${data.documentNumber}</p>
          <p><strong>Expiry Date:</strong> ${data.expiryDate}</p>
          <p><strong>Days Remaining:</strong> ${data.daysRemaining}</p>
        </div>
        <p>Please take action to renew this document before it expires.</p>
        <a href="${data.renewalLink}" style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
          View Details
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          This is an automated notification from Hawaain HR Pro.
        </p>
      </div>
    `
  }),

  payrollProcessed: (data) => ({
    subject: `Payroll Processed - ${data.month}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Payroll Processed</h2>
        <p>Hi ${data.employeeName},</p>
        <p>Your payslip for <strong>${data.month}</strong> has been generated.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Gross Salary:</strong> ${data.grossSalary}</p>
          <p><strong>Deductions:</strong> ${data.deductions}</p>
          <p><strong>Net Salary:</strong> ${data.netSalary}</p>
        </div>
        <a href="${data.payslipLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
          View Payslip
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          This is an automated notification from Hawaain HR Pro.
        </p>
      </div>
    `
  }),

  welcomeEmployee: (data) => ({
    subject: 'Welcome to the Team!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to ${data.companyName}!</h2>
        <p>Hi ${data.employeeName},</p>
        <p>Welcome to the team! Your employee profile has been created in Hawaain HR Pro.</p>
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Position:</strong> ${data.position}</p>
          <p><strong>Department:</strong> ${data.department}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
        </div>
        <p>You can access your employee portal using your registered email address.</p>
        <a href="${data.loginLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">
          Access Portal
        </a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
          This is an automated notification from Hawaain HR Pro.
        </p>
      </div>
    `
  })
};

/**
 * Cloud Function: Send email on leave status change
 */
exports.onLeaveStatusChange = functions.firestore
  .document('leaves/{leaveId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only trigger if status changed
    if (newData.status === oldData.status) return;

    try {
      // Get employee details
      const employeeDoc = await db.collection('employees').doc(newData.employeeId).get();
      const employee = employeeDoc.data();

      if (!employee?.email) return;

      let emailData;
      const baseData = {
        employeeName: employee.name,
        leaveType: newData.leaveType,
        startDate: newData.startDate,
        endDate: newData.endDate,
        days: newData.days || newData.totalDays
      };

      switch (newData.status) {
        case 'approved':
          emailData = emailTemplates.leaveApproved({
            ...baseData,
            approverName: newData.approvedBy?.name || 'HR Manager',
            comments: newData.approvalComments
          });
          break;
        case 'rejected':
          emailData = emailTemplates.leaveRejected({
            ...baseData,
            approverName: newData.rejectedBy?.name || 'HR Manager',
            rejectionReason: newData.rejectionReason
          });
          break;
        default:
          return;
      }

      await sendEmail({
        to: employee.email,
        ...emailData
      });

      // Log notification
      await db.collection('emailLogs').add({
        type: `leave_${newData.status}`,
        to: employee.email,
        leaveId: context.params.leaveId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });

    } catch (error) {
      console.error('Error in onLeaveStatusChange:', error);
    }
  });

/**
 * Cloud Function: Notify approver when new leave is submitted
 */
exports.onLeaveCreated = functions.firestore
  .document('leaves/{leaveId}')
  .onCreate(async (snap, context) => {
    const leaveData = snap.data();

    try {
      // Get employee details
      const employeeDoc = await db.collection('employees').doc(leaveData.employeeId).get();
      const employee = employeeDoc.data();

      // Find approver (supervisor or HR manager)
      const approverQuery = await db.collection('users')
        .where('companyId', '==', leaveData.companyId)
        .where('role', 'in', ['hr', 'manager', 'supervisor'])
        .limit(1)
        .get();

      if (approverQuery.empty) return;

      const approver = approverQuery.docs[0].data();
      if (!approver.email) return;

      const emailData = emailTemplates.leavePending({
        employeeName: employee?.name || 'Employee',
        approverName: approver.name || 'Manager',
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        days: leaveData.days || leaveData.totalDays,
        reason: leaveData.reason,
        approvalLink: `https://hawaainhr.com/leave-planner/${context.params.leaveId}/approve`
      });

      await sendEmail({
        to: approver.email,
        ...emailData
      });

    } catch (error) {
      console.error('Error in onLeaveCreated:', error);
    }
  });

/**
 * Cloud Function: Daily document expiry check
 */
exports.documentExpiryCheck = functions.pubsub
  .schedule('0 9 * * *') // Run daily at 9 AM
  .timeZone('Asia/Male')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const warningDays = [30, 14, 7, 3, 1];

      const documentTypes = ['passports', 'visas', 'workPermits', 'medicals'];

      for (const type of documentTypes) {
        const snapshot = await db.collection(type).get();

        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (!data.expiryDate) continue;

          const expiryDate = new Date(data.expiryDate);
          const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

          // Check if warning needed
          if (warningDays.includes(daysRemaining)) {
            // Get employee
            const employeeDoc = await db.collection('employees').doc(data.employeeId).get();
            const employee = employeeDoc.data();

            if (!employee?.email) continue;

            const emailData = emailTemplates.documentExpiring({
              employeeName: employee.name,
              documentType: type.replace(/s$/, '').replace(/([A-Z])/g, ' $1').trim(),
              documentNumber: data.number || data.passportNumber || data.visaNumber || 'N/A',
              expiryDate: data.expiryDate,
              daysRemaining,
              renewalLink: `https://hawaainhr.com/${type}`
            });

            await sendEmail({
              to: employee.email,
              ...emailData
            });

            // Also notify HR
            const hrQuery = await db.collection('users')
              .where('companyId', '==', data.companyId)
              .where('role', 'in', ['hr', 'admin'])
              .get();

            for (const hrDoc of hrQuery.docs) {
              const hr = hrDoc.data();
              if (hr.email) {
                await sendEmail({
                  to: hr.email,
                  ...emailData
                });
              }
            }
          }
        }
      }

      console.log('Document expiry check completed');
    } catch (error) {
      console.error('Error in documentExpiryCheck:', error);
    }
  });

/**
 * Cloud Function: Welcome new employee
 */
exports.onEmployeeCreated = functions.firestore
  .document('employees/{employeeId}')
  .onCreate(async (snap, context) => {
    const employee = snap.data();

    if (!employee.email) return;

    try {
      // Get company
      const companyDoc = await db.collection('companies').doc(employee.companyId).get();
      const company = companyDoc.data();

      const emailData = emailTemplates.welcomeEmployee({
        employeeName: employee.name,
        companyName: company?.name || 'Our Company',
        position: employee.position || 'Employee',
        department: employee.department || 'General',
        startDate: employee.joinDate || new Date().toISOString().split('T')[0],
        loginLink: 'https://hawaainhr.com/login'
      });

      await sendEmail({
        to: employee.email,
        ...emailData
      });

    } catch (error) {
      console.error('Error in onEmployeeCreated:', error);
    }
  });
