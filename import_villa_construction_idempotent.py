import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase Admin
cred = credentials.Certificate(r"C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\serviceAccountKey.json")
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred)

db = firestore.client()

VILLA_CONSTRUCTION_ID = "IkYokZm5QyPTF1ZUNP7O"
SOURCE_FILE = "Construction_Work_Force.json"


def norm_str(val):
    if val is None:
        return ""
    return str(val).strip()


def doc_id_safe(val):
    # Firestore doc IDs cannot contain '/'
    return norm_str(val).replace("/", "-")


def chunked(iterable, n):
    chunk = []
    for item in iterable:
        chunk.append(item)
        if len(chunk) >= n:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


def build_employee_doc(record):
    now = datetime.utcnow().isoformat() + "Z"
    emp_id = norm_str(record.get("ID"))
    name = norm_str(record.get("Name"))
    dept = norm_str(record.get("Department")) or "Villa Construction"

    return {
        "employeeId": emp_id,
        "name": name,
        "department": dept,
        "section": norm_str(record.get("Section")),
        "designation": norm_str(record.get("Designation")),
        "nationality": norm_str(record.get("Nationality")),
        "companyId": VILLA_CONSTRUCTION_ID,
        "status": "active",
        "sourceFile": "Construction Work Force.xlsx",
        "updatedAt": now,
        # don't overwrite createdAt if it already exists (we use merge)
        "createdAt": now,
    }


def main():
    print("=" * 70)
    print("IDEMPOTENT IMPORT: Villa Construction (NO PRE-READS)")
    print("=" * 70)
    print("NOTE: This will still CONSUME WRITE QUOTA. If quota is exceeded,")
    print("      you must wait for reset or enable billing / raise limits.\n")

    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Records in JSON: {len(data)}")

    # Batch write in chunks (Firestore batch limit is 500 writes)
    # We keep it smaller to be safe.
    BATCH_SIZE = 200

    total_written = 0
    total_failed = 0

    for group_index, group in enumerate(chunked(data, BATCH_SIZE), start=1):
        batch = db.batch()
        writes_in_batch = 0

        for record in group:
            try:
                raw_id = norm_str(record.get("ID"))
                if not raw_id:
                    # skip invalid rows
                    continue

                # Deterministic IDs so re-running does not create duplicates
                emp_doc_id = f"villa-construction_{doc_id_safe(raw_id)}"
                emp_ref = db.collection("employees").document(emp_doc_id)
                emp_payload = build_employee_doc(record)
                batch.set(emp_ref, emp_payload, merge=True)
                writes_in_batch += 1

                passport_no = norm_str(record.get("Passport No")).upper()
                if passport_no:
                    pass_doc_id = f"villa-passport_{doc_id_safe(passport_no)}"
                    pass_ref = db.collection("passports").document(pass_doc_id)
                    batch.set(
                        pass_ref,
                        {
                            "employeeId": emp_doc_id,
                            "passportNumber": passport_no,
                            "country": norm_str(record.get("Nationality")),
                            "companyId": VILLA_CONSTRUCTION_ID,
                            "sourceFile": "Construction Work Force.xlsx",
                            "updatedAt": datetime.utcnow().isoformat() + "Z",
                            "createdAt": datetime.utcnow().isoformat() + "Z",
                        },
                        merge=True,
                    )
                    writes_in_batch += 1

                wp_no = norm_str(record.get("WP"))
                if wp_no:
                    wp_doc_id = f"villa-wp_{doc_id_safe(wp_no)}"
                    wp_ref = db.collection("workPermits").document(wp_doc_id)
                    batch.set(
                        wp_ref,
                        {
                            "employeeId": emp_doc_id,
                            "permitNumber": wp_no,
                            "jobPosition": norm_str(record.get("Designation")),
                            "employer": "Villa Construction",
                            "expiryDate": record.get("WPExpiry"),
                            "companyId": VILLA_CONSTRUCTION_ID,
                            "sourceFile": "Construction Work Force.xlsx",
                            "updatedAt": datetime.utcnow().isoformat() + "Z",
                            "createdAt": datetime.utcnow().isoformat() + "Z",
                        },
                        merge=True,
                    )
                    writes_in_batch += 1

                visa_exp = record.get("VIsaExpiry")
                if visa_exp and norm_str(visa_exp) and norm_str(visa_exp) != "1899-12-30":
                    # Use passport as stable key if present, else ID
                    visa_key = passport_no or raw_id
                    visa_doc_id = f"villa-visa_{doc_id_safe(visa_key)}"
                    visa_ref = db.collection("visas").document(visa_doc_id)
                    batch.set(
                        visa_ref,
                        {
                            "employeeId": emp_doc_id,
                            "visaType": "Work",
                            "expiryDate": visa_exp,
                            "companyId": VILLA_CONSTRUCTION_ID,
                            "sourceFile": "Construction Work Force.xlsx",
                            "updatedAt": datetime.utcnow().isoformat() + "Z",
                            "createdAt": datetime.utcnow().isoformat() + "Z",
                        },
                        merge=True,
                    )
                    writes_in_batch += 1

            except Exception as e:
                total_failed += 1
                print(f"Row failed (ID={record.get('ID')}): {e}")

        if writes_in_batch == 0:
            continue

        # Commit this batch
        batch.commit()
        total_written += writes_in_batch
        print(f"Batch {group_index}: committed {writes_in_batch} writes (total writes={total_written})")

    print("\n" + "=" * 70)
    print("DONE")
    print("=" * 70)
    print(f"Total writes committed: {total_written}")
    print(f"Rows failed (build phase): {total_failed}")
    print("\nNext: open the app, switch to Villa Construction, refresh.")


if __name__ == "__main__":
    main()
