import pandas as pd
import json
from datetime import datetime

# Read the Excel file
file_path = r"C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\Master List.xlsx"
df = pd.read_excel(file_path)

print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print("\nFirst 5 rows:")
print(df.head())

# Convert to records
records = df.to_dict('records')

# Save to JSON file for inspection
json_output_path = r"C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\master_list_data.json"
with open(json_output_path, 'w', encoding='utf-8') as f:
    json.dump(records, f, indent=2, default=str)

print(f"\nJSON saved to: {json_output_path}")
print(f"Total records: {len(records)}")
