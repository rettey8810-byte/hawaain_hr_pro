import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import { Download, Printer, X } from 'lucide-react';

export default function DailyReport({ onClose }) {
  const { companyId, currentCompany } = useCompany();
  const { userData, filterByVisibility } = useAuth();
  const { documents: employees } = useFirestore('employees');
  const { documents: leaves } = useFirestore('leaves');
  const { documents: terminations } = useFirestore('terminations');

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Manual input state for restaurant meal counts
  const [mealCounts, setMealCounts] = useState({
    familyRestaurant: { breakfast: '', lunch: '', dinner: '' },
    tab: { breakfast: '', lunch: '', dinner: '' }
  });

  const handleMealChange = (restaurant, meal, value) => {
    setMealCounts(prev => ({
      ...prev,
      [restaurant]: {
        ...prev[restaurant],
        [meal]: value
      }
    }));
  };

  // Filter employees by visibility
  const companyEmployees = filterByVisibility(
    employees.filter(e => e.companyId === companyId || !e.companyId)
  );

  // Active employees (not terminated)
  const activeEmployees = companyEmployees.filter(e => e.Status !== 'Terminated');

  // Head Count Data
  const operationalStaff = activeEmployees.filter(e => {
    const dept = (e.Department || e.department || '').toLowerCase();
    return !['construction', 'projects', 'project'].some(d => dept.includes(d));
  }).length;

  const nonOperationalStaff = activeEmployees.filter(e => {
    const dept = (e.Department || e.department || '').toLowerCase();
    return ['construction', 'projects', 'project'].some(d => dept.includes(d));
  }).length;

  const constructionGroups = 0; // Placeholder - adjust based on your data structure

  // Leave Data
  const todayLeaves = leaves.filter(l =>
    l.companyId === companyId &&
    l.status === 'approved' &&
    l.startDate <= today &&
    l.endDate >= today
  );

  const annualLeave = todayLeaves.filter(l =>
    (l.type || l.leaveType || '').toLowerCase().includes('annual')
  ).length;

  const otherLeaves = todayLeaves.filter(l =>
    !(l.type || l.leaveType || '').toLowerCase().includes('annual')
  ).length;

  // Year to Date Data
  const currentYear = new Date().getFullYear();
  const recruitment = companyEmployees.filter(e => {
    const hireDate = e.HireDate || e.joinDate || e.createdAt;
    if (!hireDate) return false;
    const year = new Date(hireDate).getFullYear();
    return year === currentYear;
  }).length;

  const separation = terminations.filter(t =>
    t.companyId === companyId &&
    new Date(t.terminationDate || t.date).getFullYear() === currentYear
  ).length;

  // Nationality Data
  const nationalityData = activeEmployees.reduce((acc, emp) => {
    const nat = emp.Nationality || 'Unknown';
    acc[nat] = (acc[nat] || 0) + 1;
    return acc;
  }, {});

  const sortedNationalities = Object.entries(nationalityData)
    .sort((a, b) => b[1] - a[1]);

  // Head Count Ratio
  const locals = activeEmployees.filter(e => {
    const nat = (e.Nationality || '').toLowerCase();
    return nat.includes('maldivian') || nat.includes('local');
  }).length;

  const expats = activeEmployees.length - locals;
  const male = activeEmployees.filter(e =>
    (e.Gender || '').toLowerCase() === 'male'
  ).length;
  const female = activeEmployees.filter(e =>
    (e.Gender || '').toLowerCase() === 'female'
  ).length;

  // Meal Count Data
  const inHouseCount = activeEmployees.filter(e =>
    e.InHouse === 'Yes' || e.InHouse === true || e.accommodationId || e.roomAssigned
  ).length;

  const tabCount = todayLeaves.length;

  // Separations by Department
  const deptData = activeEmployees.reduce((acc, emp) => {
    const dept = emp.Department || emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const sortedDepts = Object.entries(deptData)
    .sort((a, b) => b[1] - a[1]);

  const handlePrint = () => {
    // Get the report content
    const reportContent = document.querySelector('.daily-report-content');
    if (!reportContent) return;

    // Clone the content
    const clone = reportContent.cloneNode(true);

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    // Write the HTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Dashboard - Villa Park</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: Arial, sans-serif;
          }
          .shadow-2xl, .shadow-lg, .shadow-md, .shadow-xl {
            box-shadow: none !important;
          }
          input {
            display: none !important;
          }
          .print-only {
            display: inline !important;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
          }
          .daily-report-content {
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 10mm;
          }
          .no-print, .no-print-bg {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="daily-report-content">
          ${clone.innerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
              // Fallback close after 1 second if onafterprint doesn't fire
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        <\/script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
      <div className="min-h-screen py-8 px-4">
        {/* Report Container */}
        <div className="max-w-6xl mx-auto bg-white shadow-2xl print:shadow-none daily-report-content">
          
          {/* Header */}
          <div className="bg-white p-6 border-b-2 border-gray-200">
            <div className="flex items-center justify-between mb-4 no-print">
              <h2 className="text-xl font-bold text-gray-800">Daily Information Report</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Villa Park Logo & Title */}
          <div className="text-center py-6 bg-white">
            <div className="mb-2">
              <h1 className="text-3xl font-bold tracking-widest text-gray-800">VILLA PARK</h1>
              <p className="text-sm tracking-widest text-gray-600">SUN ISLAND</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Daily Dashboard</h2>
            <p className="text-lg text-gray-700 mt-1">{todayFormatted}</p>
          </div>

          {/* Main Grid Layout */}
          <div className="p-6 bg-white">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-6">
                
                {/* Head Count */}
                <div className="border-2 border-gray-400">
                  <div className="bg-gray-800 text-white px-3 py-1 text-sm font-bold">Head Count</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="px-3 py-1 text-left text-xs"></th>
                        <th className="px-3 py-1 text-right text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-200">
                        <td className="px-3 py-1 text-xs">Operational Team Members</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{operationalStaff}</td>
                      </tr>
                      <tr className="bg-blue-100">
                        <td className="px-3 py-1 text-xs">Non-operational Team Members</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{nonOperationalStaff}</td>
                      </tr>
                      <tr className="bg-gray-300 font-bold">
                        <td className="px-3 py-1 text-xs">Total</td>
                        <td className="px-3 py-1 text-right text-xs">{operationalStaff + nonOperationalStaff}</td>
                      </tr>
                      <tr className="bg-blue-100">
                        <td className="px-3 py-1 text-xs">Construction Groups + Others</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{constructionGroups}</td>
                      </tr>
                      <tr className="bg-green-200 font-bold">
                        <td className="px-3 py-1 text-xs">Total Head Count</td>
                        <td className="px-3 py-1 text-right text-xs">{operationalStaff + nonOperationalStaff + constructionGroups}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Leave Status */}
                <div className="border-2 border-gray-400">
                  <div className="bg-gray-800 text-white px-3 py-1 text-sm font-bold">Leave Status</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="px-3 py-1 text-left text-xs"></th>
                        <th className="px-3 py-1 text-right text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-200">
                        <td className="px-3 py-1 text-xs">Annual Leave</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{annualLeave}</td>
                      </tr>
                      <tr className="bg-blue-100">
                        <td className="px-3 py-1 text-xs">Day Off & Other Leaves</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{otherLeaves}</td>
                      </tr>
                      <tr className="bg-gray-300 font-bold">
                        <td className="px-3 py-1 text-xs">Total</td>
                        <td className="px-3 py-1 text-right text-xs">{annualLeave + otherLeaves}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Year to Date */}
                <div className="border-2 border-gray-400">
                  <div className="bg-gray-800 text-white px-3 py-1 text-sm font-bold">Year to Date</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="px-3 py-1 text-left text-xs"></th>
                        <th className="px-3 py-1 text-right text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-200">
                        <td className="px-3 py-1 text-xs">Recruitment</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{recruitment}</td>
                      </tr>
                      <tr className="bg-gray-200">
                        <td className="px-3 py-1 text-xs">Separation</td>
                        <td className="px-3 py-1 text-right text-xs font-bold">{separation}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Nationality */}
                <div className="border-2 border-gray-400">
                  <div className="bg-green-800 text-white px-3 py-1 text-sm font-bold">Nationality</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-800 text-white">
                        <th className="px-3 py-1 text-left text-xs"></th>
                        <th className="px-3 py-1 text-right text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedNationalities.slice(0, 20).map(([nat, count], idx) => (
                        <tr key={nat} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-0.5 text-xs">{nat}</td>
                          <td className="px-3 py-0.5 text-right text-xs">{count}</td>
                        </tr>
                      ))}
                      <tr className="bg-green-200 font-bold">
                        <td className="px-3 py-1 text-xs">Total</td>
                        <td className="px-3 py-1 text-right text-xs">{activeEmployees.length}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-6">

                {/* Head Count Ratio */}
                <div className="border-2 border-gray-400">
                  <div className="bg-green-800 text-white px-3 py-1 text-sm font-bold">Head Count Ratio</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-700 text-white">
                        <th className="px-2 py-1 text-left text-xs">Name</th>
                        <th className="px-2 py-1 text-right text-xs">Male</th>
                        <th className="px-2 py-1 text-right text-xs">Female</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-green-100">
                        <td className="px-2 py-1 text-xs">Locals</td>
                        <td className="px-2 py-1 text-right text-xs font-bold">{locals}</td>
                        <td className="px-2 py-1 text-right text-xs">0</td>
                      </tr>
                      <tr className="bg-green-200">
                        <td className="px-2 py-1 text-xs">Expat</td>
                        <td className="px-2 py-1 text-right text-xs font-bold">{expats}</td>
                        <td className="px-2 py-1 text-right text-xs">0</td>
                      </tr>
                      <tr className="bg-green-300 font-bold">
                        <td className="px-2 py-1 text-xs">Total</td>
                        <td className="px-2 py-1 text-right text-xs">{male}</td>
                        <td className="px-2 py-1 text-right text-xs">{female}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Meal Count - Manual Input */}
                <div className="border-2 border-gray-400">
                  <div className="bg-blue-800 text-white px-3 py-1 text-sm font-bold">Meal Count</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-700 text-white">
                        <th className="px-2 py-1 text-left text-xs">Head Count Average</th>
                        <th className="px-2 py-1 text-center text-xs">Breakfast</th>
                        <th className="px-2 py-1 text-center text-xs">Lunch</th>
                        <th className="px-2 py-1 text-center text-xs">Dinner</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-blue-50">
                        <td className="px-2 py-1 text-xs">Family Restaurant</td>
                        <td className="px-2 py-1 text-center text-xs">
                          <input type="text" value={mealCounts.familyRestaurant.breakfast} onChange={(e) => handleMealChange('familyRestaurant', 'breakfast', e.target.value)} className="w-12 text-center border border-gray-300 rounded text-xs py-0.5 no-print-bg" placeholder="-" />
                          <span className="print-only">{mealCounts.familyRestaurant.breakfast || '-'}</span>
                        </td>
                        <td className="px-2 py-1 text-center text-xs">
                          <input type="text" value={mealCounts.familyRestaurant.lunch} onChange={(e) => handleMealChange('familyRestaurant', 'lunch', e.target.value)} className="w-12 text-center border border-gray-300 rounded text-xs py-0.5 no-print-bg" placeholder="-" />
                          <span className="print-only">{mealCounts.familyRestaurant.lunch || '-'}</span>
                        </td>
                        <td className="px-2 py-1 text-center text-xs">
                          <input type="text" value={mealCounts.familyRestaurant.dinner} onChange={(e) => handleMealChange('familyRestaurant', 'dinner', e.target.value)} className="w-12 text-center border border-gray-300 rounded text-xs py-0.5 no-print-bg" placeholder="-" />
                          <span className="print-only">{mealCounts.familyRestaurant.dinner || '-'}</span>
                        </td>
                      </tr>
                      <tr className="bg-blue-100">
                        <td className="px-2 py-1 text-xs">Take A Break (TAB)</td>
                        <td className="px-2 py-1 text-center text-xs">
                          <input type="text" value={mealCounts.tab.breakfast} onChange={(e) => handleMealChange('tab', 'breakfast', e.target.value)} className="w-12 text-center border border-gray-300 rounded text-xs py-0.5 no-print-bg" placeholder="-" />
                          <span className="print-only">{mealCounts.tab.breakfast || '-'}</span>
                        </td>
                        <td className="px-2 py-1 text-center text-xs">
                          <input type="text" value={mealCounts.tab.lunch} onChange={(e) => handleMealChange('tab', 'lunch', e.target.value)} className="w-12 text-center border border-gray-300 rounded text-xs py-0.5 no-print-bg" placeholder="-" />
                          <span className="print-only">{mealCounts.tab.lunch || '-'}</span>
                        </td>
                        <td className="px-2 py-1 text-center text-xs">
                          <input type="text" value={mealCounts.tab.dinner} onChange={(e) => handleMealChange('tab', 'dinner', e.target.value)} className="w-12 text-center border border-gray-300 rounded text-xs py-0.5 no-print-bg" placeholder="-" />
                          <span className="print-only">{mealCounts.tab.dinner || '-'}</span>
                        </td>
                      </tr>
                      <tr className="bg-gray-300 font-bold">
                        <td className="px-2 py-1 text-xs">Total</td>
                        <td className="px-2 py-1 text-center text-xs">
                          {(parseInt(mealCounts.familyRestaurant.breakfast) || 0) + (parseInt(mealCounts.tab.breakfast) || 0)}
                        </td>
                        <td className="px-2 py-1 text-center text-xs">
                          {(parseInt(mealCounts.familyRestaurant.lunch) || 0) + (parseInt(mealCounts.tab.lunch) || 0)}
                        </td>
                        <td className="px-2 py-1 text-center text-xs">
                          {(parseInt(mealCounts.familyRestaurant.dinner) || 0) + (parseInt(mealCounts.tab.dinner) || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Restaurant Labels */}
                  <div className="border-t border-gray-400 p-2 bg-white">
                    <div className="text-xs font-semibold text-gray-700">Family Restaurant</div>
                    <div className="text-xs font-semibold text-gray-700">Take A Break (TAB)</div>
                  </div>
                </div>

                {/* Separations by Department */}
                <div className="border-2 border-gray-400">
                  <div className="bg-blue-800 text-white px-3 py-1 text-sm font-bold">Separations</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-700 text-white">
                        <th className="px-2 py-1 text-left text-xs">Department</th>
                        <th className="px-2 py-1 text-center text-xs">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDepts.map(([dept, count], idx) => (
                        <tr key={dept} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-0.5 text-xs">{dept}</td>
                          <td className="px-2 py-0.5 text-center text-xs">{count}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-300 font-bold">
                        <td className="px-2 py-1 text-xs">Total</td>
                        <td className="px-2 py-1 text-center text-xs">{sortedDepts.reduce((sum, [,c]) => sum + c, 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 text-center text-xs text-gray-500 border-t border-gray-200">
            Villa Park Sun Island - Daily Dashboard Report
          </div>

        </div>
      </div>

      {/* Print Styles - Only print the report */}
      <style>{`
        @media print {
          /* Hide the modal overlay background */
          .fixed.inset-0 {
            position: static !important;
            background: white !important;
          }
          .bg-black\/50 {
            background: white !important;
          }
          /* Hide dashboard page content */
          body > div:not(:has(.daily-report-content)) {
            display: none !important;
          }
          /* Show only report */
          .daily-report-content {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          .fixed {
            position: static !important;
            overflow: visible !important;
          }
          .min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
            box-shadow: none !important;
          }
          body {
            background: white;
          }
          /* Ensure report takes full page */
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
      <style>{`
        .no-print-bg {
          background: white;
        }
        .print-only {
          display: none;
        }
        @media print {
          input {
            display: none !important;
          }
          .print-only {
            display: inline !important;
          }
          /* Force landscape for wide tables */
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
