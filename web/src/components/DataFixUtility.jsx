import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, AlertCircle, CheckCircle, Search, Edit2 } from 'lucide-react';

export default function DataFixUtility() {
  const { userData, isSuperAdmin } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fixing, setFixing] = useState(false);

  const [villaEmployees, setVillaEmployees] = useState([]);
  const [foundInDb, setFoundInDb] = useState([]);
  const [notInDb, setNotInDb] = useState([]);

  // Load all companies and employees
  useEffect(() => {
    loadData();
  }, []);

  // Check for Villa Construction employees when data loads
  useEffect(() => {
    if (employees.length > 0) {
      checkVillaEmployees();
    }
  }, [employees]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all companies
      const companiesSnap = await getDocs(collection(db, 'companies'));
      const companiesList = companiesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesList);

      // Load all employees
      const employeesSnap = await getDocs(collection(db, 'employees'));
      const employeesList = employeesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Check which Villa Construction employees from JSON exist in database
  const checkVillaEmployees = () => {
    // Names from Construction_Work_Force.json - Villa Construction employees
    const villaNames = [
      "SUNNY", "SANTHOSH KUMAR PAUL", "ANIL PAUL", "Anish Vijayan", "Sujan Dasaiyan",
      "Jobayed Hossain", "Kadir Ansari", "AJIM ALAM", "MD Abdul Kader", "Md Alomgir Hossain",
      "Md Shahinoor Rahman", "MIRAJ UDDIN", "MD MOJAHID ALI", "MD MASUD RANA",
      "MOHAMMED JASHIM UDDIN", "MD ROBIUL ISLAM", "PINTU DAS", "MD HELAL UDDIN",
      "MOHAMMAD JAHANGIR", "MD SHOFIUL ISLAM", "MAHBUBUR RAHMAN", "MD HARUNUR RASHID",
      "MD HAFIJUR RAHMAN", "MD REJAUL ISLAM", "MD HARUNOR RASHID", "BABUL SHAIK",
      "MILON SHAIK", "BISAWJIT DAS", "ASHIK SHAIK", "AZIZUL SHAIK", "BISHU",
      "MD JAHIRUL ISLAM", "Arifuzzaman Mallick", "MD EMON SHAIK", "Nipon Das",
      "SABUJ SHAIK", "KOUSHIK DAS", "SHAHIN SHAIK", "MD SAJID ISLAM", "MD NUR ISLAM",
      "MD NAZMUL ISLAM", "ABDUR RAHMAN", "MINTU DAS", "MD SOHEL RANA", "GOLAM RABBI",
      "MD JASIM UDDIN", "MD ROBIN SHAIK", "SALMAN Mollah", "MD RASHIDUL ISLAM",
      "MD SADDAM HOSSAIN", "MD RAKIBUL ISLAM", "KHALILUR RAHMAN", "ABUL HOSSAIN",
      "IMRAN", "TALAT HOSSAIN", "MD JIAUL ISLAM", "MD SALIM", "ALomgir Hossain",
      "MD ZAHID HOSSAIN", "MD ROMJAN ALI", "MD MIRAZ", "MD SAIFUL ISLAM",
      "MD AKASH SHAIK", "MD JALAL UDDIN", "MD SUMON SHAIK", "MD SHAHIDUL ISLAM",
      "MD NUR ALAM", "MD SAYEED AHMAD", "MD AKHTARUZZAMAN", "MD AKRAM HOSSAIN",
      "MD AMANULLAH", "MD SHORIFUL ISLAM", "MD JUWEL RANA", "MD SIZAN",
      "MD RUBEL SHAIK", "MD BILLAL HOSSAIN", "MD JAKIR HOSSAIN", "MD BADAL SHAIK",
      "RAJ", "MD JIBON SHAIK", "MD RANA SHAIK", "MD SHAKHAwat", "MD JAMAL",
      "MD BASHIR", "MD Uzzal", "IMRAN2", "SUMON", "MD BABU", "MD JIBON MIAH",
      "MD SAGAR HOSSAIN", "MD NURUL ISLAM", "MD TAUHIDUL ISLAM", "ABU TALHA",
      "MD ROBIUL AWAL", "MD MIRAZUL ISLAM", "MD AKASH MIA", "ASHRAFUL ISLAM",
      "MD ARIFUL ISLAM", "MD RABBI SHAIK", "MD BADOL SHAIK", "MD SOHEL MIAH",
      "MD JAHID HOSSAIN", "MD RAHAT", "MD MOJNU MIAH", "MD ARMAN HOSSAIN",
      "MD RUBEL SHAIK2", "MD ARIF HOSSAIN", "MD ABDUR RAHIM", "TITU"
    ];
    
    const found = [];
    const notFound = [];
    
    villaNames.forEach(name => {
      const match = employees.find(emp => {
        const fullName = (emp.FullName || emp.name || '').toLowerCase().trim();
        return fullName === name.toLowerCase().trim() || 
               fullName.includes(name.toLowerCase().trim()) ||
               name.toLowerCase().trim().includes(fullName);
      });
      
      if (match) {
        found.push({ name, employee: match });
      } else {
        notFound.push(name);
      }
    });
    
    setVillaEmployees(villaNames);
    setFoundInDb(found);
    setNotInDb(notFound);
    
    console.log(`Found ${found.length} out of ${villaNames.length} Villa employees`);
    console.log('Not found:', notFound);
  };
  const findMismatchedEmployees = () => {
    if (!selectedCompany) return [];
    
    const selectedCompanyData = companies.find(c => c.id === selectedCompany);
    if (!selectedCompanyData) return [];

    return employees.filter(emp => {
      // Check if employee belongs to this company by name but has wrong companyId
      const empCompanyName = emp.company || emp.companyName || '';
      const matchesByName = empCompanyName.toLowerCase().includes(selectedCompanyData.name?.toLowerCase() || '');
      const hasWrongCompanyId = emp.companyId !== selectedCompany;
      
      return matchesByName && hasWrongCompanyId;
    });
  };

  // Fix employee companyId
  const fixEmployeeCompanyId = async (employeeId, newCompanyId) => {
    setFixing(true);
    try {
      await updateDoc(doc(db, 'employees', employeeId), {
        companyId: newCompanyId,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, companyId: newCompanyId } : emp
      ));
      
      setMessage({ type: 'success', text: 'Employee company ID fixed!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error fixing employee:', error);
      setMessage({ type: 'error', text: 'Failed to fix employee' });
    } finally {
      setFixing(false);
    }
  };

  // Bulk fix all mismatched employees
  const bulkFixEmployees = async () => {
    const mismatched = findMismatchedEmployees();
    if (mismatched.length === 0) {
      setMessage({ type: 'info', text: 'No mismatched employees found' });
      return;
    }

    setFixing(true);
    let fixed = 0;
    let failed = 0;

    for (const emp of mismatched) {
      try {
        await updateDoc(doc(db, 'employees', emp.id), {
          companyId: selectedCompany,
          updatedAt: new Date().toISOString()
        });
        fixed++;
      } catch (error) {
        console.error(`Failed to fix employee ${emp.id}:`, error);
        failed++;
      }
    }

    // Reload data
    await loadData();
    
    setMessage({ 
      type: failed === 0 ? 'success' : 'warning', 
      text: `Fixed ${fixed} employees${failed > 0 ? `, ${failed} failed` : ''}` 
    });
    setFixing(false);
  };

  // Get company stats
  const getCompanyStats = (companyId) => {
    const companyEmps = employees.filter(e => e.companyId === companyId);
    return {
      total: companyEmps.length,
      withCompanyField: companyEmps.filter(e => e.company || e.companyName).length
    };
  };

  if (!isSuperAdmin()) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Only superadmin can access this utility</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Fix Utility</h2>
          <p className="text-gray-600">Fix company ID mismatches between users and employees</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Company Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Company Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(company => {
            const stats = getCompanyStats(company.id);
            return (
              <div 
                key={company.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCompany === company.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCompany(company.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{company.name}</span>
                  {selectedCompany === company.id && <CheckCircle className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>ID: {company.id}</p>
                  <p>Employees: {stats.total}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mismatched Employees */}
      {selectedCompany && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Employees for {companies.find(c => c.id === selectedCompany)?.name}
            </h3>
            <button
              onClick={bulkFixEmployees}
              disabled={fixing || findMismatchedEmployees().length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {fixing ? 'Fixing...' : `Fix All (${findMismatchedEmployees().length})`}
            </button>
          </div>

          <div className="space-y-2">
            {employees
              .filter(emp => {
                const matchesSearch = 
                  (emp.FullName || emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (emp.EmpID || emp.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCompany = emp.companyId === selectedCompany || 
                  findMismatchedEmployees().includes(emp);
                return matchesSearch && (matchesCompany || !searchTerm);
              })
              .map(emp => {
                const isMismatched = findMismatchedEmployees().includes(emp);
                return (
                  <div 
                    key={emp.id} 
                    className={`p-3 border rounded-lg flex justify-between items-center ${
                      isMismatched ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{emp.FullName || emp.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        ID: {emp.EmpID || emp.employeeId || 'N/A'} | 
                        Current companyId: {emp.companyId || 'NONE'}
                        {isMismatched && <span className="text-yellow-600 ml-2">⚠️ Mismatch</span>}
                      </p>
                    </div>
                    {isMismatched && (
                      <button
                        onClick={() => fixEmployeeCompanyId(emp.id, selectedCompany)}
                        disabled={fixing}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
                      >
                        Fix
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Villa Construction Employee Check */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Villa Construction Employee Check</h3>
        <p className="text-sm text-gray-600 mb-4">
          Checking {villaEmployees.length} employees from Construction_Work_Force.json
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-bold text-2xl">{foundInDb.length}</p>
            <p className="text-green-600 text-sm">Found in Database</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-800 font-bold text-2xl">{notInDb.length}</p>
            <p className="text-red-600 text-sm">Not Found in Database</p>
          </div>
        </div>

        {foundInDb.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-green-700 mb-2">Found Employees ({foundInDb.length}):</h4>
            <div className="max-h-40 overflow-y-auto bg-green-50 p-3 rounded-lg">
              {foundInDb.map(({name, employee}, idx) => (
                <div key={idx} className="text-sm text-green-800 py-1 border-b border-green-200 last:border-0">
                  ✓ {name} → {employee.FullName || employee.name} (ID: {employee.EmpID || employee.employeeId || 'N/A'})
                </div>
              ))}
            </div>
          </div>
        )}

        {notInDb.length > 0 && (
          <div>
            <h4 className="font-medium text-red-700 mb-2">Missing Employees ({notInDb.length}):</h4>
            <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded-lg">
              {notInDb.map((name, idx) => (
                <div key={idx} className="text-sm text-red-800 py-1 border-b border-red-200 last:border-0">
                  ✗ {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Total Companies:</strong> {companies.length}</p>
          <p><strong>Total Employees:</strong> {employees.length}</p>
          <p><strong>Selected Company:</strong> {selectedCompany || 'None'}</p>
          <p><strong>Mismatched Employees:</strong> {findMismatchedEmployees().length}</p>
        </div>
      </div>
    </div>
  );
}
