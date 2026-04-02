# Multi-Tenant Setup Guide

## Overview

Hawaain HR Pro uses a **multi-tenant architecture** where each company has completely isolated data. Users are assigned to a specific company and can only access data from that company.

## Architecture

### Data Isolation
- Every document in Firestore includes a `companyId` field
- Firestore security rules enforce strict company-based access control
- Users can only read/write data belonging to their assigned company
- Companies cannot see each other's data

### User Roles
1. **superadmin** - System administrator who can:
   - Create and manage companies
   - View all companies' data
   - Switch between companies
   - Create company admins

2. **admin** (per company) - Company administrator who can:
   - Manage employees in their company
   - Manage all documents (passports, visas, etc.)
   - Create HR and GM users
   - Access all HR modules

3. **hr** (per company) - HR staff who can:
   - Manage employees
   - Manage documents
   - Process payroll
   - Access recruitment module
   - Create Dept Heads, Supervisors, and Staff
   - View renewals and notifications

4. **gm** (per company) - General Manager who can:
   - Access payroll and salary information
   - View sensitive financial data
   - Approve high-value leaves (Level 4 approver)
   - Same access as HR for salary-related functions

5. **dept_head** (per company) - Department Head who can:
   - Manage department employees
   - Approve department leaves
   - Create Supervisors and Staff
   - View department reports

6. **supervisor** (per company) - Supervisor who can:
   - Manage team members
   - Approve team leaves (Level 1 approver)
   - Create Staff only

7. **staff** (per company) - Regular employees who can:
   - View their own profile
   - View their own documents
   - View notifications
   - Access self-service features

### Role Hierarchy

```
Superadmin (Level 0) → Can create companies and ALL roles
    ↓
GM (Level 1) → Can create HRM, Dept Head, Supervisor, Staff
    ↓
HRM (Level 2) → Can create Dept Head, Supervisor, Staff
    ↓
Department Head (Level 3) → Can create Supervisor, Staff
    ↓
Supervisor (Level 4) → Can create Staff only
    ↓
Staff (Level 5) → Cannot create users
```

**Important Rules:**
- Only **Superadmin** can create companies (exclusive right)
- Users can ONLY create roles below their level
- Each role can only manage users they created or users below their level

## Setup Process

### Step 1: Create First Super Admin

When you first deploy the app, you need to create a superadmin user:

1. Sign up with the first account
2. Manually update the user document in Firestore to set role to `superadmin`
3. This user can then create companies and assign users

**Firestore Console Path:** `users/{userId}`

Update the document:
```json
{
  "name": "System Admin",
  "email": "admin@yourdomain.com",
  "role": "superadmin",
  "companyId": null,
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z"
}
```

### Step 2: Create Companies

As superadmin:

1. Go to **Companies** in the sidebar
2. Click **Add Company**
3. Fill in company details:
   - Name: Company name
   - Code: Unique company code (e.g., "COMP001")
   - Address, Phone, Email
   - Max Users: Limit for this company
   - Status: active/inactive

### Step 3: Create Company Users

For each company, create users with their `companyId` set:

**Option A: Superadmin creates users**
- Superadmin can create users and assign them to specific companies
- Set the `companyId` field to the company's ID

**Option B: Self-registration with company code**
- Modify signup to require a company code
- Validate code and auto-assign companyId

### Step 4: Firestore Security Rules

