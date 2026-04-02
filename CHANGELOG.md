# Changelog

All notable changes to Hawaain HR Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-02

### 🚀 Added - Advanced HR Suite (6 Major Modules)

#### Time & Attendance (`TimeAttendance.jsx`)
- **GPS-based Clock-in/out** - Location tracking with address recording
- **Biometric Integration Ready** - Support for fingerprint/face recognition
- **Shift Management** - Morning, Day, Evening, Night, Rotating shifts
- **Overtime Management** - Automatic calculation with 1.5x, 2x rates
- **Shift Swapping** - Employee-to-employee exchange with manager approval
- **Attendance History** - 30-day rolling view with status tracking
- **Working Hours Calculation** - Automatic daily totals
- **Route:** `/time-attendance`
- **Access:** All employees (own), HRM/GM (all)
- **Firestore Collections:** `timeAttendance`, `shifts`, `shiftAssignments`, `shiftSwaps`, `overtimeRequests`

#### Benefits & Payroll Management (`BenefitsManagement.jsx`)
- **Benefit Programs** - Health, Dental, Vision, Life, Retirement plans
- **Employee Enrollment** - Self-service benefit selection
- **Contribution Tracking** - Employer vs Employee split tracking
- **Salary Advances** - Request and approval workflow
- **Advance Repayment** - Automatic deduction tracking
- **Benefit Cost Analytics** - Total cost breakdown by program
- **Provider Management** - Insurance and benefit providers
- **Route:** `/benefits`
- **Access:** All employees (view), HRM/GM (manage)
- **Firestore Collections:** `benefits`, `benefitEnrollments`, `salaryAdvances`

#### Employee Engagement (`EmployeeEngagement.jsx`)
- **Pulse Surveys** - Quick engagement questionnaires
- **eNPS Calculation** - Employee Net Promoter Score tracking
- **Kudos & Recognition** - Peer-to-peer recognition system
- **Points System** - Gamified recognition with redeemable points
- **Suggestion Box** - Anonymous feedback submission
- **Voting System** - Community-driven idea prioritization
- **Survey Analytics** - Response tracking and reporting
- **Categories:** Teamwork, Innovation, Excellence, Leadership, Customer Focus
- **Route:** `/engagement`
- **Access:** All employees
- **Firestore Collections:** `surveys`, `surveyResponses`, `recognitions`, `suggestions`

#### Compliance & Legal (`ComplianceCenter.jsx`)
- **Audit Trail** - Complete action history (30-day retention)
- **GDPR Compliance** - Data subject request management
- **GDPR Request Types:** Access, Rectification, Erasure, Portability, Restriction
- **Document Templates** - Contract, Offer Letter, Warning Letter generators
- **Template Placeholders** - Dynamic field replacement
- **Document Generation** - HTML/PDF output
- **Compliance Score** - Overall compliance health metric
- **30-Day Deadline** - Automatic GDPR request tracking
- **Route:** `/compliance`
- **Access:** HRM/GM/Superadmin
- **Firestore Collections:** `auditLogs`, `gdprRequests`, `documentTemplates`

#### HR Analytics (`HRAnalytics.jsx`)
- **Retention Risk Analysis** - AI-powered turnover prediction
- **Risk Scoring** - 0-100 risk score per employee
- **Risk Factors:** Absence rate, Recognition gap, Tenure, Salary stagnation
- **Risk Levels:** Critical, High, Medium, Low
- **Recommended Actions** - AI-suggested retention strategies
- **Diversity Metrics** - Gender, Age, Ethnicity, Disability tracking
- **Demographics Dashboard** - Visual breakdowns with charts
- **Custom Reports** - User-defined analytics reports
- **Report Scheduling** - Automated report generation
- **Export Capability** - CSV, Excel, PDF exports
- **Route:** `/hr-analytics`
- **Access:** HRM/GM/Superadmin
- **Firestore Collections:** `analyticsReports`, `retentionRiskScores`, `diversityMetrics`

#### Integrations Hub (`IntegrationsHub.jsx`)
- **Calendar Sync** - Google Calendar & Microsoft Outlook integration
- **Two-way Sync** - Events sync in both directions
- **Slack Notifications** - Real-time HR event notifications
- **Notification Events:** Leave requests, Expense claims, New hires, Birthdays
- **Job Board Posting** - LinkedIn, Indeed, Glassdoor integration
- **Accounting Integration** - QuickBooks & Xero sync
- **Webhook Support** - Custom integration endpoints
- **Sync Status Dashboard** - Health monitoring for all integrations
- **Route:** `/integrations`
- **Access:** Superadmin/HRM
- **Firestore Collections:** `integrationConfigs`, `calendarSyncs`, `slackNotifications`, `jobBoardPostings`

