# Git Push Guide (Windows / PowerShell)

This file explains how to save your code changes to Git and push them to GitHub.

## 1) Check what changed

```powershell
git status
```

- If you see **modified** files, you have local changes.
- If you see **Untracked files**, they are new files that must be added.

## 2) See what exactly changed (optional)

```powershell
git diff
```

## 3) Add files to staging

### Add everything

```powershell
git add -A
```

### OR add specific files

```powershell
git add web/src/components/ManpowerBudget.jsx
```

## 4) Commit the changes

```powershell
git commit -m "your message here"
```

Example:

```powershell
git commit -m "fix: manpower budget salary and dashboard totals"
```

## 5) Push to GitHub

Push current branch to origin:

```powershell
git push origin main
```

If your branch is not `main`, check your branch name:

```powershell
git branch
```

Then push that branch:

```powershell
git push origin <branch-name>
```

## 6) Confirm it is pushed

```powershell
git log --oneline -5
```

You can also compare local vs remote:

```powershell
git fetch origin
git show -s --oneline HEAD
git show -s --oneline origin/main
```

## Common issues

### A) "Everything up-to-date" but Vercel didn’t update

- This usually means there were no new commits pushed.
- Run:

```powershell
git status
```

If there are changes, you still need to `git add` + `git commit` + `git push`.

### B) PowerShell error: `&&` not working

In PowerShell, avoid `&&`.

Do commands one by one:

```powershell
git add -A
git commit -m "message"
git push origin main
```

### C) I committed with the wrong Git user

Fix the commit author (last commit):

```powershell
git commit --amend --reset-author
```

Then push again:

```powershell
git push origin main
```

### D) Undo local changes (be careful)

Discard changes in a single file:

```powershell
git restore path/to/file
```

Discard all local changes:

```powershell
git restore .
```

### E) Remove file from staging (unstage)

```powershell
git restore --staged path/to/file
```

---

## Latest Changes (Auto-deployed to Vercel)

### April 2026 Updates

**User Management v2.0 (Complete Redesign)**
- **Location**: Settings → User Management
- **New Card-Based UI** - Beautiful card layout replacing old table view
- **Role-Grouped Display** - Users organized by role with color-coded badges
  - Superadmin (Purple), GM (Red), HRM (Blue), Dept Head (Orange), Supervisor (Yellow), Staff (Green), Employee (Teal)
- **User Cards** show:
  - Avatar with initials, Full name, Username/Employee code
  - Status badge (Active/Inactive/Suspended)
  - Email, Phone, Department, Company
- **Three Action Buttons** on each card:
  - **View** - Opens detailed user info modal (ID, email, username, department, designation, phone, status, created date)
  - **Edit** - Modify name, username, department, designation, phone, role, status
  - **Reset** - Reset password (user must change on next login)
- **Search** - Real-time search by name, email, username, or employee code
- **Add User** - Full form to create new users with name, email, username, password, role
- **Real-time Updates** - Uses Firestore onSnapshot for live updates
- **All Users Visible** - GM/HRM/Superadmin can see all 888+ users across the system

**Turnover Dashboard (New Module)**
- New comprehensive Turnover Dashboard at `/turnover`
- Located in HR Management navigation section
- Features include:
  - **Key Metrics**: Turnover rate, active employees, new hires, fill rate
  - **Monthly Trend Chart**: Visual comparison of terminations vs hires over 12 months
  - **Termination Types Pie Chart**: Breakdown by Resignation, Termination, Contract End, Retirement, Mutual Agreement
  - **Hiring Reasons Bar Chart**: New positions, Replacements, Expansion
  - **Net Workforce Change**: Month-by-month headcount delta visualization
  - **Department Breakdown Table**: Per-department stats showing current employees, terminations, new hires, turnover rate %, and net change
  - **Quick Links**: Direct navigation to Terminations, Recruitment Pipeline, and Hiring Requisitions
  - **CSV Export**: Export department breakdown data for reporting