Deploy these security rules to enforce company isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isSuperAdmin() {
      return request.auth != null && getUserData().role == 'superadmin';
    }
    
    function getUserCompanyId() {
      return getUserData().companyId;
    }
    
    function isCompanyHR() {
      return request.auth != null && 
        getUserData().role in ['hr', 'admin', 'superadmin', 'gm', 'general_manager', 'hrm'];
    }
    
    function isHRorGM() {
      return request.auth != null && 
        getUserData().role in ['hr', 'gm', 'general_manager', 'admin', 'superadmin', 'hrm'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isSuperAdmin() || 
         resource.data.companyId == getUserCompanyId());
      allow write: if request.auth != null && 
        (request.auth.uid == userId || isSuperAdmin() ||
         (isCompanyHR() && resource.data.companyId == getUserCompanyId()));
    }
    
    // Companies collection - superadmin only
    match /companies/{companyId} {
      allow read: if request.auth != null && 
        (isSuperAdmin() || getUserCompanyId() == companyId);
      allow write: if request.auth != null && isSuperAdmin();
    }
    
    // All data collections with company isolation
    match /{collection}/{docId} {
      allow create: if request.auth != null && 
        request.resource.data.companyId == getUserCompanyId() &&
        (isSuperAdmin() || isCompanyHR());
      
      allow read: if request.auth != null && 
        (isSuperAdmin() || resource.data.companyId == getUserCompanyId());
      
      allow update: if request.auth != null && 
        resource.data.companyId == getUserCompanyId() &&
        request.resource.data.companyId == getUserCompanyId() &&
        (isSuperAdmin() || isCompanyHR());
      
      allow delete: if request.auth != null && 
        resource.data.companyId == getUserCompanyId() &&
        (isSuperAdmin() || isCompanyHR());
    }
  }
}
```

## How It Works

### Automatic Company Filtering

The `useFirestore` hook automatically:
1. Gets the current user's `companyId` from `CompanyContext`
2. Adds a `where('companyId', '==', companyId)` filter to all queries
3. Includes `companyId` in all new documents

Example:
```javascript
// In any component
const { documents: employees } = useFirestore('employees');
// Automatically filtered by current user's company
```

### Role-Based Data Visibility

In addition to company isolation, the system implements role-based data filtering:

**Data Visibility by Role:**

| Role | Company Access | Department Access | Employee Access |
|------|---------------|-------------------|-----------------|
| **Superadmin** | All companies | All departments | All employees |
| **GM** | Own company only | All departments | All employees in company |
| **HRM/HR** | Own company only | All departments | All employees in company |
| **Department Head** | Own company only | Own department only | Department employees only |
| **Supervisor** | Own company only | Own department only | Department employees only |
| **Staff** | Own company only | N/A | Own record only |

**Department Assignment:**
- Dept Head, Supervisor, and Staff roles **must** be assigned to a department
- Users with department assignment can only view/edit data from their department
- HRM and GM see all departments within their company

### Data Filtering Implementation

**useFilteredFirestore Hooks:**

```javascript
// Automatically filters data based on user's role
import { useFilteredEmployees, useFilteredDocuments, useFilteredLeaves } from '../hooks/useFilteredFirestore';

// In a component
const { employees } = useFilteredEmployees(); // Already filtered by role
const { documents } = useFilteredDocuments('passports');
const { leaves } = useFilteredLeaves();
```

**AuthContext Filtering Functions:**

```javascript
const { filterByVisibility, canViewEmployee, getDataVisibilityFilter } = useAuth();

// Filter any array of items
const filteredItems = filterByVisibility(allItems);

// Check if can view specific employee
const canView = canViewEmployee(employee);

