# Hawaain HR Pro

## Full-Stack HR & Expatriate Management System

A comprehensive HR management system with expatriate compliance tracking, document management, **leave planner with transportation booking**, renewal workflows, and real-time alerts.

---

## 🚀 Features

### Core HR Management
- **Employee Management**: Add, edit, view employee profiles with modern colorful UI
- **Role-based Access**: Superadmin/Admin/HR/GM/Staff with granular permissions
  - **HR & GM**: Access to salary sections, payroll, and sensitive employee data
  - **Staff**: Limited access to own profile and documents only
- **Document Storage**: Firebase Storage integration
- **Modern UI/UX**: Gradient headers, colorful cards, glass-morphism effects

### 🌴 Leave Planner (Comprehensive v2.1)
- **Leave Applications**: 10+ leave types including Annual, Sick, Emergency, Half-Day, Hourly, Compensatory, Study, Maternity, Paternity, Unpaid
- **Leave Import**: Bulk import leave data from JSON files (Excel converted)
- **Leave Quota Management**: Track balances per employee per year with auto-calculation
- **Smart Employee Search**: Type-to-search dropdown for selecting employees
- **Transportation Booking**: Air, Sea, Land transport options
- **4-Level Approval Workflow**: Supervisor → Dept Head → HR → GM approval chain
- **Inline Approve/Reject**: One-click approve/reject buttons for HR users
- **Enhanced Columns**: Department, Designation, Section displayed in leave list
- **Status Tracking**: 
  - 📋 Quotation Received
  - 🎫 Tickets Purchased
  - ✈️ Departed
  - 📍 Arrived
- **Emergency Contacts**: Track emergency contact information
- **Calendar View**: Visual monthly calendar showing all leaves
- **Team Calendar**: Department-filtered calendar with overlap warnings
- **Export to CSV/Excel**: Export leave data for reporting
- **Print View**: Professional printable leave application form
- **Offline Mode**: Auto-save drafts to localStorage when Firebase quota exceeded
- **Document Upload**: Medical certificates, tickets with HR verification
- **Email Notifications**: Automatic emails for approvals, rejections, reminders
- **Leave Balance Dashboard**: Real-time view of remaining days by type

### 📋 Recruitment & ATS (Enhanced v1.4)
- **Job Postings Management**: Create, publish, and close job openings with salary ranges
- **Applicant Tracking System (ATS)**: Full pipeline from Application to Hired
- **Candidate Pipeline Stages**: Applied → Screening → Interview → Assessment → Offer → Hired/Rejected
- **Source Tracking**: Track candidate sources (Direct, Referral, LinkedIn, Indeed, Job Board, Agency)
- **Candidate Rating**: 5-star rating system for evaluations
- **Resume Database**: Store candidate information and contact details
- **Real-time Pipeline**: Visual pipeline with candidate counts per stage
- **Job Management**: Close job postings when positions filled

### 🎯 Performance Management
- **Performance Reviews**: Annual, quarterly, and probation reviews
- **KPI/Goal Setting**: Set and track employee objectives (SMART, OKRs)
- **360-Degree Feedback**: Peer, manager, self, and direct report feedback
- **Competency Framework**: Technical, behavioral, and business competencies
- **Performance Improvement Plans (PIP)**: Track underperformance cases
- **Rating Scale**: 5-point scale with detailed descriptions
- **One-on-One Meeting Notes**: Record manager-employee discussions

### 🎓 Training & Development
- **Training Calendar**: Schedule and manage training sessions
- **Certification Tracking**: Monitor employee certifications and expiry
- **Skills Matrix**: Department skill gap analysis
- **Learning Management**: Course enrollment and progress tracking
- **Training Cost Calculator**: Calculate per-participant costs
- **Certification Expiry Alerts**: Warn before certifications expire