### 🛠️ Technical Architecture (v2.0.0)

#### New Context Providers
- `TimeAttendanceContext.jsx` - Clock-in/out, shifts, overtime state
- `BenefitsContext.jsx` - Benefits, enrollments, advances state
- `EngagementContext.jsx` - Surveys, recognitions, suggestions state
- `ComplianceContext.jsx` - Audit logs, GDPR, templates state
- `AnalyticsContext.jsx` - Reports, retention, diversity state
- `IntegrationsContext.jsx` - Calendar, Slack, job boards state

#### New Components
- `TimeAttendance.jsx` - GPS clock-in, shift management
- `BenefitsManagement.jsx` - Benefits and advances
- `EmployeeEngagement.jsx` - Surveys and recognition
- `ComplianceCenter.jsx` - Audit and GDPR
- `IntegrationsHub.jsx` - External service connections

#### Firestore Collections Added (v2.0.0)
See `firestore_collections_v2.json` for complete schema documentation:
- `timeAttendance` - Clock records with GPS
- `shifts` - Shift definitions
- `shiftSwaps` - Employee swap requests
- `overtimeRequests` - Overtime approvals
- `benefits` - Benefit program definitions
- `benefitEnrollments` - Employee enrollments
- `salaryAdvances` - Advance requests
- `surveys` - Engagement surveys
- `surveyResponses` - Anonymous responses
- `recognitions` - Kudos and points
- `suggestions` - Employee ideas
- `auditLogs` - System audit trail
- `gdprRequests` - Data subject requests
- `documentTemplates` - Form templates
- `analyticsReports` - Custom reports
- `retentionRiskScores` - AI predictions
- `diversityMetrics` - D&I statistics
- `integrationConfigs` - External service config
- `calendarSyncs` - Calendar connections
- `slackNotifications` - Slack settings
- `jobBoardPostings` - External job postings

### Dependencies
- No new dependencies added

---

## [1.5.0] - 2026-04-02

### 🚀 Added - HR Enhancement Suite (8 New Modules)

#### Performance Review System (`PerformanceReviews.jsx`)
- **360-Degree Feedback** - Self, Manager, Peer, and Direct Report reviews
- **Review Cycles** - Annual, Semi-Annual, Quarterly, Monthly, Ad-hoc
- **Competency Framework** - Job Knowledge, Quality, Productivity, Communication, Teamwork, Initiative
- **Goal Setting** - KPI and OKR tracking with weightages
- **Performance Ratings** - 5-point scale with descriptions
- **Action Plans** - Post-review improvement tracking
- **Status Workflow** - Draft → Self Review → Manager Review → Peer Review → HR Review → Completed
- Route: `/performance-reviews`
- Access: HRM/GM/Dept Heads

#### Attendance & Time Tracking (`AttendanceTracking.jsx`)
- **Daily Check-in/Out** - Real-time attendance recording
- **Shift Types** - Present, Absent, Late, Half-day, On Leave, WFH
- **Working Hours Calculation** - Automatic hours tracking
- **Overtime Tracking** - 1.5x, 2x rates with approval workflow
- **Late Detection** - Grace period and late arrival alerts
- **Daily/Monthly Views** - Flexible reporting periods
- **Export to CSV** - Attendance data export
- Route: `/attendance-tracking`
- Access: All employees (own), HRM/GM (all)

#### Expense Claims & Reimbursement (`ExpenseClaims.jsx`)
- **Multi-Category Support** - Travel, Meals, Office, Training, Medical, Communication, Accommodation, Fuel, Misc
- **Multi-Level Approval** - HOD → Finance → GM workflow
- **Receipt Upload** - Document attachment support
- **Currency Support** - MVR, USD, EUR, GBP
- **Status Tracking** - Draft → Submitted → HOD Approved → Finance Approved → Approved → Reimbursed
- **Project/Client Linking** - Track billable expenses
- Route: `/expense-claims`
- Access: All employees (submit), HOD/Finance/GM (approve)

#### Employee Self-Service Portal (`SelfServicePortal.jsx`)
- **Dashboard Overview** - Personal info, leave balances, quick actions
- **Payslip Access** - View and download payslip history
- **Leave Applications** - Track leave status and history
- **Document Alerts** - Expiring passport/visa notifications
- **Performance Summary** - View own performance reviews
- **Company Announcements** - Read organization updates
- **Quick Links** - Apply leave, submit expense, training access
- Route: `/self-service`
- Access: All employees (own data only)

