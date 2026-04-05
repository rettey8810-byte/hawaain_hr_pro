import pandas as pd
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import math
import re

# Initialize Firebase
cred = credentials.Certificate(r"C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Read the Excel file
file_path = r"C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\Master List.xlsx"
df = pd.read_excel(file_path)

print(f"Total rows to upload: {len(df)}")

def clean_value(val):
    """Clean values for Firestore compatibility"""
    if pd.isna(val):
        return None
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        if val == int(val):
            return int(val)
        return val
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, str):
        return val.strip()
    return val

def slugify(name):
    """Convert company name to slug for ID"""
    return re.sub(r'[^\w\s-]', '', name.lower()).strip().replace(' ', '-')

# Company details
company_name = "Sunisland Resort and Spa"
company_slug = slugify(company_name)

# Create company with slug as document ID
companies_ref = db.collection('companies')
company_doc = companies_ref.document(company_slug).get()

if not company_doc.exists:
    company_data = {
        'id': company_slug,
        'name': company_name,
        'code': 'SUNISLAND',
        'status': 'active',
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat(),
        'createdBy': 'superadmin',
        'employeeCount': len(df),
        'address': 'Nalaguraidhoo, South Ari Atoll, Maldives'
    }
    companies_ref.document(company_slug).set(company_data)
    print(f"Created company: {company_name} (ID: {company_slug})")
else:
    print(f"Found existing company: {company_name} (ID: {company_slug})")

# Upload employees to Firestore
employees_ref = db.collection('employees')
success_count = 0
error_count = 0
errors = []

print("\nStarting upload...")

for idx, row in df.iterrows():
    try:
        # Clean all values
        employee_data = {}
        for k, v in row.items():
            clean_key = k.strip() if isinstance(k, str) else k
            employee_data[clean_key] = clean_value(v)
        
        # Add metadata
        employee_data['companyId'] = company_slug
        employee_data['companyName'] = company_name
        employee_data['createdAt'] = datetime.now().isoformat()
        employee_data['updatedAt'] = datetime.now().isoformat()
        employee_data['sourceFile'] = 'Master List.xlsx'
        employee_data['status'] = 'active'
        
        # Use EmpID as document ID if available
        emp_id = str(int(employee_data.get('EmpID', idx + 1)))
        doc_id = f"{company_slug}_{emp_id}"
        
        # Upload to Firestore
        employees_ref.document(doc_id).set(employee_data)
        success_count += 1
        
        if (idx + 1) % 50 == 0:
            print(f"  Uploaded {idx + 1} / {len(df)} employees...")
            
    except Exception as e:
        error_count += 1
        errors.append(f"Row {idx + 1}: {str(e)}")
        if error_count <= 5:
            print(f"  Error on row {idx + 1}: {e}")

print(f"\n{'='*50}")
print(f"UPLOAD COMPLETE!")
print(f"{'='*50}")
print(f"Company: {company_name}")
print(f"Company ID: {company_slug}")
print(f"Successfully uploaded: {success_count} employees")
print(f"Errors: {error_count}")

if error_count > 0 and len(errors) > 5:
    print(f"\nFirst 5 errors:")
    for err in errors[:5]:
        print(f"  - {err}")

print(f"\n{'='*50}")
print(f"NEXT STEPS:")
print(f"{'='*50}")
print(f"1. In Firestore Console, verify 'companies' collection has:")
print(f"   Document ID: {company_slug}")
print(f"   Name: {company_name}")
print(f"")
print(f"2. In Firestore Console, verify 'employees' collection has:")
print(f"   {success_count} documents with companyId = '{company_slug}'")
print(f"")
print(f"3. To add a company admin user:")
print(f"   - Create user in Firebase Auth")
print(f"   - Add to 'users' collection with:")
print(f"     companyId: '{company_slug}'")
print(f"     role: 'company_admin'")
print(f"     companyIds: ['{company_slug}']")
print(f"{'='*50}")