- Data sources: Employees, Terminations, and Recruitment Approvals collections

**Dashboard - Real-Time Updates**
- Switched from `getDocs` to `onSnapshot` for live Firestore data updates
- Dashboard stats now update automatically without page refresh
- Termination stats card added showing:
  - Total completed terminations count
  - Active terminations in progress
  - Click to navigate to Terminations page
- Real-time synchronization for all collections (employees, terminations, documents)

**Dashboard - Employee Count Fix**
- Main Dashboard now excludes terminated employees from "Total Employees" count
- Only active employees (status !== 'terminated') are displayed in the stats
- Ensures terminated staff don't appear in headcount calculations

**Recruitment - Enhanced Onboarding**
- Completely redesigned Onboarding modal with comprehensive employee registration
- New sections added:
  - **Document Registration**: Passport number/expiry, Work permit number/expiry, Visa number/expiry, National ID, Medical insurance number
  - **Emergency Contact**: Name, phone number, relationship (Spouse/Parent/Sibling/Child/Friend/Other)
  - **Bank Details**: Bank name, account number for salary processing
  - **Uniform & Medical**: Uniform size (XS-XXXL), allergies, dietary restrictions (Halal/Vegetarian/etc.)
  - **Personal Info**: Date of birth, joining date
- **Accommodation Integration**:
  - Checkbox to "Arrange Accommodation" during onboarding
  - Displays all available rooms from Accommodation module in a selectable grid
  - Room cards show: Room number, Building/Floor, Room type, Bed count, Amenities
  - Visual selection feedback with checkmark indicator
  - On completion:
    - Automatically creates `roomAssignments` record linking new hire to room
    - Updates room status from `available` to `occupied`
    - Sets check-in date as the joining date
    - Shows success toast with assigned room number
  - Warning displayed if no available rooms exist
- Fixed missing `updateCandidate` helper function
- Connected `addCandidate` from useFirestore hook properly
- Access: Recruitment → Onboarding tab → "Start Onboarding" button

**Terminations - Rehire Feature**
- Added "Rehire" button for completed terminations
- Allows reversing accidental terminations
- Clicking rehire will:
  - Change termination status to 'cancelled'
  - Restore employee to 'active' status
  - Clear termination date and reason
  - Allow room allocation again

**Budget Dashboard Enhancements**
- Added new "Budget vs Actual" tab with hierarchical view
- Shows data grouped by: Department > Section > Designation
- Displays head counts and amounts with variance calculations
- Added collapsible sections for easier navigation
- Fixed chart container width/height warnings
- Fixed missing ChevronRight/ChevronDown icon imports
- Fixed CSV export to handle commas in designation names (prevents column shifts)

**Date Comparison Fix**
- Fixed bug where tomorrow's dates showed as "expired"
- Now compares dates at midnight to avoid time-of-day issues
- Affects medical records, passports, visas, and work permits expiry display

### 2025-01-XX Updates

**Leave Application Form**
- Reason and Destination fields are now optional (no longer required)
- Removed validation checks for empty reason/destination
- Updated labels to show "(optional)" indicator

**Leave Planner**
- Now shows only active leaves by default (pending and approved)
- Rejected and cancelled leaves are filtered out unless specific status filter is selected
- Status filter "all" now means "all active leaves"

**Medicals Page**
- Removed FirebaseDataChecker debug component
- Cleaned up production code

**How to Deploy**
Vercel will auto-deploy on push **only if** the GitHub repo is connected in Vercel.

Check in Vercel:
- Project → Settings → Git → Connected Repository

Quick deploy commands (PowerShell):
```powershell
git add -A
git commit -m "your message"
git push origin main
```

If Vercel doesn't auto-deploy:
- **No new commit was pushed** ("Everything up-to-date")
- Or the repo is not connected in Vercel

To trigger a new deploy without code changes:
```powershell
git commit --allow-empty -m "trigger: force deploy"
git push origin main
```



cd "C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro"
git commit --allow-empty -m "trigger: force vercel deploy"
git push origin main
