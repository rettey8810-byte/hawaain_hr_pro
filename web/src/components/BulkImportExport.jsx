import { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  X,
  Loader2,
  Users
} from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { useCompany } from '../contexts/CompanyContext';

export default function BulkImportExport() {
  const { companyId } = useCompany();
  const { documents: employees, addDocument } = useFirestore('employees');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const fileInputRef = useRef(null);

  const companyEmployees = employees.filter(e => e.companyId === companyId);

  // CSV Template
  const csvTemplate = `name,email,phone,employeeId,department,position,joinDate,status,nationality,dateOfBirth
John Doe,john@example.com,+1234567890,EMP001,Engineering,Developer,2024-01-15,active,American,1990-05-20
Jane Smith,jane@example.com,+1234567891,EMP002,HR,Manager,2024-02-01,active,British,1985-08-12`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['name', 'email', 'phone', 'employeeId', 'department', 'position', 'location', 'joinDate', 'status', 'nationality', 'passportNumber', 'dateOfBirth'];
    
    const rows = companyEmployees.map(emp => [
      emp.name,
      emp.email,
      emp.phone,
      emp.employeeId,
      emp.department,
      emp.position,
      emp.location,
      emp.joinDate,
      emp.status,
      emp.nationality,
      emp.passportNumber,
      emp.dateOfBirth
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return { ...row, lineNumber: index + 2 };
    });
  };

  const validateRow = (row) => {
    const errors = [];
    if (!row.name?.trim()) errors.push('Name is required');
    if (!row.email?.trim()) errors.push('Email is required');
    if (row.email && !row.email.includes('@')) errors.push('Invalid email format');
    return errors;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const data = parseCSV(text);
        
        // Validate each row
        const validated = data.map(row => ({
          ...row,
          errors: validateRow(row),
          valid: validateRow(row).length === 0
        }));

        setCsvData(validated);
        setShowImportModal(true);
      } catch (error) {
        alert('Error parsing CSV: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    const results = { success: [], failed: [] };

    for (const row of csvData.filter(r => r.valid)) {
      try {
        await addDocument({
          name: row.name,
          email: row.email,
          phone: row.phone,
          employeeId: row.employeeId,
          department: row.department,
          position: row.position,
          location: row.location,
          joinDate: row.joinDate,
          status: row.status || 'active',
          nationality: row.nationality,
          passportNumber: row.passportNumber,
          dateOfBirth: row.dateOfBirth,
          companyId,
          createdAt: new Date().toISOString()
        });
        results.success.push(row);
      } catch (error) {
        results.failed.push({ ...row, error: error.message });
      }
    }

    setImportResults(results);
    setImporting(false);
    setShowImportModal(false);
    setCsvData([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8" />
          Bulk Import / Export
        </h1>
        <p className="text-emerald-100 mt-1">Import employees from CSV or export to Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Import Employees</h2>
              <p className="text-sm text-gray-500">Upload CSV file with employee data</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Drag & drop your CSV file here, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Select CSV File
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">Required Columns:</p>
            <p className="text-sm text-gray-500">name, email, phone, employeeId, department, position</p>
            <button
              onClick={downloadTemplate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Download className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Export Employees</h2>
              <p className="text-sm text-gray-500">Download all employee data as CSV</p>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold">{companyEmployees.length}</p>
                  <p className="text-sm text-gray-500">Total Employees</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            disabled={companyEmployees.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export to CSV
          </button>

          <p className="mt-4 text-sm text-gray-500 text-center">
            Export includes all employee fields including documents info
          </p>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Import Results</h3>
            <button
              onClick={() => setImportResults(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Successfully Imported</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">{importResults.success.length}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-1">{importResults.failed.length}</p>
            </div>
          </div>

          {importResults.failed.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Failed Records:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importResults.failed.map((row, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg text-sm">
                    <p className="font-medium">{row.name} ({row.email})</p>
                    <p className="text-red-600">{row.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Preview Import Data</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {csvData.map((row, index) => (
                    <tr key={index} className={row.valid ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2">
                        {row.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-xs">{row.errors.join(', ')}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">{row.name}</td>
                      <td className="px-4 py-2 text-sm">{row.email}</td>
                      <td className="px-4 py-2 text-sm">{row.department}</td>
                      <td className="px-4 py-2 text-sm">{row.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-gray-500">
                {csvData.filter(r => r.valid).length} of {csvData.length} rows valid
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || csvData.filter(r => r.valid).length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Import {csvData.filter(r => r.valid).length} Employees
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