### 💰 Payroll Management (Enhanced v1.4) - HR/GM Only
- **Monthly Payroll Run**: Process payroll for all active employees
- **Salary Components**: Basic, Housing Allowance, Transport Allowance, Other Allowances
- **Deductions**: Tax, Pension, Loan Repayment, Other Deductions
- **Payslip Generation**: Professional payslip with earnings & deductions breakdown
- **Payslip Viewer**: Detailed view with download capability
- **Bank Information**: Track employee bank details (Bank Name, Account, IBAN)
- **Payroll Summary**: Total Gross, Deductions, Net Pay calculations
- **Employee Salary Profiles**: Store salary data in employee records (HR/GM access only)

### ⏰ Attendance & Time Tracking
- **Biometric Integration Ready**: Connect with fingerprint/RFID systems
- **Timesheet Management**: Daily time entry and approval
- **Shift Scheduling**: Create and manage work shifts
- **Work Pattern Management**: 5-day, 6-day, rotating shifts
- **Late/Absence Tracking**: Monitor punctuality
- **Work From Home Tracking**: Remote work logging
- **Overtime Calculation**: Automatic OT calculations

### 💝 Employee Engagement (Enhanced v2.0)
- **Pulse Surveys** - Quick engagement questionnaires with analytics
- **eNPS Scoring** - Employee Net Promoter Score calculation
- **Kudos & Recognition** - Peer-to-peer recognition with points system
- **Recognition Categories** - Teamwork, Innovation, Excellence, Leadership, Customer Focus
- **Points System** - Gamified recognition with redeemable points
- **Suggestion Box** - Anonymous feedback with voting system
- **Survey Analytics** - Response tracking and reporting dashboard
- **Event Management** - Company events and team building
- **Anniversary Alerts** - Work anniversary notifications
- **Birthday Alerts** - Birthday notifications

### ⏰ Time & Attendance (Advanced v2.0)
- **GPS-based Clock-in/out** - Location tracking with address recording
- **Biometric Integration Ready** - Support for fingerprint/face recognition
- **Shift Management** - Morning, Day, Evening, Night, Rotating shifts
- **Shift Swapping** - Employee-to-employee exchange with manager approval
- **Overtime Management** - Automatic calculation with 1.5x, 2x rates
- **Working Hours Calculation** - Automatic daily totals
- **Attendance History** - 30-day rolling view with status tracking
- **Late/Absence Tracking** - Monitor punctuality
- **Work From Home Tracking** - Remote work logging
- **Timesheet Approval** - Manager approval workflow

### 💰 Benefits & Payroll Management (v2.0)
- **Benefit Programs** - Health, Dental, Vision, Life, Retirement plans
- **Employee Enrollment** - Self-service benefit selection
- **Contribution Tracking** - Employer vs Employee split tracking
- **Salary Advances** - Request and approval workflow with repayment tracking
- **Benefit Cost Analytics** - Total cost breakdown by program
- **Provider Management** - Insurance and benefit providers
- **Eligibility Rules** - Service period and employee type requirements

### 📊 Manpower Budget (NEW v2.1)
- **Budget Planning** - Annual manpower budget allocation by company/department
- **Employee Budget Entries** - Track individual employee salary projections
- **Smart Checks** - Auto-detect duplicates, zero salaries, high earners
- **Allowance Management** - Food, transport, phone, and other allowances
- **CSV Export** - Export budget data for reporting
- **Multi-company Support** - Separate budgets per company
- **Budget Analytics** - Total budget, employee count, average salary metrics
- **CRUD Operations** - Add, edit, delete budget entries with Firebase sync

### 🔐 Compliance & Legal (v2.0)
- **Audit Trail** - Complete action history with 30-day retention
- **GDPR Compliance** - Data subject request management (Access, Rectification, Erasure, Portability, Restriction)
- **30-Day Deadline Tracking** - Automatic GDPR request deadline monitoring
- **Document Templates** - Contract, Offer Letter, Warning Letter generators
- **Template Placeholders** - Dynamic field replacement
- **Document Generation** - HTML/PDF output with company letterhead
- **Compliance Score** - Overall compliance health metric
- **Labor Law Compliance** - 8 key compliance areas tracking

