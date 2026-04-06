import pandas as pd
import json

# Convert Leave Status.xlsx
print("Converting Leave Status.xlsx...")
leave_df = pd.read_excel(r'C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\Leave Status.xlsx')
leave_records = leave_df.to_dict('records')
with open(r'C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\Leave_Status.json', 'w', encoding='utf-8') as f:
    json.dump(leave_records, f, indent=2, default=str)
print(f'Leave Status: {len(leave_records)} records converted')

# Convert Accomodation Report.xlsx
print("Converting Accomodation Report.xlsx...")
acc_df = pd.read_excel(r'C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\Accomodation Report.xlsx')
acc_records = acc_df.to_dict('records')
with open(r'C:\Users\maushaz.MADIHAA\Desktop\Rettey\Hawaain_HR_Pro\Accomodation_Report.json', 'w', encoding='utf-8') as f:
    json.dump(acc_records, f, indent=2, default=str)
print(f'Accomodation Report: {len(acc_records)} records converted')
print('Both files converted successfully!')
