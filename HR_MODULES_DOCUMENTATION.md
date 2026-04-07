# HR Modules Documentation

## Comprehensive Guide to All HR Modules

### Table of Contents
1. [Document Reports (Visa & Passport)](#1-document-reports)
2. [Termination & Exit Management](#2-termination--exit-management)
3. [Recruitment & New Staff Hiring](#3-recruitment--new-staff)
4. [Leave Analytics & Graphs](#4-leave-analytics)
5. [Budget Dashboard](#5-budget-dashboard)
6. [Manpower Budget](#6-manpower-budget)
7. [Accommodation Management](#7-accommodation-management)
8. [Leave Planner](#8-leave-planner)

---

## 1. Document Reports

### Location: `/document-reports`

#### Features:
- **Visa Status Reports**: Track all employee visas with expiry dates
- **Passport Expiry Reports**: Monitor passport expiration dates
- **Work Permit Tracking**: (via DocumentReports component)
- **Status Categories**:
  - ✓ Valid (90+ days)
  - ⚠ Warning (60-90 days)
  - 🔴 Critical (0-30 days)
  - ✗ Expired

#### How to Use:
1. Navigate to Document Reports from sidebar
2. Click "Visa Reports" or "Passport Reports" tab
3. Use filters to search by:
   - Employee name
   - Department
   - Document number
   - Status (Valid/Warning/Critical/Expired)
4. Export to CSV for reporting
5. Critical documents show red alert banner

#### Data Fields:
- Employee Name & ID
- Department
- Document Number
- Type/Country
- Issue Date
- Expiry Date
- Days Remaining
- Status Badge

---

## 2. Termination & Exit Management

### Location: `/operations` (Exit Tab)

#### Features:
- **Exit Types**:
  - Resignation
  - Termination
  - End of Contract
  - Retirement

#### How to Use:
1. Go to Operations → Exit tab
2. Click "Add" button
3. Select employee from dropdown
4. Choose exit reason
5. Set notice date and last working day
6. Add exit interview notes
7. Record audio interview (optional)
8. Save exit record

#### Workflow:
1. Employee submits resignation/termination notice
2. HR records exit details
3. Conduct exit interview
4. Process final settlement
5. Update employee status to inactive

---

## 3. Recruitment & New Staff Hiring

### Location: `/recruitment`

#### Features:
- **Job Postings**: Create and manage job openings
- **Applicant Tracking**: Track candidates through pipeline
- **Pipeline Stages**:
  - New Application
  - Screening
  - Interview
  - Assessment
  - Offer Pending
  - Hired
  - Rejected
  - Withdrawn

#### How to Use:
1. Click "New Job Posting"
2. Fill job details (title, department, location, type)
3. View all job postings in Jobs tab
4. Add candidates to jobs
5. Move candidates through pipeline stages
6. Track hiring metrics:
   - Open Positions
   - Total Applicants
   - In Pipeline
   - Hired This Month

#### Candidate Management:
- View candidate profiles
- Rate candidates (1-5 stars)
- Schedule interviews
- Send offer letters
- Track source (LinkedIn, Indeed, Referral, etc.)

---

## 4. Leave Analytics & Graphs

### Location: `/leave-analytics`

#### Features:
- **Monthly Trend Chart**: Visual graph of leave applications over time
- **Leave Type Distribution**: Pie chart of different leave types
- **Department-wise Stats**: Which departments take most leave
- **Top Leave Takers**: Employees with highest leave days
- **Date Range Filters**: Last 3/6/12 months or this year

#### Analytics Shown:
- Total Leaves
- Approved
- Pending
- Rejected
- Total Days

#### How to Use:
1. Select date range from dropdown
2. View different chart sections
3. Hover over charts for details
4. Export data to CSV
5. Identify leave patterns

---

## 5. Budget Dashboard

### Location: `/budget-dashboard`

#### Features:
- **Department Overview**: Budget breakdown by department
- **Budget Entries**: Individual designation budgets
- **Variance Analysis**: Compare budget vs actual spending
- **Summary Cards**: Total budget, positions, departments

#### Tabs:
1. **Department Overview**: Department-wise totals
2. **Budget Entries**: Individual designation details
3. **Variance Budget vs Actuals**: Compare budgeted vs actual salaries

#### How to Use:
1. View department breakdown
2. Check individual budget entries
3. Use Variance tab to see over/under budget
4. Export reports to CSV

---

## 6. Manpower Budget

### Location: `/manpower-budget`

#### Features:
- **Salary Management**: Set salaries by designation
- **Manpower Tiers**: Define positions by tier (100-80%, 80-65%, 65-50%, Below 50%)
- **Department/Section/Designation**: Hierarchical structure
- **Actual 2026**: Track actual vs budgeted

#### How to Use:
1. Click "Add Budget Entry"
2. Select Department, Section, Designation
3. Enter salary
4. Set manpower requirements by tier
5. Save and view totals

---

## 7. Accommodation Management

### Location: `/accommodation/rooms`

#### Features:
- **Room Management**: Add/edit rooms
- **Room Assignments**: Assign employees to rooms
- **Occupancy Tracking**: View who is in each room
- **Maintenance Requests**: Track room issues

#### Room Details:
- Room number, floor, building
- Capacity and current occupancy
- Amenities (AC, WiFi, TV, etc.)
- Current occupants list
- Rent tracking

#### How to Use:
1. View all rooms with occupancy
2. Click "Assign" to assign employee
3. See current occupants in each room
4. Create maintenance requests

---

## 8. Leave Planner

### Location: `/leave-planner`

#### Features:
- **Apply for Leave**: Submit leave applications
- **Track Status**: Pending/Approved/Rejected
- **Leave Types**: Annual, Sick, Emergency, Unpaid, Other
- **Transportation**: Book flights/transport for leave
- **Calendar View**: Visual leave calendar
- **Leave Balances**: Track available leave days

#### How to Use:
1. Click "Apply for Leave"
2. Select leave type
3. Choose dates
4. Add reason and destination
5. Submit for approval
6. Track status in list view

---

## Common Features Across Modules

### Export to CSV:
Most modules support CSV export for reporting:
- Click "Export CSV" button
- Download file with timestamp
- Use in Excel/Google Sheets

### Filters & Search:
- Search by name, ID, department
- Filter by status
- Date range filters

### Notifications:
- Critical documents expiring soon
- Budget overruns
- Pending approvals

### Permissions:
- HR can view all
- Managers view their department
- Employees view their own data

---

## Troubleshooting

### Common Issues:
1. **Data not showing**: Check company selection
2. **Cannot edit**: Verify permissions
3. **Export not working**: Check browser popup blocker
4. **Slow loading**: Large datasets may take time

### Support:
For technical issues, contact IT support or check browser console for errors.

---

## Recent Updates (April 2026)

### Added:
- Variance Budget vs Actuals tab
- Room occupancy view in Accommodation
- Enhanced Document Reports with alerts
- Fixed Leave Planner apply button
- Fixed Employee edit navigation

### Fixed:
- Salary display in Manpower Budget
- Budget Dashboard totals
- Dropdown pre-fill in edit mode
- Deployment issues on Vercel

---

*Documentation Version: 1.0*
*Last Updated: April 7, 2026*