### 📊 HR Analytics Dashboard (Advanced v2.0)
- **Retention Risk Analysis** - AI-powered turnover prediction
- **Risk Scoring** - 0-100 risk score per employee
- **Risk Factors** - Absence rate, Recognition gap, Tenure, Salary stagnation
- **Risk Levels** - Critical, High, Medium, Low categorization
- **Recommended Actions** - AI-suggested retention strategies
- **Diversity Metrics** - Gender, Age, Ethnicity, Disability tracking
- **Demographics Dashboard** - Visual breakdowns with charts
- **Custom Reports** - User-defined analytics reports
- **Report Scheduling** - Automated report generation
- **Export Capability** - CSV, Excel, PDF exports

### 🔌 Integrations Hub (v2.0)
- **Calendar Sync** - Google Calendar & Microsoft Outlook integration
- **Two-way Sync** - Events sync in both directions
- **Slack Notifications** - Real-time HR event notifications
- **Notification Events** - Leave requests, Expense claims, New hires, Birthdays
- **Job Board Posting** - LinkedIn, Indeed, Glassdoor integration
- **Accounting Integration** - QuickBooks & Xero sync
- **Webhook Support** - Custom integration endpoints
- **Sync Status Dashboard** - Health monitoring for all integrations

### 🏢 Staff Accommodation (v2.1)
- **Room Management**: Add, edit, delete rooms with details (capacity, beds, bathrooms, amenities)
- **Room Import**: Bulk import rooms and assignments from JSON
- **Room Assignments**: Assign employees to rooms with check-in/out tracking
- **New Assignment Button**: Create new room assignments from the assignments tab
- **Occupancy Tracking**: Real-time occupancy status (available, occupied, maintenance)
- **Maintenance Requests**: Create and track room maintenance tasks
- **Room Status Dashboard**: Visual stats (total, available, occupied, maintenance)
- **Amenities Management**: Track room features (AC, WiFi, TV, Kitchen, etc.)
- **Building/Wing Support**: Organize rooms by building and wing/block

### 🏢 HR Operations
- **Disciplinary Actions** - Warning letters, incident tracking
- **Grievance Management** - Employee complaint handling
- **Exit Management** - Resignation workflow, clearance forms
- **Exit Checklist** - HR, IT, Finance, Admin, Manager tasks
- **No Objection Certificate (NOC)** - Track and issue NOCs
- **Reference Letter Generator** - Auto-generate employment certificates

### 👤 Employee Self-Service
- **Profile Self-Update**: Employees update their own info
- **Payslip Download**: Access and download payslips (view-only for employees)
- **Leave Balance View**: Check leave quotas
- **Document Upload**: Upload personal documents
- **Request Forms**: Certificate requests, address changes
- **Request Tracking**: Track pending requests

**Note**: Salary information is only visible to HR and GM roles. Employees can view their own payslips but not salary breakdowns of others.

### Expatriate Compliance System
- **Passport Tracking**: Issue/expiry dates, country, number
- **Visa Tracking**: Type, number, entry type, status
- **Work Permit Tracking**: Employer, position, permit number
- **Medical Records**: Test dates, results, expiry tracking

### Alert System
- **Expiry Alerts**: 90, 60, 30 days warnings
- **Expired Documents**: Real-time expired status
- **Dashboard Widgets**: Visual expiry counters with gradient cards
- **Color Coding**: Green (Valid), Yellow (Warning), Red (Expired)

### Renewal Workflow
- **5-Step Process**: Alert → HR Notify → Start Renewal → Upload → Update
- **Status Tracking**: Pending, In Progress, Completed
- **Progress Visualization**: Step-by-step tracking

### Mobile App
- **React Native + Expo**: Cross-platform mobile access
- **Document Viewing**: View employee documents
- **Push Notifications**: Alert updates
- **Camera Upload**: Direct document capture

---

## 📁 Project Structure

```
Hawaain_HR_Pro/
├── web/                    # React Web Application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Auth & Notification contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Helper functions
│   │   ├── firebase/      # Firebase config
│   │   ├── App.jsx        # Main application
│   │   └── index.css      # Tailwind styles
│   ├── package.json
│   └── vite.config.js
│
├── mobile/                # React Native Mobile App
│   ├── src/
│   │   ├── screens/       # Mobile screens
│   │   ├── contexts/      # Auth context
│   │   └── utils/         # Helper functions
│   ├── App.js             # Mobile app entry
│   └── firebase.js        # Firebase config
│
└── README.md
```