#### HR Analytics Dashboard (`HRAnalytics.jsx`)
- **Headcount Metrics** - Total, new hires, terminations, turnover rate
- **Department Analysis** - Distribution and salary costs by department
- **Leave Statistics** - Usage patterns by leave type
- **Attendance Overview** - Present, absent, late percentages
- **Performance Distribution** - Rating spread visualization
- **Recruitment Pipeline** - Open positions, filled, time-to-hire
- **Time Range Filters** - 1 month, 3 months, 6 months, 1 year
- **Export Reports** - CSV export for all analytics
- Route: `/hr-analytics`
- Access: HRM/GM/Superadmin

#### Employee Directory (`EmployeeDirectory.jsx`)
- **Organization Chart** - Visual hierarchy view
- **List View** - Sortable employee listing
- **Grid View** - Card-based employee display
- **Department Filter** - View by department
- **Search** - Find by name, position, ID
- **Contact Info** - Email, phone, location display
- **Export Directory** - CSV export
- Route: `/employee-directory`
- Access: All employees (based on role visibility)

#### Company Announcements & Policies (`CompanyAnnouncements.jsx`)
- **Announcement Categories** - General, HR, Finance, Operations, Emergency
- **Priority Levels** - Normal, High, Urgent
- **Policy Repository** - Employee Handbook, Leave Policy, Code of Conduct, etc.
- **Read Receipts** - Track who has read announcements
- **Acknowledgment Tracking** - Required policy acknowledgments
- **Expiry Dates** - Automatic archive old announcements
- **Attachments** - Document uploads
- Route: `/announcements`
- Access: All employees (view), HRM/GM (create/edit)

#### Shift & Schedule Management (`ShiftManagement.jsx`)
- **Shift Types** - Morning, Day, Evening, Night, Weekend
- **Weekly Scheduling** - 7-day schedule planner
- **Employee Assignment** - Drag-and-drop shift assignment
- **Shift Swap Requests** - Employee-initiated swaps with approval
- **Coverage Alerts** - Understaffed shift warnings
- **Multiple Views** - Schedule, Swaps, Coverage
- **Export Schedules** - CSV export for payroll
- Route: `/shift-management`
- Access: HRM/GM (manage), All employees (view own)

#### New Database Collections (v1.5.0)
- **performanceReviews Collection**
  - employeeId, reviewCycle, reviewPeriod, competencies
  - selfReview, managerReview, peerReviews, overallRating
  - goals, actionItems, status, companyId
- **attendance Collection**
  - employeeId, date, checkIn, checkOut, status
  - workingHours, overtime, location, notes
- **expenseClaims Collection**
  - employeeId, category, amount, currency, date
  - description, receiptUrl, projectCode, status, approvals
- **schedules Collection**
  - employeeId, weekStart, shifts (day-indexed), notes
- **shiftSwaps Collection**
  - requesterId, recipientId, originalShift, targetShift
  - date, reason, status, approvals
- **announcements Collection**
  - title, content, category, priority, status
  - publishDate, expiryDate, readBy, acknowledgedBy
- **policies Collection**
  - title, content, category, version, acknowledgedBy

### 🛠️ Technical Changes (v1.5.0)

#### New Components
- `PerformanceReviews.jsx` - Performance management
- `AttendanceTracking.jsx` - Time and attendance
- `ExpenseClaims.jsx` - Expense reimbursement
- `SelfServicePortal.jsx` - Employee portal
- `HRAnalytics.jsx` - Analytics dashboard
- `EmployeeDirectory.jsx` - Org directory
- `CompanyAnnouncements.jsx` - Communications
- `ShiftManagement.jsx` - Scheduling

#### Updated Components
- `FormTemplates.jsx` - Added Performance and Expense form categories
- `Layout.jsx` - Added navigation for all new modules
- `App.jsx` - Added routes with PermissionRoute protection

### Dependencies
- No new dependencies added

---

## [1.4.0] - 2026-04-01

### 🚀 Added - Recruitment & Payroll Suite

#### Recruitment & ATS Module (Enhanced)
- **Job Postings Management** - Create, publish, and close job openings
  - Job title, department, location, employment type
  - Salary range fields (min/max)
  - Job description and requirements
  - Status tracking (open/closed)
- **Candidate Pipeline** - Full ATS with 7 stages
  - Applied → Screening → Interview → Assessment → Offer → Hired → Rejected
  - Visual pipeline with candidate counts per stage
  - Stage change via dropdown selector
- **Candidate Management**
  - Add candidates with name, email, phone
  - Source tracking (Direct, Referral, LinkedIn, Indeed, Job Board, Agency)
  - 5-star rating system for evaluations
  - Resume URL storage
  - Notes and observations
- **Job Selection Panel** - Left sidebar showing all jobs
  - Click to view candidates per job
  - Applicant count badges
  - Close job functionality
- **Search & Filter** - Search candidates by name or email
- **Quick Contact** - Email and phone action buttons