// Get current visibility rules
const visibility = getDataVisibilityFilter();
// Returns: { type: 'all' | 'company' | 'department' | 'own', ... }
```

### Storage Isolation

Files are stored with company prefix:
```javascript
`${companyId}/passport_documents/${filename}`
```

This ensures files are organized by company and access rules can be applied.

## Database Structure

### companies Collection
```json
{
  "name": "ABC Corporation",
  "code": "ABC001",
  "address": "123 Business St",
  "phone": "+1 234 567 8900",
  "email": "contact@abccorp.com",
  "maxUsers": 50,
  "status": "active",
  "logoUrl": "https://storage.../company_logo.png",
  "letterheadUrl": "https://storage.../letterhead.png",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

**Field Descriptions:**
- `name`: Company full legal name
- `code`: Unique company code/identifier
- `logoUrl`: URL to company logo image (used in navigation)
- `letterheadUrl`: URL to letterhead image (used on all official forms)
- `status`: Company status (active, inactive, suspended)

### users Collection
```json
{
  "name": "John Doe",
  "email": "john@abccorp.com",
  "role": "dept_head",  // Options: superadmin, admin, hrm, gm, dept_head, supervisor, staff
  "department": "Engineering",  // Required for dept_head, supervisor, staff
  "companyId": "abc123",  // Reference to companies/{id}
  "customPermissions": {
    "employees": { "view": true, "create": true, "edit": true, "delete": false },
    "payroll": { "view": true, "run": false },
    "documents": { "view": true, "create": false, "edit": false, "delete": false }
  },
  "createdBy": "admin123",  // ID of user who created this account
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

**Field Descriptions:**
- `role`: User's role in the hierarchy
- `department`: Required for Dept Head, Supervisor, and Staff (determines data visibility)
- `companyId`: Links user to a company
- `customPermissions`: Optional override for default role permissions
- `createdBy`: Tracks who created the user account

### Feature Permissions

Users can have custom permissions that override their role defaults:

```json
{
  "companies": { "view": true, "create": false, "edit": false, "delete": false },
  "employees": { "view": true, "create": true, "edit": true, "delete": false },
  "salary": { "view": true, "edit": false },
  "payroll": { "view": true, "run": false },
  "recruitment": { "view": true, "create": true, "edit": true, "delete": false },
  "documents": { "view": true, "create": true, "edit": true, "delete": false },
  "leave": { "view": true, "apply": true, "approve": false },
  "reports": { "view": true, "export": false },
  "settings": { "view": true, "edit": false },
  "users": { "view": true, "create": false, "edit": false, "delete": false }
}
```

### employees Collection (and all other data)
```json
{
  "name": "Jane Smith",
  "email": "jane@abccorp.com",
  "department": "Engineering",
  "companyId": "abc123",  // Same as user's company
  "salary": {
    "basic": 5000,
    "housingAllowance": 1000,
    "transportAllowance": 500,
    "otherAllowances": 200,
    "bankName": "Bank of Maldives",
    "bankAccount": "1234567890",
    "iban": "MV00BOM1234567890"
  },
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### positionQuotas Collection
```json
{
  "department": "Engineering",
  "position": "Software Engineer",
  "positionLevel": "mid",
  "totalQuota": 5,
  "filled": 3,
  "remaining": 2,
  "employmentType": "full_time",
  "minSalary": 4000,
  "maxSalary": 6000,
  "description": "Responsible for developing software applications",
  "status": "active",
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

**Field Descriptions:**
- `department`: Department name
- `position`: Job title/position
- `totalQuota`: Maximum allowed positions
- `filled`: Auto-calculated from active employees
- `remaining`: Auto-calculated (totalQuota - filled)
- `status`: active, frozen, or closed

### performanceReviews Collection (v1.5.0)
```json
{
  "employeeId": "emp123",
  "reviewCycle": "Annual",
  "reviewPeriod": {
    "start": "2026-01-01",
    "end": "2026-12-31"
  },
  "competencies": {
    "job_knowledge": 4,
    "quality_work": 5,
    "productivity": 4,
    "communication": 4,
    "teamwork": 5,
    "initiative": 3
  },
  "selfReview": {
    "ratings": {},
    "comments": "Self assessment text",
    "submittedAt": "2026-12-15T00:00:00.000Z"
  },
  "managerReview": {
    "ratings": {},
    "comments": "Manager feedback",
    "submittedAt": "2026-12-20T00:00:00.000Z",
    "managerId": "mgr456"
  },
  "peerReviews": [],
  "overallRating": 4.2,
  "status": "Completed",
  "actionItems": [],
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### attendance Collection (v1.5.0)
```json
{
  "employeeId": "emp123",
  "date": "2026-04-01",
  "checkIn": "09:00",
  "checkOut": "17:30",
  "workingHours": 8.5,
  "status": "present",
  "location": "Office",
  "overtime": {
    "hours": 0.5,
    "approved": true
  },
  "notes": "On time",
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### expenseClaims Collection (v1.5.0)
```json
{
  "employeeId": "emp123",
  "category": "travel",
  "amount": 500.00,
  "currency": "MVR",
  "date": "2026-03-15",
  "description": "Client meeting travel",
  "receiptUrl": "https://storage.../receipt.jpg",
  "projectCode": "PRJ001",
  "clientName": "ABC Corp",
  "status": "approved",
  "approvals": [
    {
      "approverId": "mgr456",
      "approverName": "John Manager",
      "action": "approve",
      "comments": "Approved",
      "timestamp": "2026-03-16T00:00:00.000Z"
    }
  ],
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### schedules Collection (v1.5.0)
```json
{
  "employeeId": "emp123",
  "employeeName": "Jane Smith",
  "weekStart": "2026-04-01",
  "shifts": {
    "0": "day",
    "1": "day",
    "2": "evening",
    "3": "day",
    "4": "day",
    "5": null,
    "6": null
  },
  "notes": "Regular schedule",
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### shiftSwaps Collection (v1.5.0)
```json
{
  "requesterId": "emp123",
  "requesterName": "Jane Smith",
  "recipientId": "emp456",
  "recipientName": "John Doe",
  "originalShift": "evening",
  "targetShift": "day",
  "date": "2026-04-05",
  "reason": "Personal appointment",
  "status": "pending",
  "approvedBy": null,
  "approvedAt": null,
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### announcements Collection (v1.5.0)
```json
{
  "title": "Company Policy Update",
  "content": "Updated leave policy effective immediately...",
  "category": "hr",
  "priority": "normal",
  "status": "active",
  "publishDate": "2026-04-01",
  "expiryDate": null,
  "requireAcknowledgment": true,
  "authorId": "user123",
  "authorName": "HR Manager",
  "readBy": ["emp123", "emp456"],
  "acknowledgedBy": [
    {
      "userId": "emp123",
      "userName": "Jane Smith",
      "acknowledgedAt": "2026-04-02T00:00:00.000Z"
    }
  ],
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

### policies Collection (v1.5.0)
```json
{
  "title": "Employee Handbook",
  "content": "Full policy content here...",
  "category": "employee_handbook",
  "version": "2.0",
  "authorId": "user123",
  "authorName": "HR Manager",
  "requireAcknowledgment": true,
  "acknowledgedBy": [
    {
      "userId": "emp123",
      "userName": "Jane Smith",
      "acknowledgedAt": "2026-04-02T00:00:00.000Z"
    }
  ],
  "companyId": "abc123",
  "createdAt": "2026-04-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z"
}
```

## Managing Multiple Companies

### As Superadmin

1. **View All Companies**: Go to Companies page
2. **Switch Company Context**: Click "Switch" on any company
3. **Manage Company Data**: After switching, all data shown belongs to that company
4. **Create Users**: Assign users to specific companies during creation

### As Company Admin/HR

1. **Your Data Only**: You automatically see only your company's data
2. **No Company Selection**: Users don't choose companies - they're assigned
3. **Isolation Guaranteed**: Cannot access other companies' data even via API

## Deployment for Multiple Clients

### Option 1: Single Firebase Project (Recommended)

Use this multi-tenant architecture:
- One Firebase project hosts all companies
- Data isolation via `companyId` field
- Cost-effective for small-medium deployments

### Option 2: Separate Firebase Projects

For enterprise clients requiring complete isolation:
- Each company gets their own Firebase project
- Deploy the app separately for each
- Maximum isolation but higher cost

## Security Considerations

### What Users CANNOT Do
1. Cannot access data from other companies (enforced by Firestore rules)
2. Cannot change their company assignment (only superadmin can)
3. Cannot create users in other companies
4. Cannot read documents without `companyId` field

### Audit Trail

Add `createdBy` and `updatedBy` fields to track who made changes:
```javascript
{
  "companyId": "abc123",
  "createdBy": "user123",
  "updatedBy": "user123",
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

## Troubleshooting

### User sees no data
- Check user's `companyId` is set correctly
- Verify documents have matching `companyId`
- Check Firestore rules are deployed

### Cannot create documents
- Ensure `companyId` is included in new documents
- Verify user has HR/Admin role
- Check Firestore rules allow write for user's role

### Superadmin cannot see all companies
- Verify user has `role: "superadmin"`
- Check `companyId` is `null` or matches a company
- Ensure Firestore rules allow superadmin access

## Summary

✅ Each company has isolated data  
✅ Users are assigned to companies, not selecting them  
✅ Firestore rules enforce strict access control  
✅ Superadmin can manage multiple companies  
✅ Automatic filtering in all database operations  
✅ Files organized by company in Storage  

Your multi-tenant HR system is ready for multiple companies!