---

## 🛠️ Tech Stack

### Web
- **React 18** (Vite)
- **Tailwind CSS**
- **React Router DOM**
- **Lucide React** (Icons)
- **date-fns** (Date handling)
- **Recharts** (Charts and graphs)
- **React Context** (State management)
- **localStorage** (Offline data persistence)

### Mobile
- **React Native**
- **Expo**
- **React Navigation**
- **Expo Image Picker**

### Backend
- **Firebase Authentication**
- **Cloud Firestore**
- **Firebase Storage**

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account (free tier)

### Web Application

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Configure Firebase
# Edit src/firebase/config.js with your Firebase credentials

# Start development server
npm run dev
```

### Mobile Application

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Configure Firebase
# Edit firebase.js with your Firebase credentials

# Start Expo
npx expo start

# Scan QR code with Expo Go app on your phone
# Or press 'a' for Android emulator
# Or press 'i' for iOS simulator (Mac only)
```

---

## 🔥 Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Enable Authentication, Firestore, and Storage

| Role | Can Create | Access Level |
|------|------------|--------------|
| **Superadmin** | GM, HRM, Dept Head, Supervisor, Staff | All companies, full access |
| **GM** | HRM, Dept Head, Supervisor, Staff | Company-wide, financial data |
| **HRM** | Dept Head, Supervisor, Staff | Company-wide, no company creation |
| **Department Head** | Supervisor, Staff | Department only |
| **Supervisor** | Staff | Team only |
| **Staff** | - | Self only |

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts

### Database Collections
- `companies` - Company profiles
- `employees` - Employee records
- `users` - System users with roles
- `divisions` - Company divisions/departments
- `designations` - Job positions
- `leaves` - Leave applications
- `payrolls` - Payroll records
- `rooms` - Accommodation rooms
- `roomAssignments` - Staff room assignments
- `maintenance` - Maintenance requests
- `promotions` - Promotion records
- `surveys` - Engagement surveys
- `recognitions` - Employee recognition
- `disciplinary` - Disciplinary actions
- `grievances` - Employee grievances
- `exits` - Exit management

## Mobile App

A companion mobile app is available for:
- Employee self-service
- Check-in/out
- Leave applications
- Document viewing

## Updates

### Latest (v2.1.0) - April 2026
- **Leave Planner Import** - Bulk import leave data from JSON/Excel files
- **Leave Planner Enhanced UI** - Department, Designation, Section columns added
- **Inline Leave Actions** - Direct approve/reject buttons in leave list for HR
- **Accommodation Module v2** - Room assignment creation, improved edit functionality
- **Operations Module** - Disciplinary actions, grievances, and exit management

### Previous (v2.0.0)
- Company Structure with dynamic divisions/designations
- Accommodation module (rooms, assignments, maintenance)
- Promotions with career progression
- Employee Engagement (surveys, recognition, suggestions)
- HR Operations (disciplinary, grievances, exit with voice interview)
- Enhanced Training module
- Company Structure replaces static department lists

## Troubleshooting

### Common Issues
### Company Switching
- Superadmins can switch between all companies
- Company users see only their assigned company
- Selected company stored in localStorage for persistence

### Firestore Security
- All queries filtered by `companyId` via `useFirestore` hook
- Company context manages current company state
- Automatic fallback to first company for superadmins

### After Deploy / Cached Assets
- If you still see old behavior after pushing to GitHub and deploying, your browser may be using cached assets
- Do a hard refresh: `Ctrl+Shift+R`

---

## 📊 Database Collections

### companies (Multi-tenant structure)
- id (slug format: e.g., "sunisland-resort-and-spa")
- name (e.g., "Sunisland Resort and Spa")
- code (e.g., "SUNISLAND")
- status (active/inactive)
- address, phone, email
- employeeCount
- createdAt, updatedAt
- createdBy (user ID of superadmin)