#### Payroll Management Module (New)
- **Monthly Payroll Run** - Process payroll for all active employees
  - Month selector (all 12 months of 2026)
  - Pre-populated with employee salary data
  - Bulk processing capability
- **Salary Components**
  - Basic Salary
  - Housing Allowance
  - Transport Allowance
  - Other Allowances
- **Deductions Management**
  - Tax Deduction
  - Pension Deduction
  - Loan Repayment
  - Other Deductions
- **Auto-Calculations**
  - Gross Salary (sum of all earnings)
  - Total Deductions (sum of all deductions)
  - Net Pay (Gross - Deductions)
- **Payroll Grid** - Spreadsheet-like interface for editing
  - Inline editing of all salary components
  - Real-time net pay calculation
  - Shows all unprocessed employees
- **Payroll Records** - View processed payrolls
  - Employee details with department
  - All salary components
  - Net pay highlighted
  - Status badges (processed)
- **Payroll Summary Cards**
  - Total Net Pay for month
  - Total Gross for month
  - Total Deductions
  - Employees Paid / Total Employees count

#### Payslip Viewer (New)
- **Professional Payslip Layout**
  - Employee information header
  - Pay date display
  - Earnings section with itemized breakdown
  - Deductions section with itemized breakdown
  - Gross Salary total
  - Total Deductions
  - Net Pay prominently displayed
- **Earnings Section**
  - Basic Salary
  - Housing Allowance
  - Transport Allowance
  - Other Allowances
- **Deductions Section**
  - Tax
  - Pension
  - Loan Repayment
  - Other Deductions
- **Download Button** - Ready for PDF integration
- **Close Button** - Easy modal dismissal

#### Employee Salary Fields (HR/GM Only)
- **Salary Section in Employee Form** - Only visible to HR and GM roles
  - Basic Salary field
  - Housing Allowance field
  - Transport Allowance field
  - Other Allowances field
  - Bank Name field
  - Bank Account Number field
  - IBAN field
- **Label Badge** - "HR/GM Only" indicator on salary section
- **Data Storage** - Salary data stored in `employees.salary` object
- **Backward Compatibility** - Handles employees without salary data gracefully

#### Role-Based Access Control - New Hierarchy (v1.4.0)

**New Role Hierarchy System:**
- **Superadmin** (Level 0) - Can create companies and ALL roles, sees all data
- **GM** (General Manager) (Level 1) - Can create HRM and below, sees all data in their company
- **HRM** (HR Manager) (Level 2) - Can create Dept Head and below, sees all data in their company
- **Department Head** (Level 3) - Can create Supervisor and Staff, sees only their department data
- **Supervisor** (Level 4) - Can create Staff only, sees only their department data
- **Staff** (Level 5) - Cannot create users, sees only their own data

**Role Creation Rules:**
- Users can ONLY create roles below their level in the hierarchy
- Superadmin has EXCLUSIVE rights to create companies (no other role can)
- Permission checks: `canCreateRole()`, `getCreatableRoles()`, `canManageUser()`

**User Management (Simplified):**
- Create users with just: **Name, Email, Password** (no complex setup)
- Password minimum: 6 characters
- Role dropdown dynamically filtered based on creator's permissions
- Users grouped by role in collapsible sections
- Edit/Delete restricted to users below your role level

**Feature-Level Permissions (Controlled by Superadmin):**
- Default permissions configured per role
- Features: companies, employees, salary, payroll, recruitment, documents, leave, reports, settings, users
- Actions per feature: view, create, edit, delete, run, apply, approve, export
- Toggle features on/off when creating users with custom permissions

**Data Visibility & Filtering (New):**
- **Role-based data filtering** across all modules
- **Department assignment** for Dept Head, Supervisor, and Staff roles
- **Data visibility rules**:
  - Superadmin: All companies, all departments
  - GM/HRM: All departments in their company
  - Dept Head/Supervisor: Their department only
  - Staff: Their own records only
- **useFilteredFirestore hooks** for automatic data filtering:
  - `useFilteredEmployees()` - Filters employees by role
  - `useFilteredDocuments()` - Filters documents by role
  - `useFilteredLeaves()` - Filters leave data by role
- **AuthContext functions**: `getDataVisibilityFilter()`, `canViewEmployee()`, `filterByVisibility()`

**PermissionRoute Component:**
- Route-level permission protection
- Checks feature/action permissions before allowing access
- Replaces HRAuthRoute with more granular PermissionRoute

#### Approval Workflows (v1.4.0)

**Payroll Approval Workflow (HRM → GM):**
- HRM prepares and submits payroll for approval
- GM reviews and approves/rejects
- Generates official payroll approval form when approved
- Route: `/payroll/approval`

**Promotion/Salary Increase Workflow (HOD → HRM → GM):**
- HOD raises promotion/salary increase request
- HRM validates with comments and approves/rejects
- GM reviews and approves/rejects
- Generates official promotion letter when approved
- Route: `/promotions`

