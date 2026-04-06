import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import re

# Initialize Firebase
cred = credentials.Certificate(r"C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Villa Construction Company ID
VILLA_CONSTRUCTION_ID = "IkYokZm5QyPTF1ZUNP7O"

print("="*60)
print("CROSS-CHECKING VILLA CONSTRUCTION EMPLOYEES")
print("="*60)

# Read Construction Work Force JSON
with open('Construction_Work_Force.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)

print(f"\n📁 Construction Work Force records: {len(json_data)}")

# Get ALL existing employees from Firestore
existing_employees = db.collection('employees').stream()
existing_names = set()

for emp in existing_employees:
    name = emp.to_dict().get('name', '').lower().strip()
    if name:
        existing_names.add(name)

print(f"🔥 Existing employees in Firestore: {len(existing_names)}")

# Cross-check - find missing
missing_employees = []
for record in json_data:
    name = record.get('Name', '').lower().strip()
    if name and name not in existing_names:
        missing_employees.append(record)

print(f"\n📊 CROSS-CHECK RESULTS:")
print(f"  ✅ Already in database: {len(json_data) - len(missing_employees)}")
print(f"  ❌ Missing (need import): {len(missing_employees)}")

if len(missing_employees) == 0:
    print("\n🎉 All Villa Construction employees already in database!")
    exit()

# Show first 10 missing
print(f"\nFirst 10 missing employees:")
for i, emp in enumerate(missing_employees[:10], 1):
    print(f"  {i}. {emp.get('Name')} ({emp.get('Passport No', 'no passport')})")

print(f"\n{'='*60}")
print(f"IMPORTING {len(missing_employees)} MISSING EMPLOYEES")
print(f"{'='*60}")

imported = 0
failed = 0

for record in missing_employees:
    try:
        employee_id = f"villa_{record.get('ID', imported)}"
        
        # Create employee document
        employee_data = {
            'employeeId': str(record.get('ID', '')),
            'name': record.get('Name', ''),
            'department': record.get('Department', 'Villa Construction'),
            'section': record.get('Section', ''),
            'designation': record.get('Designation', ''),
            'nationality': record.get('Nationality', ''),
            'companyId': VILLA_CONSTRUCTION_ID,
            'status': 'active',
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        db.collection('employees').add(employee_data)
        
        # Create passport document
        if record.get('Passport No'):
            passport_data = {
                'employeeId': employee_id,
                'passportNumber': record['Passport No'].upper().strip(),
                'country': record.get('Nationality', ''),
                'companyId': VILLA_CONSTRUCTION_ID,
                'createdAt': datetime.now().isoformat()
            }
            db.collection('passports').add(passport_data)
        
        # Create work permit document
        if record.get('WP'):
            wp_data = {
                'employeeId': employee_id,
                'permitNumber': record['WP'],
                'jobPosition': record.get('Designation', ''),
                'employer': 'Villa Construction',
                'expiryDate': record.get('WPExpiry', ''),
                'companyId': VILLA_CONSTRUCTION_ID,
                'createdAt': datetime.now().isoformat()
            }
            db.collection('workPermits').add(wp_data)
        
        # Create visa document
        if record.get('VIsaExpiry') and record['VIsaExpiry'] != '1899-12-30':
            visa_data = {
                'employeeId': employee_id,
                'visaNumber': record.get('WP', ''),
                'visaType': 'Work',
                'expiryDate': record['VIsaExpiry'],
                'companyId': VILLA_CONSTRUCTION_ID,
                'createdAt': datetime.now().isoformat()
            }
            db.collection('visas').add(visa_data)
        
        imported += 1
        if imported % 10 == 0:
            print(f"  Progress: {imported}/{len(missing_employees)} imported...")
            
    except Exception as e:
        print(f"  ❌ Failed: {record.get('Name')} - {e}")
        failed += 1

print(f"\n{'='*60}")
print(f"✅ IMPORT COMPLETE!")
print(f"{'='*60}")
print(f"Successfully imported: {imported}")
print(f"Failed: {failed}")
print(f"\n📝 Total Villa Construction employees now: {len(existing_names) + imported}")
print(f"\n👉 Refresh https://hawaain-hr-pro.vercel.app to see changes")
print(f"{'='*60}")