### users (Company-linked)
- uid (Firebase Auth UID)
- name, email, role (superadmin/company_admin/hr/gm/staff)
- companyId (linked to companies collection)
- companyIds[] (array for multi-company access)
- customPermissions (granular feature permissions)
- createdAt, updatedAt, lastLogin

### employees (Company-scoped)
- All employee fields from Master List (EmpID, FullName, Department, Section, Designation, etc.)
- companyId (linked to companies collection)
- companyName
- status (active/inactive)
- createdAt, updatedAt
- sourceFile (e.g., "Master List.xlsx")

### jobPostings
- title, department, location, type (full-time/part-time/contract)
- description, requirements
- salaryMin, salaryMax
- status (open/closed)
- postedAt, companyId

### candidates
- name, email, phone, resume
- jobId, source (direct/referral/linkedin/etc.)
- stage (applied/screening/interview/assessment/offer/hired/rejected)
- rating (1-5), notes
- appliedAt, hiredAt, companyId

### payrolls
- employeeId, employeeName, month
- basicSalary, housingAllowance, transportAllowance, otherAllowances
- taxDeduction, pensionDeduction, loanDeduction, otherDeductions
- grossSalary, totalDeductions, netSalary
- processedAt, status, companyId

### passports
- employeeId, passportNumber, country
- issueDate, expiryDate, placeOfIssue
- documentUrl, notes, companyId

### visas
- employeeId, visaNumber, visaType
- entryType, issueDate, expiryDate
- documentUrl, notes, companyId

### workPermits
- employeeId, permitNumber, jobPosition
- employer, issueDate, expiryDate
- documentUrl, notes, companyId

### medicals
- employeeId, testDate, expiryDate
- result, testCenter, documentUrl
- companyId

### leaves
- employeeId, leaveType, startDate, endDate
- days, destination, reason
- contactNumber, contactEmail
- transportation (mode, from, to, status)
- emergencyContact (name, relationship, phone)
- status (pending, approved, rejected, cancelled)
- approverId, approverName, approvalComments
- appliedBy, appliedAt, updatedAt
- companyId

### leaveBalances
- employeeId, year
- quotas (annual, sick, emergency, halfDay, hourly, etc.)
- used, remaining, accrued
- updatedAt, companyId

### leavePolicies
- companyId
- quota settings per leave type
- approval workflow configuration
- restrictions and rules
- updatedAt

### notifications
- type, message, userId
- documentType, read, createdAt
- companyId

### manpowerBudgets
- department, section, designation
- actual2026
- requiredManpower: {100_80, 80_65, 65_50, below50}
- companyId, createdAt, createdBy

---

## 🔐 Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['hr', 'admin'];
    }
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['hr', 'admin'];
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🌐 Deployment

### Web (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd web
vercel

# Follow prompts to link project
```

### Auto-Deploy from GitHub (Recommended)

Set up automatic deployments when pushing to GitHub:

**1. Connect GitHub to Vercel:**
1. Go to [vercel.com](https://vercel.com) → Login
2. Click "Add New Project"
3. Import your GitHub repository (`rettey8810-byte/hawaain_hr_pro`)
4. Select framework: `Vite`
5. Configure:
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

**2. vercel.json Configuration (Already in repo):**
```json
{
  "version": 2,
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}],
  "headers": [{
    "source": "/assets/(.*)",
    "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]
  }]
}
```

**3. Deploy on Every Push:**
- Push to `main` branch → Auto-deploys to production
- Push to any branch → Creates preview deployment
- View deployments at: `https://vercel.com/<username>/<project-name>`

**4. Environment Variables (if needed):**
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# etc.
```

### Mobile (Expo)

```bash
cd mobile

# Build for stores
expo build:android
expo build:ios