**Disciplinary Action Workflow (HOD → HRM → GM):**
- HOD raises disciplinary action
- HRM validates and approves/rejects
- GM reviews and approves/rejects
- Employee acknowledgment tracking
- Generates official disciplinary letter
- Route: `/disciplinary`

**Recruitment Approval Workflow (HOD → HRM → GM):**
- HOD raises recruitment requisition
- HRM validates (budget, position requirements) and approves/rejects
- GM reviews and approves/rejects
- Hiring progress tracking
- Route: `/recruitment/approval`

**Leave Approval (4-Level Workflow):**
- Supervisor → Dept Head → HRM → GM
- Each level can approve/reject with comments
- Generates official leave form when approved

#### New Modules (v1.4.0)

**Companies Management:**
- Create, edit, delete companies
- Upload company logo and letterhead
- Letterhead appears on all official forms
- Route: `/companies`
- Access: Superadmin only

**Position Quotas:**
- Set quotas for each department position
- Track filled vs remaining positions
- Real-time quota usage based on active employees
- Alerts when approaching or exceeding quota
- Route: `/position-quotas`
- Access: HRM/GM

**Job Description Generator:**
- Auto-generate JDs from employee data
- Templates for common positions
- Custom JD creation mode
- Print with company letterhead
- Route: `/job-descriptions`
- Access: HRM/GM

**Contracts & Offer Letters:**
- Generate offer letters
- Generate employment contracts
- Multiple contract types (probation, renewal, etc.)
- Print with company letterhead
- Route: `/contracts`
- Access: HRM/GM

**Form Templates Hub:**
- Centralized form template management
- Categories: HR Docs, Payroll, Leave, Disciplinary, Promotions
- Quick access to all form generators
- GM/HRM access control
- Route: `/form-templates`
- Access: GM/HRM only

#### Database Collections (New)
- **jobPostings Collection**
  - title, department, location, type
  - description, requirements
  - salaryMin, salaryMax
  - status (open/closed)
  - postedAt, companyId
- **candidates Collection**
  - name, email, phone, resume
  - jobId, source
  - stage (applied/screening/interview/assessment/offer/hired/rejected)
  - rating (1-5), notes
  - appliedAt, hiredAt, companyId
- **payrolls Collection**
  - employeeId, employeeName, month
  - basicSalary, housingAllowance, transportAllowance, otherAllowances
  - taxDeduction, pensionDeduction, loanDeduction, otherDeductions
  - grossSalary, totalDeductions, netSalary
  - processedAt, status, companyId

### 🛠️ Technical Changes

#### New Components & Functions
- `HRGMAuthRoute` - Route guard component for HR/GM access
- `isGM()` - Auth context function
- `isHRorGM()` - Combined permission check
- `RunPayrollModal` - Payroll processing modal
- `PayslipModal` - Payslip viewer modal

#### Updated Components
- `EmployeeForm.jsx` - Added salary section with HR/GM visibility
- `Payroll.jsx` - Complete rewrite with payroll run functionality
- `Recruitment.jsx` - Enhanced with full ATS pipeline
- `AuthContext.jsx` - Added isGM and isHRorGM functions
- `Layout.jsx` - Updated navigation permissions for GM role
- `App.jsx` - Added HRGMAuthRoute and applied to Payroll route

### Dependencies
- No new dependencies added

---

## [1.2.0] - 2026-04-01

### 🚀 Added - Comprehensive Leave Management System

#### Leave Quota & Balance Management
- **LeaveQuotaContext** - Context for managing leave quotas and balances
- **Employee leave balances** - Track per employee per year
- **Auto-calculation** - Remaining days calculated automatically
- **Low balance warnings** - Alerts when running low
- **Accrual tracking** - Support earned/compensatory leave

#### Advanced Leave Types
- **Half-Day Leave** - Morning/afternoon options
- **Hourly Leave** - Short leave (1-8 hours)
- **Compensatory Leave** - Track overtime converted to leave
- **Study Leave** - Educational leave with document requirement
- **Maternity/Paternity** - Gender-specific leave types
- **Emergency Leave** - Fast-track approval option
- **Leave validation** - Gender checks and balance validation

#### Team Calendar & Scheduling
- **TeamCalendar component** - Department-filtered calendar view
- **Overlap warnings** - Alert when 3+ people on leave
- **Month navigation** - Navigate through months
- **Color-coded status** - Visual leave indicators
- **Department filter** - View by department

#### Multi-Level Approval Workflow
- **Manager → HR → Director** - 3-level approval chain
- **Step-by-step progress** - Track approval stage
- **Escalation support** - Forward to next approver
- **Rejection reasons** - Required rejection comments
- **Approval history** - View all approval steps

