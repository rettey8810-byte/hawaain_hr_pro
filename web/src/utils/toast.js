import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Show a toast notification
 * Creates a Firestore notification that triggers a real-time toast
 */
export const showToast = async ({
  companyId,
  userId,
  type = 'info',
  title,
  message,
  link = null,
  autoDismiss = true
}) => {
  try {
    const notification = {
      companyId,
      userId: userId || null, // null = broadcast to all company users
      type,
      title,
      message,
      link,
      read: false,
      toastShown: false,
      createdAt: serverTimestamp(),
      autoDismiss
    };

    await addDoc(collection(db, 'notifications'), notification);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Quick toast helpers
 */
export const toast = {
  success: (companyId, title, message, link) => 
    showToast({ companyId, type: 'success', title, message, link }),
  
  error: (companyId, title, message, link) => 
    showToast({ companyId, type: 'error', title, message, link }),
  
  warning: (companyId, title, message, link) => 
    showToast({ companyId, type: 'warning', title, message, link }),
  
  info: (companyId, title, message, link) => 
    showToast({ companyId, type: 'info', title, message, link })
};

/**
 * Common notification templates
 */
export const notifications = {
  // Leave notifications
  leaveApproved: (companyId, employeeName, leaveType) => 
    toast.success(companyId, 'Leave Approved', `${employeeName}'s ${leaveType} leave has been approved.`),
  
  leaveRejected: (companyId, employeeName, leaveType) => 
    toast.error(companyId, 'Leave Rejected', `${employeeName}'s ${leaveType} leave request was rejected.`),
  
  leavePending: (companyId, employeeName, leaveType) => 
    toast.info(companyId, 'New Leave Request', `${employeeName} requested ${leaveType} leave.`),

  // Document expiry
  passportExpiring: (companyId, employeeName, daysLeft) => 
    toast.warning(companyId, 'Passport Expiring Soon', `${employeeName}'s passport expires in ${daysLeft} days.`),
  
  visaExpiring: (companyId, employeeName, daysLeft) => 
    toast.warning(companyId, 'Visa Expiring Soon', `${employeeName}'s visa expires in ${daysLeft} days.`),
  
  workPermitExpiring: (companyId, employeeName, daysLeft) => 
    toast.warning(companyId, 'Work Permit Expiring Soon', `${employeeName}'s work permit expires in ${daysLeft} days.`),

  // Employee
  newEmployee: (companyId, employeeName) => 
    toast.success(companyId, 'New Employee', `${employeeName} has joined the company.`),
  
  employeeUpdated: (companyId, employeeName) => 
    toast.info(companyId, 'Employee Updated', `${employeeName}'s profile has been updated.`),

  // Payroll
  payrollProcessed: (companyId, month) => 
    toast.success(companyId, 'Payroll Processed', `Payroll for ${month} has been processed successfully.`),
  
  payrollError: (companyId, error) => 
    toast.error(companyId, 'Payroll Error', `Error processing payroll: ${error}`),

  // Training
  trainingCompleted: (companyId, employeeName, trainingName) => 
    toast.success(companyId, 'Training Completed', `${employeeName} completed ${trainingName}.`),
  
  certificationExpiring: (companyId, employeeName, certName, daysLeft) => 
    toast.warning(companyId, 'Certification Expiring', `${employeeName}'s ${certName} expires in ${daysLeft} days.`),

  // Performance
  reviewDue: (companyId, employeeName) => 
    toast.info(companyId, 'Performance Review Due', `Performance review for ${employeeName} is due soon.`),
  
  goalAchieved: (companyId, employeeName, goalTitle) => 
    toast.success(companyId, 'Goal Achieved', `${employeeName} achieved: ${goalTitle}`),
};