# Or use EAS Build
expo eas build
```

---

## 📱 Using the Mobile App

1. Install **Expo Go** from App Store/Google Play
2. Run `npx expo start` in mobile directory
3. Scan QR code with Expo Go
4. Login with credentials
5. Access employee data and documents

---

## 🎯 Key Features Summary

✅ **Time & Attendance (v2.0)** - GPS clock-in, shift management, overtime tracking, shift swapping  
✅ **Benefits Management (v2.0)** - Health, dental, vision benefits with enrollment tracking  
✅ **Salary Advances (v2.0)** - Advance requests with approval and repayment tracking  
✅ **Employee Engagement (v2.0)** - Pulse surveys, Kudos recognition, suggestion box with voting  
✅ **Compliance Center (v2.0)** - Audit trail, GDPR requests, document templates  
✅ **HR Analytics (v2.0)** - Retention risk AI, diversity metrics, custom reports  
✅ **Integrations Hub (v2.0)** - Calendar, Slack, job boards, accounting sync  
✅ **Manpower Budget (v2.1)** - Annual budget planning, smart checks, CSV export  
✅ **Recruitment & ATS** - Job postings and candidate pipeline  
✅ **Payroll Management** - Monthly payroll runs with payslip generation  
✅ **Payroll Approval Workflow** - HRM → GM approval process  
✅ **Salary Management** - Employee salary profiles (HR/GM only)  
✅ **Payslip Viewer** - Detailed earnings and deductions breakdown  
✅ **Role-based Access** - 6-level hierarchy (Superadmin > GM > HRM > Dept Head > Supervisor > Staff)  
✅ **Feature Permissions** - Granular feature-level access control (view/create/edit/delete)  
✅ **Data Visibility** - Role-based data filtering by company and department  
✅ **Companies Management** - Multi-company support with letterhead  
✅ **Position Quotas** - Track filled vs available positions by department  
✅ **Job Descriptions** - Auto-generate JDs with company letterhead  
✅ **Offer Letters & Contracts** - Generate employment documents  
✅ **Form Templates Hub** - Centralized form management (GM/HRM)  
✅ **Promotion Management** - HOD → HRM → GM approval workflow  
✅ **Disciplinary Actions** - Warnings and disciplinary letters with workflow  
✅ **Performance Reviews** - 360-degree feedback and goal tracking  
✅ **Expense Claims** - Multi-level approval with receipt uploads  
✅ **Employee Self-Service** - Payslips, leaves, documents portal  
✅ **Employee Directory** - Org chart with contact info  
✅ **Company Announcements** - Policy repository with read receipts  
✅ **Shift Management** - Shift patterns, swaps, coverage alerts  
✅ **Leave Planner** - Full leave management with transportation  
✅ **Leave Quota System** - Balance tracking and accruals  
✅ **Multi-Level Approval** - Manager → HR → Director workflow  
✅ **Advanced Leave Types** - Half-day, hourly, compensatory  
✅ **Team Calendar** - Department view with overlap warnings  
✅ **Email Notifications** - Auto-emails for all events  
✅ **Document Upload** - Medical certs, tickets with verification  
✅ **Reports & Analytics** - Charts, trends, exports  
✅ **Leave Policy Settings** - Configure quotas and rules  
✅ **Calendar View** - Visual leave scheduling  
✅ **Export CSV** - Data export functionality  
✅ **Print Forms** - Professional document printing  
✅ **Offline Mode** - Auto-save drafts to localStorage  
✅ **Dark Mode** - Toggle between light/dark themes  
✅ **Toast Notifications** - User-friendly alerts  
✅ **Smart Search** - Type-to-search employee dropdown  
✅ **Employee Management** - Full CRUD operations  
✅ **Document Tracking** - Passport, Visa, Work Permit, Medical  
✅ **Expiry Alerts** - 90/60/30 day warnings + expired  
✅ **Renewal Workflow** - 5-step process tracking  
✅ **Real-time Updates** - Firestore live sync  
✅ **File Uploads** - Document storage  
✅ **Mobile App** - iOS & Android support  
✅ **Search & Filter** - Employee/document search  
✅ **Dashboard** - Visual statistics  

---

## 📝 License

MIT License - Free for personal and commercial use

---

## 🤝 Support

For issues or questions, please check:
1. Firebase Console for service status
2. Browser console for web errors
3. Metro bundler for mobile errors
4. Firestore rules for permission issues

---

**Built with ❤️ for HR Professionals managing expatriate workforces**