#### Email Notification System
- **Email service** - Templates for all leave events
- **Automatic emails** - Sent on approval/rejection
- **Escalation alerts** - Notify next approver
- **Reminder emails** - 1 day before leave
- **Low balance alerts** - Warn about low quotas

#### Leave Document Management
- **Document upload** - Medical certs, tickets, proof
- **HR verification** - Verify uploaded documents
- **Type categorization** - Medical, ticket, approval, other
- **Preview & download** - View and download docs
- **Document status** - Track verification status

#### Reports & Analytics
- **LeaveReports component** - Comprehensive analytics dashboard
- **Visual charts** - Bar, Line, Pie charts with Recharts
- **Monthly trends** - Track patterns over time
- **Department breakdown** - Analysis by department
- **Top leave takers** - Most active leave users
- **Export options** - CSV and Excel export
- **Date filtering** - Filter by date range

#### Leave Policy Settings
- **LeavePolicySettings component** - Configure rules
- **Quota management** - Set days per leave type
- **Approval workflow** - Enable/disable levels
- **Auto-approval** - Auto-approve under threshold
- **Notice period** - Minimum advance notice
- **Peak period blocking** - Block leaves during busy times
- **Overlap rules** - Max concurrent leaves

#### New Contexts & Components
- `LeaveQuotaContext.jsx` - Leave balance state management
- `TeamCalendar.jsx` - Department calendar view
- `LeaveBalanceCard.jsx` - Balance display component
- `MultiLevelApproval.jsx` - Approval workflow UI
- `LeaveDocumentUpload.jsx` - Document upload UI
- `AdvancedLeaveTypes.jsx` - Leave type selector
- `LeaveReports.jsx` - Analytics dashboard
- `LeavePolicySettings.jsx` - Policy configuration UI
- `emailService.js` - Email notification service

#### New Routes
- `/leave-reports` - Reports and analytics page
- `/leave-policy` - Policy settings page

#### Navigation Updates
- Added "Leave Reports" to Management section
- Added "Leave Policy" to Management section

### Dependencies
- Added `recharts` for charts and graphs

## [1.1.0] - 2026-04-01

### 🌴 Added - Leave Planner Module

#### Major Features
- **Leave Application Form** (`LeaveApplication.jsx`)
  - Multi-step leave application with transportation options
  - Leave types: Annual, Sick, Emergency, Unpaid, Other
  - Date range selection with automatic day calculation
  - Destination and reason fields
  - Contact information during leave
  - Emergency contact details

- **Transportation Booking System** (`TransportationBooking.jsx`)
  - Three transport modes: Air (Flight), Sea (Ship), Land (Bus/Car)
  - Status tracking workflow:
    - 📋 Quotation Received
    - 🎫 Tickets Purchased
    - ✈️ Departed
    - 📍 Arrived
  - Quotation management with amount and provider
  - Ticket details (number, airline, purchase amount)
  - Departure and arrival tracking with terminals/gates

- **Leave Approval Workflow** (`LeaveApproval.jsx`)
  - HR approval/rejection interface
  - Approval comments and approver name tracking
  - Status progression: Pending → Approved/Rejected

- **Leave Detail View** (`LeaveDetail.jsx`)
  - Complete leave information display
  - Employee profile card
  - Transportation booking details
  - Status history

- **Leave Planner List** (`LeavePlanner.jsx`)
  - Statistics dashboard (Total, Pending, Approved, With Transport)
  - Search by employee, destination, or leave type
  - Filter by status
  - Quick action buttons (View, Edit, Approve, Transport, Delete)

### 🎨 Changed - Modern UI/UX Update

#### Dashboard (`Dashboard.jsx`)
- New gradient header (Indigo → Purple → Pink)
- Modern stat cards with gradient icon backgrounds
- Hover scale effects on cards
- Updated alert cards with gradient backgrounds

#### Employees Page (`Employees.jsx`)
- Gradient header (Indigo → Purple → Pink)
- Glass-morphism search input
- Colorful stat cards with hover effects
- Modern grid and list view cards
- Updated delete modal with centered icon

#### Passports Page (`Passports.jsx`)
- Gradient header (Emerald → Teal → Cyan)
- Colorful alert summary cards
- Modern table with emoji column headers
- Updated status badges with borders

#### Work Permits Page (`WorkPermits.jsx`)
- Gradient header (Blue → Indigo → Violet)
- Colorful alert cards
- Modern scrollable table with sticky header
- Updated action buttons with hover backgrounds

#### Medicals Page (`Medicals.jsx`)
- Gradient header (Rose → Pink → Fuchsia)
- Colorful alert summary cards
- Glass-morphism search input
- Modern table design

