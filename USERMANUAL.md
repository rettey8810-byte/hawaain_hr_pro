# HR Factory - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Company Management](#company-management)
5. [Company Structure](#company-structure)
6. [Dashboard](#dashboard)
7. [Employee Management](#employee-management)
8. [Recruitment & ATS](#recruitment--ats)
9. [Payroll & Payslips](#payroll--payslips)
10. [Manpower Budget](#manpower-budget)
11. [Leave Planner](#leave-planner)
12. [Leave Reports & Analytics](#leave-reports--analytics)
13. [Leave Policy Settings](#leave-policy-settings)
14. [Document Management](#document-management)
15. [Accommodation](#accommodation)
16. [Promotions](#promotions)
17. [Employee Engagement](#employee-engagement)
18. [HR Operations](#hr-operations)
19. [Notifications & Alerts](#notifications--alerts)
20. [Settings](#settings)
21. [Troubleshooting](#troubleshooting)
22. [Tips & Best Practices](#tips--best-practices)
23. [Keyboard Shortcuts](#keyboard-shortcuts)
24. [Contact & Support](#contact--support)
25. [FAQ](#faq)

---

## Introduction

Hawaain HR Pro is a comprehensive Human Resources Management System designed for managing employees, tracking documents, and handling leave applications with transportation booking.

### Key Features
- Employee profile management
- Document tracking (Passports, Visas, Work Permits, Medicals)
- Leave application with transport booking
- Real-time expiry alerts
- Multi-role access control

---

## Getting Started

### Login
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the Dashboard

### First Time Setup (Super Admin)
1. Create your company profile
2. Add HR managers and staff users
3. Configure notification settings
4. Import employee data (optional)

---

## User Roles & Permissions

### Role Hierarchy

The system uses a hierarchical role structure where higher roles can create and manage users in lower roles:

**Superadmin** (Level 0)
- Full system access
- **Only role that can create companies**
- Can create ALL other roles (GM, HRM, Dept Head, Supervisor, Staff)
- Can manage all users across all companies
- Access to audit logs and system settings

**GM (General Manager)** (Level 1)
- Can create: HRM, Dept Head, Supervisor, Staff
- Access to payroll and salary information
- Can approve high-value leaves (Level 4 approver)
- View financial reports and HR analytics
- Cannot create companies

**HRM (HR Manager)** (Level 2)
- Can create: Dept Head, Supervisor, Staff
- Manage employees and documents
- Process payroll and generate payslips
- Handle recruitment and performance reviews
- Configure leave policies

**Department Head** (Level 3)
- Can create: Supervisor, Staff
- Manage department-specific operations
- Approve department leaves
- View department reports
- Cannot access salary information or payroll

**Supervisor** (Level 4)
- Can create: Staff only
- Approve team member leaves (Level 1 approver)
- View team attendance and performance
- Limited management scope

**Staff** (Level 5)
- Cannot create any users
- View own profile and documents
- Apply for leave
- Access self-service features
- View own payslips (not others)

### User Creation Rules

**Who Can Create Whom:**
- Superadmin → GM, HRM, Dept Head, Supervisor, Staff
- GM → HRM, Dept Head, Supervisor, Staff
- HRM → Dept Head, Supervisor, Staff
- Department Head → Supervisor, Staff
- Supervisor → Staff only
- Staff → Cannot create users

**Important Notes:**
1. Users can ONLY create roles BELOW their level in the hierarchy
2. Superadmin has exclusive rights to create companies
3. Only Superadmin can assign the Superadmin role
4. Users cannot modify or delete users at the same or higher level

---

## Company Management

### Overview (Superadmin Only)

The Company Management module allows superadmins to create and manage multiple companies in the system. Each company has complete data isolation.

### Data Isolation Structure

**Multi-Tenant Architecture:**
- Each company has a unique slug ID (e.g., "sunisland-resort-and-spa")
- All employee data is linked to a company via `companyId` field
- Users can only access data from their assigned company
- Superadmins can switch between all companies

### Creating a New Company

1. Go to "Administration" → "Companies"
2. Click "Add Company"
3. Enter company details:
   - **Company Name**: Full legal name (e.g., "Sunisland Resort and Spa")
   - **Company Code**: Unique identifier (e.g., "SUNISLAND")
   - **Address**: Full company address
   - **Contact Info**: Phone, email
   - **Industry**: Business sector
4. Click "Create Company"
5. System automatically creates company document with slug ID

### Managing Companies

**Viewing Companies:**
- See all companies in the Companies list
- View employee count per company
- Check company status (active/inactive)

**Editing Companies:**
1. Select company from list
2. Click "Edit"
3. Update company information
4. Save changes

**Company Switching (Superadmin):**
- Use company selector in top navigation
- Switch between companies instantly
- All data updates to show selected company's information

### Assigning Users to Companies

**Creating Company Admin:**
1. Go to "Administration" → "User Management"
2. Click "Add User"
3. Enter user details:
   - **Role**: Select "company_admin" or appropriate role
   - **Company**: Select the company from dropdown
4. System automatically sets `companyId` and `companyIds[]`

**User Company Access:**
- Regular users see only their assigned company's data
- Company admins can manage all data within their company
- Superadmins see all companies and can switch between them

### Bulk Data Import

**Importing Employees:**
1. Prepare Excel file with employee data
2. Use `upload_to_firestore.py` script
3. Script automatically:
   - Creates company document if not exists
   - Imports all employees with `companyId` linkage
   - Generates document IDs: `{companySlug}_{empId}`

**Example Import:**
- 887 employees imported for "Sunisland Resort and Spa"
- Document ID format: `sunisland-resort-and-spa_571`
- All employees linked to company ID: `sunisland-resort-and-spa`

---

## Company Structure

### Overview
Company Structure allows you to define your organization's hierarchy with divisions, departments, sections, and job designations. Once defined, these appear dynamically in dropdowns throughout the system.

### Access
Go to **Company → Company Structure**

### Divisions & Departments Tab

#### Creating Divisions
1. Click "Add Division"
2. Enter details:
   - **Name**: e.g., "Human Resources", "Finance"
   - **Code**: Short code e.g., "HR", "FIN"
   - **Type**: Division, Department, Section, Unit, or Branch
   - **Budget Code**: For budget tracking (optional)
   - **Head of Department**: Name of HOD (optional)
   - **Description**: Details about the division
3. Save

#### Managing Divisions
- View employee count per division
- View linked designations count
- Edit or delete divisions (cannot delete if employees are assigned)
- Search and filter by type

### Designations Tab

#### Creating Designations
1. Click "Add Designation"
2. Enter details:
   - **Title**: Job title e.g., "Software Engineer"
   - **Code**: Short code e.g., "SE"
   - **Department**: Link to a division/department
   - **Level**: Entry, Staff, Senior, Lead, Manager, Director, VP, Executive
   - **Grade**: Pay grade e.g., "G5"
   - **Salary Range**: Min and Max salary (USD)
   - **Description**: Role overview
   - **Responsibilities**: Key duties
3. Save

#### Managing Designations
- View all job positions in table format
- Filter by department, level, or search by name
- Edit or delete designations (cannot delete if assigned to employees)

### Leave Types Tab

#### Overview
Leave Types define the list of leave categories used in Leave Planner and Leave Policy (e.g., Annual, Sick, Unpaid).

#### Access
- Visible to **HR and GM roles**

#### Managing Leave Types
1. Go to **Company → Company Structure**
2. Open the **Leave Types** tab
3. Click **Add Leave Type** to create a new type
4. Use the edit/delete buttons to update or remove existing leave types

### Using Dynamic Dropdowns
Once divisions and designations are created, they automatically appear in:
- **Add Employee** form (Division, Department, Section, Designation fields)
- **Manpower Budget** (Department, Section, Designation fields)
- **Recruitment** job postings

---

## Dashboard

The Dashboard provides an overview of your HR system with colorful cards and alerts.

### Stat Cards
- **Total Employees**: Active workforce count
- **Expiring Soon**: Documents expiring within 30 days
- **Expired Documents**: Documents requiring immediate action
- **Valid Documents**: All clear status

### Document Type Stats
- Passports
- Work Permits
- Visas
- Medical Records

### Alerts Section
Color-coded alerts for:
- 🔴 Expired documents
- 🟠 Expiring in 30 days
- 🟡 Expiring in 60 days
- 🔵 Expiring in 90 days

---

## Employee Management

### Adding a New Employee
1. Click "Employees" in the sidebar
2. Click "Add Employee" button
3. Fill in the required information:
   - Personal details (Name, Email, Phone)
   - Employee Code
   - Department
   - Position
   - Photo (optional)
4. Click "Save"

### Editing an Employee
1. Find the employee in the list
2. Click the "Edit" icon
3. Update the information
4. Click "Save"

### Viewing Employee Details
1. Click on the employee name or "View" icon
2. See all employee information
3. View linked documents
4. View leave history

### Document Status Badges
Each employee card shows:
- 🟢 All documents valid
- 🟡 Some documents expiring soon
- 🔴 Expired documents present

---

## Recruitment & ATS

### Overview (HR/GM Only)

The Recruitment module helps you manage job postings and track candidates through the hiring pipeline.

### Creating a Job Posting

1. Go to "People" → "Recruitment" in the sidebar
2. Click "New Job" button
3. Fill in the job details:
   - **Job Title**: Position name (e.g., "Senior Developer")
   - **Department**: Hiring department
   - **Location**: Work location
   - **Employment Type**: Full-time, Part-time, Contract, or Internship
   - **Salary Range**: Minimum and maximum salary (optional)
   - **Description**: Job responsibilities and requirements
4. Click "Create Job"
5. Job posting is now live and visible to candidates

### Managing Job Postings

1. View all jobs in the left panel
2. Click on a job to see candidates
3. **Close Job**: Click "Close" when position is filled
4. **View Applicants**: See count of applicants per job

### Adding Candidates

1. Select a job posting
2. Click "Add Candidate" button
3. Enter candidate information:
   - **Full Name**: Candidate's name
   - **Email**: Contact email address
   - **Phone**: Contact phone number
   - **Source**: How they applied (Direct, Referral, LinkedIn, Indeed, Job Board, Agency)
   - **Resume URL**: Link to resume/CV
   - **Rating**: Star rating (1-5) for initial evaluation
   - **Notes**: Any observations
4. Click "Add Candidate"

### Candidate Pipeline Management

The pipeline has 7 stages. Move candidates through stages using the dropdown:

1. **Applied** - Initial application received
2. **Screening** - Initial HR review
3. **Interview** - Scheduled for interview
4. **Assessment** - Technical/Practical assessment
5. **Offer** - Offer extended
6. **Hired** - Candidate accepted and joined
7. **Rejected** - Not selected

**To move a candidate:**
1. Find candidate in the list
2. Click the stage dropdown
3. Select new stage
4. System automatically updates

### Viewing Pipeline Statistics

At the top of the candidates view, see counts for each stage:
- Visual pipeline with count badges
- Quickly see how many candidates at each stage
- Filter candidates by stage

### Searching Candidates

1. Use the search box in candidates list
2. Search by name or email
3. Results filter automatically as you type

### Contacting Candidates

Quick action buttons for each candidate:
- **Email**: Click mail icon to send email
- **Phone**: Click phone icon to call

---

## Payroll & Payslips

### Overview (HR/GM Only)

The Payroll module allows you to process monthly payroll and generate payslips for employees.

### Setting Up Employee Salaries

Before running payroll, ensure employee salary information is entered:

1. Go to "People" → "Employees"
2. Click on employee name
3. Click "Edit"
4. Scroll to "Salary & Bank Information" section (visible to HR/GM only)
5. Enter salary components:
   - **Basic Salary**: Base monthly salary
   - **Housing Allowance**: Housing benefit amount
   - **Transport Allowance**: Transport benefit amount
   - **Other Allowances**: Any additional allowances
   - **Bank Name**: Employee's bank
   - **Bank Account**: Account number
   - **IBAN**: International Bank Account Number
6. Click "Save Employee"

### Running Monthly Payroll

1. Go to "HR Management" → "Payroll"
2. Select the month from the dropdown (e.g., "April 2026")
3. Click "Run Payroll" button
4. Review the payroll grid:
   - All active employees without processed payroll appear
   - Pre-populated with their salary data
5. Edit any values as needed:
   - Adjust allowances
   - Add deductions (Tax, Pension, Loan, Other)
6. Review Net Pay calculation (auto-calculated)
7. Click "Process Payroll"
8. Payslips are generated for all employees

### Viewing Payroll Records

1. On Payroll page, see all processed payrolls for selected month
2. Columns show:
   - Employee name and department
   - Basic Salary
   - Allowances
   - Deductions
   - Net Pay
3. Shows "Employees Paid" count vs total active employees

### Viewing Payslips

**For HR/GM:**
1. In Payroll page, click "View Payslip" on any record
2. See detailed payslip with:
   - Employee information
   - Pay date
   - **Earnings Section**:
     - Basic Salary
     - Housing Allowance
     - Transport Allowance
     - Other Allowances
     - Gross Salary total
   - **Deductions Section**:
     - Tax
     - Pension
     - Loan Repayment
     - Other Deductions
     - Total Deductions
   - **NET PAY**: Final amount

**For Employees (Self-Service):**
1. Go to "Self Service" → "My Profile"
2. Payslip section shows your processed payslips
3. Select month/year to view
4. Click "Download" to save PDF (if configured)

### Exporting Payroll Data

1. On Payroll page, click "Export All" button
2. Data exports as CSV/Excel (coming soon)

### Payroll Summary Cards

Dashboard shows summary statistics:
- **Total Net Pay**: Sum of all employee net salaries
- **Total Gross**: Sum of all gross salaries
- **Deductions**: Total deductions across all employees
- **Employees Paid**: Count of processed vs total employees

---

## Leave Planner

### 🌴 Applying for Leave

1. Navigate to "Leave Planner" in sidebar
2. Click "Apply for Leave" button
3. Fill the application form:

#### Leave Details
- **Leave Type**: Select from Annual, Sick, Emergency, Unpaid, or Other
- **Start Date**: First day of leave
- **End Date**: Last day of leave
- **Days**: Auto-calculated
- **Destination**: Where you're going
- **Reason**: Why you need leave

#### Contact Information
- **Contact Number**: Phone number during leave
- **Email**: Email address during leave

#### Emergency Contact
- Name
- Relationship
- Phone number

#### Transportation (Optional)
- Check "Transportation Required" if needed
- Select mode: Air (Flight), Sea (Ship), or Land (Bus/Car)
- Enter From/To locations
- Add preferred time
- Add special requests (seat preference, meals, etc.)

4. Click "Submit Application"

### 📋 Viewing Leave Status

1. Go to "Leave Planner"
2. See all your leaves in the table
3. Status shown as:
   - ⏳ Pending
   - ✅ Approved
   - ❌ Rejected
   - 🚫 Cancelled

### ✈️ Transportation Status Tracking

If you requested transportation, HR will update the status:

1. **📋 Quotation Received** - Transport options provided
2. **🎫 Tickets Purchased** - Booking confirmed
3. **✈️ Departed** - Journey started
4. **📍 Arrived** - Reached destination

### 📅 Calendar View

View all leaves in a visual calendar format:

1. Go to "Leave Planner"
2. Click "Calendar View" toggle button
3. Navigate months using arrow buttons
4. See color-coded leave indicators on each date
5. Click any date to view leaves for that day
6. Colors indicate status:
   - 🟡 Amber: Pending
   - 🟢 Green: Approved
   - 🔴 Red: Rejected

### 📊 Export to CSV

Download leave data for reporting:

1. In Leave Planner, click "Export CSV" button
2. File will automatically download
3. CSV includes: Employee, Type, Dates, Days, Destination, Status, Transport

### 🖨️ Print Leave Form

Generate professional printable leave applications:

1. Find the leave in Leave Planner list
2. Click "Print" icon (printer symbol)
3. Review the formatted document
4. Click "Print" to send to printer
5. Or "Save as PDF" to download
6. Form includes employee details, leave info, and signature boxes

### 💾 Offline Mode & Auto-Save

Forms automatically save when connection is lost:

1. Start filling any form (e.g., Leave Application)
2. Draft saves every 30 seconds automatically
3. Yellow warning banner appears if offline/quota exceeded
4. Click "Save Now" to manually save
5. Draft timestamp shows last saved time
6. Form restores automatically when you return
7. Click "Clear Draft" to remove saved data

### 🌙 Dark Mode

Toggle between light and dark themes:

1. Click Moon/Sun icon in top header
2. Moon = Switch to Dark Mode
3. Sun = Switch to Light Mode
4. Preference saves automatically

### 🔔 Toast Notifications

Get instant feedback on actions:

- Green toasts: Success messages
- Red toasts: Error alerts
- Blue toasts: Information
- Yellow toasts: Warnings
- Auto-dismiss after 5 seconds
- Click X to close manually

### 🔍 Smart Employee Search

Quickly find employees with type-to-search:

1. When applying for leave (HR only)
2. Click employee dropdown
3. Start typing name or employee code
4. Matching results appear instantly
5. See employee avatar, department, and position
6. Click to select, X to clear

### 👥 Team Calendar (Department View)

View all team leaves by department:

1. Go to "Leave Planner"
2. Click "Team Calendar" view option
3. Select department from dropdown (or "All Departments")
4. See color-coded leave indicators per date
5. Yellow warning appears if 3+ people on leave same day
6. Click any date to see who's on leave that day

### 💳 Leave Balance & Quota

Check your leave balances:

1. Go to "Leave Planner" → "My Leaves"
2. See Leave Balance card at top
3. View remaining days by type:
   - Annual Leave
   - Sick Leave
   - Emergency Leave
   - Compensatory Leave
   - Other types
4. Progress bars show used vs remaining
5. Low balance warnings appear automatically

### 🎯 Advanced Leave Types

New leave types available:

**Half-Day Leave:**
1. Select "Half Day" as leave type
2. Choose Morning (AM) or Afternoon (PM)
3. Deducts 0.5 days from balance

**Hourly Leave:**
1. Select "Hourly" as leave type
2. Use slider to select hours (1-8)
3. Deducts hours/8 from balance

**Compensatory Leave:**
1. Available only if you've accrued overtime
2. Check your compensatory balance first
3. Expires after 90 days

**Study Leave:**
1. Select "Study" as leave type
2. Requires document upload (enrollment proof)
3. Up to 30 days per year

**Maternity/Paternity:**
1. Gender-specific (auto-validated)
2. Maternity: up to 90 days
3. Paternity: up to 7 days

### 🔄 4-Level Approval Workflow

Each company has 4 approval levels. Your leave application flows through these levels based on leave duration:

**Level 1: Supervisor (Direct Manager)**
- First level of approval
- Reviews all leave applications
- Checks team availability

**Level 2: Department Head**
- Required for leaves over 3 days
- Department-level approval
- Resource planning check

**Level 3: HR Review**
- Required for leaves over 7 days
- Verifies leave balance
- Compliance check

**Level 4: GM (General Manager)**
- Final approval for leaves over 14 days
- Strategic approval
- Executive authorization

**How it works:**
1. Submit your leave application
2. System determines required approval levels based on:
   - Number of days requested
   - Company policy settings
   - Your department
3. Application flows through each enabled level
4. All approvers must approve for final authorization
5. Any level can reject with reason

**Track Progress:**
- View approval chain on leave details page
- See current level and status
- Check approver names and timestamps
- Receive email at each approval step

### 📈 Leave Reports & Analytics (HR Only)

Access comprehensive reports:

1. Go to "Management" → "Leave Reports"
2. View summary statistics (Total, Approved, Pending, Rejected)
3. Filter by date range and department
4. View charts:
   - Leave type distribution (Pie chart)
   - Monthly trends (Line chart)
   - Department breakdown (Bar chart)
5. See top 10 leave takers
6. Export to CSV or Excel

### ⚙️ Leave Policy Settings (HR Only)

Configure leave rules:

1. Go to "Management" → "Leave Policy"
2. Set quotas per leave type
3. Configure approval workflow:
   - Enable/disable manager approval
   - Enable/disable HR approval
   - Set auto-approve threshold
4. Set restrictions:
   - Minimum notice period
   - Maximum concurrent leaves
   - Peak period blocking
5. Save settings

### � Leave Import (HR Only - v2.1)

Bulk import leave data from Excel/JSON files:

1. Go to "Leave Planner"
2. Click the "Import Data" tab
3. Prepare your data in Excel with these columns:
   - **Emp ID**: Employee ID number
   - **Name**: Employee full name
   - **Leave Type**: Annual, Sick, Emergency, Unpaid
   - **From Date**: Start date (Excel serial format or YYYY-MM-DD)
   - **To Date**: End date (Excel serial format or YYYY-MM-DD)
   - **Leave Days**: Number of days
   - **Reason**: Purpose of leave
   - **Ref. No**: Reference number (optional)
   - **Approved By.2**: Set to "SYSTEM" for auto-approved leaves

4. Save Excel file and convert to JSON (use online converter or provided script)
5. Click "Select JSON File" in the Import Data tab
6. Select your JSON file
7. System will:
   - Match employees by Emp ID
   - Create leave records for each valid entry
   - Skip records with missing employees or invalid dates
   - Show import summary (created vs skipped)

**Tips:**
- Ensure Emp IDs match exactly with employee records
- System will auto-calculate days if dates are provided
- Leaves marked with "SYSTEM" approval will be auto-approved
- Check browser console for detailed import logs

### � Leave Document Upload

Attach supporting documents:

1. Open leave application
2. Go to "Documents" section
3. Click "Upload Document"
4. Select document type:
   - Medical Certificate
   - Flight/Ticket Booking
   - Manager Approval Letter
   - Supporting Document
5. Upload PDF, JPG, or PNG (max 10MB)
6. HR can verify uploaded documents

### 📧 Email Notifications

Automatic emails sent for:

- **Leave Submitted** - Confirmation to employee, alert to HR
- **Leave Approved** - Success notification with details
- **Leave Rejected** - Reason provided
- **Approval Needed** - Escalation to next approver
- **Reminder** - 1 day before leave starts
- **Low Balance** - Warning when quota running low

---

## Leave Reports & Analytics

### Accessing Reports (HR Only)

1. Go to "Management" → "Leave Reports"
2. View summary statistics dashboard
3. Use filters to narrow down data

### Available Reports

**Summary Dashboard:**
- Total applications count
- Approved vs Pending vs Rejected
- Total leave days used

**Visual Charts:**
- Leave type distribution (Pie chart)
- Monthly trends over time (Line chart)
- Department comparison (Bar chart)

**Detailed Tables:**
- Top 10 leave takers
- Department breakdowns
- Individual employee history

### Exporting Data

1. Set your date range and filters
2. Click "Export CSV" or "Export Excel"
3. File downloads automatically
4. Includes all filtered data

---

## Leave Policy Settings

### Accessing Policy Settings (HR Only)

1. Go to "Management" → "Leave Policy"
2. Configure leave rules and quotas

### Configurable Options

**Leave Quotas:**
- Annual Leave: Default 30 days
- Sick Leave: Default 15 days
- Emergency Leave: Default 7 days
- Study Leave: Default 30 days
- Compensatory: Based on overtime
- Half-Day: Counts as 0.5 day

**4-Level Approval Workflow:**
- Enable Supervisor Approval (Level 1)
- Enable Department Head Approval (Level 2)
- Enable HR Approval (Level 3)
- Enable GM Approval (Level 4)

**Approval Thresholds:**
- Supervisor → Dept Head: Default 3 days
- Dept Head → HR: Default 7 days
- HR → GM: Default 14 days

**Auto-Approval:**
- Auto-approve under X days (if all enabled levels approve)

**Restrictions:**
- Minimum notice period (days)
- Maximum concurrent leaves
- Block peak periods

### Saving Changes

1. Adjust settings as needed
2. Click "Save Settings"
3. Changes apply immediately
4. Use "Reset" to restore defaults

---

## HR Modules (v1.3.0)

### Recruitment & ATS (HR Only)

Manage your hiring process from job posting to onboarding.

**Creating a Job Posting:**
1. Go to "Management" → "Recruitment"
2. Click "New Job Posting"
3. Fill in position details (title, department, requirements)
4. Set application deadline
5. Publish the posting

**Managing Applicants:**
1. View all applicants in the ATS pipeline
2. Move candidates through stages: New → Screening → Interview → Offer → Hired
3. Schedule interviews with calendar integration
4. Rate candidates and add evaluation notes
5. Send offer letters to selected candidates

**Analytics:**
- View time-to-hire metrics
- Track candidate sources (LinkedIn, referrals, etc.)
- Monitor recruitment pipeline progress

### Performance Management (HR & Managers)

Conduct performance reviews and track employee goals.

**Starting a Performance Review:**
1. Go to "Management" → "Performance"
2. Select review type (Annual, Quarterly, Probation)
3. Assign reviewer and reviewee
4. Set review period and due date

**360-Degree Feedback:**
1. Self-assessment by employee
2. Manager evaluation
3. Peer feedback (optional)
4. Direct report feedback (for managers)

**Goal Setting (OKRs/SMART):**
1. Define objectives with key results
2. Set measurable targets
3. Track progress throughout the quarter
4. Review achievements at period end

### Payroll Management (HR Only)

Process monthly payroll and manage compensation.

**Monthly Payroll Process:**
1. Go to "Management" → "Payroll"
2. Select payroll month and year
3. Review employee salary components
4. Calculate overtime and deductions
5. Process payroll and generate payslips

**Employee Actions:**
1. View payslips in "Self-Service" → "Payslips"
2. Download payslip PDF
3. View year-to-date earnings

**End of Service Calculation:**
1. Access employee profile
2. Click "Calculate End of Service"
3. Review gratuity and deductions
4. Generate final settlement

### Manpower Budget (HR Only)

Plan and manage annual manpower budgets across companies.

**Accessing Manpower Budget:**
1. Go to "Budget" → "Manpower Budget" in the sidebar
2. View dashboard with budget statistics
3. See smart check alerts for data issues

**Adding Budget Entry:**
1. Click "Add Employee Budget"
2. Enter employee details:
   - Name and Designation
   - Basic Salary
   - Food Allowance
   - Transport Allowance
   - Phone Allowance
   - Other Allowances
3. System auto-calculates total monthly salary
4. Save to Firestore

**Budget Analytics:**
- Total annual budget across all entries
- Employee count and average salary
- Smart check alerts:
  - Duplicate employees
  - Zero salary warnings
  - High earner notifications (>50k MVR)

**Managing Budgets:**
- Search by employee name
- Filter by company (multi-company support)
- Edit or delete entries
- Export to CSV for reporting
- View detailed breakdown per employee

**Exporting Budget Data:**
1. Click "Export CSV" button
2. Download complete budget spreadsheet
3. Use for financial planning and reporting

### Attendance & Time Tracking (HR & Employees)

Monitor employee attendance and working hours.

**For Employees - Daily Check-in:**
1. Go to "Self-Service" → "My Attendance"
2. Click "Check In" when starting work
3. Click "Check Out" when leaving
4. View daily/weekly attendance summary

**For HR - Managing Attendance:**
1. Go to "Management" → "Attendance"
2. View daily attendance dashboard
3. Review late arrivals and absences
4. Approve timesheets
5. Export attendance reports

**Shift Management:**
1. Create shift schedules (Morning, Day, Night)
2. Assign employees to shifts
3. Track shift rotations
4. Monitor overtime hours

### Employee Engagement (HR & All Employees)

Participate in surveys and recognition programs.

**Taking a Survey:**
1. Access from dashboard notification or "Engagement" page
2. Complete pulse check or engagement survey
3. Submit anonymous feedback
4. View engagement scores (HR only)

**Employee Recognition:**
1. Go to "Engagement" → "Recognition"
2. Nominate a colleague for an award
3. Select award type (Excellence, Team Player, Innovation)
4. Add recognition message
5. Submit for approval

**eNPS Calculation:**
- HR can view Employee Net Promoter Score
- Track engagement trends over time
- Identify areas for improvement

### Employee Self-Service (All Employees)

Manage your personal information and requests.

**Updating Profile:**
1. Go to "Self Service" → "Self-Service"
2. Click "Update Profile"
3. Edit contact information, address, emergency contacts
4. Upload profile photo

**Requesting Certificates:**
1. Go to "Self-Service" → "Request Certificates"
2. Select certificate type (NOC, Experience, Salary)
3. Fill in required details
4. Submit request
5. Track request status

**Viewing Payslips:**
1. Go to "Self-Service" → "Payslips"
2. Select month/year
3. View or download payslip PDF
4. Access historical payslips

### Organization Structure (HR Only)

View and manage company hierarchy.

**Viewing Org Chart:**
1. Go to "Management" → "Org Structure"
2. View visual organization chart
3. Click on any position to see details
4. View reporting lines

**Managing Departments:**
1. Add new departments
2. Assign department heads
3. View department headcount
4. Manage positions and grades

### HR Analytics (HR Only)

View comprehensive HR metrics and reports.

**Dashboard Overview:**
1. Go to "Management" → "HR Analytics"
2. View real-time headcount
3. Monitor turnover trends
4. Check diversity metrics

**Available Reports:**
- Headcount by department
- Recruitment metrics
- Attendance analytics
- Leave utilization
- Employee demographics

**Exporting Data:**
1. Select report type
2. Apply date filters
3. Choose export format (CSV, Excel)
4. Download report

### Compliance & Legal (HR Only)

Ensure labor law compliance and manage contracts.

**Contract Management:**
1. Go to "Management" → "Compliance"
2. View all employee contracts
3. Track contract expiry dates
4. Generate contract renewals

**Compliance Tracking:**
1. Monitor 8 key compliance areas
2. View compliance score
3. Track workplace incidents
4. Generate compliance reports

**Document Generation:**
- Generate NOC (No Objection Certificate)
- Create experience certificates
- Issue salary certificates
- Prepare offer letters

---

## Document Management

### Adding a Passport
1. Go to "Passports"
2. Click "Add Passport"
3. Select employee
4. Enter:
   - Passport number
   - Issue date
   - Expiry date
   - Country
   - Upload document (optional)
5. Save

### Adding a Visa
1. Go to "Visas"
2. Click "Add Visa"
3. Enter:
   - Visa number
   - Type (Work, Tourist, etc.)
   - Entry type (Single, Multiple)
   - Issue date
   - Expiry date
   - Upload document (optional)
4. Save

### Adding a Work Permit
1. Go to "Work Permits"
2. Click "Add Work Permit"
3. Enter:
   - Permit number
   - Job position
   - Employer
   - Issue date
   - Expiry date
   - Upload document (optional)
4. Save

### Adding a Medical Record
1. Go to "Medical"
2. Click "Add Medical Record"
3. Enter:
   - Test date
   - Expiry date
   - Result (Approved, Failed, Pending)
   - Upload document (optional)
4. Save

---

## Accommodation (v2.1)

### Overview
Manage staff accommodation with room assignments, occupancy tracking, and maintenance requests. Now includes bulk import and enhanced room management.

### Access
Go to **Accommodation** in the main navigation

### Room List

#### Creating Rooms
1. Go to "Accommodation" → "Room List"
2. Click "Add Room"
3. Enter room details:
   - **Room Number**: e.g., "101", "A-203"
   - **Building**: Building name or block
   - **Floor**: Floor number (Ground, 1, 2, etc.)
   - **Wing**: Optional wing/block identifier
   - **Room Type**: Standard, Deluxe, Suite, Shared, Studio, Family
   - **Capacity**: Number of people room can accommodate
   - **Beds**: Number of beds
   - **Bathrooms**: Number of bathrooms
   - **Area**: Square meters (optional)
   - **Amenities**: AC, WiFi, TV, Kitchen, Laundry, Hot Water, Backup Power, Fan
4. Set room status: Available, Occupied, Maintenance, Cleaning, Reserved
5. Save room

#### Importing Rooms (v2.1)
Bulk import rooms and assignments from JSON:

1. Prepare Excel file with columns:
   - **Emp ID**: Employee ID (for assignments)
   - **Name**: Employee name
   - **Building Name**: Building identifier
   - **Room No**: Room number
   - **Flat Name**: Floor/flat name
   - **Bed No**: Bed count
   - **In House**: TRUE/FALSE (only TRUE records are imported)
   - **Check In**: Check-in date
   - **Entry By**: Who made the entry

2. Convert Excel to JSON using provided script or online tool
3. In Accommodation, click "Import JSON" button
4. Select your JSON file
5. System will:
   - Create unique rooms based on Building + Room No
   - Match employees by Emp ID
   - Create room assignments automatically
   - Skip duplicates and invalid records

#### Managing Rooms
- View all rooms with occupancy status
- Filter by building, status, or search by room number
- Edit room details or delete rooms
- View occupancy percentage per room
- Room details now persist correctly when editing

### Room Assignments

#### Creating New Assignments (v2.1)
1. Go to "Accommodation" → "Room Assignments"
2. Click **"New Assignment"** button (top right)
3. Select from available rooms (shows all rooms with status)
4. Choose employee from dropdown
5. Set check-in date
6. Add optional notes
7. Save - room status automatically updates to "occupied"

#### Managing Assignments
- View all current occupants
- See check-in dates and expected duration
- Edit assignments if needed
- Vacate rooms when staff move out
- Room status automatically updates to "Cleaning" when vacated
- Room status updates to "available" when assignment is removed

### Maintenance

#### Creating Maintenance Requests
1. Go to "Accommodation" → "Maintenance"
2. Click "New Request"
3. Enter details:
   - **Room**: Select room
   - **Type**: Repair, Cleaning, Inspection, Renovation, Pest Control, Electrical, Plumbing, HVAC
   - **Priority**: Low, Medium, High, Urgent
   - **Description**: Issue details
   - **Scheduled Date**: When maintenance should occur
   - **Assigned To**: Staff or vendor name
4. Save request

#### Tracking Maintenance
- View all pending and completed requests
- Filter by priority, status, or room
- Room status automatically set to "Maintenance" when request created
- Mark requests as completed when done
- Room status returns to previous state when maintenance completed

---

## Promotions

### Overview
Track career progression, manage promotion workflows, and monitor salary increases.

### Access
Go to **HR Management** → **Promotions**

### Career Progression

#### 8 Career Levels
- **Entry Level**: New hires, trainees
- **Staff**: Junior employees
- **Senior**: Experienced individual contributors
- **Lead/Principal**: Technical experts, team leads
- **Manager**: Department managers
- **Director**: Senior leadership
- **VP**: Vice President level
- **Executive**: C-suite, top executives

### Managing Promotions

#### Creating a Promotion
1. Click "New Promotion"
2. Select employee
3. Enter promotion details:
   - **Current Level**: Auto-populated
   - **New Level**: Select new career level
   - **Current Position**: Auto-populated
   - **New Position**: New job title
   - **Effective Date**: When promotion takes effect
   - **Previous Salary**: Current salary (for HR/GM)
   - **New Salary**: Updated salary (for HR/GM)
4. Add reason for promotion
5. Submit for approval

#### Promotion Workflow
- **Pending**: Awaiting approval
- **Approved**: Promotion confirmed
- **Rejected**: With reason provided
- **Effective**: Active from specified date

### Eligible Candidates
- View staff eligible for promotion based on:
  - Years of service (2+ years typically)
  - No recent promotion
  - Performance ratings

### Analytics
- Total promotions count
- Average salary increase
- Promotions by department
- Level distribution across company

---

## Employee Engagement

### Overview
Run surveys, manage recognition programs, and track employee satisfaction.

### Access
Go to **HR Management** → **Engagement**

### Surveys

#### Creating Surveys
1. Go to "Engagement" → "Surveys" tab
2. Click "Create Survey"
3. Choose template:
   - **eNPS**: Employee Net Promoter Score
   - **Pulse Check**: Quick monthly check-in
   - **Full Engagement**: Comprehensive survey
4. Configure:
   - **Title**: Survey name
   - **Anonymous**: Enable for honest feedback
   - **Questions**: Add/edit questions
   - **Expiry Date**: Response deadline
5. Publish survey

#### Survey Templates
- **eNPS**: "How likely are you to recommend this company?" (1-10 scale)
- **Pulse**: Work satisfaction, stress levels, manager support
- **Full Engagement**: Career development, compensation, culture, work-life balance

#### Question Types
- Rating scales (1-5, 1-10)
- Multiple choice
- Open text responses
- Yes/No questions

### Recognition Wall

#### Giving Kudos
1. Go to "Engagement" → "Recognition"
2. Click "Give Kudos"
3. Select:
   - **Employee**: Colleague to recognize
   - **Badge Type**: Excellence, Teamwork, Innovation, Dedication, Leadership
   - **Message**: Why you're recognizing them
4. Submit

#### Badge Types
- 🏆 **Excellence**: Outstanding performance
- 🤝 **Teamwork**: Great collaboration
- 💡 **Innovation**: Creative solutions
- ⭐ **Dedication**: Going above and beyond
- 👑 **Leadership**: Leading by example

### Suggestions Box
- Employees can submit anonymous suggestions
- HR can review and respond
- Track implementation status

### Analytics
- **Engagement Score**: Overall company engagement
- **eNPS**: Promoter vs Detractor ratio
- **Participation Rates**: Survey completion
- **Recognition Activity**: Kudos given/received

---

## HR Operations

### Overview
Manage disciplinary actions, grievances, and exit processes.

### Access
Go to **HR Management** → **Operations**

### Disciplinary

#### Recording Actions
1. Go to "Operations" → "Disciplinary" tab
2. Click "Record Action"
3. Enter details:
   - **Employee**: Staff member
   - **Type**: Verbal Warning, Written Warning, Final Warning, Suspension, Termination
   - **Incident Date**: When incident occurred
   - **Description**: What happened
   - **Action Taken**: Consequences applied
4. Save record

#### Workflow
- Actions recorded by HR/GM
- Employee notified
- Can be appealed through grievance process
- History maintained for future reference

### Grievances

#### Submitting Grievances
1. Employees: Go to "Self-Service" → "Submit Grievance"
2. HR: Go to "Operations" → "Grievances"
3. Enter:
   - **Type**: Harassment, Discrimination, Pay Issues, Management, Other
   - **Description**: Detailed explanation
   - **Anonymous**: Optional for employee submissions
4. Submit

#### Managing Grievances
- Track status: Pending, Under Review, Resolved, Escalated
- Assign to HR investigator
- Document findings and resolution
- Maintain confidentiality

### Exit Management

#### Recording Exits
1. Go to "Operations" → "Exit Management"
2. Click "Record Exit"
3. Enter:
   - **Employee**: Departing staff
   - **Exit Type**: Resignation, Termination, Retirement, End of Contract, Transfer
   - **Last Working Day**: Final date
   - **Reason**: Why they're leaving
   - **Clearance Status**: Pending, In Progress, Completed
4. Save

#### Voice Exit Interview
- Optional voice recording for exit interviews
- Browser records and transcribes answers
- Questions include:
  - Why are you leaving?
  - What did you like most/least?
  - How was your manager relationship?
  - What could we improve?
- Save transcript with exit record

#### Clearance Workflow
1. **HR Clearance**: Documents, equipment return
2. **IT Clearance**: Accounts, devices
3. **Finance Clearance**: Loans, advances
4. **Admin Clearance**: Access cards, keys

---

## Notifications & Alerts

### Viewing Notifications
1. Click the "Notifications" bell icon in sidebar
2. See all unread notifications
3. Click to view details

### Alert Types
- **🔴 Expired**: Document has expired - immediate action needed
- **🟠 Critical**: Expires in < 30 days
- **🟡 Warning**: Expires in 30-60 days
- **🔵 Notice**: Expires in 60-90 days

### Managing Notifications
- Mark as read
- Delete old notifications
- Filter by type

---

## Settings

### Profile Settings
1. Click your name in top right
2. Select "Profile"
3. Update:
   - Display name
   - Email
   - Password
   - Phone number

### Company Settings (Admin Only)
1. Go to "Settings"
2. Update company information:
   - Company name
   - Logo
   - Address
   - Contact details

### User Management (Role-Based Access)

User creation and management follows the role hierarchy:

**Access by Role:**
- **Superadmin**: Can create all roles including GM, HRM, Dept Head, Supervisor, Staff
- **GM**: Can create HRM, Dept Head, Supervisor, Staff
- **HRM**: Can create Dept Head, Supervisor, Staff  
- **Department Head**: Can create Supervisor and Staff
- **Supervisor**: Can create Staff only
- **Staff**: No user creation access

**How to Create a User:**
1. Go to "Administration" → "User Management"
2. Click "Add User" button (only visible if you have creation rights)
3. Enter required information:
   - **Full Name**: User's display name
   - **Email**: Valid email address for login
   - **Password**: Minimum 6 characters
   - **Confirm Password**: Re-enter to verify
   - **Role**: Select from available roles (filtered by your permissions)
   - **Department** (Required for Dept Head, Supervisor, Staff): Assign department to restrict data visibility
4. **Feature Permissions**: Toggle features on/off (pre-configured based on role, but customizable)
5. Click "Create User"

**Department Assignment:**
- **Dept Head, Supervisor, Staff**: Must be assigned to a specific department
- **Department determines data visibility** - these users only see their department's data
- **Available Departments**: Engineering, HR, Finance, Marketing, Operations, Sales, IT, Admin
- **HRM and GM**: No department assigned (see all departments in their company)

**Managing Existing Users:**
- Users are grouped by role in collapsible sections
- You can only edit/delete users at levels below your role
- Email addresses cannot be changed after creation
- Status can be set to: Active, Inactive, or Suspended

**Feature Permissions:**
When creating a user, you can customize their access to specific features:
- **Companies**: View/Create/Edit/Delete
- **Employees**: View/Create/Edit/Delete
- **Salary Information**: View/Edit
- **Payroll**: View/Run
- **Recruitment**: View/Create/Edit/Delete
- **Documents**: View/Create/Edit/Delete
- **Leave Management**: View/Apply/Approve
- **Reports**: View/Export
- **Settings**: View/Edit
- **User Management**: View/Create/Edit/Delete

Each role has default permissions that are pre-selected, but Superadmin can customize these before creating the user.

---

## Companies Management (Superadmin Only)

### Creating a New Company
1. Go to "Administration" → "Companies"
2. Click "Add Company"
3. Enter company details:
   - **Company Name**: Full legal name
   - **Company Code**: Unique identifier (e.g., ABC001)
   - **Registration Number**: Business registration number
   - **Tax ID**: Tax identification number
   - **Address**: Full company address
   - **Contact Info**: Phone, email, website
   - **Industry**: Business sector
4. **Upload Company Logo**: Used in navigation and headers
5. **Upload Letterhead**: Used on all official forms (REQUIRED)
   - This appears on payslips, offer letters, contracts, etc.
   - Recommended: 1200x400 pixels, PNG or JPG
6. Click "Create Company"

### Managing Letterhead
The company letterhead automatically appears on:
- Payslips and payroll forms
- Offer letters
- Employment contracts
- Job descriptions
- Leave forms
- Disciplinary letters
- Promotion letters

To update letterhead:
1. Go to "Companies" → Select company
2. Click "Edit"
3. Upload new letterhead image
4. Save changes

---

## Position Quotas (HRM/GM)

### Understanding Position Quotas
Position quotas help track staffing levels across departments:
- **Total Quota**: Maximum positions allocated
- **Filled**: Currently occupied positions (auto-calculated)
- **Remaining**: Available positions for hiring
- **Status**: Active, Frozen, or Closed

### Setting Up Position Quotas
1. Go to "Management" → "Position Quotas"
2. Click "Add Quota"
3. Enter details:
   - **Department**: Select from list
   - **Position Title**: Job title
   - **Total Quota**: Number of positions allowed
   - **Employment Type**: Full-time, Part-time, Contract, etc.
   - **Salary Range**: Min-Max salary for position
4. Save quota

### Monitoring Quota Usage
The dashboard shows:
- Total positions across all departments
- Filled vs Vacant positions
- Over-quota alerts (when filled > quota)
- Department-wise breakdown

**Alerts:**
- 🟢 Green: Positions available
- 🟡 Yellow: 80% or more filled
- 🔴 Red: Over quota or fully utilized

---

## Job Description Generator

### Creating Job Descriptions
1. Go to "Management" → "Job Descriptions" (or via Form Templates)
2. Choose mode:
   - **Select Employee**: Auto-populate from employee data
   - **Custom JD**: Create from scratch
3. Fill in job details:
   - Job Title, Department, Reports To
   - Employment Type, Location
   - Job Summary
   - Key Responsibilities (add/remove as needed)
   - Requirements/Qualifications
   - Salary Range, Benefits
4. Preview the JD
5. Print to PDF with company letterhead

### Templates Available
The system includes templates for common positions:
- Software Engineer
- HR Manager
- Sales Manager
- Finance Manager
- Generic template (default)

---

## Contracts & Offer Letters

### Generating Offer Letters
1. Go to "Management" → "Contracts & Letters"
2. Select "Offer Letter" type
3. Choose employee (or fill manually)
4. Complete details:
   - Position, Department, Start Date
   - Salary, Benefits, Probation Period
   - Working Hours, Location
   - Reporting Manager
   - Special clauses (if any)
5. Preview and print with letterhead

### Creating Employment Contracts
1. Select "Employment Contract" type
2. Fill employee and position details
3. Add contract terms:
   - Contract duration (Permanent/Fixed-term)
   - Notice period
   - Probation details
   - Termination clauses
   - Special conditions
4. Generate contract with letterhead
5. Print for signature

### Contract Types Available
- **Offer Letter**: Initial employment offer
- **Employment Contract**: Full contract with terms
- **Probation Contract**: Probationary period specifics
- **Contract Renewal**: Extension of existing contract

---

## Form Templates Hub (GM/HRM)

### Accessing Form Templates
1. Go to "HR Management" → "Form Templates"
2. Browse categories:
   - HR Documents (JD, Offer Letters, Contracts)
   - Payroll & Benefits (Payslips, Approvals)
   - Leave & Attendance (Application Forms)
   - Disciplinary (Warning Letters)
   - Promotions (Increment Letters)

### Using Templates
1. Click on any template category
2. Select specific form type
3. System auto-generates with:
   - Company letterhead
   - Pre-filled templates
   - Professional formatting
4. Customize content as needed
5. Print to PDF

**Note**: Form Templates are only accessible to GM and HRM roles.

---

## Troubleshooting

### Cannot Login
- Check email/password
- Ensure account is active
- Contact HR if account locked

### Documents Not Showing
- Refresh page (Ctrl+F5)
- Check internet connection
- Verify document permissions

### Leave Application Errors
- Ensure all required fields filled
- Check date format (YYYY-MM-DD)
- End date must be after start date

### Notification Issues
- Enable browser notifications
- Check notification settings in profile
- Clear browser cache

### Page Not Loading
- Check internet connection
- Try different browser
- Clear browser cache
- Contact IT support

---

## Tips & Best Practices

### For Employees
1. Apply for leave at least 2 weeks in advance
2. Keep contact information updated
3. Upload clear document scans
4. Check expiry dates regularly

### For HR Managers
1. Process leave applications within 3 days
2. Update transport status promptly
3. Monitor document expiries weekly
4. Keep employee records current

### Data Entry
1. Use correct date format
2. Enter complete information
3. Upload high-quality documents
4. Double-check before saving

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Global Search |
| Ctrl+Home | Go to Dashboard |
| Ctrl+R | Refresh Page |
| Escape | Close Modal |

---

## Contact & Support

For technical support or inquiries, please contact:

**Hawaain Pvt Ltd**  
📧 Email: retey.ay@hotmail.com  
📱 Viber/WhatsApp: +960 9795572  

---

## Contact & Support (Legacy)

### Technical Support
- Email: support@hawaainhr.com
- Hours: Sunday - Thursday, 8:00 AM - 5:00 PM (Maldives Time)

### HR Department
For account issues, password resets, and access requests

**Q: How do I download my payslip?**
A: Go to "Self-Service" → "Payslips", select the month/year, and click "Download PDF".

**Q: How do I update my profile information?**
A: Go to "Self-Service" → "Update Profile" to edit your contact details, address, and emergency contacts.

**Q: How do I request a certificate (NOC/Experience letter)?**
A: Go to "Self-Service" → "Request Certificates", select certificate type, fill details, and submit. Track status in "My Requests".

**Q: How do I check in/out for attendance?**
A: Go to "Self-Service" → "My Attendance" and click "Check In" when you start work and "Check Out" when leaving.

**Q: How can HR post a new job opening?**
A: Go to "Management" → "Recruitment" → "New Job Posting", fill in position details, and publish.

**Q: How do I track a candidate through the hiring pipeline?**
A: In "Recruitment" → "Candidates", drag candidates through stages: New → Screening → Interview → Offer → Hired.

**Q: How do I start a performance review?**
A: Go to "Management" → "Performance" → "Start Review", select review type (Annual/Quarterly), assign reviewer and due date.

**Q: How is overtime calculated?**
A: Overtime is calculated at 1.5x for weekdays, 2x for weekends, and 2.5x for public holidays. View in "Attendance" → "Overtime Report".

**Q: How do I schedule training for employees?**
A: Go to "Management" → "Training" → "Schedule Training", select training type, date, and assign participants.

**Q: How do I track employee certifications?**
A: Go to "Management" → "Training" → "Certifications" to view expiry dates and get alerts before expiration.

**Q: How do I process monthly payroll?**
A: Go to "Management" → "Payroll", select month/year, review calculations, and click "Process Payroll" to generate payslips.

**Q: How do I add a manpower budget entry?**
A: Go to "Budget" → "Manpower Budget", click "Add Employee Budget", fill in salary and allowance details, then save.

**Q: How do I export the manpower budget?**
A: In the Manpower Budget page, click "Export CSV" to download the complete budget data for reporting.

**Q: What are smart checks in the budget module?**
A: Smart checks automatically detect duplicate employees, zero salaries, and high earners (>50,000 MVR) to ensure data quality.

**Q: How do I calculate end of service benefits?**
A: Access employee profile → "Calculate End of Service" to view gratuity and generate final settlement.

**Q: How do I view the organization chart?**
A: Go to "Management" → "Org Structure" to see the visual hierarchy and reporting lines.

**Q: How do I track compliance status?**
A: Go to "Management" → "Compliance" to view the compliance score and track 8 key compliance areas.

**Q: How do I generate HR analytics reports?**
A: Go to "Management" → "HR Analytics", select report type (Headcount, Turnover, etc.), apply filters, and export.

**Q: How do I submit a grievance?**
A: Go to "Self-Service" → "Submit Grievance", select type, describe the issue. It can be anonymous.

**Q: How do I recognize a colleague?**
A: Go to "Engagement" → "Recognition", select employee, choose award type, and add a message.

**Q: How do I participate in a survey?**
A: Access from dashboard notifications or go to "Engagement" → "Surveys" to complete pulse checks.

**Q: How do I handle disciplinary actions?**
A: Go to "Management" → "Operations" → "Disciplinary", select employee, action type, and document the incident.

**Q: How do I manage exit/offboarding?**
A: Go to "Management" → "Operations" → "Exit Management", initiate clearance workflow with HR, IT, Finance, Admin checklists.

**Q: How do I access self-service features?**
A: All employees can access "Self-Service" from the sidebar to manage their profile, payslips, attendance, and requests.

---

## Performance Reviews (HRM/GM/Dept Heads)

### Starting a Performance Review
1. Go to "HR Management" → "Performance Reviews"
2. Click "New Review"
3. Select employee and review cycle (Annual/Semi-Annual/Quarterly)
4. Set review period dates
5. Define goals and competencies
6. Assign reviewers (Manager, Peers)

### Review Workflow
- **Draft** - Review being prepared
- **Self Review** - Employee completes self-assessment
- **Manager Review** - Manager evaluates and rates
- **Peer Review** - Peers provide feedback
- **HR Review** - HR validates and processes
- **Completed** - Final rating determined
- **Action Plan** - Development plan created

### Rating Scale
- **5** - Exceptional (Exceeds all expectations)
- **4** - Exceeds Expectations
- **3** - Meets Expectations
- **2** - Needs Improvement
- **1** - Unsatisfactory

---

## Attendance & Time Tracking

### Recording Attendance
1. Go to "Leave & Time" → "Attendance"
2. For check-in: Click "Check In" when starting work
3. For check-out: Click "Check Out" when leaving
4. View daily/weekly attendance records

### Tracking Overtime
- Overtime calculated automatically from check-out time
- Standard working hours: 8 hours/day
- Rates: 1.5x (weekday), 2x (weekend), 2.5x (holiday)
- Requires manager approval for payment

### Monthly Reports
1. Select month from dropdown
2. View summary statistics
3. Export to CSV if needed

---

## Expense Claims

### Submitting an Expense Claim
1. Go to "HR Management" → "Expense Claims"
2. Click "New Claim"
3. Select category (Travel, Meals, Office, etc.)
4. Enter amount and currency
5. Add description and upload receipt
6. Submit for approval

### Approval Workflow
- **Submitted** → HOD Review → Finance Review → Approved → Reimbursed
- Track status in "My Claims" tab
- Receive notifications at each stage

### Categories Available
- Travel & Transportation
- Meals & Entertainment
- Office Supplies
- Training & Development
- Medical Expenses
- Communication
- Accommodation
- Fuel & Mileage

---

## Employee Self-Service Portal

### Accessing Your Portal
1. Go to "Self Service" → "My Self Service"
2. View dashboard with:
   - Leave balances
   - Recent payslips
   - Pending approvals
   - Document alerts

### Available Actions
- View/download payslips
- Check leave history
- Monitor attendance
- Read company announcements
- Access quick links (Apply Leave, Submit Expense)

---

## HR Analytics Dashboard (HRM/GM)

### Viewing Analytics
1. Go to "Compliance & Reports" → "HR Analytics"
2. Select time range (1 month to 1 year)
3. View various metrics:
   - Headcount trends
   - Department distribution
   - Turnover rates
   - Leave patterns
   - Performance distribution
   - Recruitment pipeline

### Exporting Reports
1. Apply desired filters
2. Click "Export" to download CSV
3. Use data for presentations/decisions

---

## Employee Directory

### Finding Colleagues
1. Go to "People" → "Employee Directory"
2. Switch between views:
   - **Org Chart** - Visual hierarchy
   - **List View** - Sortable table
   - **Grid View** - Photo cards
3. Use search to find by name/position
4. Filter by department

### Viewing Contact Info
- Click any employee card
- View email, phone, location
- See reporting structure

---

## Company Announcements & Policies

### Reading Announcements
1. Go to "Self Service" → "Announcements"
2. View by category:
   - General
   - HR & People
   - Finance
   - Operations
   - Emergency
3. Mark as read
4. Acknowledge if required

### Accessing Policies
1. Switch to "Policies" tab
2. Browse policy categories:
   - Employee Handbook
   - Leave Policy
   - Code of Conduct
   - IT Policy
   - Health & Safety
3. Read and acknowledge policies

---

## Shift Management (HRM/GM)

### Creating Shift Schedules
1. Go to "Leave & Time" → "Shift Management"
2. Select week from calendar
3. Click "Assign Shift" for each employee
4. Choose shift type for each day
5. Save schedule

### Shift Types
- Morning (06:00-14:00)
- Day (09:00-17:00)
- Evening (14:00-22:00)
- Night (22:00-06:00)
- Weekend (09:00-17:00)

### Shift Swaps
1. Employees can request swaps
2. Requires manager approval
3. System checks for coverage gaps

---

## FAQ

**Q: How do I check my leave balance?**
A: Go to Leave Planner → My Leaves. Your balance card shows remaining days for each leave type.

**Q: Can I apply for half-day leave?**
A: Yes! Select "Half Day" as leave type and choose Morning (AM) or Afternoon (PM).

**Q: Why was my leave rejected?**
A: Common reasons: insufficient balance, missing documents, understaffing, or policy violations. Check the rejection reason in your leave details.

**Q: How do I upload a medical certificate?**
A: Open your leave application → Documents section → Upload Document → Select "Medical Certificate" → Choose file.

**Q: Can I see my team's leave calendar?**
A: Yes, HR and managers can view Team Calendar with department filter to see who's on leave.

**Q: How long does approval take?**
A: Depends on leave length:
- 1-3 days: Supervisor only (1-2 days)
- 4-7 days: Supervisor + Dept Head (2-3 days)
- 8-14 days: + HR Review (3-4 days)
- 15+ days: + GM Approval (4-5 days)

**Q: What is the 4-level approval system?**
A: Company hierarchy: Supervisor → Department Head → HR → GM. Each level checks different aspects: availability, resources, compliance, and strategy.

**Q: Who is my supervisor?**
A: Check with your department or HR. Your direct manager/supervisor is Level 1 approver.

**Q: Can I escalate my leave if urgent?**
A: Emergency leave type has fast-track option. Contact HR for urgent escalations.

**Q: What is compensatory leave?**
A: Overtime hours converted to leave days. Check your compensatory balance in Leave Planner.

**Q: Can I edit my leave application after submission?**
A: Yes, if it's still in "Pending" status. Go to Leave Planner → Find your application → Click Edit.

**Q: How do I know if my leave is approved?**
A: You'll see a ✅ status and receive a notification. Check Leave Planner for updates.

**Q: Can I cancel my leave after approval?**
A: Contact your HR manager. Approved leaves can only be cancelled by HR.

**Q: What file formats are supported for document upload?**
A: PDF, JPG, PNG. Maximum file size: 10MB.

**Q: How do I reset my password?**
A: Click "Forgot Password" on login page or contact HR.

**Q: Can I access the system on mobile?**
A: Yes, the web app is mobile-responsive. Use your phone's browser.

**Q: Who can create new users?**
A: Depends on your role. Superadmin can create all roles. GM can create HRM and below. HRM can create Department Heads and below. Department Heads can create Supervisors and Staff. Supervisors can only create Staff.

**Q: Why can't I see the "Add User" button?**
A: Only users with user creation permissions can see this button. Staff cannot create users. If you're a Supervisor or above but don't see it, check with your administrator.

**Q: Can I change a user's role after creation?**
A: Only if you have permission to manage that role. You can only assign roles below your level. For example, an HRM can change a user to Department Head, Supervisor, or Staff, but not to GM.

**Q: Who can create companies?**
A: Only Superadmin can create and manage companies. This is exclusive to Superadmin and cannot be delegated to other roles.

**Q: I need to create a user with a higher role than I currently have. What should I do?**
A: Contact your manager or someone with a higher role in the hierarchy. For example, if you're a Supervisor and need to create another Supervisor, ask your Department Head or HRM.

**Q: How do I become a Superadmin?**
A: Superadmin roles are assigned during initial system setup by the system owner. Contact your system administrator if you need Superadmin access.

**Q: What is the difference between GM and HRM roles?**
A: GM (General Manager) is higher in the hierarchy and can create HRMs. GM has access to financial data and salary information. HRM focuses on HR operations like payroll, recruitment, and employee management.

---

**Current Version:** 2.1.0
**Last Updated:** April 2026

For detailed technical changes, see [CHANGELOG.md](./CHANGELOG.md)

---

**© 2026 Hawaain HR Systems. All rights reserved.**
