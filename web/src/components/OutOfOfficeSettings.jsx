import { useState, useEffect } from 'react';
import { Briefcase, UserCheck, Calendar, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useFirestore } from '../hooks/useFirestore';
import { doc, updateDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

export default function OutOfOfficeSettings() {
  const { user, userData } = useAuth();
  const { companyId } = useCompany();
  const { documents: employees } = useFirestore('employees');

  const [isEnabled, setIsEnabled] = useState(false);
  const [delegatedTo, setDelegatedTo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDelegation, setCurrentDelegation] = useState(null);

  // Check if user is HOD (case-insensitive)
  const isHOD = userData?.role?.toLowerCase() === 'dept_head';
  const userDept = userData?.department;

  // Load existing delegation on mount
  useEffect(() => {
    if (userData?.outOfOffice) {
      setIsEnabled(userData.outOfOffice.enabled);
      setDelegatedTo(userData.outOfOffice.deputyEmployeeId || '');
      setStartDate(userData.outOfOffice.startDate || '');
      setEndDate(userData.outOfOffice.endDate || '');
      setReason(userData.outOfOffice.reason || '');
      setCurrentDelegation(userData.outOfOffice);
    }
  }, [userData]);

  // Filter employees by same department (excluding self)
  const eligibleDeputies = employees.filter(e => {
    const empDept = e['Department '] || e.Department || e.department;
    return empDept === userDept && e.id !== user?.uid;
  });

  // Debug logging - check console for actual field names
  useEffect(() => {
    if (eligibleDeputies.length > 0) {
      console.log('[OutOfOffice] Department:', userDept);
      console.log('[OutOfOffice] Total eligible:', eligibleDeputies.length);
      console.log('[OutOfOffice] Sample employee:', eligibleDeputies[0]);
      console.log('[OutOfOffice] All keys:', Object.keys(eligibleDeputies[0]));
    }
  }, [eligibleDeputies, userDept]);

  const handleEnable = async () => {
    console.log('[OutOfOffice] handleEnable called, delegatedTo:', delegatedTo);
    if (!delegatedTo) {
      toast.error('Please select a deputy');
      return;
    }

    setLoading(true);
    console.log('[OutOfOffice] Loading set to true');
    try {
      console.log('[OutOfOffice] Starting delegation process...');
      // Find the employee record
      const selectedEmployee = employees.find(e => e.id === delegatedTo);
      console.log('[OutOfOffice] Selected employee:', selectedEmployee?.FullName, 'ID:', selectedEmployee?.id);
      const deputyEmail = selectedEmployee?.['Email'] || selectedEmployee?.email || selectedEmployee?.['E-mail'] || selectedEmployee?.PersonalEmailID || selectedEmployee?.personalEmail;
      console.log('[OutOfOffice] Deputy email:', deputyEmail);

      // Find the user by email since employee ID doesn't match user ID
      let deputyUserId = null;
      if (deputyEmail) {
        console.log('[OutOfOffice] Querying users by email...');
        // Try lowercase 'email' field
        const usersQuery = query(collection(db, 'users'), where('email', '==', deputyEmail.toLowerCase()));
        const usersSnap = await getDocs(usersQuery);
        console.log('[OutOfOffice] Users query (email lowercase) result empty?', usersSnap.empty);
        if (!usersSnap.empty) {
          deputyUserId = usersSnap.docs[0].id;
          console.log('[OutOfOffice] Found deputy user by email:', deputyUserId);
        }
        
        // Try capitalized 'Email' field if first query failed
        if (!deputyUserId) {
          const usersQuery2 = query(collection(db, 'users'), where('Email', '==', deputyEmail));
          const usersSnap2 = await getDocs(usersQuery2);
          console.log('[OutOfOffice] Users query (Email capitalized) result empty?', usersSnap2.empty);
          if (!usersSnap2.empty) {
            deputyUserId = usersSnap2.docs[0].id;
            console.log('[OutOfOffice] Found deputy user by Email (capitalized):', deputyUserId);
          }
        }
        
        // Try case-insensitive search if still not found
        if (!deputyUserId) {
          const allUsersQuery = query(collection(db, 'users'));
          const allUsersSnap = await getDocs(allUsersQuery);
          console.log('[OutOfOffice] Searching all users for email match...');
          allUsersSnap.forEach(doc => {
            const userData = doc.data();
            const userEmail = (userData.email || userData.Email || '').toLowerCase();
            if (userEmail === deputyEmail.toLowerCase()) {
              deputyUserId = doc.id;
              console.log('[OutOfOffice] Found deputy user by case-insensitive search:', deputyUserId);
            }
          });
        }
      }

      // Fallback to stored userId or uid if available
      if (!deputyUserId) {
        console.log('[OutOfOffice] Trying fallback userId/uid...');
        deputyUserId = selectedEmployee?.userId || selectedEmployee?.uid;
        console.log('[OutOfOffice] Fallback userId:', deputyUserId);
      }
      
      // Search by EmpID if email search failed
      if (!deputyUserId && selectedEmployee?.EmpID) {
        console.log('[OutOfOffice] Searching by EmpID:', selectedEmployee.EmpID);
        const empIdQuery = query(collection(db, 'users'), where('employeeId', '==', String(selectedEmployee.EmpID)));
        const empIdSnap = await getDocs(empIdQuery);
        console.log('[OutOfOffice] EmpID query result empty?', empIdSnap.empty);
        if (!empIdSnap.empty) {
          deputyUserId = empIdSnap.docs[0].id;
          console.log('[OutOfOffice] Found deputy user by EmpID:', deputyUserId);
        }
      }
      
      // Search by employeeCode/EmpCode if available
      if (!deputyUserId && selectedEmployee?.EmpID) {
        console.log('[OutOfOffice] Searching by employeeCode...');
        const codeQuery = query(collection(db, 'users'), where('employeeCode', '==', String(selectedEmployee.EmpID)));
        const codeSnap = await getDocs(codeQuery);
        console.log('[OutOfOffice] employeeCode query result empty?', codeSnap.empty);
        if (!codeSnap.empty) {
          deputyUserId = codeSnap.docs[0].id;
          console.log('[OutOfOffice] Found deputy user by employeeCode:', deputyUserId);
        }
      }

      if (!deputyUserId) {
        console.log('[OutOfOffice] ERROR: No deputyUserId found!');
        toast.error('Could not find deputy user account. The deputy must have logged in at least once.');
        setLoading(false);
        return;
      }

      const outOfOffice = {
        enabled: true,
        delegatedTo: deputyUserId,
        deputyEmployeeId: selectedEmployee?.id || delegatedTo,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || null,
        reason: reason || 'Leave',
        delegatedAt: new Date().toISOString(),
      };

      // Update HOD's user document
      await updateDoc(doc(db, 'users', user.uid), {
        outOfOffice
      });

      // Update deputy's user document
      await updateDoc(doc(db, 'users', deputyUserId), {
        actingAsHOD: true,
        delegatedBy: user.uid,
        department: userDept // Ensure deputy gets same department
      });
      toast.success(`HOD access granted to deputy`);

      toast.success('Out of Office delegation enabled');
      setCurrentDelegation(outOfOffice);
      setIsEnabled(true);
    } catch (error) {
      toast.error('Failed to enable delegation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to end the delegation? The deputy will lose HOD access.')) return;

    console.log('[OutOfOffice] Ending delegation...');
    setLoading(true);
    try {
      // Delegation is stored as deputy user id in outOfOffice.delegatedTo
      const deputyUserId = currentDelegation?.delegatedTo;

      // Update HOD's user document
      await updateDoc(doc(db, 'users', user.uid), {
        outOfOffice: {
          enabled: false,
          delegatedTo: null,
          deputyEmployeeId: null,
          startDate: null,
          endDate: null,
          reason: null,
          delegatedAt: null,
        }
      });

      // Restore deputy's original role
      if (deputyUserId) {
        console.log('[OutOfOffice] Removing HOD access from deputy:', deputyUserId);
        await updateDoc(doc(db, 'users', deputyUserId), {
          actingAsHOD: false,
          delegatedBy: null,
          department: null // Remove the temporary department assignment
        });
        toast.success(`HOD access removed from deputy`);
      } else {
        console.warn('[OutOfOffice] No deputy ID found to remove access');
      }

      toast.success('Delegation ended. HOD access restored.');
      setIsEnabled(false);
      setDelegatedTo('');
      setCurrentDelegation(null);
    } catch (error) {
      console.error('[OutOfOffice] Error disabling delegation:', error);
      toast.error('Failed to disable delegation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isHOD) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium leading-6 text-gray-900">Out of Office Delegation</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Temporarily delegate your HOD access to a department staff member when you're on leave.
        </p>

        {currentDelegation?.enabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Out of Office is currently enabled
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {(() => {
                    const deputyEmp = employees.find(e =>
                      e.id === currentDelegation.deputyEmployeeId ||
                      e.id === currentDelegation.delegatedTo ||
                      e.userId === currentDelegation.delegatedTo
                    );
                    const deputyName = deputyEmp?.FullName || deputyEmp?.name || deputyEmp?.employeeName || deputyEmp?.['Full Name'] || 'a staff member';
                    return (
                      <>HOD access is delegated to <strong>{deputyName}</strong> from {currentDelegation.startDate}
                      {currentDelegation.endDate && ` until ${currentDelegation.endDate}`}</>
                    );
                  })()}
                </p>
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="mt-3 text-sm bg-amber-100 text-amber-800 px-3 py-1.5 rounded hover:bg-amber-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'End Delegation Early'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!currentDelegation?.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserCheck className="h-4 w-4 inline mr-1" />
                Select Deputy
              </label>
              <select
                value={delegatedTo}
                onChange={(e) => {
                  console.log('[OutOfOffice] Selected deputy ID:', e.target.value);
                  setDelegatedTo(e.target.value);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
              >
                <option value="">Select by Designation from {userDept}...</option>
                {eligibleDeputies
                  .sort((a, b) => {
                    const desigA = (a.Designation || a.position || a.designation || '').toLowerCase();
                    const desigB = (b.Designation || b.position || b.designation || '').toLowerCase();
                    return desigA.localeCompare(desigB);
                  })
                  .map(emp => {
                    const designation = emp.Designation || emp.position || emp.designation || 'Staff';
                    const name = emp.FullName || emp.name || emp.employeeName || 'Unknown';
                    return (
                      <option key={emp.id} value={emp.id}>
                        {designation} - {name}
                      </option>
                    );
                  })
                }
              </select>
              {eligibleDeputies.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  No eligible staff members found in your department.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Annual Leave, Business Trip"
                className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2"
              />
            </div>

            <div className="pt-2">
              {console.log('[OutOfOffice] Button state - loading:', loading, 'delegatedTo:', delegatedTo, 'disabled:', loading || !delegatedTo)}
              <button
                onClick={(e) => {
                  console.log('[OutOfOffice] Button clicked!');
                  handleEnable(e);
                }}
                disabled={loading || !delegatedTo}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400"
              >
                {loading ? 'Enabling...' : 'Enable Out of Office Delegation'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                The selected staff member will gain HOD access for your department.
                You can end this delegation anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