#### Visas Page (`Visas.jsx`)
- Gradient header (Violet → Purple → Fuchsia)
- Colorful alert cards
- Modern table with emoji headers
- Updated status badges

### 🛠️ Technical Changes

#### New Components
- `LeavePlanner.jsx` - Main leave management interface
- `LeaveApplication.jsx` - Leave application form
- `LeaveApproval.jsx` - HR approval workflow
- `LeaveDetail.jsx` - Leave detail view
- `TransportationBooking.jsx` - Transport management

#### Routing Updates (`App.jsx`)
- Added `/leave-planner` route
- Added `/leave-planner/apply` route
- Added `/leave-planner/:id` route
- Added `/leave-planner/:id/edit` route
- Added `/leave-planner/:id/approve` route (HR only)
- Added `/leave-planner/:id/transport` route (HR only)

#### Additional Enhancements (v1.1.0 cont.)
- **Calendar View** (`LeaveCalendar.jsx`)
  - Monthly calendar visualization of all leaves
  - Color-coded by status (Pending, Approved, Rejected)
  - Click date to view leaves for that day
  - Month navigation controls

- **Export to CSV** (`LeavePlanner.jsx`)
  - Export filtered leave data to CSV format
  - Includes all leave details with employee names
  - Automatic download with timestamp filename
  - Toast notification on successful export

- **Print View** (`LeavePrintView.jsx`)
  - Professional printable leave application form
  - Employee information, leave details, emergency contacts
  - Transportation booking details
  - Signature boxes for employee and manager
  - Print and Save as PDF buttons

- **Smart Employee Search** (`LeaveApplication.jsx`)
  - Type-to-search dropdown for employee selection
  - Filters by name and employee code
  - Visual employee cards with avatar and department
  - Clear selection option

- **Offline Mode** (`OfflineContext.jsx`)
  - Auto-save form drafts to localStorage every 30 seconds
  - Draft restore when returning to form
  - Warning banner when Firebase quota exceeded
  - Manual "Save Now" button
  - Draft timestamp indicator

- **Dark Mode** (`ThemeContext.jsx`)
  - Toggle between light and dark themes
  - Persists preference to localStorage
  - Moon/Sun icon in header

- **Toast Notifications** (`ToastContext.jsx`)
  - Success, Error, Info, Warning notification types
  - Auto-dismiss after 5 seconds
  - Slide-in animation from top-right
  - Manual close button

#### Navigation Updates
- Added "Leave Management" section to sidebar
- Added "Apply for Leave" and "My Leaves" sub-navigation items

### 🛠️ Technical Changes

#### New Contexts
- `OfflineContext.jsx` - LocalStorage persistence for offline support
- `ThemeContext.jsx` - Dark mode state management
- `ToastContext.jsx` - Toast notification system

---

## [1.0.0] - 2024-XX-XX

### Initial Release

#### Core Features
- **Employee Management**
  - Add, edit, view employees
  - Employee photo upload
  - Department and position tracking
  - Status management (Active/Inactive)

- **Document Management**
  - Passport tracking
  - Visa tracking
  - Work permit tracking
  - Medical records tracking
  - Document upload to Firebase Storage

- **Alert System**
  - Expiry alerts (90, 60, 30 days)
  - Expired document notifications
  - Dashboard alert widgets
  - Color-coded status indicators

- **Renewal Workflow**
  - 5-step renewal process
  - Status tracking
  - Document renewal history

- **Authentication & Authorization**
  - Firebase Authentication
  - Role-based access control (Superadmin, Admin, HR, Staff)
  - Company isolation for multi-tenant support

- **Dashboard**
  - Employee statistics
  - Document expiry summaries
  - Quick navigation
  - Alert notifications

### Technical Stack
- React 19 with Vite
- Firebase (Auth, Firestore, Storage)
- TailwindCSS for styling
- Lucide React for icons
- date-fns for date handling

---

## [1.3.0] - 2026-04-01

### 🚀 Added - Complete HR Management Suite (12 New Modules)

#### Recruitment & ATS (`Recruitment.jsx`)
- Job postings management with publish/unpublish
- Applicant tracking with pipeline stages (New → Screening → Interview → Offer → Hired)
- Interview scheduling system
- Candidate rating and evaluation
- Source tracking (LinkedIn, Indeed, Referrals, etc.)
- Time-to-hire analytics

#### Performance Management (`Performance.jsx`)
- Performance review cycles (Annual, Quarterly, Probation)
- 5-point rating scale with descriptions
- 360-degree feedback (Self, Manager, Peer, Direct Report)
- SMART Goals and OKR tracking
- Competency framework (Technical, Behavioral, Business)
- Performance Improvement Plans (PIP)

#### Training & Development (`Training.jsx`)
- Training calendar and scheduling
- Multiple delivery methods (Classroom, Virtual, E-learning, Workshop)
- Certification tracking with expiry alerts
- Skills matrix for departments
- Training cost calculator

#### Payroll Management (`Payroll.jsx`)
- Monthly salary processing
- Payslip generation and download
- Overtime calculation (1.5x, 2x, 2.5x rates)
- Tax calculation with progressive brackets
- End of service benefits calculator
- Loan/advance tracking

#### Attendance & Time Tracking (`Attendance.jsx`)
- Daily attendance recording
- Shift management (Morning, Day, Night, Rotating)
- Late and early departure tracking
- Work from home logging
- Timesheet approval workflow
- Biometric integration ready

#### Employee Engagement (`Engagement.jsx`)
- Pulse surveys and engagement questionnaires
- eNPS (Employee Net Promoter Score) calculation
- Employee recognition and awards system
- Suggestion box for anonymous feedback
- Work anniversary and birthday alerts
- Event management

#### HR Operations (`Operations.jsx`)
- Disciplinary action tracking (Verbal, Written, Final Warning, Suspension)
- Grievance management with SLA tracking
- Exit management and clearance workflow
- Exit checklists (HR, IT, Finance, Admin, Manager)
- Exit interview tracking

#### HR Analytics Dashboard (`Analytics.jsx`)
- Headcount dashboard with real-time metrics
- Turnover analysis with reasons
- Recruitment metrics (time-to-hire, cost-per-hire)
- Demographics reporting (gender, age, tenure)
- Diversity index calculation
- Visual charts (Bar, Line, Pie, Doughnut) with Recharts

#### Compliance & Legal (`Compliance.jsx`)
- Contract management (Permanent, Fixed-term, Part-time, Consultant)
- Labor law compliance tracking (8 key areas)
- Document generation (NOC, Experience letters, Salary certificates)
- Incident tracking (Workplace injuries, Safety violations)
- Compliance score calculation

#### Organization Structure (`OrgStructure.jsx`)
- Organization chart visualization
- Department management
- Position and grade levels
- Reporting line tracking
- Span of control analysis

#### Employee Self-Service (`SelfService.jsx`)
- Profile self-update
- Payslip download and history
- Leave balance view
- Document upload
- Certificate requests (NOC, Experience letter, Salary certificate)
- Request tracking

#### 4-Level Approval Workflow (Updated)
- Supervisor → Department Head → HR → GM approval chain
- Configurable approval thresholds
- Level-specific email notifications
- Approval policy settings

### 🎨 Added - Illustrations
- Added Storyset illustrations to Login page
- Added illustrations to Dashboard header
- 50+ free illustrations in `/public/storyset` folder

### 🛠️ New Service Files
- `recruitmentService.js` - Recruitment logic and templates
- `performanceService.js` - Performance review logic
- `trainingService.js` - Training management
- `payrollService.js` - Payroll calculations
- `attendanceService.js` - Attendance tracking
- `engagementService.js` - Employee engagement
- `operationsService.js` - HR operations
- `analyticsService.js` - HR analytics
- `complianceService.js` - Legal compliance
- `orgStructureService.js` - Organization structure
- `selfService.js` - Self-service portal

### Dependencies
- Added `recharts` for data visualization charts

---

## Future Roadmap

### Planned for v1.4.0
- [ ] Mobile app improvements
- [ ] Advanced workflow automation
- [ ] AI-powered insights
- [ ] Integration with external HR systems

---

## Version History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.0.0 | 2026-04-02 | Advanced HR Suite: Time & Attendance (GPS), Benefits Management, Employee Engagement, Compliance Center, HR Analytics, Integrations Hub |
| 1.5.0 | 2026-04-02 | HR Enhancement Suite: Performance Reviews, Attendance Tracking, Expense Claims, Self-Service Portal, HR Analytics, Employee Directory, Announcements, Shift Management |
| 1.4.0 | 2026-04-01 | Recruitment & Payroll Suite: Full ATS pipeline, Payroll run with payslips, GM role |
| 1.3.0 | 2026-04-01 | Complete HR Suite: 12 New Modules (Recruitment, Payroll, Attendance, Analytics, etc.) |
| 1.2.0 | 2026-04-01 | Comprehensive Leave System: Quotas, Multi-Approval, Reports, Policy Settings |
| 1.1.0 | 2026-04-01 | Leave Planner + Calendar + Export + Print + Offline + Dark Mode + Toast |
| 1.0.0 | 2024-XX-XX | Initial Release |

---

## Contributors
- Development Team - Hawaain HR Systems

## Notes
- All dates are in UTC+05:00 (Maldives time)
- Features marked with 🌴 are part of the Leave Planner module
- Features marked with 🎨 are UI/UX improvements
